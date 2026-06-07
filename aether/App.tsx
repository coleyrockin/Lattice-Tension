'use client';

import { useState } from 'react';
import { AetherCanvas } from '@/aether/Canvas';
import { HUD } from '@/aether/HUD';
import { useAether } from '@/aether/hooks/useAether';

export function AetherApp() {
  const [label, setLabel] = useState('…');
  const { sim, pulse, audioOn, setPreset, pluck, toggleAudio } = useAether();

  return (
    <div
      id="aether"
      className="relative h-[100dvh] w-full overflow-hidden bg-black"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-ui]')) return;
        pluck(e.clientX, e.clientY);
      }}
    >
      <AetherCanvas sim={sim} pulse={pulse} onReady={setLabel} />
      <HUD sim={sim} label={label} audioOn={audioOn} onPreset={setPreset} onAudio={toggleAudio} />
    </div>
  );
}