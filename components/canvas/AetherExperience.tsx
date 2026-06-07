'use client';

import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { CanvasErrorBoundary } from '@/components/canvas/CanvasErrorBoundary';
import { ArtScene } from '@/components/field/ArtScene';
import { BackgroundStars } from '@/components/environment/BackgroundStars';
import { NebulaField } from '@/components/environment/NebulaField';
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
  const reduced = useReducedMotion();
  const visualDamp = reduced ? 0.4 : 1;
  const { audioOn, toggleAudio } = useTensionAudio(simParams.tension);
  const { mouse, burst, pulse, handlePluck } = useTensionInput(setSimParams);

  useAutoDemo(simParams, setSimParams);

  const applyPreset = useCallback(
    (name: TensionPreset) => {
      animateToPreset(simParams, PRESETS[name], setSimParams);
    },
    [simParams],
  );

  return (
    <div
      id="lattice-container"
      className="relative h-[100dvh] w-full overflow-hidden bg-black text-[#f8f4ff]"
      onClick={handlePluck}
    >
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 0.6, 8.2], fov: 45 }}
          style={{ background: '#000' }}
          gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={0.08} />
          <pointLight
            position={[0, 0, 0]}
            intensity={0.6 + simParams.tension * 0.8}
            color="#facc15"
          />
          <pointLight position={[1.5, 1, 2]} intensity={0.4} color="#c084fc" />
          <BackgroundStars />
          <NebulaField tension={simParams.tension} />
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