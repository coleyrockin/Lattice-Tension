'use client';

import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Field } from '@/aether/visuals/Field';
import { CameraRig } from '@/aether/visuals/CameraRig';
import { createRenderer } from '@/aether/renderer/create';
import { detectTier, maxDpr, tierLabel } from '@/aether/renderer/tier';
import type { Pulse, Sim } from '@/aether/core/types';

type Props = {
  sim: Sim;
  pulse: Pulse;
  onReady: (label: string) => void;
};

function Scene({ sim, pulse, tier }: { sim: Sim; pulse: Pulse; tier: ReturnType<typeof detectTier> }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraRig tension={sim.tension} speed={sim.speed} />
      <Field tension={sim.tension} speed={sim.speed} pulse={pulse} tier={tier} />
    </>
  );
}

export function AetherCanvas({ sim, pulse, onReady }: Props) {
  const [open, setOpen] = useState(false);
  const tier = useMemo(() => detectTier(), []);
  const dpr = useMemo(() => Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, maxDpr(tier)), [tier]);

  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-black transition-opacity duration-[3000ms] ${
          open ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <Canvas
        camera={{ position: [0, 0, 2.15], fov: 50, near: 0.1, far: 20 }}
        dpr={dpr}
        style={{ background: 'transparent' }}
        gl={async (props) => createRenderer(props.canvas as HTMLCanvasElement, tier, dpr)}
        onCreated={() => {
          onReady(tierLabel(tier));
          setTimeout(() => setOpen(true), 500);
        }}
      >
        <Scene sim={sim} pulse={pulse} tier={tier} />
      </Canvas>
    </>
  );
}