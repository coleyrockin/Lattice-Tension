import type { Sim } from '@/aether/core/types';

const active = new Set<number>();

export function stopAll() {
  active.forEach((id) => cancelAnimationFrame(id));
  active.clear();
}

export function tweenSim(
  from: Sim,
  to: Sim,
  onUpdate: (s: Sim) => void,
  duration = 1.4,
  onDone?: () => void,
) {
  const start = performance.now();
  const ms = duration * 1000;

  const tick = (now: number) => {
    const raw = Math.min(1, (now - start) / ms);
    const t = raw * raw * (3 - 2 * raw);
    onUpdate({
      tension: from.tension + (to.tension - from.tension) * t,
      speed: from.speed + (to.speed - from.speed) * t,
    });
    if (raw < 1) {
      const id = requestAnimationFrame(tick);
      active.add(id);
    } else {
      onDone?.();
    }
  };

  const id = requestAnimationFrame(tick);
  active.add(id);
}