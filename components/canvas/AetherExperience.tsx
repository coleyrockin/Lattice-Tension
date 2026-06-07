'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AetherCanvas } from '@/components/canvas/AetherCanvas';
import { AetherHUD } from '@/components/ui/AetherHUD';
import { DEFAULT_SIM, PRESETS } from '@/lib/constants/presets';
import { animateToPreset } from '@/lib/tension/animatePreset';
import type { SimParams, TensionPreset } from '@/lib/tension/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTensionAudio } from '@/hooks/useTensionAudio';
import { useTensionInput } from '@/hooks/useTensionInput';
import { useAutoDemo } from '@/hooks/useAutoDemo';

export function AetherExperience() {
  const [simParams, setSimParams] = useState<SimParams>(DEFAULT_SIM);
  const [rendererLabel, setRendererLabel] = useState('…');
  const simRef = useRef(simParams);
  useEffect(() => {
    simRef.current = simParams;
  }, [simParams]);

  const reduced = useReducedMotion();
  const dpr =
    reduced || typeof window === 'undefined'
      ? 1
      : Math.min(window.devicePixelRatio, 2);
  const visualDamp = reduced ? 0.4 : 1;
  const { audioOn, toggleAudio } = useTensionAudio(simParams.tension);
  const { cancelDemo } = useAutoDemo(simRef, setSimParams);
  const { mouse, burst, pulse, handlePluck } = useTensionInput(setSimParams, cancelDemo);

  const applyPreset = useCallback(
    (name: TensionPreset) => {
      cancelDemo();
      animateToPreset(simRef.current, PRESETS[name], setSimParams);
    },
    [cancelDemo],
  );

  const handleCanvasPluck = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-tension-ui]')) return;
      handlePluck(e);
    },
    [handlePluck],
  );

  return (
    <div
      id="lattice-container"
      className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0618] text-[#f8f4ff]"
      onClick={handleCanvasPluck}
    >
      <AetherCanvas
        simParams={simParams}
        mouse={mouse}
        burst={burst * visualDamp}
        pulse={pulse}
        visualDamp={visualDamp}
        dpr={dpr}
        onReady={setRendererLabel}
      />

      <AetherHUD
        simParams={simParams}
        audioOn={audioOn}
        rendererLabel={rendererLabel}
        onPreset={applyPreset}
        onToggleAudio={toggleAudio}
        onInteract={cancelDemo}
      />
    </div>
  );
}