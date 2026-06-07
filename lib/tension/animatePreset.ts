import { gsap } from 'gsap';
import type { SimParams } from '@/lib/tension/types';

export function animateToPreset(
  from: SimParams,
  target: SimParams,
  onUpdate: (params: SimParams) => void,
  options?: { duration?: number; ease?: string; onComplete?: () => void },
) {
  const state = { ...from };
  gsap.to(state, {
    tension: target.tension,
    speed: target.speed,
    pullStrength: target.pullStrength,
    duration: options?.duration ?? 1.45,
    ease: options?.ease ?? 'power2.inOut',
    onUpdate() {
      onUpdate({ ...state });
    },
    onComplete: options?.onComplete,
  });
}