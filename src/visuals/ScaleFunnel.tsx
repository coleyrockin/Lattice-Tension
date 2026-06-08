import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group, Vector3 } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";

const FUNNEL_COUNT = 24;
const COLUMN_COUNT = 16;
const COLORS = [
  "#69dcff",
  "#728cff",
  "#a86cff",
  "#e45ec3",
  "#efa75e",
  "#d9ec71",
];

function createEllipse(
  radius: number,
  aspect: number,
  phase: number,
  warp = 0.04,
) {
  return Array.from({ length: 97 }, (_, pointIndex) => {
    const angle = (pointIndex / 96) * Math.PI * 2;
    const modulation =
      Math.sin(angle * 3 + phase) * warp +
      Math.sin(angle * 7 - phase * 0.6) * warp * 0.35;
    return new Vector3(
      Math.cos(angle) * (radius + modulation),
      Math.sin(angle) * (radius * aspect + modulation * 0.45),
      Math.sin(angle * 2 + phase) * warp * 0.8,
    );
  });
}

export function ScaleFunnel() {
  const root = useRef<Group>(null);
  const progress = useExperienceStore((state) => state.scrollProgress);
  const sample = sampleExperience(progress);
  const funnelRings = useMemo(
    () =>
      Array.from({ length: FUNNEL_COUNT }, (_, index) => {
        const normalized = index / (FUNNEL_COUNT - 1);
        return createEllipse(
          2.1 - normalized * 1.72,
          0.18 + normalized * 0.08,
          index * 0.38,
          0.055,
        );
      }),
    [],
  );
  const columnRings = useMemo(
    () =>
      Array.from({ length: COLUMN_COUNT }, (_, index) => {
        const normalized = index / (COLUMN_COUNT - 1);
        return createEllipse(
          0.92 - normalized * 0.5,
          0.28,
          index * 0.55,
          0.038,
        );
      }),
    [],
  );

  useFrame((state, delta) => {
    if (!root.current) return;
    const store = useExperienceStore.getState();
    const current = sampleExperience(store.scrollProgress);
    const motion = store.reducedMotion ? 0.08 : 1;
    const time = state.clock.elapsedTime;
    root.current.rotation.z += delta * 0.012 * motion;
    root.current.rotation.y =
      Math.sin(time * 0.09) * 0.08 * motion -
      store.pointer.x * current.simulation.pointerForce * 0.025;
    root.current.position.x =
      0.9 + store.pointer.x * current.simulation.pointerForce * 0.08;
    root.current.position.y =
      -0.4 + Math.sin(time * 0.08) * 0.12 * motion;
    root.current.scale.setScalar(
      0.88 +
        current.visual.nestedScale * 0.16 -
        current.visual.collapseDistortion * 0.14,
    );
  });

  const opacity =
    0.035 +
    sample.visual.nestedScale * 0.16 +
    sample.simulation.emergence * 0.035;

  return (
    <group ref={root} position={[0.9, -0.4, -5.8]}>
      <group rotation={[0.78, -0.24, 0.08]} scale={[1.2, 1.2, 1.2]}>
        {funnelRings.map((points, index) => {
          const normalized = index / (FUNNEL_COUNT - 1);
          return (
            <group
              key={`funnel-${index}`}
              position={[
                Math.sin(index * 0.38) * 0.08,
                normalized * 4.8 - 1.6,
                -normalized * 2.7,
              ]}
            >
              <Line
                points={points}
                color={COLORS[index % COLORS.length]}
                transparent
                opacity={opacity * (0.55 + normalized * 0.65)}
                lineWidth={0.42 + normalized * 0.48}
                toneMapped={false}
                depthWrite={false}
              />
            </group>
          );
        })}
      </group>

      <group
        position={[3.55, -2.15, -1.2]}
        rotation={[0.18, -0.48, -0.12]}
        scale={[0.9, 0.9, 0.9]}
      >
        {columnRings.map((points, index) => {
          const normalized = index / (COLUMN_COUNT - 1);
          return (
            <group
              key={`column-${index}`}
              position={[0, normalized * 5.1, -normalized * 0.72]}
              scale={[
                1 + normalized * 0.85,
                1 + normalized * 0.85,
                1,
              ]}
            >
              <Line
                points={points}
                color={COLORS[(index + 2) % COLORS.length]}
                transparent
                opacity={opacity * (0.48 + normalized * 0.42)}
                lineWidth={0.42}
                toneMapped={false}
                depthWrite={false}
              />
            </group>
          );
        })}
      </group>
    </group>
  );
}
