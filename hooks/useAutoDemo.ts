'use client';

import { useEffect, useRef, useCallback, useState, type RefObject } from 'react';
import { AUTO_DEMO } from '@/lib/constants/motion';
import { PRESETS, PRESET_ORDER } from '@/lib/constants/presets';
import { animateToPreset, killAllAnimations } from '@/lib/tension/animatePreset';
import type { SimParams } from '@/lib/tension/types';

export function useAutoDemo(
  simRef: RefObject<SimParams>,
  setSimParams: React.Dispatch<React.SetStateAction<SimParams>>,
) {
  const cancelledRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [runId, setRunId] = useState(0);

  const cancelDemo = useCallback(() => {
    if (cancelledRef.current) return;
    cancelledRef.current = true;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    killAllAnimations();
  }, []);

  const restartDemo = useCallback(() => {
    cancelledRef.current = false;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    killAllAnimations();
    setRunId((id) => id + 1);
  }, []);

  useEffect(() => {
    let idx = 0;
    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timeoutsRef.current.push(id);
    };

    schedule(() => {
      const step = () => {
        if (cancelledRef.current || idx >= PRESET_ORDER.length) return;
        const name = PRESET_ORDER[idx++];
        const tgt = PRESETS[name];
        const isRelease = idx === PRESET_ORDER.length;
        animateToPreset(simRef.current, tgt, setSimParams, {
          duration: isRelease ? AUTO_DEMO.releaseDuration : AUTO_DEMO.stepDuration,
          ease: isRelease ? AUTO_DEMO.releaseEase : AUTO_DEMO.presetEase,
          onComplete() {
            if (!cancelledRef.current && idx < PRESET_ORDER.length) {
              schedule(step, AUTO_DEMO.stepGapMs);
            }
          },
        });
      };
      step();
    }, AUTO_DEMO.startDelayMs);

    return () => {
      cancelledRef.current = true;
      timeoutsRef.current.forEach(clearTimeout);
      killAllAnimations();
    };
  }, [setSimParams, simRef, runId]);

  return { cancelDemo, restartDemo };
}