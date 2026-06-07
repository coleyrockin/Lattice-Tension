export const PALETTE = {
  void: '#000000',
  light: '#f8f4ff',
  gold: '#facc15',
  lavender: '#c084fc',
} as const;

export const ATMOSPHERE = {
  coherent: { bg: '#0a0618', accent: '#7dd3fc', emissive: '#7dd3fc' },
  strain: { bg: '#1a0f1e', accent: '#f59e0b', emissive: '#facc15' },
  peak: { bg: '#0d0008', accent: '#fef08a', emissive: '#fef08a' },
  release: { bg: '#120a14', accent: '#fda4af', emissive: '#fda4af' },
} as const;