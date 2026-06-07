'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createStarField } from '@/lib/lattice/particles';

type Props = { count?: number };

export function BackgroundStars({ count = 1400 }: Props) {
  const pointsRef = useRef<THREE.Points>(null!);
  const geo = useMemo(() => createStarField(count), [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.0025;
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    if (mat) {
      mat.size = 0.85 + Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
    }
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial size={0.9} color="#f4f0ff" transparent opacity={0.38} sizeAttenuation />
    </points>
  );
}