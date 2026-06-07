'use client';

import { PRESETS } from '@/aether/core/presets';
import { STATE_COLOR } from '@/aether/core/palette';
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
  const accent = STATE_COLOR[active];

  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000_72%)]" />
      <div
        className="pointer-events-none absolute left-6 top-6 font-mono text-[10px] tracking-[0.55em] text-white/50"
        style={{ textShadow: `0 0 24px ${accent}40` }}
      >
        AETHER
      </div>
      <div className="pointer-events-none absolute right-6 top-6 font-mono text-[8px] tracking-[0.25em] text-white/25 uppercase">
        {label}
      </div>
      <div
        data-ui
        className="absolute inset-x-0 bottom-0 flex justify-center pb-8 opacity-0 transition-opacity duration-700 hover:opacity-100 focus-within:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-black/40 px-3 py-2 backdrop-blur-xl">
          {(Object.keys(PRESETS) as Preset[]).map((k) => (
            <button
              key={k}
              type="button"
              className="rounded-full px-3 py-1 font-mono text-[8px] uppercase tracking-[0.22em] transition-all duration-300"
              style={{
                color: active === k ? STATE_COLOR[k] : 'rgba(255,255,255,0.35)',
                background: active === k ? `${STATE_COLOR[k]}18` : 'transparent',
              }}
              onClick={() => onPreset(k)}
            >
              {k}
            </button>
          ))}
          <span className="mx-1 h-3 w-px bg-white/10" />
          <button
            type="button"
            className="rounded-full px-3 py-1 font-mono text-[8px] uppercase tracking-[0.22em] text-white/35 transition-colors hover:text-white/60"
            onClick={onAudio}
          >
            {audioOn ? 'mute' : 'tone'}
          </button>
        </div>
      </div>
    </>
  );
}