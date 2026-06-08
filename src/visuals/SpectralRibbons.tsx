import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, Group, Vector3 } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";

const RIBBON_SPECS = [
  {
    color: "#7dd7ff",
    opacity: 0.3,
    lineWidth: 4.8,
    points: [
      [-6.6, -2.8, 3.9],
      [-3.4, -1.5, 4.8],
      [-0.8, -2.2, 4.2],
      [2.2, -3.0, 3.3],
      [6.4, -1.25, 1.6],
    ],
  },
  {
    color: "#cc63ff",
    opacity: 0.28,
    lineWidth: 4,
    points: [
      [-6.1, 2.7, 1.4],
      [-2.7, 3.35, 2.4],
      [0.2, 2.45, 1.6],
      [2.8, 3.15, 0.8],
      [6.4, 2.0, -0.8],
    ],
  },
  {
    color: "#f1bd70",
    opacity: 0.36,
    lineWidth: 2.7,
    points: [
      [-6.2, -0.9, 1.4],
      [-2.5, 0.45, 2.3],
      [0.5, -0.38, 1.3],
      [2.5, 0.72, 0.35],
      [6.2, 1.15, -1.25],
    ],
  },
  {
    color: "#d9ef72",
    opacity: 0.22,
    lineWidth: 2.2,
    points: [
      [-6.4, 1.25, -1.1],
      [-3.2, 0.55, -0.3],
      [-0.4, 1.15, 0.75],
      [2.6, 0.15, 1.8],
      [6.1, -0.15, 0.2],
    ],
  },
  {
    color: "#ef5cad",
    opacity: 0.2,
    lineWidth: 2.5,
    points: [
      [-5.8, -2.9, -1.6],
      [-2.9, -1.85, -0.45],
      [0.3, -1.35, 0.55],
      [3.2, -0.8, -0.35],
      [6.1, -1.8, -2.2],
    ],
  },
] as const;

export function SpectralRibbons() {
  const group = useRef<Group>(null);
  const progress = useExperienceStore((state) => state.scrollProgress);
  const sample = sampleExperience(progress);
  const ribbons = useMemo(
    () =>
      RIBBON_SPECS.map((spec) => ({
        ...spec,
        points: new CatmullRomCurve3(
          spec.points.map(([x, y, z]) => new Vector3(x, y, z)),
        ).getPoints(120),
      })),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const store = useExperienceStore.getState();
    const sample = sampleExperience(store.scrollProgress);
    const time = state.clock.elapsedTime;
    const motion = store.reducedMotion ? 0.12 : 1;
    group.current.rotation.y =
      Math.sin(time * 0.11) * 0.08 * motion +
      store.pointer.x * sample.simulation.pointerForce * 0.14;
    group.current.rotation.x =
      Math.cos(time * 0.09) * 0.04 * motion -
      store.pointer.y * sample.simulation.pointerForce * 0.08;
    group.current.position.z =
      -0.35 +
      sample.visual.ribbonDepth * 0.62 -
      sample.visual.collapseDistortion * 0.72;
    group.current.scale.setScalar(
      0.94 +
        sample.simulation.birth * 0.06 -
        sample.visual.collapseDistortion * 0.08,
    );
  });

  return (
    <group ref={group}>
      {ribbons.map((ribbon, index) => (
        <Line
          key={ribbon.color}
          points={ribbon.points}
          color={ribbon.color}
          transparent
          opacity={
            ribbon.opacity *
            (0.35 +
              sample.visual.ribbonDepth * 0.54 +
              sample.visual.stressIntensity * 0.18)
          }
          lineWidth={
            ribbon.lineWidth +
            sample.visual.ribbonDepth * 0.9 +
            (index === 0 ? 0.8 : 0)
          }
          toneMapped={false}
          depthWrite={false}
        />
      ))}
    </group>
  );
}
