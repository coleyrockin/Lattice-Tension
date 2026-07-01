import { describe, expect, it } from "vitest";
import { ATLAS_MAX } from "./atlas";
import { CHAPTERS } from "./definitions";
import { sampleExperience } from "./interpolate";

describe("chapter interpolation", () => {
  it("clamps progress to the atlas extent", () => {
    expect(sampleExperience(-2).globalProgress).toBe(0);
    expect(sampleExperience(ATLAS_MAX + 4).globalProgress).toBe(1);
  });

  it("selects the origin chapter across its whole range", () => {
    const start = sampleExperience(CHAPTERS[0].range[0] + 0.001);
    const mid = sampleExperience((CHAPTERS[0].range[0] + CHAPTERS[0].range[1]) / 2);
    const end = sampleExperience(CHAPTERS[0].range[1] - 0.001);
    expect(start.chapterIndex).toBe(0);
    expect(mid.chapterIndex).toBe(0);
    expect(end.chapterIndex).toBe(0);
  });

  it("holds the origin signature steady at chapter center", () => {
    const origin = sampleExperience(CHAPTERS[0].range[0] + 0.05);
    expect(origin.signature.latticeReveal).toBeLessThan(0.3);
    expect(origin.signature.orbPresence).toBeGreaterThan(0.9);
  });

  it("remains finite during rapid direction changes", () => {
    [0.92, 0.02, 0.68, 0.31, ATLAS_MAX, 0].forEach((progress) => {
      const sample = sampleExperience(progress);
      expect(sample.camera.position.every(Number.isFinite)).toBe(true);
      expect(Object.values(sample.simulation).every(Number.isFinite)).toBe(
        true,
      );
      expect(Object.values(sample.visual).every(Number.isFinite)).toBe(true);
    });
  });
});
