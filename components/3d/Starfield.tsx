'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { starVertexShader, starFragmentShader } from '@/lib/shaders';

interface StarfieldProps {
  count?: number;
  radius?: number;
  speed?: number;
  intensity?: number;
}

export default function Starfield({ 
  count = 2200, 
  radius = 52, 
  speed = 0.008,
  intensity = 0.6 
}: StarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null!);

  const { positions, sizes, twinkles } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const tw = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spherical distribution with bias toward outer
      const r = radius * (0.6 + Math.pow(Math.random(), 1.6) * 0.9);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.72;
      pos[i * 3 + 2] = r * Math.cos(phi);

      sz[i] = Math.random() * 2.1 + 0.9;
      tw[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, sizes: sz, twinkles: tw };
  }, [count, radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkles, 1));
    return geo;
  }, [positions, sizes, twinkles]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * speed;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.06;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={{
          uTime: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
