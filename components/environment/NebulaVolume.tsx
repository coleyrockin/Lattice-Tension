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
  mul,
  oscSine,
  positionWorld,
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
    const shell = oscSine(radius.mul(0.04).sub(time.mul(0.02))).mul(0.5).add(0.5);
    const bandA = oscSine(world.x.mul(0.07).add(time.mul(0.04)))
      .mul(oscSine(world.y.mul(0.05).sub(time.mul(0.03))))
      .mul(0.5)
      .add(0.5);
    const bandB = oscSine(world.z.mul(0.06).add(time.mul(0.025)))
      .mul(oscSine(world.x.mul(0.04).add(world.y.mul(0.03))))
      .mul(0.5)
      .add(0.5);
    const density = mul(shell, bandA.mul(0.55).add(bandB.mul(0.45))).mul(0.65).add(0.2);

    const cool = vec3(0.06, 0.1, 0.42);
    const warm = vec3(0.42, 0.16, 0.08);
    const accent = vec3(0.55, 0.35, 0.75);
    const col = mix(mix(cool, warm, tensionUniform), accent, density.mul(0.35));
    mat.colorNode = col.mul(density.mul(0.7).add(0.35));
    return mat;
  }, [tensionUniform]);

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame mutates TSL material
  useFrame(() => {
    tensionUniform.value = tension;
    const atm = getAtmosphere(tension);
    material.opacity = 0.2 + tension * 0.16;
    material.colorNode = mix(color(atm.bg), color(atm.accent), float(tension * 0.42)).mul(
      oscSine(time.mul(0.03)).mul(0.1).add(0.9),
    );
  });

  return (
    <mesh scale={[60, 60, 60]}>
      <sphereGeometry args={[1, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}