import { describe, expect, it } from "vitest";
import { JellyDynamics, volumeScaleFromStrain } from "./jellyDynamics";

const idleInput = {
  dragX: 0,
  dragY: 0,
  dragging: false,
  idleTarget: 0,
  motionScale: 1,
};

const restInput = { ...idleInput, motionScale: 0 };

describe("JellyDynamics", () => {
  it("preserves volume for axial deformation", () => {
    for (const strain of [-0.2, -0.05, 0, 0.18, 0.34]) {
      const [x, y, z] = volumeScaleFromStrain(strain);
      expect(x * y * z).toBeCloseTo(1, 8);
    }
  });

  it("settles after an impulse without accumulating drift", () => {
    const jelly = new JellyDynamics();
    jelly.applyImpulse([0.5, 0.7, 0.4], 1);

    for (let frame = 0; frame < 60 * 8; frame += 1) {
      jelly.advance(1 / 60, restInput);
    }

    expect(Math.abs(jelly.state.strain)).toBeLessThan(0.002);
    expect(Math.abs(jelly.state.strainVelocity)).toBeLessThan(0.004);
    expect(jelly.state.kineticEnergy).toBeLessThan(0.002);
  });

  it("turns a multi-contact pinch and twist into bounded squish", () => {
    const jelly = new JellyDynamics();

    for (let frame = 0; frame < 60; frame += 1) {
      jelly.advance(1 / 60, {
        ...idleInput,
        dragging: true,
        contactStrength: 0.72,
        squeeze: 0.62,
        twist: 0.7,
      });
    }

    expect(jelly.state.strain).toBeLessThan(-0.08);
    expect(jelly.state.contactPressure).toBeGreaterThan(0.12);
    expect(jelly.state.torsion).toBeGreaterThan(0.2);
    expect(jelly.state.torsion).toBeLessThanOrEqual(0.82);

    for (let frame = 0; frame < 60 * 8; frame += 1) {
      jelly.advance(1 / 60, restInput);
    }

    expect(Math.abs(jelly.state.torsion)).toBeLessThan(0.003);
    expect(Math.abs(jelly.state.torsionVelocity)).toBeLessThan(0.005);
  });

  it("is stable across common render frame rates", () => {
    const run = (fps: number) => {
      const jelly = new JellyDynamics();
      jelly.applyFlick(0.2, -0.14, 1.2);
      for (let frame = 0; frame < fps * 3; frame += 1) {
        jelly.advance(1 / fps, idleInput);
      }
      return jelly.state;
    };

    const at30 = run(30);
    const at60 = run(60);
    const at120 = run(120);

    expect(at30.strain).toBeCloseTo(at60.strain, 4);
    expect(at60.strain).toBeCloseTo(at120.strain, 4);
    expect(at30.slosh[0]).toBeCloseTo(at120.slosh[0], 4);
    expect(at30.angularOffset[1]).toBeCloseTo(at120.angularOffset[1], 4);
  });
});
