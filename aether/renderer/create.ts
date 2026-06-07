import { WebGPURenderer } from 'three/webgpu';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import type { Tier } from '@/aether/renderer/tier';

export async function createRenderer(canvas: HTMLCanvasElement, tier: Tier, dpr: number) {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: tier !== 'C',
    alpha: true,
    forceWebGL: tier !== 'A',
  });

  await renderer.init();
  renderer.setPixelRatio(dpr);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  return renderer;
}