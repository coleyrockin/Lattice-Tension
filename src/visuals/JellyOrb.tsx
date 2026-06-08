import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { createJellyOrbMaterial } from "./jellyOrbMaterial";
import { useExperienceStore } from "../experience/store";

const STEPS: Record<string, number> = { high: 120, medium: 80, low: 44 };

export function JellyOrb() {
  const mesh = useRef<Mesh>(null!);
  const pulseAmp = useRef(0);
  const lastImpulse = useRef(0);
  const px = useRef(0);
  const py = useRef(0);

  const tier = useExperienceStore((s) => s.profile?.tier ?? "high");
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const u = useMemo(() => createJellyOrbMaterial(STEPS[tier] ?? 110), [tier]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const { pointer, impulse, scrollProgress } = useExperienceStore.getState();

    // FALL INTO THE ORB: dolly the camera inward as descent rises, so the orb
    // grows to fill the frame and we pass through the glass into the lattice.
    const enter = Math.min(1, Math.max(0, scrollProgress / 0.46));
    const eased = enter * enter * (3 - 2 * enter);
    state.camera.position.z = 2.35 - eased * 2.1;

    // click / impulse → exp-decaying pulse (inflate + warm)
    if (impulse && impulse.startedAt !== lastImpulse.current) {
      lastImpulse.current = impulse.startedAt;
      pulseAmp.current = 1;
    }
    pulseAmp.current = Math.max(0, pulseAmp.current - dt * 1.8);
    u.pulse.value = pulseAmp.current;

    // eased pointer lean
    const lead = reducedMotion ? 0.12 : 1;
    px.current += (pointer.x - px.current) * 0.05;
    py.current += (pointer.y - py.current) * 0.05;
    u.pointer.value.set(px.current * lead, py.current * lead);

    u.speed.value = reducedMotion ? 0.14 : 0.6;

    // multi-axis incommensurate tumble — never repeats
    const rot = reducedMotion ? 0.2 : 1;
    mesh.current.rotation.y = t * 0.06 * rot;
    mesh.current.rotation.x = Math.sin(t * 0.11) * 0.14 * rot;
    mesh.current.rotation.z = Math.cos(t * 0.083) * 0.08 * rot;
  });

  return (
    <mesh
      ref={mesh}
      onClick={() => useExperienceStore.getState().fireImpulse(0)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={u.material} attach="material" />
    </mesh>
  );
}
