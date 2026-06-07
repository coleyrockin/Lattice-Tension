'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TorusKnotGeometry } from 'three';
import {
  createHaloMaterial,
  createSculptureMaterial,
  syncHaloMaterial,
  syncSculptureMaterial,
} from '@/engine/tsl/sculptureMaterial';
import type { MouseState, PulseState } from '@/lib/tension/types';

type Props = {
  tension: number;
  speed: number;
  mouse: MouseState;
  burst?: number;
  pulse?: PulseState;
};

export function TensionSculpture({
  tension,
  speed,
  mouse,
  burst = 0,
  pulse = { x: 0, y: 0, strength: 0 },
}: Props) {
  const group = useRef<import('three').Group>(null!);
  const pulseRef = useRef(0);

  const geometry = useMemo(
    () => new TorusKnotGeometry(1.35, 0.38, 320, 48, 2, 5),
    [],
  );

  const sculpture = useMemo(() => createSculptureMaterial(), []);
  const halo = useMemo(() => createHaloMaterial(), []);

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame drives sculpture
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    pulseRef.current = Math.max(0, pulseRef.current - delta * 2.2);
    if (pulse.strength > 0.5) pulseRef.current = 1;

    syncSculptureMaterial(sculpture, tension, pulseRef.current + burst * 0.35);
    syncHaloMaterial(halo, tension);

    if (!group.current) return;
    group.current.rotation.y = t * 0.06 * speed;
    group.current.rotation.x = Math.sin(t * 0.14) * 0.12 * tension + mouse.y * 0.08;
    group.current.rotation.z = Math.cos(t * 0.11) * 0.06 * tension + mouse.x * 0.06;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={sculpture.material} />
      <mesh geometry={geometry} material={halo.material} scale={1.06} />
    </group>
  );
}