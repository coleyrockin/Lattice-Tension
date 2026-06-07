import type { SimParams } from '@/lib/tension/types';

const activeFrames = new Set<number>();

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

export function killAllAnimations() {
  activeFrames.forEach((id) => cancelAnimationFrame(id));
  activeFrames.clear();
}

export function animateToPreset(
  from: SimParams,
  target: SimParams,
  onUpdate: (params: SimParams) => void,
  options?: { duration?: number; ease?: string; onComplete?: () => void },
) {
  const duration = (options?.duration ?? 1.45) * 1000;
  const start = performance.now();
  const origin = { ...from };

  const tick = (now: number) => {
    const raw = Math.min(1, (now - start) / duration);
    const t = smoothstep(raw);
    onUpdate({
      tension: origin.tension + (target.tension - origin.tension) * t,
      speed: origin.speed + (target.speed - origin.speed) * t,
      pullStrength: origin.pullStrength + (target.pullStrength - origin.pullStrength) * t,
    });
    if (raw < 1) {
      const id = requestAnimationFrame(tick);
      activeFrames.add(id);
    } else {
      options?.onComplete?.();
    }
  };

  const id = requestAnimationFrame(tick);
  activeFrames.add(id);
}