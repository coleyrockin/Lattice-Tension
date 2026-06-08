import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh, PointLight } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";

export function OriginSignal() {
  const point = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);

  useFrame((state) => {
    if (!point.current || !light.current) return;
    const store = useExperienceStore.getState();
    const sample = sampleExperience(store.scrollProgress);
    const time = state.clock.elapsedTime;
    const pulse =
      1 +
      Math.sin(time * (0.8 + sample.simulation.tension * 1.4)) *
        (store.reducedMotion ? 0.03 : 0.18);
    const scale =
      (0.032 +
        sample.simulation.birth * 0.028 +
        sample.simulation.emergence * 0.022 +
        sample.visual.stressIntensity * 0.012) *
      pulse;
    point.current.scale.setScalar(scale);
    point.current.position.x =
      0.45 + store.pointer.x * sample.simulation.pointerForce * 0.16;
    point.current.position.y =
      0.05 + store.pointer.y * sample.simulation.pointerForce * 0.12;
    light.current.position.copy(point.current.position);
    light.current.intensity =
      16 +
      sample.visual.stressIntensity * 46 +
      sample.simulation.emergence * 20;
    light.current.distance =
      6 + sample.visual.stressIntensity * 5 + sample.simulation.emergence * 2;
  });

  return (
    <>
      <mesh ref={point} position={[0.45, 0.05, 1.1]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#fff6df" toneMapped={false} />
      </mesh>
      <pointLight
        ref={light}
        position={[0.45, 0.05, 1.1]}
        color="#f1c77b"
        distance={8}
      />
    </>
  );
}
