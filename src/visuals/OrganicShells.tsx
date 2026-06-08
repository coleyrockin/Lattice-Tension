import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, MathUtils, Mesh } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";
import {
  createShellMaterial,
  type ShellMaterial,
} from "./materials/shellMaterial";

const SHELLS = [
  {
    position: [0.65, 0.05, -0.65] as [number, number, number],
    rotation: [0.15, 0.42, -0.28] as [number, number, number],
    scale: [3.45, 2.5, 1.5] as [number, number, number],
    phase: 0.5,
    opacity: 0.78,
  },
  {
    position: [-2.65, -1.45, 0.2] as [number, number, number],
    rotation: [0.2, -0.52, 0.7] as [number, number, number],
    scale: [2.7, 1.05, 1.1] as [number, number, number],
    phase: 2.2,
    opacity: 0.54,
  },
  {
    position: [0.15, 2.75, -3.15] as [number, number, number],
    rotation: [0.55, 0.1, 0.15] as [number, number, number],
    scale: [3.8, 0.95, 1.15] as [number, number, number],
    phase: 4.1,
    opacity: 0.46,
  },
  {
    position: [3.65, -1.55, -1.4] as [number, number, number],
    rotation: [-0.25, 0.8, -0.18] as [number, number, number],
    scale: [2.45, 0.82, 1.05] as [number, number, number],
    phase: 5.6,
    opacity: 0.38,
  },
];

function Shell({ config, index }: {
  config: (typeof SHELLS)[number];
  index: number;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () => createShellMaterial(config.phase, config.opacity),
    [config.opacity, config.phase],
  );

  useFrame((state, delta) => {
    const store = useExperienceStore.getState();
    const sample = sampleExperience(store.scrollProgress);
    const time = state.clock.elapsedTime;
    const motion = store.reducedMotion ? 0.12 : 1;
    const breath = Math.sin(time * 0.27 + config.phase) * 0.04 * motion;
    const collapse = sample.visual.collapseDistortion;
    const jitter =
      Math.sin(time * 9.2 + index * 2.4) * collapse * 0.038 * motion;

    updateShell(
      material,
      time,
      index,
      config.opacity,
      delta,
    );

    if (!mesh.current) return;
    mesh.current.position.set(
      MathUtils.lerp(config.position[0], config.position[0] * 0.48, collapse) +
        store.pointer.x * sample.simulation.pointerForce * 0.18 +
        jitter,
      MathUtils.lerp(config.position[1], config.position[1] * 0.5, collapse) +
        store.pointer.y * sample.simulation.pointerForce * 0.12 -
        jitter * 0.7,
      config.position[2] - collapse * (0.2 + index * 0.12),
    );
    mesh.current.rotation.set(
      config.rotation[0] + breath + jitter,
      config.rotation[1] + Math.sin(time * 0.16 + config.phase) * 0.1 * motion,
      config.rotation[2] + breath * 1.6 - jitter,
    );
    const scale =
      (0.72 + sample.visual.membraneScale * 0.3 + breath) *
      (1 - collapse * 0.18);
    mesh.current.scale.set(
      config.scale[0] * scale,
      config.scale[1] * scale,
      config.scale[2] * (1 + sample.simulation.tension * 0.08),
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
      <icosahedronGeometry args={[1, 5]} />
    </mesh>
  );
}

function updateShell(
  material: ShellMaterial,
  time: number,
  index: number,
  baseOpacity: number,
  delta: number,
) {
  const store = useExperienceStore.getState();
  const sample = sampleExperience(store.scrollProgress);
  const motion = store.reducedMotion ? 0.14 : 1;
  material.uniforms.uTime.value = time * motion + index * 0.62;
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
      (0.7 + sample.simulation.birth * 0.3),
    3.2,
    delta,
  );
  material.uniforms.uPointer.value.set(store.pointer.x, store.pointer.y);
  material.uniforms.uPrimary.value.lerp(
    new Color(sample.palette.primary),
    0.06,
  );
  material.uniforms.uSecondary.value.lerp(
    new Color(sample.palette.secondary),
    0.06,
  );
  material.uniforms.uAccent.value.lerp(
    new Color(sample.palette.accent),
    0.06,
  );
}

export function OrganicShells() {
  return (
    <group>
      {SHELLS.map((config, index) => (
        <Shell key={config.phase} config={config} index={index} />
      ))}
    </group>
  );
}
