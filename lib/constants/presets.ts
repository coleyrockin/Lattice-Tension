import type { SimParams, TensionPreset } from '@/lib/tension/types';

export const PRESETS: Record<TensionPreset, SimParams> = {
  coherent: { tension: 0.18, speed: 0.45, pullStrength: 0.1 },
  strain: { tension: 0.58, speed: 0.85, pullStrength: 0.38 },
  peak: { tension: 0.88, speed: 1.2, pullStrength: 0.65 },
  release: { tension: 0.28, speed: 0.55, pullStrength: 0.15 },
};

export const PRESET_ORDER: TensionPreset[] = ['coherent', 'strain', 'peak', 'release'];

export const DEFAULT_SIM: SimParams = PRESETS.coherent;