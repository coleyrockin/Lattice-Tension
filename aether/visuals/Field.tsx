'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import { createCloudTexture } from '@/aether/visuals/noiseTexture';
import { createFieldMaterial } from '@/aether/visuals/fieldMaterial';
import { STATE_COLOR } from '@/aether/core/palette';
import { PRESETS } from '@/aether/core/presets';
import type { Preset, Pulse } from '@/aether/core/types';
import type { Tier } from '@/aether/renderer/tier';
import { raySteps } from '@/aether/renderer/tier';

type Props = {
  tension: number;
  speed: number;
  pulse: Pulse;
  tier: Tier;
};

function nearestPreset(tension: number): Preset {
  const keys = Object.keys(PRESETS) as Preset[];
  return keys.reduce((best, k) =>
    Math.abs(PRESETS[k].tension - tension) < Math.abs(PRESETS[best].tension - tension) ? k : best,
  );
}

export function Field({ tension, speed, pulse, tier }: Props) {
  const mesh = useRef<import('three').Mesh>(null!);
  const pulseAmp = useRef(0);

  const { material, uniforms } = useMemo(() => {
    const tex = createCloudTexture(tier === 'C' ? 96 : 128);
    const steps = raySteps(tier);
    const { material, baseColor, range, threshold, opacity, pulse: pulseU, stepCount } =
      createFieldMaterial(tex, steps);
    return {
      material,
      uniforms: { baseColor, range, threshold, opacity, pulse: pulseU, stepCount },
    };
  }, [tier]);

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame drives volume
  useFrame((state, delta) => {
    pulseAmp.current = Math.max(0, pulseAmp.current - delta * 1.8);
    if (pulse.strength > 0.4) pulseAmp.current = 1;

    const preset = nearestPreset(tension);
    const accent = new Color(STATE_COLOR[preset]);

    uniforms.baseColor.value.copy(accent).multiplyScalar(0.35);
    uniforms.threshold.value = 0.16 + tension * 0.22 + pulseAmp.current * 0.06;
    uniforms.opacity.value = 0.28 + tension * 0.28 + pulseAmp.current * 0.12;
    uniforms.range.value = 0.08 + tension * 0.06;
    uniforms.pulse.value = pulseAmp.current;

    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.04 * speed;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.07) * 0.08 * tension;
    }
  });

  return (
    <mesh ref={mesh} scale={1.65}>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}