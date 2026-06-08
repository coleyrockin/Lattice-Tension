import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group, Vector3 } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";

const COUNT = 18;
const SPECTRUM = ["#68d9ff", "#7f9cff", "#b66dff", "#ef65bd", "#f0a95f", "#d7ec76"];

export function ContourStack() {
  const group = useRef<Group>(null);
  const progress = useExperienceStore((state) => state.scrollProgress);
  const sample = sampleExperience(progress);
  const contours = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, index) => {
        const radius = 0.62 + index * 0.105;
        return Array.from({ length: 97 }, (_, pointIndex) => {
          const angle = (pointIndex / 96) * Math.PI * 2;
          const modulation =
            Math.sin(angle * 3 + index * 0.42) * 0.12 +
            Math.sin(angle * 5 - index * 0.18) * 0.055;
          const radial = radius + modulation;
          return new Vector3(
            Math.cos(angle) * radial * 1.45,
            Math.sin(angle) * radial * 0.7,
            (index - COUNT / 2) * 0.19 +
              Math.sin(angle * 2 + index * 0.3) * 0.16,
          );
        });
      }),
    [],
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const store = useExperienceStore.getState();
    const current = sampleExperience(store.scrollProgress);
    const motion = store.reducedMotion ? 0.1 : 1;
    group.current.rotation.y += delta * 0.04 * motion;
    group.current.rotation.x =
      0.25 + Math.sin(state.clock.elapsedTime * 0.13) * 0.09 * motion;
    group.current.position.y =
      0.2 + Math.sin(state.clock.elapsedTime * 0.18) * 0.1 * motion;
    group.current.position.x =
      3.15 + store.pointer.x * current.simulation.pointerForce * 0.18;
    group.current.position.z =
      -1.55 - current.visual.collapseDistortion * 0.8;
    group.current.scale.setScalar(
      0.78 +
        current.visual.contourDensity * 0.28 +
        current.simulation.emergence * 0.1 -
        current.visual.collapseDistortion * 0.16,
    );
  });

  return (
    <group
      ref={group}
      position={[3.15, 0.2, -1.55]}
      rotation={[0.34, -0.62, 0.18]}
    >
      {contours.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={SPECTRUM[index % SPECTRUM.length]}
          transparent
          opacity={
            0.035 +
            sample.visual.contourDensity * 0.18 +
            sample.simulation.emergence * 0.055
          }
          lineWidth={
            0.45 +
            sample.visual.contourDensity * 0.72 +
            (index % 5 === 0 ? 0.22 : 0)
          }
          toneMapped={false}
          depthWrite={false}
        />
      ))}
    </group>
  );
}
