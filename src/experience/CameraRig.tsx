/* eslint-disable react-hooks/immutability -- R3F useFrame drives the live camera */
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { descent, frameSample, useExperienceStore } from "./store";

/**
 * Scroll-driven camera: FOV, dolly Z, and gentle drift from chapter definitions
 * so each realm frames differently — wide cathedral vs tight vortex vs soft origin.
 */
export function CameraRig() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const sample = frameSample.current ?? sampleExperience(descent.value);
    const sig = sample.signature;
    const time = state.clock.getElapsedTime();
    const reducedMotion = useExperienceStore.getState().reducedMotion;
    const motionScale = reducedMotion ? 0.12 : 1;

    let zoomOffset = 0;
    if (sig.crystalline > 0.1) {
      zoomOffset = -6.5 * sig.crystalline;
    }
    if (sig.nebula > 0.1) {
      zoomOffset = 9.0 * sig.nebula;
    }

    const baseBlendSpeed = 4.2;
    const crystallineRigidifier = sig.crystalline * 6.5;
    const veilDriftSlower = sig.veil * 2.2;
    const activeBlendRate = Math.max(
      1.5,
      baseBlendSpeed + crystallineRigidifier - veilDriftSlower,
    );
    const blend = 1 - Math.exp(-activeBlendRate * dt);

    const targetFov =
      sample.camera.fov + sig.singularity * 9 - sig.orbPresence * 4 + zoomOffset;
    camera.fov += (targetFov - camera.fov) * blend;

    const [cx, cy] = sample.camera.position;
    let targetX = cx * 0.014 + sig.twist * 0.04;
    let targetY = cy * 0.014 - sample.simulation.collapse * 0.025;

    const gravity = sig.singularity + sig.twist;
    if (gravity > 0.05) {
      const shakeFreq = 42;
      const shakeAmp = 0.02 * gravity * motionScale;
      targetX += Math.sin(time * shakeFreq) * shakeAmp;
      targetY += Math.cos(time * shakeFreq * 0.95) * shakeAmp;
    }

    if (sig.veil > 0.05) {
      const floatFreq = 0.95;
      const floatAmp = 0.018 * sig.veil * motionScale;
      targetX += Math.sin(time * floatFreq) * floatAmp;
      targetY += Math.cos(time * floatFreq * 0.72) * floatAmp;
    }

    camera.position.x += (targetX - camera.position.x) * blend;
    camera.position.y += (targetY - camera.position.y) * blend;

    // Orb proximity dolly — single owner so JellyOrb doesn't fight this rig
    const enter = sig.orbPresence;
    const eased = enter * enter * (3 - 2 * enter);
    // Near-clip guard: when the orb is the hero (high presence) AND there's no
    // lit lattice backdrop (very low latticeReveal — i.e. Origin), the dolly
    // parks the camera so close that the orb's bounding box crosses the camera
    // near plane and is clipped to nothing — Origin rendered black. Push the
    // camera back into the zone where the raymarched orb actually rasterizes.
    // Gated to latticeReveal < 0.3, so only Origin is affected (origin_core at
    // 0.32 and every other realm get exactly 0).
    const nearClipGuard = eased * Math.max(0, 0.3 - sig.latticeReveal) * 2.7;
    const targetZ =
      0.72 -
      eased * (0.22 + sig.latticeReveal * 0.48) +
      nearClipGuard -
      sample.visual.cameraProximity * 0.022 +
      sample.simulation.birth * 0.04;
    const zBlend = 1 - Math.exp(-5 * dt);
    camera.position.z += (targetZ - camera.position.z) * zBlend;

    camera.updateProjectionMatrix();
  });

  return null;
}
