import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { PHILOSOPHICAL_FRAGMENTS } from "../chapters/definitions";
import {
  GYROID_HEADING,
  createGyroidLatticeMaterial,
} from "./gyroidLatticeMaterial";
import { useExperienceStore } from "../experience/store";

const STEPS: Record<string, number> = { high: 150, medium: 96, low: 52 };

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
    const { pointer, drag, impulse, scrollProgress } =
      useExperienceStore.getState();
    const sample = sampleExperience(scrollProgress);
    const motion = reducedMotion ? 0.25 : 1;
    const p = pos.current;

    // descent (scroll) drives the crossfade-in and the tension/morph ramp
    const descent = standalone ? 1 : scrollProgress;
    const reveal = standalone ? 1 : smoothstep(0.36, 0.56, descent);
    const tension = sample.simulation.tension;

    if (impulse && impulse.startedAt !== lastImpulse.current) {
      lastImpulse.current = impulse.startedAt;
      pulseAmp.current = 1;
    }
    pulseAmp.current = Math.max(0, pulseAmp.current - dt * 0.72);

    // slow meditative drift down the screw axis + a gentle sway for life
    travel.current =
      1.2 +
      descent * (5.5 + sample.visual.nestedScale * 3.2) +
      sample.simulation.collapse * 2.2 + // Collapse pulls you in faster
      time * 0.12 * motion;
    p.copy(HEADING)
      .multiplyScalar(travel.current)
      .addScaledVector(RIGHT, Math.sin(time * 0.11) * 0.45 * motion)
      .addScaledVector(UP, Math.sin(time * 0.083) * 0.4 * motion);
    u.ro.value.copy(p);

    // look down the axis + slow sway + pointer steer
    px.current += (pointer.x - px.current) * 0.05;
    py.current += (pointer.y - py.current) * 0.05;
    dragX.current += (drag.x - dragX.current) * 0.07;
    dragY.current += (drag.y - dragY.current) * 0.07;
    const collapseJitter =
      sample.simulation.collapse * Math.sin(time * 8.2) * 0.075 * motion;
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
          collapseJitter,
      )
      .addScaledVector(
        UP,
        Math.cos(time * 0.05) * 0.08 * motion -
          py.current * 0.26 * sample.simulation.pointerForce * motion -
          dragY.current * 1.05 +
          cameraPitch -
          collapseJitter,
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
    u.twist.value = sample.simulation.collapse * 1.0;
    u.swell.value = sample.simulation.emergence * (1 - aether);
    u.veil.value = aether;
    // chapter contour density reframes the lattice; Emergence opens into
    // sparse cathedral chambers, Aether thins slightly for the veils.
    u.freq.value =
      3.3 +
      sample.visual.contourDensity * 2.8 -
      u.swell.value * 1.7 -
      aether * 0.9;
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
