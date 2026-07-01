import type { ChapterSignature } from "./types";

/**
 * Each chapter's visual identity — one or two traits spike to ~1, the rest stay low.
 * Interpolated with a plateau so the chapter center reads pure, not a muddy blend.
 */
export const CHAPTER_SIGNATURES: Record<string, ChapterSignature> = {
  origin: {
    latticeReveal: 0.24,
    orbPresence: 1.30,
    twist: 0,
    swell: 0,
    veil: 0,
    crystalline: 0,
    fringe: 0,
    singularity: 0,
    quantum: 0,
    nebula: 0,
    echo: 0,
    interferenceLayer: 0,
    echoLayer: 0,
    shellThickness: 0.48,
    cellDensity: 0.35,
    absorption: 0.68,
    focalGlow: 0.52,
    chromatic: 0.02,
    orbDistortion: 0,
    interiorCrystalline: 0.35,
  },
};
