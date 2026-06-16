import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Mesh } from "three";
import { sampleExperience } from "../chapters/interpolate";
import {
  ECHO_HEADING,
  createEchoMaterial,
} from "./EchoMaterial";
import { descent, frameSample, useExperienceStore } from "../experience/store";

const STEPS: Record<string, number> = { high: 168, medium: 108, low: 58 };

// frame-rate-independent damping decay rates (reused exactly from GyroidLattice)
const K_STEER = 3.0776; // ≈ -60*ln(1-0.05)
const K_DRAG = 4.3543; // ≈ -60*ln(1-0.07)

const HEADING = new Vector3(...ECHO_HEADING).normalize();
const WORLD_UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3().crossVectors(HEADING, WORLD_UP).normalize();
const UP = new Vector3().crossVectors(RIGHT, HEADING).normalize();

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

type Props = { standalone?: boolean };

/**
 * ECHO LAYER (WITNESS) — the meta final evolution, layered atop the atlas.
 *
 * Drives strictly from:
 * - sampleExperience(descent) for chapter palette / simulation / visual
 * - userResonance accumulator (shared store)
 * - effectiveRes = min(2.2, baseRes + userResonance)  (full reuse)
 *
 * Reveal is gated: only appears as the final layer when scroll progress
 * reaches deep echo territory (raw d > ~1.62) AND user imprint is high.
 * Generative offspring filaments (in material) become brighter/structured
 * ONLY for high userResonance contribution — "the pattern now contains
 * your question" is literal: user marks seed the children.
 *
 * Full pattern reuse:
 * - descent/store/interp/fieldFG (via material)
 * - resonance decay + addResonance on impulse/drag/pointer
 * - tiered STEPS (higher fidelity for the witness detail)
 * - identical travel/steer/pulse/pos/fwd math
 * - same uniform wiring for continuity of atlas language
 * - click fires impulse + fragment (participation continues in the echo)
 */
export function EchoLayer({ standalone = false }: Props) {
  const tier = useExperienceStore((s) => s.profile?.tier ?? "high");
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const u = useMemo(() => createEchoMaterial(STEPS[tier] ?? 168), [tier]);

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
    // smoothed descent (raw value allows >1 for echo atlas depth)
    const d = standalone ? 1 : descent.value;
    const sample =
      !standalone && frameSample.current ? frameSample.current : sampleExperience(d);
    const motion = reducedMotion ? 0.25 : 1;
    const p = pos.current;

    const baseRes = sample.simulation.resonance;
    const effectiveRes = Math.min(2.2, baseRes + userResonance);
    u.resonance.value = effectiveRes;

    // IMPRINT: resonance makes generative offspring brighter/structured
    // ONLY for high user imprint. Threshold chosen so chapter base alone
    // is insufficient; user interaction (drag/impulse) must contribute.
    const imprint = Math.max(0, Math.min(1, (effectiveRes - 0.95) / 1.05));
    u.imprint.value = imprint;

    // Final layer reveal gate: high progress (deep into echo chapter range)
    // + high resonance threshold. Uses raw descent for late-scroll depth.
    // When either gate is low, material discards (zero cost).
    const sig = sample.signature;
    const resGate = smoothstep(0.55, 1.35, effectiveRes);
    const reveal = standalone ? 1 : sig.echoLayer * resGate * (0.45 + sig.echo * 0.55);
    // Cull the draw when imperceptible — Echo is reveal≈0 in ~10/12 chapters
    // (and gated further by resonance), so it skips its heavy 168-step march
    // (plus the child sub-loop) for nearly the whole experience.
    if (mesh.current) mesh.current.visible = reveal > 0.012;

    if (impulse && impulse.startedAt !== lastImpulse.current) {
      lastImpulse.current = impulse.startedAt;
      pulseAmp.current = 1;
    }
    pulseAmp.current = Math.max(0, pulseAmp.current - dt * 0.72);

    // meditative drift + life sway, extended for echo depth
    travel.current =
      1.2 +
      d * (6.1 + sample.visual.nestedScale * 3.6) +
      sample.simulation.collapse * 2.4 +
      time * 0.095 * motion;
    p.copy(HEADING)
      .multiplyScalar(travel.current)
      .addScaledVector(RIGHT, Math.sin(time * 0.11) * 0.45 * motion)
      .addScaledVector(UP, Math.sin(time * 0.083) * 0.4 * motion);
    u.ro.value.copy(p);

    // pointer steer + drag (frame-rate-independent, reused)
    const steerK = 1 - Math.exp(-K_STEER * dt);
    const dragK = 1 - Math.exp(-K_DRAG * dt);
    px.current += (pointer.x - px.current) * steerK;
    py.current += (pointer.y - py.current) * steerK;
    dragX.current += (drag.x - dragX.current) * dragK;
    dragY.current += (drag.y - dragY.current) * dragK;

    // lean + camera-derived sway (reused)
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

    // Per-chapter signatures reused for seamless atlas continuity.
    // Echo inherits the late-aether language but the material's children
    // are the new structural signature: generative from user marks.
    u.twist.value = sig.twist * 0.25;
    u.swell.value = sig.swell * 0.45;
    // Echo stays translucent-layered but not transparent — keep the veil
    // moderate so far shells still absorb and a black void survives between the
    // filaments (otherwise the whole frame washes to flat cream).
    u.veil.value = sig.veil * 0.5 + sig.echo * 0.05;
    // Compressed absorption band (see GyroidLattice for rationale) — keep parity.
    u.absorptionScale.value = 0.62 + ((sig.absorption - 0.18) / 1.37) * 0.46;
    u.freq.value = 2.8 + sig.cellDensity * 1.8 + sig.echo * 0.6;
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
      renderOrder={12}
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
