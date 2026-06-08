import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, MathUtils, Mesh } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";
import {
  createMembraneMaterial,
  type MembraneMaterial,
} from "./materials/membraneMaterial";

const MEMBRANES = [
  {
    position: [0.15, 0.05, -0.45] as [number, number, number],
    rotation: [-0.24, 0.5, -0.28] as [number, number, number],
    scale: [1.42, 1.08, 1] as [number, number, number],
    phase: 0.3,
    opacity: 0.88,
  },
  {
    position: [-2.55, -0.55, -1.85] as [number, number, number],
    rotation: [-0.42, 0.72, -0.12] as [number, number, number],
    scale: [1.18, 0.92, 1] as [number, number, number],
    phase: 2.1,
    opacity: 0.68,
  },
  {
    position: [2.55, 0.7, -2.25] as [number, number, number],
    rotation: [0.4, -0.58, 0.34] as [number, number, number],
    scale: [1.14, 0.86, 1] as [number, number, number],
    phase: 4.2,
    opacity: 0.64,
  },
  {
    position: [0.35, 2.45, -3.65] as [number, number, number],
    rotation: [1.02, 0.18, 0.08] as [number, number, number],
    scale: [1.54, 0.78, 1] as [number, number, number],
    phase: 5.4,
    opacity: 0.5,
  },
  {
    position: [0.4, -2.4, 1.55] as [number, number, number],
    rotation: [-0.94, -0.22, 0.28] as [number, number, number],
    scale: [1.26, 0.64, 1] as [number, number, number],
    phase: 1.1,
    opacity: 0.42,
  },
];

function Membrane({
  config,
  index,
}: {
  config: (typeof MEMBRANES)[number];
  index: number;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () => createMembraneMaterial(config.phase, config.opacity),
    [config.opacity, config.phase],
  );

  useFrame((state, delta) => {
    const store = useExperienceStore.getState();
    const sample = sampleExperience(store.scrollProgress);
    const time = state.clock.elapsedTime;
    const motion = store.reducedMotion ? 0.12 : 1;
    const breath = Math.sin(time * 0.22 + config.phase) * 0.035 * motion;
    const collapse = sample.visual.collapseDistortion;
    const jitter =
      Math.sin(time * 8.5 + index * 1.7) * collapse * 0.045 * motion;

    updateMaterial(
      material,
      time,
      index,
      config.opacity,
      delta,
    );

    if (!mesh.current) return;
    mesh.current.position.set(
      MathUtils.lerp(config.position[0], config.position[0] * 0.46, collapse) +
        store.pointer.x * sample.simulation.pointerForce * (0.22 + index * 0.025) +
        jitter,
      MathUtils.lerp(config.position[1], config.position[1] * 0.54, collapse) +
        store.pointer.y * sample.simulation.pointerForce * 0.16 -
        jitter * 0.55,
      config.position[2] + breath * 7 - collapse * (0.28 + index * 0.08),
    );
    mesh.current.rotation.set(
      config.rotation[0] + breath * 1.4 + jitter,
      config.rotation[1] + Math.sin(time * 0.14 + index) * 0.08 * motion,
      config.rotation[2] + breath * 1.8 - jitter,
    );
    const scale =
      (0.74 + sample.visual.membraneScale * 0.34 + breath) *
      (1 - collapse * 0.14);
    mesh.current.scale.set(
      config.scale[0] * scale,
      config.scale[1] * scale,
      config.scale[2],
    );
  });

  return (
    <mesh
      ref={mesh}
      position={config.position}
      rotation={config.rotation}
      scale={config.scale}
      material={material}
    >
      <planeGeometry args={[7.2, 7.2, 74, 74]} />
    </mesh>
  );
}

function updateMaterial(
  material: MembraneMaterial,
  time: number,
  index: number,
  baseOpacity: number,
  delta: number,
) {
  const store = useExperienceStore.getState();
  const sample = sampleExperience(store.scrollProgress);
  const motion = store.reducedMotion ? 0.18 : 1;
  material.uniforms.uTime.value = time * motion + index * 0.4;
  material.uniforms.uBirth.value = sample.simulation.birth;
  material.uniforms.uTension.value = sample.simulation.tension;
  material.uniforms.uOrder.value = sample.simulation.order;
  material.uniforms.uCollapse.value = sample.simulation.collapse;
  material.uniforms.uEmergence.value = sample.simulation.emergence;
  material.uniforms.uCollapseDistortion.value =
    sample.visual.collapseDistortion;
  material.uniforms.uStressIntensity.value = sample.visual.stressIntensity;
  material.uniforms.uOpacity.value = MathUtils.damp(
    material.uniforms.uOpacity.value,
    baseOpacity *
      sample.visual.membraneOpacity *
      (0.58 + sample.simulation.birth * 0.42),
    3.2,
    delta,
  );
  material.uniforms.uPointer.value.set(store.pointer.x, store.pointer.y);
  material.uniforms.uPrimary.value.lerp(
    new Color(sample.palette.primary),
    0.08,
  );
  material.uniforms.uSecondary.value.lerp(
    new Color(sample.palette.secondary),
    0.08,
  );
  material.uniforms.uAccent.value.lerp(
    new Color(sample.palette.accent),
    0.08,
  );
}

export function InterferenceMembranes() {
  return (
    <group>
      {MEMBRANES.map((config, index) => (
        <Membrane key={config.phase} config={config} index={index} />
      ))}
    </group>
  );
}
