import { Line2NodeMaterial } from 'three/webgpu';
import { color, mix, oscSine, pow, time, uniform, vec3 } from 'three/tsl';
import { getAtmosphere } from '@/lib/atmosphere/interpolate';

export function createFilamentMaterial(lineWidth = 0.085, worldUnits = true) {
  const material = new Line2NodeMaterial({
    linewidth: lineWidth,
    worldUnits,
    alphaToCoverage: true,
  });

  const tensionUniform = uniform(0.6);
  const stressUniform = uniform(0);
  const accentUniform = uniform(color(getAtmosphere(0.5).accent));

  const cyan = vec3(0.45, 0.88, 1.0);
  const gold = vec3(1.0, 0.82, 0.35);
  const white = vec3(1.0, 0.98, 0.92);

  const pulse = oscSine(time.mul(0.45).add(tensionUniform.mul(3))).mul(0.5).add(0.5);
  const ripple = oscSine(time.mul(10).add(stressUniform.mul(14))).mul(0.5).add(0.5);
  const base = mix(cyan, gold, tensionUniform.mul(0.72).add(pulse.mul(0.28)));
  const hot = mix(base, white, stressUniform.mul(0.65).add(pow(tensionUniform, 2).mul(0.35)));
  const accentMix = mix(hot, accentUniform, 0.22);
  const glow = accentMix
    .mul(tensionUniform.mul(0.55).add(1.15).add(stressUniform.mul(1.4)))
    .add(white.mul(stressUniform.mul(ripple).mul(0.55)));

  material.lineColorNode = glow;
  material.depthWrite = false;
  material.transparent = true;

  return { material, tensionUniform, stressUniform, accentUniform };
}