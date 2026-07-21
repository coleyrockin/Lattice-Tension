import { useCallback, useEffect, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Mesh, Vector3 } from "three";
import {
  ORGANISM_MODEL_SCALE,
  ORGANISM_RADIUS,
  organismController,
} from "../simulation/organismController";
import type { Vec3Tuple } from "../simulation/jellyDynamics";
import {
  releaseVelocityForGesture,
  sampleContactGesture,
  type ContactGestureState,
} from "./contactGesture";

type PointerCaptureTarget = {
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
  hasPointerCapture?: (pointerId: number) => boolean;
};

type Gesture = ContactGestureState & {
  pointerId: number;
  captureTarget: PointerCaptureTarget;
};

const LOCAL_POINT = new Vector3();

function localSurfaceNormal(mesh: Mesh, point: Vector3): Vec3Tuple {
  mesh.worldToLocal(LOCAL_POINT.copy(point));
  return [
    LOCAL_POINT.x / ORGANISM_RADIUS,
    LOCAL_POINT.y / ORGANISM_RADIUS,
    LOCAL_POINT.z / ORGANISM_RADIUS,
  ];
}

function releasePointer(target: PointerCaptureTarget, pointerId: number) {
  try {
    if (target.hasPointerCapture && !target.hasPointerCapture(pointerId)) return;
    target.releasePointerCapture?.(pointerId);
  } catch {
    // Capture may already have been released by the browser.
  }
}

/**
 * The only hit surface in the experience. The transparent sphere follows the
 * same transform as the raymarched body, so space outside the organism is inert.
 */
export function ContactSurface() {
  const mesh = useRef<Mesh>(null!);
  const gestures = useRef(new Map<number, Gesture>());

  const cancelGesture = useCallback((pointerId?: number) => {
    if (pointerId === undefined) {
      gestures.current.forEach((current) => {
        releasePointer(current.captureTarget, current.pointerId);
      });
      gestures.current.clear();
      organismController.cancelContact();
      return;
    }

    const current = gestures.current.get(pointerId);
    if (!current) return;
    gestures.current.delete(pointerId);
    organismController.cancelContact(pointerId);
    releasePointer(current.captureTarget, current.pointerId);
  }, []);

  useEffect(() => {
    const handleBlur = () => cancelGesture();
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") cancelGesture();
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelGesture();
    };
  }, [cancelGesture]);

  useFrame(() => {
    if (!mesh.current) return;
    const snapshot = organismController.snapshot;
    mesh.current.position.set(...snapshot.position);
    mesh.current.rotation.set(...snapshot.rotation);
    mesh.current.scale.setScalar(snapshot.modelScale ?? ORGANISM_MODEL_SCALE);
  });

  const updateGesture = (event: ThreeEvent<PointerEvent>) => {
    const current = gestures.current.get(event.pointerId);
    if (!mesh.current || !current) return;

    const normal = localSurfaceNormal(mesh.current, event.point);
    const now = event.nativeEvent.timeStamp / 1000;
    const sample = sampleContactGesture(current, normal, now);

    if (!sample.moved) return;

    gestures.current.set(event.pointerId, { ...current, ...sample.gesture });
    organismController.moveContact(
      normal,
      sample.displacement,
      sample.gesture.velocity,
      event.pointerId,
    );
  };

  const finishGesture = (event: ThreeEvent<PointerEvent>) => {
    const releasedAt = event.nativeEvent.timeStamp / 1000;
    updateGesture(event);
    const current = gestures.current.get(event.pointerId);
    if (!current) return;

    gestures.current.delete(event.pointerId);
    organismController.endContact(
      releaseVelocityForGesture(current, releasedAt),
      current.travel,
      event.pointerId,
    );
    releasePointer(current.captureTarget, current.pointerId);
  };

  return (
    <mesh
      ref={mesh}
      onPointerDown={(event) => {
        if (!mesh.current) return;
        event.stopPropagation();
        const normal = localSurfaceNormal(mesh.current, event.point);
        if (!organismController.beginContact(normal, event.pointerId)) return;
        const nextGesture: Gesture = {
          pointerId: event.pointerId,
          captureTarget: event.target as unknown as PointerCaptureTarget,
          start: normal,
          previous: normal,
          previousAt: event.nativeEvent.timeStamp / 1000,
          velocity: [0, 0],
          travel: 0,
        };
        gestures.current.set(event.pointerId, nextGesture);
        nextGesture.captureTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={updateGesture}
      onPointerUp={(event) => finishGesture(event)}
      onPointerCancel={(event) => cancelGesture(event.pointerId)}
      onLostPointerCapture={(event) => cancelGesture(event.pointerId)}
    >
      <sphereGeometry args={[ORGANISM_RADIUS, 32, 24]} />
      <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
    </mesh>
  );
}
