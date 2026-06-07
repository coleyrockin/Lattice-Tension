'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { createShellMaterial } from '@/aether/visuals/shellMaterial';
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

export function Shell({ tension, speed, pulse, tier }: Props) {
  const mesh = useRef<import('three').Mesh>(null!);
  const pulseAmp = useRef(0);

  const { material, uniforms } = useMemo(() => {
    const steps = raySteps(tier);
    const { material, tension: tU, speed: sU, pulse: pU, tint } = createShellMaterial(steps);
    return { material, uniforms: { tension: tU, speed: sU, pulse: pU, tint } };
  }, [tier]);

  const uniformsRef = useRef(uniforms);
  useEffect(() => {
    uniformsRef.current = uniforms;
  }, [uniforms]);

  useFrame((state, delta) => {
    pulseAmp.current = Math.max(0, pulseAmp.current - delta * 2.2);
    if (pulse.strength > 0.4) pulseAmp.current = 1;

    const preset = nearestPreset(tension);
    const u = uniformsRef.current;
    u.tint.value.set(STATE_COLOR[preset]);
    u.tension.value = tension;
    u.speed.value = speed;
    u.pulse.value = pulseAmp.current;

    if (mesh.current) {
      const t = state.clock.elapsedTime;
      mesh.current.rotation.y = t * 0.06 * speed;
      mesh.current.rotation.x = Math.sin(t * 0.11) * 0.12 * tension;
      mesh.current.rotation.z = Math.cos(t * 0.08) * 0.06 * tension;
    }
  });

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}