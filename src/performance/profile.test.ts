import { describe, expect, it } from "vitest";
import { choosePerformanceProfile } from "./profile";

describe("performance profiles", () => {
  it("forces the low tier for reduced motion", () => {
    expect(
      choosePerformanceProfile({
        width: 1800,
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
        devicePixelRatio: 2,
        hardwareConcurrency: 16,
        deviceMemory: 16,
        reducedMotion: false,
      }).tier,
    ).toBe("high");
  });
});
