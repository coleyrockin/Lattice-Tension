'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { TorusKnotGeometry } from 'three/webgpu';
import { getAtmosphere } from '@/lib/atmosphere/interpolate';
import { createProofOfLifeMaterial } from '@/engine/tsl/proofOfLifeMaterial';

type Props = { tension: number };

export function TSLProof({ tension }: Props) {
  const geo = useMemo(() => new TorusKnotGeometry(0.42, 0.11, 180, 24), []);
  const { material, accentUniform } = useMemo(
    () => createProofOfLifeMaterial(getAtmosphere(0.5).accent),
    [],
  );

  useFrame(() => {
    accentUniform.value.set(getAtmosphere(tension).accent);
  });

  return <mesh geometry={geo} position={[5.2, 1.8, -1.5]} scale={0.55} material={material} />;
}