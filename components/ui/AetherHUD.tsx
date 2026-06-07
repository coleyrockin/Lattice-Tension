'use client';

import { useEffect, useState } from 'react';
import { PRESETS } from '@/lib/constants/presets';
import { nearestPreset } from '@/lib/atmosphere/interpolate';
import type { SimParams, TensionPreset } from '@/lib/tension/types';

type Props = {
  simParams: SimParams;
  audioOn: boolean;
  rendererLabel: string;
  onPreset: (name: TensionPreset) => void;
  onToggleAudio: () => void;
  onInteract?: () => void;
};

export function AetherHUD({
  simParams,
  audioOn,
  rendererLabel,
  onPreset,
  onToggleAudio,
  onInteract,
}: Props) {
  const [visible, setVisible] = useState(true);
  const active = nearestPreset(simParams.tension);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    onInteract?.();
    setVisible(false);
  };

  return (
    <>
      <div
        className={`pointer-events-none absolute top-6 left-6 transition-opacity duration-[1400ms] ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="mono text-[11px] tracking-[0.38em] text-white/70">AETHER</div>
        <div className="mt-1 text-[10px] tracking-[0.22em] text-white/30 uppercase">
          tension field
        </div>
      </div>

      <div className="pointer-events-none absolute top-6 right-6 mono text-[9px] tracking-[0.2em] text-white/25 uppercase">
        {rendererLabel}
      </div>

      <div
        data-tension-ui
        className="pointer-events-auto absolute bottom-7 left-1/2 -translate-x-1/2 flex gap-1.5"
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
      >
        {(Object.keys(PRESETS) as TensionPreset[]).map((k) => (
          <button
            key={k}
            onClick={() => onPreset(k)}
            className={`tension-control${active === k ? ' active' : ''}`}
          >
            {k}
          </button>
        ))}
        <button onClick={onToggleAudio} className="audio-toggle">
          {audioOn ? 'MUTE' : 'TONE'}
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 mono text-[8px] tracking-[2.5px] text-white/20">
        MOUSE • WHEEL • STATES
      </div>
    </>
  );
}