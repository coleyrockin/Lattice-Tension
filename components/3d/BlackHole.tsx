'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { blackHoleVertexShader, blackHoleFragmentShader } from '@/lib/shaders';

interface BlackHoleProps {
  mouse: { x: number; y: number };
  intensity: number;
  climax?: number;
}

export default function BlackHole({ mouse, intensity, climax = 0 }: BlackHoleProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const diskRef = useRef<THREE.Mesh>(null!);
  const coronaRef = useRef<THREE.Mesh>(null!);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0.4 },
    uMousePull: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uClimax: { value: 0 },
  }), []);

  // Accretion disk ring geometry (thin torus-like)
  const diskGeometry = useMemo(() => {
    return new THREE.RingGeometry(1.05, 2.35, 92);
  }, []);

  const coronaGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.92, 48, 48);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Core singularity
    if (meshRef.current) {
      meshRef.current.rotation.z = t * 0.035;
      meshRef.current.rotation.y = t * 0.012;
    }

    // Accretion disk slow spin + wobble
    if (diskRef.current) {
      diskRef.current.rotation.z = t * -0.18 + Math.sin(t * 0.4) * 0.03;
      diskRef.current.rotation.x = Math.sin(t * 0.15) * 0.12 + 0.1;
    }

    // Corona / photon sphere
    if (coronaRef.current) {
      coronaRef.current.rotation.y = t * 0.22;
      coronaRef.current.scale.setScalar(1.0 + Math.sin(t * 2.1) * 0.035 + intensity * 0.08);
    }

    // Update shader uniforms
    uniforms.uTime.value = t;
    uniforms.uIntensity.value = intensity;
    uniforms.uMousePull.value = Math.min(1.0, Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y) * 1.6);
    uniforms.uMouse.value.set(mouse.x, mouse.y);
    uniforms.uClimax.value = climax;
  });

  return (
    <group>
      {/* Event Horizon Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.72, 64, 64]} />
        <shaderMaterial
          vertexShader={blackHoleVertexShader}
          fragmentShader={blackHoleFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Fiery Accretion Disk */}
      <mesh ref={diskRef} geometry={diskGeometry} rotation={[1.35, 0, 0]}>
        <meshBasicMaterial
          color="#f4c26a"
          transparent
          opacity={1.0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner glowing disk layer (lavender) */}
      <mesh geometry={diskGeometry} rotation={[1.32, 0, 0.6]} scale={0.82}>
        <meshBasicMaterial
          color="#c084fc"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Photon Corona */}
      <mesh ref={coronaRef} geometry={coronaGeometry}>
        <meshBasicMaterial
          color="#f8f0ff"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Extra bright outer glow ring for immediate visibility */}
      <mesh rotation={[1.4, 0, 0]}>
        <ringGeometry args={[2.6, 3.1, 64]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.35} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Tiny ultra bright core point */}
      <mesh>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshBasicMaterial 
          color="#fffef5" 
          transparent 
          opacity={1} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
    </group>
  );
}
