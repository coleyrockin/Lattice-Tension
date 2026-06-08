import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import {
  GYROID_FREQ,
  GYROID_HEADING,
  createGyroidLatticeMaterial,
} from "./gyroidLatticeMaterial";
import { useExperienceStore } from "../experience/store";

/** gyroid value + gradient at a world point (field coords = p·FREQ). */
function gyroidFG(x: number, y: number, z: number) {
  const fx = x * GYROID_FREQ;
  const fy = y * GYROID_FREQ;
  const fz = z * GYROID_FREQ;
  const sx = Math.sin(fx);
  const sy = Math.sin(fy);
  const sz = Math.sin(fz);
  const cx = Math.cos(fx);
  const cy = Math.cos(fy);
  const cz = Math.cos(fz);
  return {
    f: sx * cy + sy * cz + sz * cx,
    gx: cx * cy - sz * sx,
    gy: -sx * sy + cy * cz,
    gz: -sy * sz + cz * cx,
  };
}

const STEPS: Record<string, number> = { high: 150, medium: 96, low: 52 };

const HEADING = new Vector3(...GYROID_HEADING).normalize();
const WORLD_UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3().crossVectors(HEADING, WORLD_UP).normalize();
const UP = new Vector3().crossVectors(RIGHT, HEADING).normalize();

type Props = { reveal?: number; tension?: number };

export function GyroidLattice({ reveal = 1, tension = 0.16 }: Props) {
  const tier = useExperienceStore((s) => s.profile?.tier ?? "high");
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const u = useMemo(() => createGyroidLatticeMaterial(STEPS[tier] ?? 150), [tier]);

  const pos = useRef(new Vector3().copy(HEADING).multiplyScalar(1.2));
  const travel = useRef(1.2);
  const fwd = useRef(HEADING.clone());
  const px = useRef(0);
  const py = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const time = state.clock.elapsedTime;
    const { pointer } = useExperienceStore.getState();
    const motion = reducedMotion ? 0.25 : 1;
    const p = pos.current;

    // slow meditative drift down the screw axis + a gentle sway for life
    p.copy(HEADING)
      .multiplyScalar((travel.current += dt * (0.5 + tension * 0.35) * motion))
      .addScaledVector(RIGHT, Math.sin(time * 0.11) * 0.45 * motion)
      .addScaledVector(UP, Math.sin(time * 0.083) * 0.4 * motion);
    u.ro.value.copy(p);

    // look down the axis + slow sway + pointer steer
    px.current += (pointer.x - px.current) * 0.05;
    py.current += (pointer.y - py.current) * 0.05;
    fwd.current
      .copy(HEADING)
      .addScaledVector(RIGHT, Math.sin(time * 0.06) * 0.1 * motion + px.current * 0.3 * motion)
      .addScaledVector(UP, Math.cos(time * 0.05) * 0.08 * motion - py.current * 0.26 * motion)
      .normalize();
    u.fwd.value.copy(fwd.current);

    u.aspect.value = state.size.width / Math.max(1, state.size.height);
    u.tension.value = tension;
    u.reveal.value = reveal;
    u.pointer.value.set(px.current, py.current);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <primitive object={u.material} attach="material" />
    </mesh>
  );
}
