import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { PHILOSOPHICAL_FRAGMENTS } from "../chapters/definitions";
import {
  GYROID_HEADING,
  createGyroidLatticeMaterial,
} from "./gyroidLatticeMaterial";
import { descent, useExperienceStore } from "../experience/store";

const STEPS: Record<string, number> = { high: 150, medium: 96, low: 52 };

// frame-rate-independent damping decay rates (see JellyOrb.tsx)
const K_STEER = 3.0776; // ≈ -60*ln(1-0.05)
const K_DRAG = 4.3543; // ≈ -60*ln(1-0.07)

const HEADING = new Vector3(...GYROID_HEADING).normalize();
const WORLD_UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3().crossVectors(HEADING, WORLD_UP).normalize();
const UP = new Vector3().crossVectors(RIGHT, HEADING).normalize();

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

type Props = { standalone?: boolean };

export function GyroidLattice({ standalone = false }: Props) {
  const tier = useExperienceStore((s) => s.profile?.tier ?? "high");
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const addResonance = useExperienceStore((s) => s.addResonance);
  const userResonance = useExperienceStore((s) => s.resonance);
  const u = useMemo(() => createGyroidLatticeMaterial(STEPS[tier] ?? 150), [tier]);

  const pos = useRef(new Vector3().copy(HEADING).multiplyScalar(1.2));
  const travel = useRef(1.2);
  const fwd = useRef(HEADING.clone());
  const px = useRef(0);
  const py = useRef(0);
  const dragX = useRef(0);
  const dragY = useRef(0);
  const pulseAmp = useRef(0);
  const lastImpulse = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const time = state.clock.elapsedTime;
    const { pointer, drag, impulse } = useExperienceStore.getState();
    // smoothed descent → palette, structure, travel and crossfade glide as one
    const d = standalone ? 1 : descent.value;
    const sample = sampleExperience(d);
    const motion = reducedMotion ? 0.25 : 1;
    const p = pos.current;

    // resonance decay (gentle) + base from chapter + user accumulation
    // decay happens here and in JellyOrb so it compounds across interactions
    const resDecay = 1 - Math.exp(-2.8 * dt);
    const baseRes = sample.simulation.resonance;
    const effectiveRes = Math.min(2.2, baseRes + userResonance);
    u.resonance.value = effectiveRes;
    u.interference.value = sample.simulation.interference || 0;
    u.singularity.value = sample.simulation.singularity || 0;
    u.diffusion.value = sample.simulation.diffusion || 0;
    u.curvature.value = sample.simulation.curvature || 0;
    // slow global decay on the user accumulator (shared across orb + lattice)
    if (userResonance > 0) addResonance(-userResonance * resDecay * 0.65);

    const reveal = standalone ? 1 : smoothstep(0.36, 0.56, d);
    const tension = sample.simulation.tension;

    if (impulse && impulse.startedAt !== lastImpulse.current) {
      lastImpulse.current = impulse.startedAt;
      pulseAmp.current = 1;
      addResonance(0.18 * sample.simulation.pointerForce);
    }
    pulseAmp.current = Math.max(0, pulseAmp.current - dt * 0.72);

    // slow meditative drift down the screw axis + a gentle sway for life
    travel.current =
      1.2 +
      d * (5.5 + sample.visual.nestedScale * 3.2) +
      sample.simulation.collapse * 2.2 + // Collapse pulls you in faster
      time * 0.12 * motion;
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

    // continuous resonance from touching the lattice (drag or strong pointer)
    if (drag.active || (Math.hypot(pointer.x, pointer.y) > 0.25 && pointer.active)) {
      addResonance(0.014 * dt * sample.simulation.pointerForce);
    }

    // Collapse lean: a slow controlled banking into the vortex (was an 8.2 Hz
    // shake — that read as glitch). The torque comes from the in-shader twist;
    // here we just sink and bank, no vibration.
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
    // Per-chapter structural signatures — each lattice chapter must read as
    // its own place, not a recolor of the same tunnel:
    //   Pattern   → Schwarz-P crystal, thin crisp walls (order, in-shader)
    //   Collapse  → helical torque shearing the cells around the axis
    //   Emergence → wide chambers whose cell size breathes along the path
    //   Aether    → thin translucent veils, low absorption, layered depth
    const aether = smoothstep(0.78, 0.92, sample.globalProgress);
    u.twist.value = sample.simulation.collapse * 1.0 + sample.simulation.singularity * 0.6; // Singularity: extra torque
    u.swell.value = sample.simulation.emergence * (1 - aether) + sample.simulation.diffusion * 0.4; // Nebula diffusion
    u.veil.value = aether;
    // chapter contour density reframes the lattice; Emergence opens into
    // sparse cathedral chambers, Aether thins slightly for the veils.
    u.freq.value =
      3.3 +
      sample.visual.contourDensity * 2.8 -
      u.swell.value * 1.7 -
      aether * 0.9 +
      sample.simulation.interference * 1.2; // Interference realm: wave density boost
    u.tension.value = tension;
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
      frustumCulled={false}
      renderOrder={10}
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
      <planeGeometry args={[2, 2]} />
      <primitive object={u.material} attach="material" />
    </mesh>
  );
}
