import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, Group, Vector3 } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";

const FILAMENTS = [
  [
    [-6.4, 1.3, 0.7],
    [-3.2, 1.12, 0.95],
    [-0.5, 0.15, 0.9],
    [2.2, 0.48, 0.4],
    [6.1, 1.0, -0.6],
  ],
  [
    [-5.8, 1.65, -0.8],
    [-2.8, 1.15, 0.15],
    [0.2, 1.35, 0.95],
    [2.6, 1.05, 0.35],
    [5.2, 1.65, -1.1],
  ],
  [
    [-5.6, -2.3, -1.2],
    [-2.4, -1.8, 0.1],
    [0.8, -1.35, 0.85],
    [2.4, -0.55, 0.2],
    [5.2, -0.2, -1.4],
  ],
  [
    [-1.4, 3.1, -2.5],
    [-0.8, 1.55, -0.45],
    [0.1, 0.15, 1.3],
    [1.35, -1.4, 0.1],
    [2.7, -3, -1.6],
  ],
  [
    [3.8, -2.4, -0.7],
    [2.1, -1.2, 0.75],
    [1, 0.2, 1.35],
    [2.25, 1.4, 0.55],
    [4.7, 2.3, -1.25],
  ],
] as const;

export function StressFilaments() {
  const group = useRef<Group>(null);
  const progress = useExperienceStore((state) => state.scrollProgress);
  const sample = sampleExperience(progress);
  const curves = useMemo(
    () =>
      FILAMENTS.map((points) =>
        new CatmullRomCurve3(
          points.map(([x, y, z]) => new Vector3(x, y, z)),
        ).getPoints(150),
      ),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const store = useExperienceStore.getState();
    const current = sampleExperience(store.scrollProgress);
    const time = state.clock.elapsedTime;
    const motion = store.reducedMotion ? 0.08 : 1;
    group.current.rotation.y =
      Math.sin(time * 0.08) * 0.045 * motion +
      store.pointer.x * current.simulation.pointerForce * 0.08;
    group.current.rotation.x =
      Math.cos(time * 0.07) * 0.035 * motion -
      store.pointer.y * current.simulation.pointerForce * 0.045;
    group.current.position.z =
      -0.62 -
      current.visual.collapseDistortion * 0.42 +
      current.simulation.emergence * 0.12;
    group.current.scale.setScalar(
      0.96 +
        current.visual.stressIntensity * 0.04 -
        current.visual.collapseDistortion * 0.08,
    );
  });

  const glowOpacity =
    0.025 +
    sample.visual.stressIntensity * 0.11 +
    sample.simulation.emergence * 0.02;
  const coreOpacity =
    0.12 +
    sample.visual.stressIntensity * 0.32 +
    sample.simulation.emergence * 0.05;

  return (
    <group ref={group}>
      {curves.map((points, index) => (
        <group key={index}>
          <Line
            points={points}
            color={index % 2 === 0 ? "#ffb84f" : "#f4d67f"}
            transparent
            opacity={glowOpacity}
            lineWidth={2.2 + sample.visual.stressIntensity * 1.6}
            toneMapped={false}
            depthWrite={false}
          />
          <Line
            points={points}
            color={index % 2 === 0 ? "#ffe4a1" : "#ffc766"}
            transparent
            opacity={coreOpacity}
            lineWidth={0.45 + sample.visual.stressIntensity * 0.35}
            toneMapped={false}
            depthWrite={false}
          />
        </group>
      ))}
    </group>
  );
}
