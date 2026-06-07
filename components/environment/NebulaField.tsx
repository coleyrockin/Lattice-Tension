'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Props = { tension: number };

export function NebulaField({ tension }: Props) {
  const m1 = useRef<THREE.Mesh>(null!);
  const m2 = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (m1.current) {
      m1.current.rotation.z = state.clock.elapsedTime * 0.0015 + tension * 0.02;
      m1.current.rotation.y = state.clock.elapsedTime * 0.0008;
    }
    if (m2.current) {
      m2.current.rotation.z = -state.clock.elapsedTime * 0.0012 - tension * 0.015;
    }
  });

  const opacity1 = 0.048 + tension * 0.035;
  const opacity2 = 0.038 + tension * 0.028;

  return (
    <>
      <mesh ref={m1} position={[-10, 3.5, -26]} rotation={[0.35, 1.15, -0.25]}>
        <planeGeometry args={[38, 38]} />
        <meshBasicMaterial color="#2a1f4a" transparent opacity={opacity1} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={m2} position={[12, -4, -22]} rotation={[-0.45, -0.95, 0.35]}>
        <planeGeometry args={[32, 32]} />
        <meshBasicMaterial color="#1f2a3e" transparent opacity={opacity2} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}