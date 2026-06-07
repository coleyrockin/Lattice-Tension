'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { particleVertexShader, particleFragmentShader } from '@/lib/shaders';

interface ParticleFieldProps {
  count?: number;
  intensity?: number;
  mouse: { x: number; y: number };
  mousePull?: number;
}

export default function ParticleField({ 
  count = 780, 
  intensity = 0.65,
  mouse,
  mousePull = 0 
}: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null!);

  const { positions, sizes, phases, types } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);
    const ty = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread in a generous sphere + bias toward center for "temple" feel
      const r = 3.5 + Math.random() * 19.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.85;
      pos[i * 3 + 2] = r * Math.cos(phi) * 0.9;

      sz[i] = (Math.random() * 2.8 + 1.1) * (i % 4 === 0 ? 1.6 : 1.0);
      ph[i] = Math.random() * Math.PI * 2;
      
      // Type distribution: 0=spark, 1=rune-like, 2=code fragment
      const t = Math.random();
      ty[i] = t > 0.82 ? 2 : (t > 0.58 ? 1 : 0);
    }
    return { positions: pos, sizes: sz, phases: ph, types: ty };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aType', new THREE.BufferAttribute(types, 1));
    return geo;
  }, [positions, sizes, phases, types]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: intensity },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uMousePull: { value: 0 },
  }), []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uIntensity.value = intensity;
    uniforms.uMouse.value.set(mouse.x, mouse.y);
    uniforms.uMousePull.value = mousePull;

    if (pointsRef.current) {
      // Very subtle global drift
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.0045;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
