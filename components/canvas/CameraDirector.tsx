'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { MouseState } from '@/lib/tension/types';

type Props = {
  tension: number;
  mouse: MouseState;
  reducedDamp?: number;
};

export function CameraDirector({ tension, mouse, reducedDamp = 1 }: Props) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.15, 11.5));
  const lookAt = useRef(new THREE.Vector3());

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const chaotic = Math.max(0, (tension - 0.55) * 2.2) * reducedDamp;

    const orbitR = 1.8 + tension * 0.6;
    const orbitY = 0.55 + Math.sin(t * 0.11) * 0.35;
    const baseZ = 11.5 - tension * 1.2;

    target.current.set(
      Math.sin(t * 0.07) * orbitR + mouse.x * 0.9,
      orbitY + mouse.y * 0.45 + Math.sin(t * 0.14) * 0.2 * tension,
      baseZ + Math.cos(t * 0.05) * 0.5,
    );

    if (chaotic > 0) {
      target.current.x += Math.sin(t * 19.0) * 0.06 * chaotic;
      target.current.y += Math.cos(t * 23.0) * 0.04 * chaotic;
    }

    const lerp = 0.04 + (1 - tension) * 0.02;
    // eslint-disable-next-line react-hooks/immutability
    camera.position.lerp(target.current, lerp);

    lookAt.current.set(
      mouse.x * 0.35 * tension,
      0.05 + (tension > 0.6 ? Math.sin(t * 2.5) * 0.08 * (tension - 0.6) : 0),
      0,
    );
    camera.lookAt(lookAt.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 48 + tension * 6 + chaotic * 4;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}