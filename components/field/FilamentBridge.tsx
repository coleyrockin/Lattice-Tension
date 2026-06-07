'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FieldBridge } from '@/lib/lattice/generateField';

type Props = {
  bridges: FieldBridge[];
  tension: number;
};

export function FilamentBridge({ bridges, tension }: Props) {
  const ref = useRef<THREE.LineSegments>(null!);

  const geometry = useMemo(() => {
    const positions = new Float32Array(bridges.length * 6);
    bridges.forEach((b, i) => {
      positions[i * 6] = b.from.x;
      positions[i * 6 + 1] = b.from.y;
      positions[i * 6 + 2] = b.from.z;
      positions[i * 6 + 3] = b.to.x;
      positions[i * 6 + 4] = b.to.y;
      positions[i * 6 + 5] = b.to.z;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [bridges]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const mat = ref.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.2 + tension * 0.45 + Math.sin(t * 2.0) * 0.05 * tension;
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial
        color="#facc15"
        transparent
        opacity={0.2 + tension * 0.4}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}