import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Mesh } from "three";
import { sampleExperience } from "../chapters/interpolate";
import {
  GYROID_HEADING,
  createGyroidLatticeMaterial,
} from "./gyroidLatticeMaterial";
import { descent, frameSample, useExperienceStore } from "../experience/store";

const STEPS: Record<string, number> = { high: 150, medium: 96, low: 52 };

// frame-rate-independent damping decay rates (see JellyOrb.tsx)
const K_STEER = 3.0776; // ≈ -60*ln(1-0.05)
const K_DRAG = 4.3543; // ≈ -60*ln(1-0.07)

const HEADING = new Vector3(...GYROID_HEADING).normalize();
const WORLD_UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3().crossVectors(HEADING, WORLD_UP).normalize();
const UP = new Vector3().crossVectors(RIGHT, HEADING).normalize();

type Props = { standalone?: boolean };

export function GyroidLattice({ standalone = false }: Props) {
  const tier = useExperienceStore((s) => s.profile?.tier ?? "high");
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
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
  const mesh = useRef<Mesh>(null!);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const time = state.clock.elapsedTime;
    const { pointer, drag, impulse, resonance: userResonance } =
      useExperienceStore.getState();
    // smoothed descent → palette, structure, travel and crossfade glide as one
    const d = standalone ? 1 : descent.value;
    // reuse the once-per-frame shared sample (avoids re-allocating ~10 Colors)
    const sample =
      !standalone && frameSample.current ? frameSample.current : sampleExperience(d);
    const sig = sample.signature;
    const motion = reducedMotion ? 0.25 : 1;
    const p = pos.current;

    const baseRes = sample.simulation.resonance;
    const effectiveRes = Math.min(2.2, baseRes + userResonance);
    u.resonance.value = effectiveRes;
    u.interference.value = sig.fringe;
    u.singularity.value = sig.singularity;
    u.diffusion.value = sig.nebula * 0.85;
    u.curvature.value = sig.quantum * 0.75;
    u.fringeAmp.value = 0.35 + sig.fringe * 1.25;
    u.quantumFold.value = sig.quantum;
    u.nebulaFog.value = sig.nebula;
    u.crystalline.value = sig.crystalline;
    // Remap the raw signature absorption (0.18–1.55) into a compressed 0.62–1.08
    // band. Raw values >=1.0 extinguished the ray in the first march steps (only
    // the post-loop focal dot survived → "dot on black"); <=0.65 over-accumulated
    // into blown foam. The compressed band keeps EVERY chapter in the proven
    // emergence/interference legibility zone: structure + real blacks + color.
    u.absorptionScale.value = 0.62 + ((sig.absorption - 0.18) / 1.37) * 0.46;
    u.shellScale.value = 0.55 + sig.shellThickness * 0.45;
    u.focalGlow.value = sig.focalGlow;

    const reveal = standalone ? 1 : sig.latticeReveal;
    // Cull the whole draw when the layer is imperceptible — a full-screen
    // raymarch dispatched at reveal≈0 still rasterizes ~3.7M fragments. Skipping
    // the draw entirely (vs the in-shader discard) is the biggest perf win.
    if (mesh.current) mesh.current.visible = reveal > 0.012;
    const tension = sample.simulation.tension;

    if (impulse && impulse.startedAt !== lastImpulse.current) {
      lastImpulse.current = impulse.startedAt;
      pulseAmp.current = 1;
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
    u.twist.value = sig.twist;
    u.swell.value = sig.swell;
    u.veil.value = sig.veil;
    // Floor the cell frequency at 1.8: high swell+nebula (Nebula chapter) drove
    // this NEGATIVE (-0.22), collapsing the gyroid to a DC field with no surface
    // to intersect — that is why Nebula rendered as a flat wall, not a lattice.
    // Cap the subtractive terms at 1.0 so they soften cells without erasing them.
    u.freq.value = Math.max(
      1.8,
      2.4 +
        sig.cellDensity * 2.2 +
        sample.visual.contourDensity * 1.1 -
        Math.min(sig.swell, 1.0) * 1.0 -
        Math.min(sig.nebula, 1.0) * 0.6 +
        sig.fringe * 1.35,
    );
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
      ref={mesh}
      frustumCulled={false}
      renderOrder={10}
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
