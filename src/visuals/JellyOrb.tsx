import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Intersection, type Mesh, type Raycaster } from "three";
import { useExperienceStore } from "../experience/store";
import { organismController } from "../simulation/organismController";
import { createJellyOrbMaterial } from "./jellyOrbMaterial";

const STEPS: Record<string, number> = { high: 128, medium: 68, low: 48 };
const REDUCED_MOTION_SCALE = 0.18;

// Deliberately cool and low-luminance. The shader does the bright work through
// wet highlights and bloom; these anchors keep the body from bleaching white.
const DEEP = new Color("#05478d");
const OCEAN = new Color("#18afea");
const BABY_BLUE = new Color("#91e7ff");
const VIOLET = new Color("#7180ff");
const STRETCH_CYAN = new Color("#20b8ea");
const SQUISH_VIOLET = new Color("#6872e6");
const TWIST_ORCHID = new Color("#9b79dc");
const ACTIVE_ACCENT = new Color();
const ACTIVE_HIGHLIGHT = new Color();

// The shader's bounding cube is only a render envelope. ContactSurface is the
// sole interaction volume, so the cube must never compete for pointer hits.
const skipRaycast = (...args: [Raycaster, Intersection[]]) => {
  void args;
};

function applyWave(
  origin: { value: { set: (x: number, y: number, z: number) => unknown } },
  age: { value: number },
  strength: { value: number },
  wave: { origin: readonly [number, number, number]; age: number; strength: number } | undefined,
) {
  if (!wave) {
    age.value = 999;
    strength.value = 0;
    return;
  }
  origin.value.set(wave.origin[0], wave.origin[1], wave.origin[2]);
  age.value = wave.age;
  strength.value = wave.strength;
}

export function JellyOrb() {
  const mesh = useRef<Mesh>(null!);
  const tier = useExperienceStore((state) => state.profile?.tier ?? "high");
  const reducedMotion = useExperienceStore((state) => state.reducedMotion);
  const uniforms = useMemo(() => createJellyOrbMaterial(STEPS[tier] ?? 110), [tier]);

  useEffect(() => () => uniforms.material.dispose(), [uniforms]);

  useFrame(() => {
    const snapshot = organismController.snapshot;
    const energy = snapshot.energy;
    const resonance = snapshot.resonance;
    const bendAmount = Math.hypot(...snapshot.bend);
    const stretchColorStrength = Math.min(
      1,
      Math.max(0, snapshot.strain) * 3.15 + bendAmount * 0.3 + energy * 0.1,
    );
    const squishColorStrength = Math.min(
      1,
      Math.max(0, -snapshot.strain) * 3.4 +
        Math.max(0, snapshot.squeeze) * 0.72 +
        snapshot.contactPressure * 0.72,
    );
    const twistColorStrength = Math.min(
      1,
      Math.abs(snapshot.torsion) * 0.9 +
        Math.abs(snapshot.squeeze) * 0.16 +
        resonance * 0.04,
    );

    uniforms.phase.value = snapshot.phase;
    uniforms.motionScale.value = reducedMotion ? REDUCED_MOTION_SCALE : 1;
    uniforms.squash.value = snapshot.strain;
    uniforms.jiggle.value.set(...snapshot.axis);
    uniforms.bend.value.set(...snapshot.bend);
    uniforms.slosh.value.set(...snapshot.slosh);
    uniforms.kineticEnergy.value = energy;
    uniforms.contactOrigin.value.set(...snapshot.contactOrigin);
    uniforms.contactPressure.value = snapshot.contactPressure;
    uniforms.secondaryContactOrigin.value.set(...snapshot.secondaryContactOrigin);
    uniforms.secondaryContactPressure.value = snapshot.secondaryContactPressure;
    uniforms.pointer.value.set(...snapshot.pointer);

    applyWave(uniforms.rippleOrigin0, uniforms.rippleAge0, uniforms.rippleStrength0, snapshot.surfaceWaves[0]);
    applyWave(uniforms.rippleOrigin1, uniforms.rippleAge1, uniforms.rippleStrength1, snapshot.surfaceWaves[1]);
    applyWave(uniforms.rippleOrigin2, uniforms.rippleAge2, uniforms.rippleStrength2, snapshot.surfaceWaves[2]);
    applyWave(uniforms.rippleOrigin3, uniforms.rippleAge3, uniforms.rippleStrength3, snapshot.surfaceWaves[3]);

    uniforms.speed.value = 0.22 + energy * 0.2;
    uniforms.tension.value = 0.34 + energy * 0.46 + resonance * 0.12;
    uniforms.order.value = 0.18 + energy * 0.28 + resonance * 0.11;
    uniforms.pulse.value = Math.min(0.94, energy * 0.66 + resonance * 0.38);
    uniforms.resonance.value = resonance;
    uniforms.presence.value = 1;
    uniforms.collapseDistort.value = 0;
    uniforms.fringeRipple.value = energy * 0.045;
    uniforms.lattice.value = 0.22 + energy * 0.24 + resonance * 0.1;
    uniforms.stretchColorStrength.value = stretchColorStrength;
    uniforms.squishColorStrength.value = squishColorStrength;
    uniforms.twistColorStrength.value = twistColorStrength;
    uniforms.stretchColor.value.copy(STRETCH_CYAN);
    uniforms.squishColor.value.copy(SQUISH_VIOLET);
    uniforms.twistColor.value.copy(TWIST_ORCHID);

    ACTIVE_ACCENT
      .copy(OCEAN)
      .lerp(STRETCH_CYAN, stretchColorStrength * 0.32)
      .lerp(SQUISH_VIOLET, squishColorStrength * 0.24)
      .lerp(TWIST_ORCHID, twistColorStrength * 0.12);
    ACTIVE_HIGHLIGHT
      .copy(BABY_BLUE)
      .lerp(STRETCH_CYAN, stretchColorStrength * 0.24)
      .lerp(SQUISH_VIOLET, squishColorStrength * 0.2)
      .lerp(TWIST_ORCHID, twistColorStrength * 0.12);
    uniforms.tint.value.copy(DEEP).lerp(OCEAN, stretchColorStrength * 0.03);
    uniforms.accent.value.copy(ACTIVE_ACCENT);
    uniforms.highlight.value.copy(ACTIVE_HIGHLIGHT).lerp(VIOLET, energy * 0.04);

    if (!mesh.current) return;
    mesh.current.position.set(...snapshot.position);
    mesh.current.rotation.set(...snapshot.rotation);
    mesh.current.scale.setScalar(snapshot.modelScale);
  });

  return (
    <mesh ref={mesh} renderOrder={15} raycast={skipRaycast}>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={uniforms.material} attach="material" />
    </mesh>
  );
}
