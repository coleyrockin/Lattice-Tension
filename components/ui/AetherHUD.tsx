'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [flash, setFlash] = useState<TensionPreset | null>(null);
  const active = nearestPreset(simParams.tension);
  const prevActive = useRef(active);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (active !== prevActive.current) {
      setFlash(active);
      prevActive.current = active;
      const t = setTimeout(() => setFlash(null), 2400);
      return () => clearTimeout(t);
    }
  }, [active]);

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
        <div className="hud-glass inline-block px-4 py-2.5">
          <div className="mono text-[11px] tracking-[0.38em] text-white/75">AETHER</div>
          <div className="mt-1 text-[10px] tracking-[0.22em] text-white/35 uppercase">
            tension field
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute top-6 right-6 mono text-[9px] tracking-[0.2em] text-white/25 uppercase">
        {rendererLabel}
      </div>

      {flash && (
        <div className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 hud-state-flash mono text-[10px] tracking-[0.42em] uppercase text-[#facc15]/90">
          {flash}
        </div>
      )}

      <div
        data-tension-ui
        className="pointer-events-auto absolute bottom-7 left-1/2 -translate-x-1/2 hud-glass flex gap-1.5 px-2 py-1.5"
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