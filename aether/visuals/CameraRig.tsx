'use client';

import { useFrame } from '@react-three/fiber';

type Props = { tension: number; speed: number };

export function CameraRig({ tension, speed }: Props) {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.set(
      Math.sin(t * 0.07 * speed) * 0.14 * tension,
      Math.cos(t * 0.05 * speed) * 0.1 * tension,
      2.15 - tension * 0.12,
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}