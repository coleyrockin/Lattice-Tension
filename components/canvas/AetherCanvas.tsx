'use client';

import { useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { CanvasErrorBoundary } from '@/components/canvas/CanvasErrorBoundary';
import { ArtScene } from '@/components/field/ArtScene';
import { BackgroundStars } from '@/components/environment/BackgroundStars';
import { NebulaVolume } from '@/components/environment/NebulaVolume';
import { AtmosphereController } from '@/components/canvas/AtmosphereController';
import { TSLPostPipeline } from '@/components/canvas/TSLPostPipeline';
import { createAetherRenderer } from '@/engine/renderer/createRenderer';
import { detectRendererInfo } from '@/engine/renderer/capability';
import { getPerfProfile } from '@/lib/constants/perfTiers';
import type { SimParams, MouseState, PulseState } from '@/lib/tension/types';
import type { PointLight } from 'three';

type Props = {
  simParams: SimParams;
  mouse: MouseState;
  burst: number;
  pulse: PulseState;
  visualDamp: number;
  dpr: number;
  onReady: (label: string) => void;
};

export function AetherCanvas({
  simParams,
  mouse,
  burst,
  pulse,
  visualDamp,
  dpr,
  onReady,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const rendererInfo = useMemo(() => detectRendererInfo(), []);
  const perf = useMemo(() => getPerfProfile(rendererInfo.tier), [rendererInfo.tier]);
  const coreLight = useRef<PointLight>(null!);
  const accentLight = useRef<PointLight>(null!);

  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-black transition-opacity duration-[2800ms] ease-out ${
          revealed ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 0.2, 8.2], fov: 44 }}
          style={{ background: '#010108' }}
          dpr={dpr}
          gl={async (props) => {
            const renderer = await createAetherRenderer(
              props.canvas as HTMLCanvasElement,
              rendererInfo.tier,
              dpr,
            );
            return renderer;
          }}
          onCreated={() => {
            onReady(rendererInfo.label);
            window.setTimeout(() => setRevealed(true), 400);
          }}
        >
          <TSLPostPipeline tension={simParams.tension} tier={rendererInfo.tier} />
          <AtmosphereController
            tension={simParams.tension}
            accentRef={coreLight}
            emissiveRef={accentLight}
          />
          <ambientLight intensity={0.06} />
          <pointLight
            ref={coreLight}
            position={[0, 0, 0]}
            intensity={1.1 + simParams.tension * 1.4}
            color="#5eead4"
            distance={28}
          />
          <pointLight
            ref={accentLight}
            position={[4, 2, 5]}
            intensity={0.65 + simParams.tension * 0.5}
            color="#a78bfa"
            distance={32}
          />
          <BackgroundStars count={perf.starCount} />
          <NebulaVolume tension={simParams.tension} segments={perf.nebulaSegments} />
          <ArtScene
            tension={simParams.tension}
            speed={simParams.speed}
            pullStrength={simParams.pullStrength}
            mouse={mouse}
            burst={burst}
            reducedDamp={visualDamp}
            pulse={pulse}
            perf={perf}
          />
        </Canvas>
      </CanvasErrorBoundary>
    </>
  );
}