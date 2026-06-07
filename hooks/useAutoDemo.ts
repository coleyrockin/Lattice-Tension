'use client';

import { useEffect } from 'react';
import { AUTO_DEMO } from '@/lib/constants/motion';
import { PRESETS, PRESET_ORDER } from '@/lib/constants/presets';
import { animateToPreset } from '@/lib/tension/animatePreset';
import type { SimParams } from '@/lib/tension/types';

export function useAutoDemo(
  simParams: SimParams,
  setSimParams: React.Dispatch<React.SetStateAction<SimParams>>,
) {
  useEffect(() => {
    let idx = 0;
    const t0 = setTimeout(() => {
      const step = () => {
        if (idx >= PRESET_ORDER.length) return;
        const name = PRESET_ORDER[idx++];
        const tgt = PRESETS[name];
        const isRelease = idx === PRESET_ORDER.length;
        animateToPreset(simParams, tgt, setSimParams, {
          duration: isRelease ? AUTO_DEMO.releaseDuration : AUTO_DEMO.stepDuration,
          ease: isRelease ? AUTO_DEMO.releaseEase : AUTO_DEMO.presetEase,
          onComplete() {
            if (idx < PRESET_ORDER.length) setTimeout(step, AUTO_DEMO.stepGapMs);
          },
        });
      };
      step();
    }, AUTO_DEMO.startDelayMs);
    return () => clearTimeout(t0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}