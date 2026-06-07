'use client';

import { CameraDirector } from '@/components/canvas/CameraDirector';
import { TensionSculpture } from '@/components/field/TensionSculpture';
import type { MouseState, PulseState } from '@/lib/tension/types';

type Props = {
  tension: number;
  speed: number;
  mouse: MouseState;
  burst?: number;
  reducedDamp?: number;
  pulse?: PulseState;
};

export function ArtScene({
  tension,
  speed,
  mouse,
  burst = 0,
  reducedDamp = 1,
  pulse = { x: 0, y: 0, strength: 0 },
}: Props) {
  return (
    <>
      <CameraDirector tension={tension} mouse={mouse} reducedDamp={reducedDamp} />
      <TensionSculpture
        tension={tension}
        speed={speed}
        mouse={mouse}
        burst={burst}
        pulse={pulse}
      />
    </>
  );
}