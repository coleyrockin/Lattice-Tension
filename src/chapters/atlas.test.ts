import { describe, expect, it } from "vitest";
import { ATLAS_MAX, clampAtlasProgress, getActiveChapterIndex } from "./atlas";
import { CHAPTERS } from "./definitions";

describe("atlas progress", () => {
  it("exposes the full chapter range", () => {
    expect(ATLAS_MAX).toBe(CHAPTERS[CHAPTERS.length - 1].range[1]);
    expect(ATLAS_MAX).toBeGreaterThan(1);
  });

  it("maps chapter boundaries to active indices", () => {
    expect(getActiveChapterIndex(0)).toBe(0);
    expect(getActiveChapterIndex(0.5)).toBe(3);
    expect(getActiveChapterIndex(1.1)).toBe(6);
    expect(getActiveChapterIndex(ATLAS_MAX)).toBe(CHAPTERS.length - 1);
  });

  it("clamps atlas progress", () => {
    expect(clampAtlasProgress(-1)).toBe(0);
    expect(clampAtlasProgress(99)).toBe(ATLAS_MAX);
  });
});