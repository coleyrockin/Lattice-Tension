import { WebGPURenderer } from 'three/webgpu';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import type { RenderTier } from '@/engine/renderer/capability';

export async function createAetherRenderer(
  canvas: HTMLCanvasElement,
  tier: RenderTier,
  dpr: number,
) {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: tier !== 'C',
    alpha: false,
    forceWebGL: tier !== 'A',
  });

  await renderer.init();
  renderer.setPixelRatio(dpr);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  return renderer;
}