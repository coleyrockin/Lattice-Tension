import { ATMOSPHERE } from '@/lib/constants/palette';

export type AtmosphereState = {
  bg: string;
  accent: string;
  emissive: string;
  secondary: string;
  fogNear: number;
  fogFar: number;
};

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

function lerpHex(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t,
  );
}

export function getAtmosphere(tension: number): AtmosphereState {
  const t = Math.max(0, Math.min(1, tension));
  let from: (typeof ATMOSPHERE)[keyof typeof ATMOSPHERE] = ATMOSPHERE.coherent;
  let to: (typeof ATMOSPHERE)[keyof typeof ATMOSPHERE] = ATMOSPHERE.strain;
  let w = t / 0.45;

  if (t >= 0.45 && t < 0.72) {
    from = ATMOSPHERE.strain;
    to = ATMOSPHERE.peak;
    w = (t - 0.45) / 0.27;
  } else if (t >= 0.72) {
    from = ATMOSPHERE.peak;
    to = ATMOSPHERE.release;
    w = (t - 0.72) / 0.28;
  }

  return {
    bg: lerpHex(from.bg, to.bg, w),
    accent: lerpHex(from.accent, to.accent, w),
    emissive: lerpHex(from.emissive, to.emissive, w),
    secondary: t < 0.5 ? '#c084fc' : '#fda4af',
    fogNear: 10 + t * 4,
    fogFar: 22 + t * 14,
  };
}

export function nearestPreset(tension: number): keyof typeof ATMOSPHERE {
  const presets: { key: keyof typeof ATMOSPHERE; t: number }[] = [
    { key: 'coherent', t: 0.18 },
    { key: 'strain', t: 0.58 },
    { key: 'peak', t: 0.88 },
    { key: 'release', t: 0.32 },
  ];
  return presets.reduce((best, p) =>
    Math.abs(p.t - tension) < Math.abs(best.t - tension) ? p : best,
  ).key;
}