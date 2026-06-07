import { gsap } from 'gsap';
import type { SimParams } from '@/lib/tension/types';

const activeTargets = new Set<object>();

export function killAllAnimations() {
  activeTargets.forEach((t) => gsap.killTweensOf(t));
  activeTargets.clear();
}

export function animateToPreset(
  from: SimParams,
  target: SimParams,
  onUpdate: (params: SimParams) => void,
  options?: { duration?: number; ease?: string; onComplete?: () => void },
) {
  const state = { ...from };
  activeTargets.add(state);
  gsap.to(state, {
    tension: target.tension,
    speed: target.speed,
    pullStrength: target.pullStrength,
    duration: options?.duration ?? 1.45,
    ease: options?.ease ?? 'power2.inOut',
    onUpdate() {
      onUpdate({ ...state });
    },
    onComplete() {
      activeTargets.delete(state);
      options?.onComplete?.();
    },
  });
}