'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { nebulaVertexShader, nebulaFragmentShader } from '@/components/shaders';

type Props = { tension: number };

export function NebulaVolume({ tension }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uTension.value = tension;
  });

  return (
    <mesh scale={[55, 55, 55]}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uTension: { value: 0.5 },
        }}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}