import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { WebGPURenderer } from "three/webgpu";
import { RenderPipeline } from "three/webgpu";
import { clamp, dot, float, max, mix, pass, uniform, vec2, vec3 } from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { chromaticAberration } from "three/examples/jsm/tsl/display/ChromaticAberrationNode.js";
import { film } from "three/examples/jsm/tsl/display/FilmNode.js";
import { sampleExperience } from "../chapters/interpolate";
import { descent, frameSample } from "../experience/store";

/**
 * Full TSL post stack: bloom → chromatic aberration → film grain → vignette.
 * Chapter signature drives aberration, vignette, exposure — each realm feels
 * optically different, not just recolored geometry.
 */
export function TslBloom() {
  const gl = useThree((s) => s.gl) as unknown as WebGPURenderer;
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  const post = useMemo(() => {
    const chromaStrength = uniform(0.002);
    const grainIntensity = uniform(0.035);
    // Display-referred color grade — the single lever that un-milks every realm.
    // The volumetric march + ACES desaturate the whole frame toward pale grey;
    // this re-floors the black void, re-separates mids from brights, and rebuilds
    // palette saturation. Genuinely driven per-chapter from the useFrame block
    // below (the previous version claimed to but never updated these three).
    const blackPoint = uniform(0.03);
    const contrast = uniform(1.1);
    const saturation = uniform(1.34);

    const scenePass = pass(scene, camera);
    const color = scenePass.getTextureNode();
    const bloomPass = bloom(color, 0.22, 0.38, 0.92);
    // Screen-blend, not raw add: already-bright pixels can't stack a second full
    // bloom pass on top and roll to white under ACES — preserves mid contrast.
    const bloomed = color.add(bloomPass.mul(color.oneMinus()));

    // Inline color grade (pure node composition — no Fn wrapper, which trips the
    // type-checker here). 1) black point re-floors the void, 2) contrast S-curve
    // pivoted LOW (0.35) so it LIFTS low-mids instead of crushing the dim
    // chapters to black, 3) saturation counters ACES.
    const floored = max(bloomed.sub(blackPoint), vec3(0)).div(
      max(float(1).sub(blackPoint), float(0.001)),
    );
    const contrasted = floored.sub(0.35).mul(contrast).add(0.35);
    const lum = dot(contrasted, vec3(0.2126, 0.7152, 0.0722));
    const graded = clamp(
      mix(vec3(lum), contrasted, saturation),
      vec3(0),
      vec3(1),
    );
    const chromed = chromaticAberration(graded, chromaStrength, vec2(0.5, 0.5));
    const grained = film(chromed, grainIntensity);

    const pipeline = new RenderPipeline(gl);
    pipeline.outputNode = grained;

    return {
      pipeline,
      bloomPass,
      chromaStrength,
      grainIntensity,
      blackPoint,
      contrast,
      saturation,
    };
  }, [gl, scene, camera]);
  useEffect(() => () => { post.pipeline.dispose?.(); }, [post]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const progress = descent.value;
    const sample = frameSample.current ?? sampleExperience(progress);
    const sig = sample.signature;

    post.bloomPass.strength.value =
      0.1 + sample.post.bloom * 0.18 + sig.focalGlow * 0.06 + sig.nebula * 0.08 + sig.echo * 0.04;
    post.bloomPass.radius.value =
      0.24 + sig.nebula * 0.24 + sig.echo * 0.12 + sig.veil * 0.1 - sig.crystalline * 0.05;
    post.bloomPass.threshold.value = 0.92 - sig.nebula * 0.05 - sig.focalGlow * 0.03 - sig.echo * 0.02;
    post.chromaStrength.value =
      sample.post.aberration * 160 + sig.chromatic * 0.013;
    post.grainIntensity.value = 0.018 + sig.nebula * 0.04 + sig.echo * 0.025;

    // Exposure: hold a controlled base; fog-heavy realms (Nebula) drop exposure
    // a touch to recover black-void contrast rather than compensating upward
    // (the old upward push is what washed the mid-descent to milky haze).
    const exposure =
      0.5 + sig.focalGlow * 0.12 - sig.absorption * 0.04 - sig.nebula * 0.05 + sig.echo * 0.02;
    gl.toneMappingExposure += (exposure - gl.toneMappingExposure) * (1 - Math.exp(-5 * dt));

    // Per-chapter grade (smoothed). Black point + contrast key on the WASH
    // sources (veil/nebula) so aether/nebula de-milk while the dim chapters keep
    // a gentle floor that preserves faint shells. Saturation lifts a touch where
    // absorption darkens. Keeps the grade from manufacturing dead-black.
    const gradeK = 1 - Math.exp(-5 * dt);
    // Black point keys on veil ONLY (aether's washout) — NOT nebula: after the
    // freq-floor fix nebula is a DARK gas, so a nebula-scaled floor was crushing
    // it to maroon. Higher base contrast (1.12) gives the low-veil chapters
    // (quantum/singularity) the pop their structure needs without a wash term.
    const targetBlack = 0.02 + sig.veil * 0.008;
    const targetContrast = 1.12 + sig.veil * 0.1 + sig.nebula * 0.08;
    const targetSat = 1.28 + sig.absorption * 0.06;
    post.blackPoint.value += (targetBlack - post.blackPoint.value) * gradeK;
    post.contrast.value += (targetContrast - post.contrast.value) * gradeK;
    post.saturation.value += (targetSat - post.saturation.value) * gradeK;

    post.pipeline.render();
  }, 1);

  return null;
}
