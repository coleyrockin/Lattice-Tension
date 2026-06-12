import { useFrame } from "@react-three/fiber";
import { BackgroundDriver } from "../experience/BackgroundDriver";
import { CameraRig } from "../experience/CameraRig";
import { JellyOrb } from "./JellyOrb";
import { GyroidLattice } from "./GyroidLattice";
import { EchoLayer } from "./EchoLayer";
import { InterferenceLayer } from "./InterferenceLayer";
import { descent, useExperienceStore } from "../experience/store";

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
  });
  return null;
}

export function AetherWorld() {
  return (
    <>
      <DescentDriver />
      <BackgroundDriver />
      <CameraRig />
      <JellyOrb />
      <GyroidLattice />
      <InterferenceLayer />
      <EchoLayer />
    </>
  );
}
