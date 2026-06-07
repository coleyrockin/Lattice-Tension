'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { WebGPURenderer } from 'three/webgpu';
import { lerpAtmospherePreset } from '@/lib/constants/atmosphere';
import { getPerfProfile } from '@/lib/constants/perfTiers';
import { createPostPipeline } from '@/engine/post/createPostPipeline';
import type { RenderTier } from '@/engine/renderer/capability';

type Props = {
  tension: number;
  tier: RenderTier;
};

export function TSLPostPipeline({ tension, tier }: Props) {
  const { gl, scene, camera } = useThree();
  const handlesRef = useRef<ReturnType<typeof createPostPipeline> | null>(null);
  const profile = getPerfProfile(tier);

  useEffect(() => {
    const renderer = gl as unknown as WebGPURenderer;
    if (!renderer.isWebGPURenderer || !profile.postFx) return;

    const handles = createPostPipeline(renderer, scene, camera, tier);
    handlesRef.current = handles;

    const originalRender = renderer.render.bind(renderer);
    renderer.render = () => handles.pipeline.render();

    return () => {
      renderer.render = originalRender;
      handles.pipeline.dispose();
      handlesRef.current = null;
    };
  }, [gl, scene, camera, tier, profile.postFx]);

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame mutates post uniforms
  useFrame(() => {
    const handles = handlesRef.current;
    if (!handles) return;

    const atm = lerpAtmospherePreset(tension);
    handles.tensionUniform.value = tension;
    handles.bloomPass.strength.value = atm.bloom * profile.bloomScale;
    handles.bloomPass.radius.value = atm.bloomRadius;
    handles.bloomPass.threshold.value = atm.bloomThreshold;
  });

  return null;
}