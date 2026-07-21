import { describe, expect, it } from "vitest";
import {
  releaseVelocityForGesture,
  sampleContactGesture,
  type ContactGestureState,
} from "./contactGesture";

const gesture = (): ContactGestureState => ({
  start: [0, 0, 1],
  previous: [0.2, -0.1, 0.97],
  previousAt: 1,
  velocity: [2.5, -1.25],
  travel: 0.3,
});

describe("sampleContactGesture", () => {
  it("preserves the previous flick velocity on a stationary pointerup", () => {
    const current = gesture();
    const sample = sampleContactGesture(current, [0.2, -0.1, 0.97], 1.08);

    expect(sample.moved).toBe(false);
    expect(sample.gesture).toBe(current);
    expect(sample.gesture.velocity).toEqual([2.5, -1.25]);
    expect(sample.gesture.previousAt).toBe(1);
    expect(sample.gesture.travel).toBe(0.3);
  });

  it("updates velocity and travel when the final event contains movement", () => {
    const sample = sampleContactGesture(gesture(), [0.26, -0.13, 0.96], 1.02);

    expect(sample.moved).toBe(true);
    expect(sample.displacement).toEqual([0.26, -0.13]);
    expect(sample.gesture.velocity[0]).toBeCloseTo(3);
    expect(sample.gesture.velocity[1]).toBeCloseTo(-1.5);
    expect(sample.gesture.previous).toEqual([0.26, -0.13, 0.96]);
    expect(sample.gesture.previousAt).toBe(1.02);
    expect(sample.gesture.travel).toBeCloseTo(0.3 + Math.hypot(0.06, 0.03));
  });
});

describe("releaseVelocityForGesture", () => {
  it("preserves velocity for an immediate stationary release", () => {
    expect(releaseVelocityForGesture(gesture(), 1.02)).toEqual([2.5, -1.25]);
  });

  it("smoothly reduces velocity during the idle window", () => {
    const velocity = releaseVelocityForGesture(gesture(), 1.1);

    expect(velocity[0]).toBeCloseTo(1.25);
    expect(velocity[1]).toBeCloseTo(-0.625);
  });

  it("returns zero for a delayed stationary release", () => {
    expect(releaseVelocityForGesture(gesture(), 1.25)).toEqual([0, 0]);
  });
});
