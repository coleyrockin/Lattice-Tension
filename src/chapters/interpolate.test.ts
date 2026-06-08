import { describe, expect, it } from "vitest";
import { CHAPTERS } from "./definitions";
import { sampleExperience } from "./interpolate";

describe("chapter interpolation", () => {
  it("clamps progress to the experience", () => {
    expect(sampleExperience(-2).globalProgress).toBe(0);
    expect(sampleExperience(4).globalProgress).toBe(1);
  });

  it("selects all six chapters at their scroll boundaries", () => {
    CHAPTERS.forEach((_, index) => {
      const progress = index / CHAPTERS.length + 0.001;
      expect(sampleExperience(progress).chapterIndex).toBe(index);
    });
  });

  it("remains finite during rapid direction changes", () => {
    [0.92, 0.02, 0.68, 0.31, 1, 0].forEach((progress) => {
      const sample = sampleExperience(progress);
      expect(sample.camera.position.every(Number.isFinite)).toBe(true);
      expect(Object.values(sample.simulation).every(Number.isFinite)).toBe(
        true,
      );
      expect(Object.values(sample.visual).every(Number.isFinite)).toBe(true);
    });
  });
});
