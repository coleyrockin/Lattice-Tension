import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Mesh } from "three";
import { createJellyOrbMaterial } from "./jellyOrbMaterial";
import { useExperienceStore } from "../experience/store";

const STEPS: Record<string, number> = { high: 120, medium: 80, low: 44 };

export function JellyOrb() {
  const mesh = useRef<Mesh>(null!);
  const pulseAmp = useRef(0);
  const lastImpulse = useRef(0);
  const px = useRef(0);
  const py = useRef(0);

  // jiggle spring: displacement + velocity, with a wobble axis
  const jp = useRef(0);
  const jv = useRef(0);
  const jaxis = useRef(new Vector3(0, 1, 0));
  const ppx = useRef(0);
  const ppy = useRef(0);

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
    state.camera.position.z = 0.65 - eased * 0.37; // rest z=0.65 → orb fills ~85% of frame; dollies to z=0.28

    const jig = reducedMotion ? 0.25 : 1;

    // click / impulse → pulse + a hard jiggle kick (overshoot)
    if (impulse && impulse.startedAt !== lastImpulse.current) {
      lastImpulse.current = impulse.startedAt;
      pulseAmp.current = 1;
      jv.current += 9 * jig; // sharp impulse → the orb lurches
      jaxis.current.set(px.current, py.current, 0.5).normalize();
    }
    pulseAmp.current = Math.max(0, pulseAmp.current - dt * 1.8);
    u.pulse.value = pulseAmp.current;

    // fast pointer flicks impart momentum into the jiggle (alive + a little dangerous)
    const vx = pointer.x - ppx.current;
    const vy = pointer.y - ppy.current;
    ppx.current = pointer.x;
    ppy.current = pointer.y;
    const flick = Math.hypot(vx, vy);
    if (flick > 0.04) {
      jv.current += Math.min(flick * 22, 6) * jig;
      jaxis.current.set(vx, vy, 0.35).normalize();
    }

    // spring–damper with real momentum + overshoot, then settle
    const k = 46;
    const damp = 4.6;
    jv.current += (-k * jp.current - damp * jv.current) * dt;
    jp.current += jv.current * dt;
    u.squash.value = Math.max(-0.6, Math.min(0.6, jp.current));
    u.jiggle.value.copy(jaxis.current);

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
