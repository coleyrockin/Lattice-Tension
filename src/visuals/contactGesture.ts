import type { Vec2Tuple } from "../simulation/organismController";
import type { Vec3Tuple } from "../simulation/jellyDynamics";

export type ContactGestureState = {
  start: Vec3Tuple;
  previous: Vec3Tuple;
  previousAt: number;
  velocity: Vec2Tuple;
  travel: number;
};

export type ContactGestureSample = {
  gesture: ContactGestureState;
  displacement: Vec2Tuple;
  moved: boolean;
};

const MIN_SAMPLE_SECONDS = 1 / 240;
const FULL_RELEASE_VELOCITY_SECONDS = 0.04;
const ZERO_RELEASE_VELOCITY_SECONDS = 0.16;

const smoothstep = (value: number) => value * value * (3 - 2 * value);

export function sampleContactGesture(
  gesture: ContactGestureState,
  normal: Vec3Tuple,
  sampledAt: number,
): ContactGestureSample {
  const displacement: Vec2Tuple = [
    normal[0] - gesture.start[0],
    normal[1] - gesture.start[1],
  ];
  const dx = normal[0] - gesture.previous[0];
  const dy = normal[1] - gesture.previous[1];

  if (dx === 0 && dy === 0) {
    return { gesture, displacement, moved: false };
  }

  const elapsed = Math.max(MIN_SAMPLE_SECONDS, sampledAt - gesture.previousAt);
  const velocity: Vec2Tuple = [dx / elapsed, dy / elapsed];

  return {
    gesture: {
      ...gesture,
      previous: normal,
      previousAt: sampledAt,
      velocity,
      travel: gesture.travel + Math.hypot(dx, dy),
    },
    displacement,
    moved: true,
  };
}

export function releaseVelocityForGesture(
  gesture: ContactGestureState,
  releasedAt: number,
): Vec2Tuple {
  const idleSeconds = Math.max(0, releasedAt - gesture.previousAt);

  if (idleSeconds <= FULL_RELEASE_VELOCITY_SECONDS) {
    return [...gesture.velocity];
  }
  if (idleSeconds >= ZERO_RELEASE_VELOCITY_SECONDS) return [0, 0];

  const progress =
    (idleSeconds - FULL_RELEASE_VELOCITY_SECONDS) /
    (ZERO_RELEASE_VELOCITY_SECONDS - FULL_RELEASE_VELOCITY_SECONDS);
  const retained = 1 - smoothstep(progress);

  return [gesture.velocity[0] * retained, gesture.velocity[1] * retained];
}
