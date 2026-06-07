import type { RenderTier } from '@/engine/renderer/capability';

export type PerfProfile = {
  flowCount: number;
  starCount: number;
  bloomScale: number;
  /** World-space filament radius */
  lineWidth: number;
  nebulaSegments: number;
  macroArcs: boolean;
  postFx: boolean;
  maxDpr: number;
  showNodes: boolean;
  showSparks: boolean;
};

export const PERF_TIERS: Record<RenderTier, PerfProfile> = {
  A: {
    flowCount: 180,
    starCount: 2200,
    bloomScale: 1.35,
    lineWidth: 0.095,
    nebulaSegments: 64,
    macroArcs: false,
    postFx: true,
    maxDpr: 2,
    showNodes: false,
    showSparks: false,
  },
  B: {
    flowCount: 100,
    starCount: 900,
    bloomScale: 1,
    lineWidth: 0.075,
    nebulaSegments: 40,
    macroArcs: false,
    postFx: true,
    maxDpr: 1.5,
    showNodes: false,
    showSparks: false,
  },
  C: {
    flowCount: 40,
    starCount: 400,
    bloomScale: 0.5,
    lineWidth: 0.055,
    nebulaSegments: 28,
    macroArcs: false,
    postFx: false,
    maxDpr: 1,
    showNodes: false,
    showSparks: false,
  },
};

export function getPerfProfile(tier: RenderTier): PerfProfile {
  return PERF_TIERS[tier];
}