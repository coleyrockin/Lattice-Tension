'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AetherCanvas } from '@/components/canvas/AetherCanvas';
import { AetherHUD } from '@/components/ui/AetherHUD';
import { DEFAULT_SIM, PRESETS } from '@/lib/constants/presets';
import { animateToPreset } from '@/lib/tension/animatePreset';
import { detectRendererInfo } from '@/engine/renderer/capability';
import { getPerfProfile } from '@/lib/constants/perfTiers';
import type { SimParams, TensionPreset } from '@/lib/tension/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTensionSonifier } from '@/hooks/useTensionSonifier';
import { useTensionInput } from '@/hooks/useTensionInput';
import { useAutoDemo } from '@/hooks/useAutoDemo';
import { useIdleOrbit } from '@/hooks/useIdleOrbit';

export function AetherExperience() {
  const [simParams, setSimParams] = useState<SimParams>(DEFAULT_SIM);
  const [rendererLabel, setRendererLabel] = useState('…');
  const simRef = useRef(simParams);
  useEffect(() => {
    simRef.current = simParams;
  }, [simParams]);

  const reduced = useReducedMotion();
  const tier = useMemo(() => detectRendererInfo().tier, []);
  const perf = useMemo(() => getPerfProfile(tier), [tier]);
  const dpr =
    reduced || typeof window === 'undefined'
      ? 1
      : Math.min(window.devicePixelRatio, perf.maxDpr);
  const visualDamp = reduced ? 0.4 : 1;
  const { audioOn, toggleAudio } = useTensionSonifier(simParams.tension);
  const { cancelDemo, restartDemo } = useAutoDemo(simRef, setSimParams);
  const { mouse, burst, pulse, handlePluck } = useTensionInput(setSimParams, cancelDemo);

  useIdleOrbit(restartDemo, 30000);

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
      className="aether-stage relative h-[100dvh] w-full overflow-hidden text-[#f8f4ff]"
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