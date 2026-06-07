import { Color, DoubleSide } from 'three';
import { NodeMaterial } from 'three/webgpu';
import {
  Break,
  Fn,
  If,
  cos,
  float,
  sin,
  smoothstep,
  texture3D,
  uniform,
  vec3,
  vec4,
  time,
} from 'three/tsl';
import { RaymarchingBox } from 'three/examples/jsm/tsl/utils/Raymarching.js';
import type { Data3DTexture } from 'three';

export function createFieldMaterial(texture: Data3DTexture, steps: number) {
  const baseColor = uniform(new Color('#3d5a80'));
  const range = uniform(0.11);
  const threshold = uniform(0.22);
  const opacity = uniform(0.38);
  const pulse = uniform(0);
  const stepCount = uniform(steps);
  const volume = texture3D(texture, null, 0);

  const raymarch = Fn(() => {
    const finalColor = vec4(0).toVar();

    RaymarchingBox(stepCount, ({ positionRay }) => {
      const samplePos = positionRay
        .add(vec3(sin(time.mul(0.08)).mul(0.015), cos(time.mul(0.06)).mul(0.015), 0))
        .add(0.5);
      const density = float(volume.sample(samplePos).r).toVar();
      const gate = smoothstep(
        threshold.sub(range).sub(pulse.mul(0.08)),
        threshold.add(range).add(pulse.mul(0.05)),
        density,
      ).mul(opacity);

      const shade = volume
        .sample(samplePos.add(vec3(-0.012)))
        .r.sub(volume.sample(samplePos.add(vec3(0.012))).r);
      const tone = shade.mul(2.8).add(samplePos.x.add(samplePos.y).mul(0.18)).add(0.28);

      finalColor.rgb.addAssign(finalColor.a.oneMinus().mul(gate).mul(tone));
      finalColor.a.addAssign(finalColor.a.oneMinus().mul(gate));

      If(finalColor.a.greaterThanEqual(0.92), () => {
        Break();
      });
    });

    return finalColor;
  });

  const material = new NodeMaterial();
  material.colorNode = raymarch().rgb.add(baseColor);
  material.transparent = true;
  material.side = DoubleSide;
  material.depthWrite = false;

  return { material, baseColor, range, threshold, opacity, pulse, stepCount };
}