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
        className={`pointer-events-none absolute inset-0 z-10 bg-black transition-opacity duration-[2000ms] ease-out ${
          revealed ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 0.8, 11.5], fov: 52 }}
          style={{ background: '#0a0618' }}
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
            window.setTimeout(() => setRevealed(true), 120);
          }}
        >
          <TSLPostPipeline tension={simParams.tension} tier={rendererInfo.tier} />
          <AtmosphereController
            tension={simParams.tension}
            accentRef={coreLight}
            emissiveRef={accentLight}
          />
          <ambientLight intensity={0.12} />
          <pointLight
            ref={coreLight}
            position={[0, 0, 0]}
            intensity={0.75 + simParams.tension}
            color="#7dd3fc"
          />
          <pointLight ref={accentLight} position={[2, 1.5, 3]} intensity={0.55} color="#c084fc" />
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