import { Line2NodeMaterial } from 'three/webgpu';
import { color, mix, oscSine, time, uniform, vec3 } from 'three/tsl';
import { getAtmosphere } from '@/lib/atmosphere/interpolate';

export function createFilamentMaterial(lineWidth = 3.5) {
  const material = new Line2NodeMaterial({
    linewidth: lineWidth,
    worldUnits: false,
    alphaToCoverage: true,
  });

  const tensionUniform = uniform(0.6);
  const stressUniform = uniform(0);
  const accentUniform = uniform(color(getAtmosphere(0.5).accent));

  const cool = vec3(0.35, 0.45, 0.82);
  const warm = vec3(0.92, 0.55, 0.28);
  const hot = vec3(1.0, 0.95, 0.65);

  const phaseGlow = oscSine(time.mul(0.5)).mul(0.5).add(0.5);
  const ripple = oscSine(time.mul(9).add(stressUniform.mul(12))).mul(0.5).add(0.5);
  const w = oscSine(time.mul(0.35).add(tensionUniform.mul(4))).mul(0.5).add(0.5);
  const base = mix(mix(cool, warm, w), hot, tensionUniform.mul(0.75).add(stressUniform.mul(0.55)));
  const accentMix = mix(base, accentUniform, 0.35);
  const glow = accentMix
    .mul(tensionUniform.mul(0.75).add(0.85).add(phaseGlow.mul(0.35)).add(stressUniform.mul(1.1)))
    .add(vec3(1.0, 0.92, 0.65).mul(stressUniform.mul(ripple).mul(0.45)));

  material.lineColorNode = glow;
  material.depthWrite = false;
  material.transparent = true;

  return { material, tensionUniform, stressUniform, accentUniform };
}