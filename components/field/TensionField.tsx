'use client';

import { useMemo } from 'react';
import { generateTensionField } from '@/lib/lattice/generateField';
import { LatticeOrganism } from '@/components/field/LatticeOrganism';
import { FilamentBridge } from '@/components/field/FilamentBridge';
import type { PerfProfile } from '@/lib/constants/perfTiers';
import type { MouseState, PulseState } from '@/lib/tension/types';

type Props = {
  tension: number;
  speed: number;
  mouse: MouseState;
  mousePull: number;
  burst?: number;
  pulse?: PulseState;
  perf: PerfProfile;
};

export function TensionField({
  tension,
  speed,
  mouse,
  mousePull,
  burst = 0,
  pulse = { x: 0, y: 0, strength: 0 },
  perf,
}: Props) {
  const field = useMemo(() => generateTensionField(), []);

  return (
    <group>
      <FilamentBridge bridges={field.bridges} tension={tension} lineWidth={perf.lineWidth * 0.55} />
      {field.organisms.map(({ geometry, placement }, i) => (
        <group
          key={i}
          position={placement.position}
          rotation={placement.rotation}
          scale={placement.scale}
        >
          <LatticeOrganism
            geometry={geometry}
            tension={tension}
            speed={speed}
            mouse={mouse}
            mousePull={mousePull}
            burst={burst}
            pulse={pulse}
            perf={perf}
            lineWidth={perf.lineWidth * (placement.scale < 0.6 ? 0.85 : 1)}
          />
        </group>
      ))}
    </group>
  );
}