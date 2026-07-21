export type PerformanceTier = "high" | "medium" | "low";

export type PerformanceProfile = {
  tier: PerformanceTier;
  maxDpr: number;
  particleCount: number;
  nodeCount: number;
  membraneSegments: number;
  postprocessing: boolean;
  depthOfField: boolean;
  antialias: boolean;
};

export function arePerformanceProfilesEqual(
  left: PerformanceProfile | null,
  right: PerformanceProfile | null,
): boolean {
  if (left === right) return true;
  if (!left || !right) return false;

  return (
    left.tier === right.tier &&
    left.maxDpr === right.maxDpr &&
    left.particleCount === right.particleCount &&
    left.nodeCount === right.nodeCount &&
    left.membraneSegments === right.membraneSegments &&
    left.postprocessing === right.postprocessing &&
    left.depthOfField === right.depthOfField &&
    left.antialias === right.antialias
  );
}

type ProfileInput = {
  width: number;
  height: number;
  devicePixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  reducedMotion: boolean;
};

export function choosePerformanceProfile(
  input: ProfileInput,
): PerformanceProfile {
  const isNarrowPortrait = input.width < 900 && input.height > input.width;

  if (
    input.reducedMotion ||
    input.width < 700 ||
    isNarrowPortrait ||
    input.hardwareConcurrency <= 4 ||
    (input.deviceMemory !== undefined && input.deviceMemory <= 4)
  ) {
    return {
      tier: "low",
      maxDpr: 1,
      particleCount: 320,
      nodeCount: 20,
      membraneSegments: 42,
      postprocessing: false,
      depthOfField: false,
      antialias: false,
    };
  }

  if (
    input.width < 1200 ||
    input.hardwareConcurrency <= 8 ||
    (input.deviceMemory !== undefined && input.deviceMemory <= 8)
  ) {
    return {
      tier: "medium",
      maxDpr: 1.35,
      particleCount: 650,
      nodeCount: 28,
      membraneSegments: 64,
      postprocessing: true,
      depthOfField: false,
      antialias: true,
    };
  }

  return {
    tier: "high",
    // DPR is a quadratic multiplier over every full-screen raymarch pass AND
    // the bloom chain. 1.4 vs 1.75 is ~36% fewer fragments; the emissive glow +
    // ACES/bloom hide the resolution drop almost entirely on a DPR-2 display.
    maxDpr: Math.min(1.4, input.devicePixelRatio),
    particleCount: 1100,
    nodeCount: 34,
    membraneSegments: 84,
    postprocessing: true,
    depthOfField: true,
    antialias: true,
  };
}

export function detectPerformanceProfile(
  reducedMotion: boolean,
): PerformanceProfile {
  const navigatorWithMemory = navigator as Navigator & {
    deviceMemory?: number;
  };

  return choosePerformanceProfile({
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    deviceMemory: navigatorWithMemory.deviceMemory,
    reducedMotion,
  });
}
