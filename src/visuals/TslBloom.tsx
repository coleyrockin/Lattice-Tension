import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { WebGPURenderer } from "three/webgpu";
import { RenderPipeline } from "three/webgpu";
import { pass } from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";

/**
 * TSL bloom on the WebGPURenderer. Takes over the R3F render loop via a
 * positive-priority useFrame so the pipeline (scene + bloom) renders instead of
 * R3F's default pass. High threshold keeps the void black — only the bright rim,
 * specular, and internal lattice cores flare.
 */
export function TslBloom() {
  const gl = useThree((s) => s.gl) as unknown as WebGPURenderer;
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  const post = useMemo(() => {
    const scenePass = pass(scene, camera);
    const color = scenePass.getTextureNode();
    // cleaner bloom: moderate strength, tighter radius, higher threshold for polished look
    const bloomPass = bloom(color, 0.28, 0.44, 0.8);
    const pipeline = new RenderPipeline(gl);
    pipeline.outputNode = color.add(bloomPass);
    return { pipeline, bloomPass };
  }, [gl, scene, camera]);

  useFrame(() => {
    const progress = useExperienceStore.getState().scrollProgress;
    const sample = sampleExperience(progress);
    post.bloomPass.strength.value = 0.17 + sample.post.bloom * 0.11;
    post.bloomPass.radius.value = 0.38 + sample.visual.stressIntensity * 0.08;
    post.bloomPass.threshold.value = 0.8;
    post.pipeline.render();
  }, 1);

  return null;
}
