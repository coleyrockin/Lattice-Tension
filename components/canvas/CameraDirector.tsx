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
  const target = useRef(new THREE.Vector3(0, 0, 5.8));

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame drives camera
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pull = tension * reducedDamp;

    target.current.set(
      Math.sin(t * 0.05) * 0.35 * pull + mouse.x * 0.25,
      Math.sin(t * 0.07) * 0.18 * pull + mouse.y * 0.2,
      5.8 - pull * 0.35,
    );

    camera.position.lerp(target.current, 0.035);
    camera.lookAt(0, 0, 0);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 36 + tension * 4;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}