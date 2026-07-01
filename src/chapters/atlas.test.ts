import { describe, expect, it } from "vitest";
import {
  ATLAS_MAX,
  clampAtlasProgress,
  getActiveChapterIndex,
  getChapterCenterProgress,
} from "./atlas";
import { CHAPTERS } from "./definitions";

describe("atlas progress", () => {
  it("exposes the full chapter range", () => {
    expect(ATLAS_MAX).toBe(CHAPTERS[CHAPTERS.length - 1].range[1]);
  });

  it("maps any progress within range to the single chapter", () => {
    expect(getActiveChapterIndex(0)).toBe(0);
    expect(getActiveChapterIndex(0.5)).toBe(0);
    expect(getActiveChapterIndex(ATLAS_MAX)).toBe(0);
  });

  it("clamps atlas progress", () => {
    expect(clampAtlasProgress(-1)).toBe(0);
    expect(clampAtlasProgress(99)).toBe(ATLAS_MAX);
  });

  it("returns the visual center of a chapter for rail navigation", () => {
    CHAPTERS.forEach((chapter, index) => {
      const center = getChapterCenterProgress(index);
      expect(center).toBeGreaterThan(chapter.range[0]);
      expect(center).toBeLessThanOrEqual(chapter.range[1]);
      expect(getActiveChapterIndex(center)).toBe(index);
    });
  });
});
