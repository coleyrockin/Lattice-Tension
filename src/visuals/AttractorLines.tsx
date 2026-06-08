import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";
import { createAttractorPoints } from "../simulation/field";

export function AttractorLines() {
  const group = useRef<Group>(null);
  const progress = useExperienceStore((state) => state.scrollProgress);
  const sample = sampleExperience(progress);
  const points = useMemo(() => createAttractorPoints(), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const store = useExperienceStore.getState();
    const sample = sampleExperience(store.scrollProgress);
    const motion = store.reducedMotion ? 0.12 : 1;
    group.current.rotation.x += delta * 0.018 * motion;
    group.current.rotation.y += delta * 0.035 * motion;
    group.current.scale.setScalar(
      0.68 +
        sample.simulation.order * 0.24 -
        sample.visual.collapseDistortion * 0.24 +
        sample.simulation.emergence * 0.08,
    );
    group.current.position.x =
      0.8 + store.pointer.x * sample.simulation.pointerForce * 0.28;
    group.current.position.z =
      0.4 -
      sample.visual.collapseDistortion * 0.8 +
      Math.sin(state.clock.elapsedTime * 0.23) * 0.08 * motion;
  });

  return (
    <group ref={group} position={[0.8, -1.2, 0.4]} rotation={[0.6, 0.1, 0.2]}>
      <Line
        points={points}
        color="#efb86e"
        transparent
        opacity={0.18 + sample.visual.stressIntensity * 0.52}
        lineWidth={0.55 + sample.visual.stressIntensity * 0.5}
        toneMapped={false}
        depthWrite={false}
      />
      <Line
        points={points}
        color="#b766ff"
        transparent
        opacity={0.06 + sample.visual.stressIntensity * 0.18}
        lineWidth={1.8 + sample.visual.stressIntensity * 1.5}
        toneMapped={false}
        depthWrite={false}
      />
    </group>
  );
}
