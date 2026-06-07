import type { Camera, Scene } from 'three';
import { RenderPipeline } from 'three/webgpu';
import { float, pass, uniform } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { film } from 'three/addons/tsl/display/FilmNode.js';
import type { RenderTier } from '@/engine/renderer/capability';

export type PostPipelineHandles = {
  pipeline: RenderPipeline;
  bloomPass: ReturnType<typeof bloom>;
  tensionUniform: ReturnType<typeof uniform>;
};

export function createPostPipeline(
  renderer: RenderPipeline['renderer'],
  scene: Scene,
  camera: Camera,
  tier: RenderTier,
): PostPipelineHandles {
  const pipeline = new RenderPipeline(renderer);
  const scenePass = pass(scene, camera);
  const color = scenePass.getTextureNode('output');
  const tensionUniform = uniform(float(0.6));

  const bloomPass = bloom(color, tier === 'A' ? 1.6 : 1.1, 0.35, 0.08);
  const output = film(
    color.add(bloomPass),
    tensionUniform.mul(tier === 'A' ? 0.035 : 0.02).add(0.018),
  );
  pipeline.outputNode = output;

  return { pipeline, bloomPass, tensionUniform };
}