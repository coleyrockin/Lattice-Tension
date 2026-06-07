import { MeshBasicNodeMaterial } from 'three/webgpu';
import { color, mix, oscSine, time, uniform, uv, vec3 } from 'three/tsl';

export function createProofOfLifeMaterial(accent: string) {
  const material = new MeshBasicNodeMaterial();
  const accentUniform = uniform(color(accent));

  material.colorNode = mix(
    accentUniform,
    vec3(1.0, 0.92, 0.7),
    oscSine(time.mul(0.35)).mul(0.5).add(0.5),
  ).mul(uv().y.mul(0.4).add(0.7));

  return { material, accentUniform };
}