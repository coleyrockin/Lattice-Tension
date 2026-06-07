'use client';

import { PRESETS } from '@/aether/core/presets';
import type { Preset, Sim } from '@/aether/core/types';

type Props = {
  sim: Sim;
  label: string;
  audioOn: boolean;
  onPreset: (p: Preset) => void;
  onAudio: () => void;
};

function activePreset(tension: number): Preset {
  const keys = Object.keys(PRESETS) as Preset[];
  return keys.reduce((best, k) =>
    Math.abs(PRESETS[k].tension - tension) < Math.abs(PRESETS[best].tension - tension) ? k : best,
  );
}

export function HUD({ sim, label, audioOn, onPreset, onAudio }: Props) {
  const active = activePreset(sim.tension);

  return (
    <>
      <div className="pointer-events-none absolute left-5 top-5 font-mono text-[9px] tracking-[0.45em] text-white/40">
        AETHER
      </div>
      <div className="pointer-events-none absolute right-5 top-5 font-mono text-[8px] tracking-[0.2em] text-white/20 uppercase">
        {label}
      </div>
      <div
        data-ui
        className="absolute inset-x-0 bottom-0 flex justify-center pb-6 opacity-0 transition-opacity duration-500 hover:opacity-100 focus-within:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-1 rounded-md border border-white/10 bg-black/50 px-2 py-1.5 backdrop-blur-md">
          {(Object.keys(PRESETS) as Preset[]).map((k) => (
            <button
              key={k}
              type="button"
              className={`px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] transition-colors ${
                active === k ? 'text-cyan-300' : 'text-white/40 hover:text-white/70'
              }`}
              onClick={() => onPreset(k)}
            >
              {k}
            </button>
          ))}
          <button
            type="button"
            className="ml-1 border-l border-white/10 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40 hover:text-white/70"
            onClick={onAudio}
          >
            {audioOn ? 'mute' : 'tone'}
          </button>
        </div>
      </div>
    </>
  );
}