'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CanvasErrorBoundary } from '@/components/canvas/CanvasErrorBoundary';
import { ArtScene } from '@/components/field/ArtScene';
import { BackgroundStars } from '@/components/environment/BackgroundStars';
import { NebulaVolume } from '@/components/environment/NebulaVolume';
import { TensionHUD } from '@/components/ui/TensionHUD';
import { DEFAULT_SIM, PRESETS } from '@/lib/constants/presets';
import { animateToPreset } from '@/lib/tension/animatePreset';
import type { SimParams, TensionPreset } from '@/lib/tension/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTensionAudio } from '@/hooks/useTensionAudio';
import { useTensionInput } from '@/hooks/useTensionInput';
import { useAutoDemo } from '@/hooks/useAutoDemo';

export function AetherExperience() {
  const [simParams, setSimParams] = useState<SimParams>(DEFAULT_SIM);
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

  const applyPreset = useCallback((name: TensionPreset) => {
    cancelDemo();
    animateToPreset(simRef.current, PRESETS[name], setSimParams);
  }, [cancelDemo]);

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
      className="relative h-[100dvh] w-full overflow-hidden bg-black text-[#f8f4ff]"
      onClick={handleCanvasPluck}
    >
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 0.6, 8.2], fov: 45 }}
          style={{ background: '#000' }}
          gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
          dpr={dpr}
        >
          <ambientLight intensity={0.08} />
          <pointLight
            position={[0, 0, 0]}
            intensity={0.6 + simParams.tension * 0.8}
            color="#facc15"
          />
          <pointLight position={[1.5, 1, 2]} intensity={0.4} color="#c084fc" />
          <BackgroundStars />
          <NebulaVolume tension={simParams.tension} />
          <ArtScene
            tension={simParams.tension}
            speed={simParams.speed}
            pullStrength={simParams.pullStrength}
            mouse={mouse}
            burst={burst * visualDamp}
            reducedDamp={visualDamp}
            pulse={pulse}
          />
        </Canvas>
      </CanvasErrorBoundary>

      <TensionHUD
        simParams={simParams}
        audioOn={audioOn}
        onPreset={applyPreset}
        onToggleAudio={toggleAudio}
      />
    </div>
  );
}