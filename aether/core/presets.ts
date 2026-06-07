import type { Preset, Sim } from '@/aether/core/types';

export const PRESETS: Record<Preset, Sim> = {
  coherent: { tension: 0.15, speed: 0.35 },
  strain: { tension: 0.55, speed: 0.75 },
  peak: { tension: 0.9, speed: 1.1 },
  release: { tension: 0.25, speed: 0.45 },
};

export const PRESET_CYCLE: Preset[] = ['coherent', 'strain', 'peak', 'release'];

export const DEFAULT_SIM: Sim = PRESETS.coherent;