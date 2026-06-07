'use client';

import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

type Props = {
  tension: number;
  reducedDamp?: number;
};

export function PostPipeline({ tension, reducedDamp = 1 }: Props) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={(1.85 + tension * 1.25 + (tension > 0.72 ? 0.75 : 0)) * reducedDamp}
        luminanceThreshold={0.07}
        luminanceSmoothing={0.62}
        kernelSize={3}
      />
      <ChromaticAberration offset={[0.00072 + tension * 0.00155, 0.00038]} />
      <Noise
        premultiply
        blendFunction={BlendFunction.OVERLAY}
        opacity={(0.032 + tension * 0.024) * reducedDamp}
      />
      <Vignette offset={0.17} darkness={0.68} />
    </EffectComposer>
  );
}