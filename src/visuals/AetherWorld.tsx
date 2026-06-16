import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackgroundDriver } from "../experience/BackgroundDriver";
import { CameraRig } from "../experience/CameraRig";
import { JellyOrb } from "./JellyOrb";
import { GyroidLattice } from "./GyroidLattice";
import { EchoLayer } from "./EchoLayer";
import { InterferenceLayer } from "./InterferenceLayer";
import { SpectralStressField } from "./SpectralStressField";
import { sampleExperience } from "../chapters/interpolate";
import { descent, frameSample, useExperienceStore } from "../experience/store";

/**
 * Owns the single smoothed `descent` value. Runs first (mounted first, default
 * priority) so the orb and lattice frames read an already-updated value. Easing
 * the master journey control here is what makes scroll glide instead of lurch:
 * trackpad/wheel deltas land as discrete jumps in scrollProgress, and this
 * critically-damped follow turns them into continuous motion.
 */
function DescentDriver() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    descent.target = useExperienceStore.getState().scrollProgress;
    const k = 6;
    descent.value += (descent.target - descent.value) * (1 - Math.exp(-k * dt));
    // Compute the chapter sample ONCE per frame; every layer + driver reads it
    // from frameSample instead of each re-deriving it (and re-allocating Colors).
    frameSample.current = sampleExperience(descent.value);
  });
  return null;
}

/** Single owner for imprint decay and drag/impulse deposits — avoids 4× stacking. */
function InteractionDriver() {
  const lastImpulse = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const state = useExperienceStore.getState();
    const { resonance, drag, impulse, pointer, addResonance } = state;

    if (resonance > 0) {
      const resDecay = 1 - Math.exp(-2.6 * dt);
      addResonance(-resonance * resDecay * 0.65);
    }

    const sample = frameSample.current ?? sampleExperience(descent.value);

    if (drag.active) {
      addResonance(0.011 * dt * sample.simulation.pointerForce);
    } else if (
      pointer.active &&
      Math.hypot(pointer.x, pointer.y) > 0.25
    ) {
      addResonance(0.005 * dt * sample.simulation.pointerForce);
    }

    if (impulse && impulse.startedAt !== lastImpulse.current) {
      lastImpulse.current = impulse.startedAt;
      addResonance(0.2 * sample.simulation.pointerForce);
    }
  });

  return null;
}

export function AetherWorld() {
  return (
    <>
      <DescentDriver />
      <InteractionDriver />
      <BackgroundDriver />
      <CameraRig />
      <JellyOrb />
      <GyroidLattice />
      <InterferenceLayer />
      <EchoLayer />
      <SpectralStressField />
    </>
  );
}
