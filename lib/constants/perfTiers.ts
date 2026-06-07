import type { RenderTier } from '@/engine/renderer/capability';

export type PerfProfile = {
  flowCount: number;
  starCount: number;
  bloomScale: number;
  lineWidth: number;
  nebulaSegments: number;
  macroArcs: boolean;
  postFx: boolean;
  maxDpr: number;
};

export const PERF_TIERS: Record<RenderTier, PerfProfile> = {
  A: {
    flowCount: 280,
    starCount: 1400,
    bloomScale: 1,
    lineWidth: 3.2,
    nebulaSegments: 56,
    macroArcs: true,
    postFx: true,
    maxDpr: 2,
  },
  B: {
    flowCount: 150,
    starCount: 700,
    bloomScale: 0.7,
    lineWidth: 2.4,
    nebulaSegments: 36,
    macroArcs: true,
    postFx: true,
    maxDpr: 1.5,
  },
  C: {
    flowCount: 60,
    starCount: 320,
    bloomScale: 0.35,
    lineWidth: 1.8,
    nebulaSegments: 24,
    macroArcs: false,
    postFx: false,
    maxDpr: 1,
  },
};

export function getPerfProfile(tier: RenderTier): PerfProfile {
  return PERF_TIERS[tier];
}