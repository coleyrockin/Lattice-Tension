'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { nebulaVertexShader, nebulaFragmentShader } from '@/lib/shaders';

interface NebulaProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color1?: string;
  color2?: string;
  density?: number;
  speed?: number;
  intensity?: number;
}

export default function Nebula({
  position = [0, 0, -8],
  rotation = [0.6, 1.2, -0.3],
  scale = 28,
  color1 = '#3b2a5e',
  color2 = '#4c2a6e',
  density = 0.9,
  speed = 1.0,
  intensity = 0.6,
}: NebulaProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(color1) },
    uColor2: { value: new THREE.Color(color2) },
    uDensity: { value: density },
    uSpeed: { value: speed },
    uIntensity: { value: intensity },
  }), [color1, color2, density, speed]);

  const geometry = useMemo(() => {
    // Large plane for volumetric feel. Multiple instances at different angles give depth.
    return new THREE.PlaneGeometry(1, 1);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.04) * 0.08;
    }
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uIntensity.value = intensity;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation as any}
      scale={scale}
      geometry={geometry}
    >
      <shaderMaterial
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
