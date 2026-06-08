import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group, Vector3 } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";

const COUNT = 10;
const COLORS = ["#69dcff", "#8c83ff", "#c867ff", "#ee66bd", "#efb263"];

export function RippleWells() {
  const group = useRef<Group>(null);
  const progress = useExperienceStore((state) => state.scrollProgress);
  const sample = sampleExperience(progress);
  const rings = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, index) => {
        const radius = 0.72 + index * 0.25;
        return Array.from({ length: 97 }, (_, pointIndex) => {
          const angle = (pointIndex / 96) * Math.PI * 2;
          const ripple =
            Math.sin(angle * 4 + index * 0.48) * 0.04 +
            Math.sin(angle * 9 - index * 0.31) * 0.018;
          return new Vector3(
            Math.cos(angle) * (radius + ripple) * 1.18,
            Math.sin(angle) * (radius + ripple) * 0.72,
            Math.sin(angle * 2 + index * 0.4) * 0.12 +
              (index - COUNT / 2) * 0.075,
          );
        });
      }),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const store = useExperienceStore.getState();
    const current = sampleExperience(store.scrollProgress);
    const time = state.clock.elapsedTime;
    const motion = store.reducedMotion ? 0.1 : 1;
    group.current.rotation.z =
      Math.sin(time * 0.09) * 0.08 * motion - store.pointer.x * 0.055;
    group.current.rotation.y =
      0.32 + Math.cos(time * 0.07) * 0.08 * motion;
    group.current.position.x =
      -3.45 + store.pointer.x * current.simulation.pointerForce * 0.12;
    group.current.position.z =
      -2.65 - current.visual.collapseDistortion * 0.55;
    group.current.scale.setScalar(
      0.78 +
        current.visual.contourDensity * 0.16 -
        current.visual.collapseDistortion * 0.12,
    );
  });

  const opacity =
    0.025 +
    sample.visual.contourDensity * 0.1 +
    sample.simulation.birth * 0.025;

  return (
    <group
      ref={group}
      position={[-3.45, 0.3, -2.65]}
      rotation={[-0.72, 0.32, 0.08]}
    >
      {rings.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={COLORS[index % COLORS.length]}
          transparent
          opacity={opacity * (0.5 + (COUNT - index) / COUNT)}
          lineWidth={0.5 + index * 0.035}
          toneMapped={false}
          depthWrite={false}
        />
      ))}
    </group>
  );
}
