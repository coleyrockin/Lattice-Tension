'use client';

import { motion } from 'framer-motion';
import { PRESETS } from '@/lib/constants/presets';
import type { SimParams, TensionPreset } from '@/lib/tension/types';

type Props = {
  simParams: SimParams;
  audioOn: boolean;
  onPreset: (name: TensionPreset) => void;
  onToggleAudio: () => void;
};

export function TensionHUD({ simParams, audioOn, onPreset, onToggleAudio }: Props) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <div className="mono text-[10px] tracking-[6px] text-[#facc15]/55 mb-2">PROCEDURAL ART</div>
          <div className="font-display text-[clamp(3.8rem,11vw,7.2rem)] tracking-[-3.6px] text-white/95 drop-shadow-[0_2px_30px_rgba(0,0,0,0.6)]">
            LATTICE TENSION
          </div>
          <div
            className="h-px w-3/4 mx-auto mt-1.5 bg-gradient-to-r from-transparent via-[#facc15] to-transparent"
            style={{
              opacity: simParams.tension * 0.65 + 0.1,
              transform: `scaleX(${0.4 + simParams.tension * 0.6})`,
              transition: 'transform 80ms linear, opacity 80ms linear',
            }}
          />
          <div className="mt-1.5 text-xs text-white/35 tracking-[2px]">
            counter-rotating helical filaments under procedural strain
          </div>
        </motion.div>
      </div>

      <div
        data-tension-ui
        className="pointer-events-auto absolute bottom-7 left-1/2 -translate-x-1/2 flex gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {(Object.keys(PRESETS) as TensionPreset[]).map((k) => (
          <button key={k} onClick={() => onPreset(k)} className="tension-control">
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