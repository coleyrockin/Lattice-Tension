import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";
import { createSeededRandom, randomBetween } from "../simulation/seeded";

export function Atmosphere() {
  const points = useRef<Points>(null);
  const profile = useExperienceStore((state) => state.profile);
  const count = profile?.tier === "low" ? 240 : 680;
  const geometry = useMemo(() => createDustGeometry(count), [count]);
  const material = useMemo(
    () =>
      new PointsMaterial({
        color: "#9cb8ff",
        size: 0.015,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );

  useFrame((state, delta) => {
    if (!points.current) return;
    const store = useExperienceStore.getState();
    const sample = sampleExperience(store.scrollProgress);
    const motion = store.reducedMotion ? 0.08 : 1;
    geometry.setDrawRange(
      0,
      Math.max(
        1,
        Math.floor(count * (0.18 + sample.visual.particleDensity * 0.82)),
      ),
    );
    points.current.rotation.y += delta * 0.012 * motion;
    points.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.055) * 0.08;
    points.current.position.x = store.pointer.x * 0.08;
    material.color.lerp(new Color(sample.palette.primary), 0.04);
    material.opacity =
      (0.1 +
        sample.simulation.birth * 0.16 +
        sample.simulation.emergence * 0.1) *
      (0.5 + sample.visual.particleDensity * 0.5);
    material.size = 0.011 + sample.visual.particleDensity * 0.008;
  });

  return <points ref={points} geometry={geometry} material={material} />;
}

function createDustGeometry(count: number) {
  const random = createSeededRandom(9091);
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = randomBetween(random, -10, 10);
    positions[index * 3 + 1] = randomBetween(random, -6, 6);
    positions[index * 3 + 2] = randomBetween(random, -8, 3);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return geometry;
}
