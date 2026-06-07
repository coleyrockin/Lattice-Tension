export const LATTICE_CONFIG = {
  layers: 7,
  strands: 10,
  periods: 8,
  flowCount: 180,
  sparkCount: 48,
  starCount: 2200,
} as const;

export const AUTO_DEMO = {
  startDelayMs: 5200,
  stepGapMs: 2400,
  releaseDuration: 2.4,
  stepDuration: 1.6,
  presetEase: 'power2.inOut' as const,
  releaseEase: 'power2.out' as const,
} as const;