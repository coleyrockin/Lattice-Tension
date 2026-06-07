'use client';

import { useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { CanvasErrorBoundary } from '@/components/canvas/CanvasErrorBoundary';
import { ArtScene } from '@/components/field/ArtScene';
import { BackgroundStars } from '@/components/environment/BackgroundStars';
import { AtmosphereController } from '@/components/canvas/AtmosphereController';
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

  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-black transition-opacity duration-[3200ms] ease-out ${
          revealed ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 5.8], fov: 38 }}
          style={{ background: 'transparent' }}
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
            window.setTimeout(() => setRevealed(true), 600);
          }}
        >
          <AtmosphereController
            tension={simParams.tension}
            accentRef={coreLight}
            emissiveRef={coreLight}
          />
          <ambientLight intensity={0.04} />
          <pointLight
            ref={coreLight}
            position={[2.5, 1.5, 4]}
            intensity={1.4}
            color="#5eead4"
            distance={20}
          />
          <pointLight position={[-3, -1, 2]} intensity={0.5} color="#818cf8" distance={18} />
          <BackgroundStars count={Math.min(perf.starCount, 600)} />
          <ArtScene
            tension={simParams.tension}
            speed={simParams.speed}
            mouse={mouse}
            burst={burst}
            reducedDamp={visualDamp}
            pulse={pulse}
          />
        </Canvas>
      </CanvasErrorBoundary>
    </>
  );
}