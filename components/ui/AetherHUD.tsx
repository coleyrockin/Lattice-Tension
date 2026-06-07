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
  const [showChrome, setShowChrome] = useState(true);
  const [flash, setFlash] = useState<TensionPreset | null>(null);
  const active = nearestPreset(simParams.tension);
  const prevActive = useRef(active);

  useEffect(() => {
    const t = setTimeout(() => setShowChrome(false), 4500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (active !== prevActive.current) {
      setFlash(active);
      prevActive.current = active;
      const t = setTimeout(() => setFlash(null), 2200);
      return () => clearTimeout(t);
    }
  }, [active]);

  return (
    <>
      <div
        className={`pointer-events-none absolute top-5 left-5 transition-opacity duration-[2000ms] ${
          showChrome ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="mono text-[10px] tracking-[0.42em] text-white/50">AETHER</div>
      </div>

      <div className="pointer-events-none absolute top-5 right-5 mono text-[8px] tracking-[0.18em] text-white/15 uppercase">
        {rendererLabel}
      </div>

      {flash && (
        <div className="pointer-events-none absolute left-1/2 top-[20%] -translate-x-1/2 hud-state-flash mono text-[9px] tracking-[0.48em] uppercase text-[#5eead4]/80">
          {flash}
        </div>
      )}

      <div
        data-tension-ui
        className="group pointer-events-auto absolute bottom-0 left-0 right-0 flex justify-center pb-6 opacity-0 transition-opacity duration-700 hover:opacity-100 focus-within:opacity-100"
        style={{ opacity: showChrome ? 1 : undefined }}
        onPointerEnter={() => setShowChrome(true)}
        onPointerLeave={() => setShowChrome(false)}
        onClick={(e) => {
          e.stopPropagation();
          onInteract?.();
        }}
      >
        <div className="hud-glass flex gap-1 px-2 py-1.5">
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
      </div>
    </>
  );
}