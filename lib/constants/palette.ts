export const PALETTE = {
  void: '#010108',
  light: '#f8f4ff',
  gold: '#ffd54a',
  lavender: '#a78bfa',
  cyan: '#5eead4',
} as const;

export const ATMOSPHERE = {
  coherent: { bg: '#010108', accent: '#5eead4', emissive: '#67e8f9' },
  strain: { bg: '#08040f', accent: '#fbbf24', emissive: '#fcd34d' },
  peak: { bg: '#050208', accent: '#fef3c7', emissive: '#fffbeb' },
  release: { bg: '#06040c', accent: '#f9a8d4', emissive: '#fbcfe8' },
} as const;