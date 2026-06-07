'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide } from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { color, float, mix, oscSine, positionWorld, time, uniform, vec3 } from 'three/tsl';
import { getAtmosphere } from '@/lib/atmosphere/interpolate';

type Props = { tension: number };

export function NebulaVolume({ tension }: Props) {
  const tensionUniform = useMemo(() => uniform(float(tension)), [tension]);

  const material = useMemo(() => {
    const mat = new MeshBasicNodeMaterial();
    mat.side = BackSide;
    mat.transparent = true;
    mat.depthWrite = false;
    mat.opacity = 0.85;

    const world = positionWorld;
    const density = oscSine(world.x.mul(0.08).add(time.mul(0.05)))
      .mul(oscSine(world.y.mul(0.06).add(time.mul(0.04))))
      .mul(0.5)
      .add(0.5);

    const cool = vec3(0.08, 0.12, 0.38);
    const warm = vec3(0.38, 0.18, 0.06);
    const col = mix(cool, warm, tensionUniform).mul(density.mul(0.55).add(0.25));

    mat.colorNode = col;
    return mat;
  }, [tensionUniform]);

  useFrame(() => {
    tensionUniform.value = tension;
    const atm = getAtmosphere(tension);
    material.opacity = 0.18 + tension * 0.14;
    material.colorNode = mix(
      color(atm.bg),
      color(atm.accent),
      float(tension * 0.35),
    ).mul(oscSine(time.mul(0.03)).mul(0.08).add(0.92));
  });

  return (
    <mesh scale={[60, 60, 60]}>
      <sphereGeometry args={[1, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}