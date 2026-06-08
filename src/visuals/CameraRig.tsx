import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";

const desiredPosition = new Vector3();
const desiredTarget = new Vector3();
const currentTarget = new Vector3();
const interactionOffset = new Vector3();

export function CameraRig() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;

  useFrame((state, delta) => {
    const store = useExperienceStore.getState();
    const sample = sampleExperience(store.scrollProgress);
    const pointerScale = store.reducedMotion
      ? 0.08
      : 0.24 + sample.visual.cameraProximity * 0.14;
    const idleScale =
      store.reducedMotion || store.pointer.active || store.drag.active
        ? 0
        : 0.22;
    const idleTime = state.clock.elapsedTime * 0.08;

    interactionOffset.set(
      store.pointer.x * pointerScale +
        Math.sin(idleTime) * idleScale +
        store.drag.x * 2.2,
      store.pointer.y * pointerScale * 0.6 +
        Math.cos(idleTime * 0.8) * idleScale * 0.45 -
        store.drag.y * 1.3,
      0,
    );
    desiredPosition.fromArray(sample.camera.position).add(interactionOffset);
    desiredTarget
      .fromArray(sample.camera.target)
      .add(
        new Vector3(
          store.pointer.x * pointerScale * 0.16,
          store.pointer.y * pointerScale * 0.12,
          0,
        ),
      );
    desiredPosition.lerp(
      desiredTarget,
      0.025 + sample.visual.cameraProximity * 0.075,
    );
    if (!store.reducedMotion && sample.visual.collapseDistortion > 0.01) {
      const collapseJitter = sample.visual.collapseDistortion;
      desiredPosition.x += Math.sin(state.clock.elapsedTime * 7.4) * 0.035 * collapseJitter;
      desiredPosition.y += Math.cos(state.clock.elapsedTime * 8.1) * 0.025 * collapseJitter;
    }

    camera.position.x = MathUtils.damp(
      camera.position.x,
      desiredPosition.x,
      3.2,
      delta,
    );
    camera.position.y = MathUtils.damp(
      camera.position.y,
      desiredPosition.y,
      3.2,
      delta,
    );
    camera.position.z = MathUtils.damp(
      camera.position.z,
      desiredPosition.z,
      3.2,
      delta,
    );
    currentTarget.lerp(desiredTarget, 1 - Math.exp(-delta * 3.8));
    camera.lookAt(currentTarget);
    const targetFov =
      sample.camera.fov +
      Math.sin(state.clock.elapsedTime * 6.2) *
        sample.visual.collapseDistortion *
        0.65;
    camera.fov = MathUtils.damp(camera.fov, targetFov, 3, delta);
    camera.updateProjectionMatrix();
  });

  return null;
}
