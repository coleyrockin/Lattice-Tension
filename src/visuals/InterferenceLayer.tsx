import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Mesh } from "three";
import { sampleExperience } from "../chapters/interpolate";
import {
  INTERFERENCE_HEADING,
  createInterferenceMaterial,
} from "./InterferenceMaterial";
import { descent, frameSample, useExperienceStore } from "../experience/store";

const STEPS: Record<string, number> = { high: 150, medium: 96, low: 52 };

// frame-rate-independent damping decay rates (exact reuse from GyroidLattice/EchoLayer)
const K_STEER = 3.0776; // ≈ -60*ln(1-0.05)
const K_DRAG = 4.3543; // ≈ -60*ln(1-0.07)

const HEADING = new Vector3(...INTERFERENCE_HEADING).normalize();
const WORLD_UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3().crossVectors(HEADING, WORLD_UP).normalize();
const UP = new Vector3().crossVectors(RIGHT, HEADING).normalize();

type Props = { standalone?: boolean };

/**
 * INTERFERENCE LAYER — crossed-wave realm driver.
 *
 * Modeled 1:1 on GyroidLattice.tsx:
 * - useMemo material per tier (STEPS high/medium/low)
 * - useFrame: sampleExperience(d) + userResonance → effectiveRes
 * - drive new uniforms (interference, fringeAmp) + all atlas continuity ones
 * - accumulate resonance on impulse + sustained drag/pointer (K springs)
 * - identical travel/steer/pulse/pos/fwd math + sway
 * - plane mesh, onClick fires impulse + fragment
 * - reveal gated to Interference range (~1.0-1.166) using raw descent
 *   while still factoring sample.simulation.interference so low early
 * - poetic comments, tier respect, full reuse of descent/store/addResonance
 *
 * Renders as a distinct visual layer (renderOrder 11) between lattice and echo.
 * Fringes are geometric (distanceToSurface modulation in material) so they
 * integrate with the gyroid shells rather than float on top.
 */
export function InterferenceLayer({ standalone = false }: Props) {
  const tier = useExperienceStore((s) => s.profile?.tier ?? "high");
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const u = useMemo(() => createInterferenceMaterial(STEPS[tier] ?? 150), [tier]);

  const pos = useRef(new Vector3().copy(HEADING).multiplyScalar(1.2));
  const travel = useRef(1.2);
  const fwd = useRef(HEADING.clone());
  const px = useRef(0);
  const py = useRef(0);
  const dragX = useRef(0);
  const dragY = useRef(0);
  const pulseAmp = useRef(0);
  const lastImpulse = useRef(0);
  const mesh = useRef<Mesh>(null!);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const time = state.clock.elapsedTime;
    const { pointer, drag, impulse, resonance: userResonance } =
      useExperienceStore.getState();
    // smoothed descent → palette, structure, travel and crossfade glide as one
    const d = standalone ? 1 : descent.value;
    const sample =
      !standalone && frameSample.current ? frameSample.current : sampleExperience(d);
    const motion = reducedMotion ? 0.25 : 1;
    const p = pos.current;

    const baseRes = sample.simulation.resonance;
    const effectiveRes = Math.min(2.2, baseRes + userResonance);
    u.resonance.value = effectiveRes;

    // drive Interference-specific uniforms from sample + resonance
    const sig = sample.signature;
    const interf = sig.fringe;
    u.interference.value = interf;
    u.fringeAmp.value = 0.55 + interf * 1.35 + effectiveRes * 0.28;
    const reveal = standalone ? 1 : sig.interferenceLayer * sig.latticeReveal;
    // Cull the draw when imperceptible — Interference is reveal≈0 in ~8/12
    // chapters, so this skips a full-screen raymarch for most of the scroll.
    if (mesh.current) mesh.current.visible = reveal > 0.012;

    if (impulse && impulse.startedAt !== lastImpulse.current) {
      lastImpulse.current = impulse.startedAt;
      pulseAmp.current = 1;
    }
    pulseAmp.current = Math.max(0, pulseAmp.current - dt * 0.72);

    // slow meditative drift down the screw axis + a gentle sway for life
    travel.current =
      1.2 +
      d * (5.8 + sample.visual.nestedScale * 3.4) +
      sample.simulation.collapse * 2.1 +
      time * 0.11 * motion;
    p.copy(HEADING)
      .multiplyScalar(travel.current)
      .addScaledVector(RIGHT, Math.sin(time * 0.11) * 0.45 * motion)
      .addScaledVector(UP, Math.sin(time * 0.083) * 0.4 * motion);
    u.ro.value.copy(p);

    // look down the axis + slow sway + pointer steer (frame-rate-independent)
    const steerK = 1 - Math.exp(-K_STEER * dt);
    const dragK = 1 - Math.exp(-K_DRAG * dt);
    px.current += (pointer.x - px.current) * steerK;
    py.current += (pointer.y - py.current) * steerK;
    dragX.current += (drag.x - dragX.current) * dragK;
    dragY.current += (drag.y - dragY.current) * dragK;

    // Collapse lean + camera sway (reused exactly)
    const collapseLean =
      sample.simulation.collapse * Math.sin(time * 0.7) * 0.06 * motion;
    const cameraYaw =
      (sample.camera.target[0] - sample.camera.position[0]) * 0.018;
    const cameraPitch =
      (sample.camera.target[1] - sample.camera.position[1]) * 0.018;
    fwd.current
      .copy(HEADING)
      .addScaledVector(
        RIGHT,
        Math.sin(time * 0.06) * 0.1 * motion +
          px.current * 0.3 * sample.simulation.pointerForce * motion +
          dragX.current * 1.15 +
          cameraYaw +
          collapseLean,
      )
      .addScaledVector(
        UP,
        Math.cos(time * 0.05) * 0.08 * motion -
          py.current * 0.26 * sample.simulation.pointerForce * motion -
          dragY.current * 1.05 +
          cameraPitch -
          collapseLean,
      )
      .normalize();
    u.fwd.value.copy(fwd.current);

    u.aspect.value = state.size.width / Math.max(1, state.size.height);

    // Per-chapter structural signatures — each layer reuses the language
    // so Interference reads as part of the continuous atlas, not a bolt-on.
    // Interference realm boosts wave density via the material's crossed terms.
    u.twist.value = sig.twist * 0.4;
    u.swell.value = sig.swell * 0.35;
    u.veil.value = sig.veil * 0.5;
    u.freq.value = 3.8 + sig.cellDensity * 2.6 + interf * 2.8;
    u.tension.value = sample.simulation.tension;
    u.reveal.value = reveal;
    u.pulse.value = pulseAmp.current;
    u.collapse.value = sample.simulation.collapse;
    u.emergence.value = sample.simulation.emergence;
    u.order.value = sample.simulation.order;
    u.stress.value = sample.visual.stressIntensity;
    u.tint.value.set(sample.palette.primary);
    u.accent.value.set(sample.palette.secondary);
    u.highlight.value.set(sample.palette.accent);
    u.pointer.value.set(px.current, py.current);
  });

  return (
    <mesh
      ref={mesh}
      frustumCulled={false}
      renderOrder={11}
      onClick={() => {
        const state = useExperienceStore.getState();
        const sample = sampleExperience(state.scrollProgress);
        state.fireImpulse(sample.chapterIndex);
      }}
    >
      <planeGeometry args={[2, 2]} />
      <primitive object={u.material} attach="material" />
    </mesh>
  );
}
