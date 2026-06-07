'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { lerpAtmospherePreset } from '@/lib/constants/atmosphere';
import { nearestPreset } from '@/lib/atmosphere/interpolate';
import type { MouseState } from '@/lib/tension/types';

type Props = {
  tension: number;
  mouse: MouseState;
  reducedDamp?: number;
};

export function CameraDirector({ tension, mouse, reducedDamp = 1 }: Props) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.1, 8.2));
  const lookAt = useRef(new THREE.Vector3());
  const state = nearestPreset(tension);

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame drives camera
  useFrame((frameState) => {
    const t = frameState.clock.elapsedTime;
    const atm = lerpAtmospherePreset(tension);
    const chaotic = Math.max(0, (tension - 0.55) * 2.2) * reducedDamp * atm.cameraJitter;

    const orbitR = 1.1 + tension * 0.45;
    const orbitY = 0.25 + Math.sin(t * 0.09) * 0.22;
    let baseZ = 8.2 - tension * 0.9;
    if (state === 'release') baseZ += 1.1;
    if (state === 'peak') baseZ -= 0.5;

    target.current.set(
      Math.sin(t * atm.cameraOrbit) * orbitR + mouse.x * (0.45 + tension * 0.2),
      orbitY + mouse.y * 0.28,
      baseZ + Math.cos(t * 0.04) * 0.35,
    );

    if (chaotic > 0) {
      target.current.x += Math.sin(t * 19.0) * 0.04 * chaotic;
      target.current.y += Math.cos(t * 23.0) * 0.03 * chaotic;
    }

    const lerp = state === 'peak' ? 0.05 : 0.035 + (1 - tension) * 0.015;
    camera.position.lerp(target.current, lerp);

    lookAt.current.set(mouse.x * 0.18 * tension, 0, 0);
    camera.lookAt(lookAt.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 44 + tension * 5 + chaotic * 3;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}