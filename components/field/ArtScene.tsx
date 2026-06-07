'use client';

import { CameraDirector } from '@/components/canvas/CameraDirector';
import { TensionField } from '@/components/field/TensionField';

import type { MouseState, PulseState } from '@/lib/tension/types';

type Props = {
  tension: number;
  speed: number;
  pullStrength: number;
  mouse: MouseState;
  burst?: number;
  reducedDamp?: number;
  pulse?: PulseState;
};

export function ArtScene({
  tension,
  speed,
  pullStrength,
  mouse,
  burst = 0,
  reducedDamp = 1,
  pulse = { x: 0, y: 0, strength: 0 },
}: Props) {
  const mousePull = Math.min(1, Math.hypot(mouse.x, mouse.y) * 1.25) * pullStrength;

  return (
    <>
      <CameraDirector tension={tension} mouse={mouse} reducedDamp={reducedDamp} />
      <TensionField
        tension={tension}
        speed={speed}
        mouse={mouse}
        mousePull={mousePull}
        burst={burst}
        pulse={pulse}
      />

    </>
  );
}