import { ATMOSPHERE } from '@/lib/constants/palette';
import type { TensionPreset } from '@/lib/tension/types';

export { ATMOSPHERE };

export type AtmospherePreset = {
  bloom: number;
  bloomRadius: number;
  bloomThreshold: number;
  grain: number;
  chromatic: number;
  fogNear: number;
  fogFar: number;
  cameraOrbit: number;
  cameraJitter: number;
};

export const ATMOSPHERE_PRESETS: Record<TensionPreset, AtmospherePreset> = {
  coherent: {
    bloom: 1.35,
    bloomRadius: 0.32,
    bloomThreshold: 0.1,
    grain: 0.018,
    chromatic: 0.0006,
    fogNear: 10,
    fogFar: 24,
    cameraOrbit: 0.065,
    cameraJitter: 0,
  },
  strain: {
    bloom: 1.85,
    bloomRadius: 0.42,
    bloomThreshold: 0.07,
    grain: 0.028,
    chromatic: 0.0011,
    fogNear: 11,
    fogFar: 20,
    cameraOrbit: 0.095,
    cameraJitter: 0.35,
  },
  peak: {
    bloom: 2.45,
    bloomRadius: 0.55,
    bloomThreshold: 0.05,
    grain: 0.042,
    chromatic: 0.0018,
    fogNear: 8,
    fogFar: 16,
    cameraOrbit: 0.12,
    cameraJitter: 1,
  },
  release: {
    bloom: 1.15,
    bloomRadius: 0.28,
    bloomThreshold: 0.12,
    grain: 0.014,
    chromatic: 0.0004,
    fogNear: 12,
    fogFar: 28,
    cameraOrbit: 0.05,
    cameraJitter: 0,
  },
};

export function lerpAtmospherePreset(tension: number): AtmospherePreset {
  const t = Math.max(0, Math.min(1, tension));
  let from: AtmospherePreset = ATMOSPHERE_PRESETS.coherent;
  let to: AtmospherePreset = ATMOSPHERE_PRESETS.strain;
  let w = t / 0.45;

  if (t >= 0.45 && t < 0.72) {
    from = ATMOSPHERE_PRESETS.strain;
    to = ATMOSPHERE_PRESETS.peak;
    w = (t - 0.45) / 0.27;
  } else if (t >= 0.72) {
    from = ATMOSPHERE_PRESETS.peak;
    to = ATMOSPHERE_PRESETS.release;
    w = (t - 0.72) / 0.28;
  }

  const lerp = (a: number, b: number) => a + (b - a) * w;
  return {
    bloom: lerp(from.bloom, to.bloom),
    bloomRadius: lerp(from.bloomRadius, to.bloomRadius),
    bloomThreshold: lerp(from.bloomThreshold, to.bloomThreshold),
    grain: lerp(from.grain, to.grain),
    chromatic: lerp(from.chromatic, to.chromatic),
    fogNear: lerp(from.fogNear, to.fogNear),
    fogFar: lerp(from.fogFar, to.fogFar),
    cameraOrbit: lerp(from.cameraOrbit, to.cameraOrbit),
    cameraJitter: lerp(from.cameraJitter, to.cameraJitter),
  };
}