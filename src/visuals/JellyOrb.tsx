import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Vector3, type Mesh } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { PHILOSOPHICAL_FRAGMENTS } from "../chapters/definitions";
import { createJellyOrbMaterial } from "./jellyOrbMaterial";
import { descent, useExperienceStore } from "../experience/store";

// frame-rate-independent damping decay rates: a per-frame lerp of `c` at 60fps
// has decay k = -60*ln(1-c). Lerp factor each frame = 1 - exp(-k*dt), so the
// feel matches the old constants at 60fps but stays stable when frames vary.
// (Inlined as plain numbers — matches today's 0.05 / 0.08 per-frame eases.)
const K_LEAN = 3.0776; // ≈ -60*ln(1-0.05)
const K_DRAG = 5.0029; // ≈ -60*ln(1-0.08)

const STEPS: Record<string, number> = { high: 120, medium: 80, low: 44 };

// scratch colors — avoid per-frame allocation
const PRIMARY = new Color();
const SECONDARY = new Color();
const DEEP = new Color();
const LIGHT = new Color();
const DEEP_ANCHOR = new Color("#020d24");
const WHITE = new Color("#ffffff");

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
  const dragX = useRef(0);
  const dragY = useRef(0);
  const slosh = useRef(new Vector3());
  const sloshVelocity = useRef(new Vector3());
  const sloshTarget = useRef(new Vector3());
  const sloshDelta = useRef(new Vector3());
  const flickImpulse = useRef(new Vector3());

  const tier = useExperienceStore((s) => s.profile?.tier ?? "high");
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const addResonance = useExperienceStore((s) => s.addResonance);
  const userResonance = useExperienceStore((s) => s.resonance);

  const u = useMemo(() => createJellyOrbMaterial(STEPS[tier] ?? 110), [tier]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const { pointer, drag, impulse } = useExperienceStore.getState();
    // read the smoothed descent so camera, palette, tension and structure all
    // glide together (set once per frame by <DescentDriver/>)
    const d = descent.value;
    const sample = sampleExperience(d);

    // resonance: wire effective (chapter base + user imprints) + contribute to decay
    const baseRes = sample.simulation.resonance;
    const effectiveRes = Math.min(2.2, baseRes + userResonance);
    u.resonance.value = effectiveRes;
    const resDecay = 1 - Math.exp(-2.6 * dt);
    if (userResonance > 0) addResonance(-userResonance * resDecay * 0.65);

    // FALL INTO THE ORB: dolly the camera inward as descent rises, so the orb
    // grows to fill the frame and we pass through the glass into the lattice.
    const enter = Math.min(1, Math.max(0, d / 0.46));
    const eased = enter * enter * (3 - 2 * enter);
    state.camera.position.z =
      0.68 - eased * 0.39 - sample.visual.cameraProximity * 0.018;

    const jig = reducedMotion ? 0.25 : 1;

    // click / impulse → pulse + a hard jiggle kick (overshoot)
    if (impulse && impulse.startedAt !== lastImpulse.current) {
      lastImpulse.current = impulse.startedAt;
      pulseAmp.current = 1;
      jv.current += 4.15 * jig;
      jaxis.current.set(px.current, py.current, 0.5).normalize();
      sloshVelocity.current.addScaledVector(jaxis.current, -2.8 * jig);
      addResonance(0.22 * sample.simulation.pointerForce);
    }
    pulseAmp.current = Math.max(0, pulseAmp.current - dt * 1.05);
    u.pulse.value = pulseAmp.current;

    // fast pointer flicks impart momentum into the jiggle (alive + a little dangerous)
    const vx = pointer.x - ppx.current;
    const vy = pointer.y - ppy.current;
    ppx.current = pointer.x;
    ppy.current = pointer.y;
    const flick = Math.hypot(vx, vy);
    if (flick > 0.04) {
      jv.current += Math.min(flick * 15, 4.5) * jig;
      jaxis.current.set(vx, vy, 0.35).normalize();
      flickImpulse.current
        .set(vx, -vy, 0.18)
        .multiplyScalar(Math.min(flick * 11, 2.4) * jig);
      sloshVelocity.current.add(flickImpulse.current);
      addResonance(Math.min(flick * 0.9, 0.11));
    }

    // The shell never fully rests: two slow, incommensurate compression waves
    // keep the mass breathing while interaction adds larger overshoot.
    const idleCompression =
      (Math.sin(t * 0.72) * 0.026 + Math.sin(t * 0.29 + 1.4) * 0.014) * jig;
    const k = 17;
    const damp = 2.45;
    jv.current += (-k * (jp.current - idleCompression) - damp * jv.current) * dt;
    jp.current += jv.current * dt;
    u.squash.value = Math.max(-0.34, Math.min(0.34, jp.current));
    u.jiggle.value.copy(jaxis.current);

    // The inner mass is a slower spring with less damping, so it visibly lags
    // behind the outer shell and continues moving after a flick or click.
    sloshTarget.current.set(
      -dragX.current * 0.32 - vx * 1.8 + Math.sin(t * 0.41) * 0.045 * jig,
      dragY.current * 0.32 + vy * 1.8 + Math.cos(t * 0.33) * 0.04 * jig,
      -jp.current * 0.22 + Math.sin(t * 0.27 + 0.8) * 0.03 * jig,
    );
    sloshDelta.current.copy(slosh.current).sub(sloshTarget.current);
    sloshVelocity.current.addScaledVector(sloshDelta.current, -8.2 * dt);
    sloshVelocity.current.multiplyScalar(Math.exp(-1.35 * dt));
    slosh.current.addScaledVector(sloshVelocity.current, dt);
    slosh.current.clampLength(0, 0.42);
    u.slosh.value.copy(slosh.current);

    // eased pointer lean (frame-rate-independent)
    const lead = reducedMotion ? 0.12 : 1;
    const dragK = 1 - Math.exp(-K_DRAG * dt);
    const leanK = 1 - Math.exp(-K_LEAN * dt);
    dragX.current += (drag.x - dragX.current) * dragK;
    dragY.current += (drag.y - dragY.current) * dragK;
    px.current += (pointer.x - px.current) * leanK;
    py.current += (pointer.y - py.current) * leanK;

    // sustained drag on the orb deposits resonance (the glass "remembers" being pushed)
    if (drag.active) {
      addResonance(0.009 * dt);
    }

    u.pointer.value.set(
      (px.current + dragX.current * 2.1) * lead,
      (py.current - dragY.current * 2.1) * lead,
    );

    u.speed.value = reducedMotion ? 0.14 : 0.6;
    u.tension.value = sample.simulation.tension;
    // order crisps the interior: Pattern (order→1) reads as a crystalline
    // lattice; Origin (order→0) stays a soft serene web.
    u.order.value = sample.simulation.order + (sample.simulation.scale - 1) * 0.2; // Quantum/Nebula/Echo scale effect on interior (new realms)
    // chapter palette drives the glass: deep body absorbs toward a darkened
    // primary, the rim catches the full primary, glints lift toward white.
    PRIMARY.set(sample.palette.primary);
    SECONDARY.set(sample.palette.secondary);
    DEEP.copy(PRIMARY).multiplyScalar(0.24).lerp(DEEP_ANCHOR, 0.42);
    LIGHT.copy(PRIMARY).lerp(WHITE, 0.72);
    u.tint.value.copy(DEEP);
    u.accent.value.copy(PRIMARY).lerp(SECONDARY, 0.18).multiplyScalar(0.78);
    u.highlight.value.copy(LIGHT);
    u.lattice.value =
      0.42 + sample.visual.stressIntensity * 0.4 + sample.simulation.order * 0.12;

    const scale = 0.82 + sample.visual.membraneScale * 0.1;
    mesh.current.scale.setScalar(scale);
    mesh.current.position.x = 0.095;
    mesh.current.position.y = 0.015;

    // multi-axis incommensurate tumble — never repeats
    const rot = reducedMotion ? 0.2 : 1;
    mesh.current.rotation.y =
      t * 0.052 * rot + Math.sin(t * 0.19) * 0.07 * rot + dragX.current * 1.3;
    mesh.current.rotation.x =
      (Math.sin(t * 0.11) * 0.14 + Math.sin(t * 0.37) * 0.025) * rot +
      dragY.current * 1.1;
    mesh.current.rotation.z =
      Math.cos(t * 0.083) * 0.08 * rot +
      sample.simulation.collapse * Math.sin(t * 1.7) * 0.045;
  });

  return (
    <mesh
      ref={mesh}
      onClick={() => {
        const state = useExperienceStore.getState();
        const sample = sampleExperience(state.scrollProgress);
        state.fireImpulse(sample.chapterIndex);
        state.setSelectedFragment({
          nodeId: sample.chapterIndex,
          text: PHILOSOPHICAL_FRAGMENTS[sample.chapterIndex],
        });
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={u.material} attach="material" />
    </mesh>
  );
}
