import type { Preset } from '@/aether/core/types';

export const PALETTE = {
  void: '#000000',
  text: '#e8e4f0',
  accent: '#67e8f9',
} as const;

export const STATE_COLOR: Record<Preset, string> = {
  coherent: '#5eead4',
  strain: '#fbbf24',
  peak: '#fef9c3',
  release: '#f9a8d4',
};

export const STATE_FOG: Record<Preset, string> = {
  coherent: '#061018',
  strain: '#120a08',
  peak: '#0a0804',
  release: '#100810',
};