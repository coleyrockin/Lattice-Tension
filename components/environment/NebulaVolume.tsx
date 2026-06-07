'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide } from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  color,
  float,
  length,
  mix,
  oscSine,
  positionWorld,
  pow,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import { getAtmosphere } from '@/lib/atmosphere/interpolate';

type Props = {
  tension: number;
  segments?: number;
};

export function NebulaVolume({ tension, segments = 48 }: Props) {
  const tensionUniform = useMemo(() => uniform(float(tension)), []);

  const material = useMemo(() => {
    const mat = new MeshBasicNodeMaterial();
    mat.side = BackSide;
    mat.transparent = true;
    mat.depthWrite = false;

    const world = positionWorld;
    const radius = length(world);
    const shell = pow(oscSine(radius.mul(0.035).sub(time.mul(0.015))).mul(0.5).add(0.5), 1.4);
    const bandA = oscSine(world.x.mul(0.05).add(time.mul(0.03)))
      .mul(oscSine(world.y.mul(0.04).sub(time.mul(0.025))))
      .mul(0.5)
      .add(0.5);
    const bandB = oscSine(world.z.mul(0.045).add(time.mul(0.02)))
      .mul(oscSine(world.x.mul(0.03).add(world.y.mul(0.025))))
      .mul(0.5)
      .add(0.5);
    const density = shell.mul(bandA.mul(0.5).add(bandB.mul(0.5))).mul(0.75).add(0.15);

    const deep = vec3(0.02, 0.04, 0.14);
    const mist = vec3(0.18, 0.08, 0.32);
    const col = mix(deep, mist, tensionUniform.mul(0.65)).mul(density);
    mat.colorNode = col;
    return mat;
  }, [tensionUniform]);

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame mutates TSL material
  useFrame(() => {
    tensionUniform.value = tension;
    const atm = getAtmosphere(tension);
    material.opacity = 0.32 + tension * 0.22;
    material.colorNode = mix(color(atm.bg), color(atm.accent), float(0.28 + tension * 0.42)).mul(
      oscSine(time.mul(0.025)).mul(0.12).add(0.88),
    );
  });

  return (
    <mesh scale={[72, 72, 72]}>
      <sphereGeometry args={[1, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}