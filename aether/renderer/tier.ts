export type Tier = 'A' | 'B' | 'C';

export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'B';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'C';
  const mobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
  if (mobile) return 'B';
  if ('gpu' in navigator) return 'A';
  return 'B';
}

export function tierLabel(tier: Tier) {
  return tier === 'A' ? 'WebGPU' : tier === 'B' ? 'WebGL2' : 'Reduced';
}

export function raySteps(tier: Tier) {
  return tier === 'A' ? 110 : tier === 'B' ? 72 : 36;
}

export function maxDpr(tier: Tier) {
  return tier === 'A' ? 2 : tier === 'B' ? 1.5 : 1;
}