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
  const target = useRef(new THREE.Vector3(0, 0.15, 11.5));
  const lookAt = useRef(new THREE.Vector3());
  const state = nearestPreset(tension);

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame drives camera
  useFrame((frameState) => {
    const t = frameState.clock.elapsedTime;
    const atm = lerpAtmospherePreset(tension);
    const chaotic = Math.max(0, (tension - 0.55) * 2.2) * reducedDamp * atm.cameraJitter;

    const orbitR = 1.6 + tension * 0.75;
    const orbitY = 0.5 + Math.sin(t * 0.11) * 0.35;
    let baseZ = 11.5 - tension * 1.2;
    if (state === 'release') baseZ += 1.4;
    if (state === 'peak') baseZ -= 0.8;

    target.current.set(
      Math.sin(t * atm.cameraOrbit) * orbitR + mouse.x * (0.7 + tension * 0.35),
      orbitY + mouse.y * 0.45 + Math.sin(t * 0.14) * 0.2 * tension,
      baseZ + Math.cos(t * 0.05) * 0.5,
    );

    if (chaotic > 0) {
      target.current.x += Math.sin(t * 19.0) * 0.06 * chaotic;
      target.current.y += Math.cos(t * 23.0) * 0.04 * chaotic;
    }

    const lerp = state === 'peak' ? 0.06 : 0.04 + (1 - tension) * 0.02;
    camera.position.lerp(target.current, lerp);

    lookAt.current.set(
      mouse.x * 0.35 * tension,
      0.05 + (state === 'peak' ? Math.sin(t * 2.5) * 0.1 * (tension - 0.6) : 0),
      0,
    );
    camera.lookAt(lookAt.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 48 + tension * 6 + chaotic * 4 + (state === 'release' ? -2 : 0);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}