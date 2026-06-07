import { MeshBasicNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
import { BackSide } from 'three';
import {
  color,
  float,
  mix,
  normalLocal,
  oscSine,
  positionLocal,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import { getAtmosphere } from '@/lib/atmosphere/interpolate';

export function createSculptureMaterial() {
  const material = new MeshStandardNodeMaterial();
  const tensionUniform = uniform(0.2);
  const pulseUniform = uniform(0);
  const accentUniform = uniform(color(getAtmosphere(0.18).accent));

  const wave = oscSine(
    time.mul(0.65).add(positionLocal.y.mul(5)).add(positionLocal.x.mul(2.5)),
  );
  const breathe = oscSine(time.mul(0.22)).mul(0.5).add(0.5);
  const displacement = normalLocal.mul(
    wave.mul(tensionUniform.mul(0.055).add(0.012)).add(pulseUniform.mul(0.1)),
  );
  material.positionNode = positionLocal.add(displacement);

  const core = vec3(0.03, 0.05, 0.1);
  const rim = mix(accentUniform, vec3(1.0, 0.94, 0.78), tensionUniform.mul(0.7));
  const shade = mix(core, rim, wave.mul(0.45).add(0.55).mul(tensionUniform.mul(0.5).add(0.3)));
  material.colorNode = shade;
  material.emissiveNode = rim.mul(
    tensionUniform.mul(0.55).add(0.22).add(pulseUniform.mul(0.45)).add(breathe.mul(0.08)),
  );
  material.metalnessNode = float(0.92);
  material.roughnessNode = float(0.12);

  return { material, tensionUniform, pulseUniform, accentUniform };
}

export function createHaloMaterial() {
  const material = new MeshBasicNodeMaterial();
  const tensionUniform = uniform(0.2);
  const accentUniform = uniform(color(getAtmosphere(0.18).accent));

  material.colorNode = mix(accentUniform, vec3(1, 0.95, 0.85), tensionUniform.mul(0.5));
  material.opacity = 0.08;
  material.transparent = true;
  material.depthWrite = false;
  material.side = BackSide;

  return { material, tensionUniform, accentUniform };
}

export function syncSculptureMaterial(
  handles: ReturnType<typeof createSculptureMaterial>,
  tension: number,
  pulse: number,
) {
  handles.tensionUniform.value = tension;
  handles.pulseUniform.value = pulse;
  handles.accentUniform.value.set(getAtmosphere(tension).accent);
}

export function syncHaloMaterial(
  handles: ReturnType<typeof createHaloMaterial>,
  tension: number,
) {
  handles.tensionUniform.value = tension;
  handles.accentUniform.value.set(getAtmosphere(tension).accent);
  handles.material.opacity = 0.05 + tension * 0.09;
}