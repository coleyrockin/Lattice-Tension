import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { WebGPURenderer } from "three/webgpu";
import { RenderPipeline } from "three/webgpu";
import { pass, uniform, vec2 } from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { chromaticAberration } from "three/examples/jsm/tsl/display/ChromaticAberrationNode.js";
import { film } from "three/examples/jsm/tsl/display/FilmNode.js";
import { sampleExperience } from "../chapters/interpolate";
import { descent } from "../experience/store";

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

    const scenePass = pass(scene, camera);
    const color = scenePass.getTextureNode();
    const bloomPass = bloom(color, 0.22, 0.38, 0.92);
    const bloomed = color.add(bloomPass);
    const chromed = chromaticAberration(bloomed, chromaStrength, vec2(0.5, 0.5));
    const grained = film(chromed, grainIntensity);

    const pipeline = new RenderPipeline(gl);
    pipeline.outputNode = grained;

    return { pipeline, bloomPass, chromaStrength, grainIntensity };
  }, [gl, scene, camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const progress = descent.value;
    const sample = sampleExperience(progress);
    const sig = sample.signature;

    post.bloomPass.strength.value =
      0.1 + sample.post.bloom * 0.18 + sig.focalGlow * 0.14 + sig.nebula * 0.08 + sig.echo * 0.04;
    post.bloomPass.radius.value =
      0.24 + sig.nebula * 0.24 + sig.echo * 0.12 + sig.veil * 0.1 - sig.crystalline * 0.05;
    post.bloomPass.threshold.value = 0.86 - sig.nebula * 0.14 - sig.focalGlow * 0.06 - sig.echo * 0.03;
    post.chromaStrength.value =
      sample.post.aberration * 160 + sig.chromatic * 0.013;
    post.grainIntensity.value = 0.018 + sig.nebula * 0.04 + sig.echo * 0.025;

    // Exposure: slightly brighter base so the lattice details read well; absorption-heavy
    // chapters compensate upward so the tunnels don't crush to black.
    const exposure =
      0.52 + sig.focalGlow * 0.14 - sig.absorption * 0.035 + sig.nebula * 0.07 + sig.veil * 0.05 + sig.echo * 0.03;
    gl.toneMappingExposure += (exposure - gl.toneMappingExposure) * (1 - Math.exp(-5 * dt));

    post.pipeline.render();
  }, 1);

  return null;
}