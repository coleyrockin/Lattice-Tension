import type { Preset } from '@/aether/core/types';

export const PALETTE = {
  void: '#020408',
  text: '#e8e4f0',
  accent: '#67e8f9',
} as const;

export const STATE_COLOR: Record<Preset, string> = {
  coherent: '#4fd1c5',
  strain: '#f59e0b',
  peak: '#fef3c7',
  release: '#f0abfc',
};

export const STATE_FOG: Record<Preset, string> = {
  coherent: '#041018',
  strain: '#140c06',
  peak: '#0c0a04',
  release: '#100610',
};