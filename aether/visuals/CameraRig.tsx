'use client';

import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';

type Props = { tension: number; speed: number };

export function CameraRig({ tension, speed }: Props) {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const orbit = 0.22 * tension;
    const lift = 0.08 * tension;

    state.camera.position.set(
      Math.sin(t * 0.05 * speed) * orbit,
      Math.sin(t * 0.035 * speed) * lift,
      2.35 - tension * 0.18,
    );
    state.camera.lookAt(0, 0, 0);

    const cam = state.camera as PerspectiveCamera;
    if ('fov' in cam) {
      cam.fov = 42 + tension * 6;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}