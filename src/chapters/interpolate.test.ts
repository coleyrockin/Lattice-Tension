import { describe, expect, it } from "vitest";
import { ATLAS_MAX } from "./atlas";
import { CHAPTERS } from "./definitions";
import { sampleExperience } from "./interpolate";

describe("chapter interpolation", () => {
  it("clamps progress to the atlas extent", () => {
    expect(sampleExperience(-2).globalProgress).toBe(0);
    expect(sampleExperience(ATLAS_MAX + 4).globalProgress).toBe(1);
  });

  it("selects every chapter at the start of its range", () => {
    CHAPTERS.forEach((chapter, index) => {
      const progress = chapter.range[0] + 0.001;
      expect(sampleExperience(progress).chapterIndex).toBe(index);
    });
  });

  it("holds distinct signatures at chapter centers", () => {
    const origin = sampleExperience(CHAPTERS[0].range[0] + 0.05);
    const pattern = sampleExperience(CHAPTERS[2].range[0] + 0.05);
    const collapse = sampleExperience(CHAPTERS[3].range[0] + 0.05);
    const interference = sampleExperience(CHAPTERS[6].range[0] + 0.05);

    // Origin now carries a visible ghost-cathedral lattice so the void around
    // the seed is alive, but the orb still dominates the opening read.
    expect(origin.signature.latticeReveal).toBeLessThan(0.3);
    expect(origin.signature.orbPresence).toBeGreaterThan(0.9);
    expect(pattern.signature.crystalline).toBeGreaterThan(0.9);
    expect(collapse.signature.twist).toBeGreaterThan(0.9);
    expect(interference.signature.fringe).toBeGreaterThan(0.9);
  });

  it("reaches extended atlas realms beyond the original six chapters", () => {
    const interference = sampleExperience(1.08);
    expect(interference.chapterIndex).toBe(6);
    expect(interference.simulation.interference).toBeGreaterThan(0.5);

    const echo = sampleExperience(1.72);
    expect(echo.chapterIndex).toBe(10);
    expect(echo.simulation.resonance).toBeGreaterThan(1);
  });

  it("remains finite during rapid direction changes", () => {
    [0.92, 0.02, 0.68, 0.31, ATLAS_MAX, 1.45, 0].forEach((progress) => {
      const sample = sampleExperience(progress);
      expect(sample.camera.position.every(Number.isFinite)).toBe(true);
      expect(Object.values(sample.simulation).every(Number.isFinite)).toBe(
        true,
      );
      expect(Object.values(sample.visual).every(Number.isFinite)).toBe(true);
    });
  });
});
