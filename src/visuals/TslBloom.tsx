import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { WebGPURenderer } from "three/webgpu";
import { RenderPipeline } from "three/webgpu";
import { pass } from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";

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
    const bloomPass = bloom(color, 0.62, 0.7, 0.62);
    const pipeline = new RenderPipeline(gl);
    pipeline.outputNode = color.add(bloomPass);
    return pipeline;
  }, [gl, scene, camera]);

  useFrame(() => {
    post.render();
  }, 1);

  return null;
}
