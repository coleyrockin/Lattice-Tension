'use client';

import { useFrame, useThree } from '@react-three/fiber';
import type { MouseState } from '@/lib/tension/types';

type Props = {
  tension: number;
  mouse: MouseState;
  reducedDamp?: number;
};

export function CameraDirector({ tension, mouse, reducedDamp = 1 }: Props) {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const camFreq = 0.35 + tension * 0.45;
    const bob = Math.sin(t * camFreq) * 0.014 * tension * reducedDamp;
    // R3F convention: mutate camera in useFrame
    // eslint-disable-next-line react-hooks/immutability
    camera.position.y = 0.6 + bob + mouse.y * 0.05 * tension * reducedDamp;
    camera.position.x = mouse.x * 0.035 * tension * reducedDamp;
    const sway = tension * 0.025 * Math.sin(t * 0.08) * reducedDamp;
    camera.position.z = 8.2 + Math.cos(t * 0.06) * sway;
    const lookY = 0.1 + bob * 0.6 + (tension > 0.6 ? Math.sin(t * 2.5) * 0.03 * (tension - 0.6) : 0);
    camera.lookAt(0, lookY, 0);
  });

  return null;
}