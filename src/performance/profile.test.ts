import { describe, expect, it } from "vitest";
import {
  arePerformanceProfilesEqual,
  choosePerformanceProfile,
} from "./profile";

describe("performance profiles", () => {
  it("forces the low tier for reduced motion", () => {
    expect(
      choosePerformanceProfile({
        width: 1800,
        height: 1000,
        devicePixelRatio: 2,
        hardwareConcurrency: 16,
        deviceMemory: 16,
        reducedMotion: true,
      }),
    ).toMatchObject({
      tier: "low",
      postprocessing: false,
      depthOfField: false,
    });
  });

  it("uses the high tier for capable desktop devices", () => {
    expect(
      choosePerformanceProfile({
        width: 1800,
        height: 1000,
        devicePixelRatio: 2,
        hardwareConcurrency: 16,
        deviceMemory: 16,
        reducedMotion: false,
      }).tier,
    ).toBe("high");
  });

  it("uses the low tier for narrow portrait viewports", () => {
    expect(
      choosePerformanceProfile({
        width: 820,
        height: 1180,
        devicePixelRatio: 2,
        hardwareConcurrency: 12,
        deviceMemory: 16,
        reducedMotion: false,
      }),
    ).toMatchObject({
      tier: "low",
      maxDpr: 1,
      antialias: false,
      postprocessing: false,
    });
  });

  it("keeps a capable narrow landscape viewport on the medium tier", () => {
    expect(
      choosePerformanceProfile({
        width: 820,
        height: 600,
        devicePixelRatio: 2,
        hardwareConcurrency: 12,
        deviceMemory: 16,
        reducedMotion: false,
      }).tier,
    ).toBe("medium");
  });

  it("recognizes equivalent profiles without hiding meaningful changes", () => {
    const profile = choosePerformanceProfile({
      width: 1400,
      height: 900,
      devicePixelRatio: 2,
      hardwareConcurrency: 12,
      deviceMemory: 16,
      reducedMotion: false,
    });

    expect(arePerformanceProfilesEqual(profile, { ...profile })).toBe(true);
    expect(
      arePerformanceProfilesEqual(profile, {
        ...profile,
        maxDpr: profile.maxDpr - 0.1,
      }),
    ).toBe(false);
    expect(arePerformanceProfilesEqual(null, profile)).toBe(false);
  });
});
