import type { SimParams, TensionPreset } from '@/lib/tension/types';

export const PRESETS: Record<TensionPreset, SimParams> = {
  coherent: { tension: 0.18, speed: 0.55, pullStrength: 0.12 },
  strain: { tension: 0.58, speed: 1.05, pullStrength: 0.48 },
  peak: { tension: 0.88, speed: 1.55, pullStrength: 0.82 },
  release: { tension: 0.32, speed: 0.78, pullStrength: 0.22 },
};

export const PRESET_ORDER: TensionPreset[] = ['coherent', 'strain', 'peak', 'release'];

export const DEFAULT_SIM: SimParams = { tension: 0.62, speed: 0.95, pullStrength: 0.38 };