export const LATTICE_CONFIG = {
  layers: 7,
  strands: 10,
  periods: 8,
  flowCount: 260,
  sparkCount: 48,
  starCount: 1400,
} as const;

export const AUTO_DEMO = {
  startDelayMs: 1350,
  stepGapMs: 680,
  releaseDuration: 1.8,
  stepDuration: 0.95,
  presetEase: 'power2.inOut' as const,
  releaseEase: 'power2.out' as const,
} as const;