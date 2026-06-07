import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, float, mix, oscSine, time, uniform, vec3 } from 'three/tsl';
import { getAtmosphere } from '@/lib/atmosphere/interpolate';

export function createNodeMaterial() {
  const material = new MeshStandardNodeMaterial();
  const tensionUniform = uniform(0.6);
  const stressUniform = uniform(0);
  const accentUniform = uniform(color(getAtmosphere(0.5).accent));

  const heat = tensionUniform
    .mul(0.6)
    .add(oscSine(time.mul(3)).mul(0.3))
    .add(stressUniform.mul(0.45));

  const cool = vec3(0.6, 0.7, 0.95);
  const warm = vec3(0.95, 0.82, 0.55);
  const hot = vec3(1.0, 0.95, 0.72);
  const col = mix(mix(cool, warm, heat), hot, stressUniform.mul(0.65));
  const emissive = mix(col, accentUniform, 0.25).mul(heat.mul(0.5).add(0.85).add(stressUniform.mul(0.8)));

  material.colorNode = col;
  material.emissiveNode = emissive;
  material.metalnessNode = float(0.15);
  material.roughnessNode = float(0.32);
  material.transparent = true;

  return { material, tensionUniform, stressUniform, accentUniform };
}

export function syncNodeMaterial(
  handles: ReturnType<typeof createNodeMaterial>,
  tension: number,
  stress: number,
) {
  handles.tensionUniform.value = tension;
  handles.stressUniform.value = stress;
  handles.accentUniform.value.set(getAtmosphere(tension).accent);
}