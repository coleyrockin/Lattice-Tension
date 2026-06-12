/* eslint-disable react-hooks/immutability -- R3F useFrame drives the live camera */
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { descent } from "./store";

/**
 * Scroll-driven camera: FOV and gentle drift from chapter definitions so each
 * realm frames differently — wide cathedral vs tight vortex vs soft origin.
 */
export function CameraRig() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const sample = sampleExperience(descent.value);
    const sig = sample.signature;
    const time = state.clock.getElapsedTime();

    // 1. Zoom in/out based on signature and crystalline state
    // High crystalline (Pattern) has a tight zoom in, Nebula has a wide/grander zoom out
    let zoomOffset = 0;
    if (sig.crystalline > 0.1) {
      zoomOffset = -6.5 * sig.crystalline; // zoom in tightly
    }
    if (sig.nebula > 0.1) {
      zoomOffset = 9.0 * sig.nebula; // zoom out widely
    }

    // Snapping blend speed: rigid pattern vs slow floating nebula/origin
    // Crystalline/Pattern is rigid, veil (Aether/Nebula) makes it slower and smoother
    const baseBlendSpeed = 4.2;
    const crystallineRigidifier = sig.crystalline * 6.5;
    const veilDriftSlower = sig.veil * 2.2;
    const activeBlendRate = Math.max(1.5, baseBlendSpeed + crystallineRigidifier - veilDriftSlower);
    const blend = 1 - Math.exp(-activeBlendRate * dt);

    const targetFov = sample.camera.fov + sig.singularity * 9 - sig.orbPresence * 4 + zoomOffset;
    camera.fov += (targetFov - camera.fov) * blend;

    const [cx, cy] = sample.camera.position;

    // 2. Base target position
    let targetX = cx * 0.014 + sig.twist * 0.04;
    let targetY = cy * 0.014 - sample.simulation.collapse * 0.025;

    // 3. Subtle spring-based violent orbit/position shake under high gravity (singularity or twist)
    const gravity = sig.singularity + sig.twist;
    if (gravity > 0.05) {
      // Violent orbit-like offset shake
      const shakeFreq = 42; // Fast shake
      const shakeAmp = 0.02 * gravity;
      targetX += Math.sin(time * shakeFreq) * shakeAmp;
      targetY += Math.cos(time * shakeFreq * 0.95) * shakeAmp;
    }

    // 4. Slow, smooth drift when veil is high
    if (sig.veil > 0.05) {
      const floatFreq = 0.95;
      const floatAmp = 0.018 * sig.veil;
      targetX += Math.sin(time * floatFreq) * floatAmp;
      targetY += Math.cos(time * floatFreq * 0.72) * floatAmp;
    }

    camera.position.x += (targetX - camera.position.x) * blend;
    camera.position.y += (targetY - camera.position.y) * blend;

    camera.updateProjectionMatrix();
  });

  return null;
}