import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Points,
  PointsMaterial,
  Vector3,
} from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";
import { createSeededRandom } from "../simulation/seeded";
import type { LatticeField } from "../simulation/field";

type Props = {
  field: LatticeField;
  currentPositions: Vector3[];
};

type ParticleSpec = {
  edgeIndex: number;
  offset: number;
  speed: number;
};

const point = new Vector3();

export function FlowParticles({ field, currentPositions }: Props) {
  const profile = useExperienceStore((state) => state.profile);
  const count = profile?.particleCount ?? 650;
  const pointsRef = useRef<Points>(null);
  const particles = useMemo(
    () => createParticleSpecs(count, field.edges.length),
    [count, field.edges.length],
  );
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    const positions = new BufferAttribute(new Float32Array(count * 3), 3);
    positions.setUsage(DynamicDrawUsage);
    result.setAttribute("position", positions);
    return result;
  }, [count]);
  const material = useMemo(
    () =>
      new PointsMaterial({
        color: "#f4c77b",
        size: 0.024,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );

  useFrame((state) => {
    if (!pointsRef.current) return;
    const store = useExperienceStore.getState();
    const sample = sampleExperience(store.scrollProgress);
    const positions = geometry.getAttribute("position") as BufferAttribute;
    const time = state.clock.elapsedTime;
    const direction = sample.simulation.collapse > 0.55 ? -1 : 1;
    const activeCount = Math.max(
      1,
      Math.floor(count * (0.16 + sample.visual.particleDensity * 0.84)),
    );
    geometry.setDrawRange(0, activeCount);

    for (let index = 0; index < activeCount; index += 1) {
      const particle = particles[index];
      const edge = field.edges[particle.edgeIndex];
      const from = currentPositions[edge.from];
      const to = currentPositions[edge.to];
      const progress =
        ((particle.offset +
          time *
            particle.speed *
            direction *
            (0.32 + sample.simulation.tension * 0.75)) %
          1 +
          1) %
        1;
      point.lerpVectors(from, to, progress);
      const shimmer =
        Math.sin(time * 2.2 + index * 0.37) *
        0.018 *
        sample.simulation.emergence;
      positions.setXYZ(index, point.x, point.y + shimmer, point.z);
    }

    positions.needsUpdate = true;
    material.color.lerp(
      new Color(
        sample.simulation.order > 0.65
          ? sample.palette.primary
          : sample.palette.accent,
      ),
      0.05,
    );
    material.opacity =
      (0.24 + sample.visual.stressIntensity * 0.5) *
      (0.45 + sample.visual.particleDensity * 0.55);
    material.size =
      0.014 +
      sample.simulation.emergence * 0.014 +
      sample.visual.stressIntensity * 0.006;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

function createParticleSpecs(
  count: number,
  edgeCount: number,
): ParticleSpec[] {
  const random = createSeededRandom(8192);
  return Array.from({ length: count }, () => ({
    edgeIndex: Math.floor(random() * edgeCount),
    offset: random(),
    speed: 0.025 + random() * 0.08,
  }));
}
