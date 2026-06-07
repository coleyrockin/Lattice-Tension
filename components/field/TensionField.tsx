'use client';

import { useMemo } from 'react';
import { generateTensionField } from '@/lib/lattice/generateField';
import { LatticeOrganism } from '@/components/field/LatticeOrganism';
import { FilamentBridge } from '@/components/field/FilamentBridge';
import { MacroArcs } from '@/components/field/MacroArcs';
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
      {perf.macroArcs && <MacroArcs tension={tension} />}
      <FilamentBridge bridges={field.bridges} tension={tension} />
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
          />
        </group>
      ))}
    </group>
  );
}