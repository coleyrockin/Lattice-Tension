import { useEffect, useRef, useState } from "react";
import { useExperienceStore } from "../experience/store";

type Ripple = {
  id: number;
  x: number;
  y: number;
  strength: number;
};

/**
 * Fading rings at the pointer — visible proof that drag and touch leave
 * traces on the aether. Spawns while dragging; intensity scales with imprint.
 */
export function ResonanceImprint() {
  // Only `drag.active` and `reducedMotion` gate the rAF loop — subscribe to
  // those. Pointer and resonance change every move/frame, so reading them via a
  // selector would re-render this whole ripple tree continuously; read them
  // imperatively inside the tick instead.
  const dragActive = useExperienceStore((s) => s.drag.active);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const impulse = useExperienceStore((s) => s.impulse);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);
  const lastSpawn = useRef(0);

  // Clicks echo in the DOM layer too: one full-strength ring at the pointer,
  // matching the shader-side touch ripple filed by the same impulse.
  useEffect(() => {
    if (!impulse || reducedMotion) return;
    const { pointer } = useExperienceStore.getState();
    const px = ((pointer.x + 1) / 2) * window.innerWidth;
    const py = ((1 - pointer.y) / 2) * window.innerHeight;
    const id = nextId.current++;
    setRipples((prev) => [...prev.slice(-11), { id, x: px, y: py, strength: 1 }]);
  }, [impulse, reducedMotion]);

  useEffect(() => {
    if (!dragActive || reducedMotion) return;

    let frame = 0;
    const tick = (now: number) => {
      if (document.hidden) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const { pointer, resonance } = useExperienceStore.getState();
      const interval = Math.max(90, 220 - resonance * 45);
      if (now - lastSpawn.current >= interval) {
        lastSpawn.current = now;
        const px = ((pointer.x + 1) / 2) * window.innerWidth;
        const py = ((1 - pointer.y) / 2) * window.innerHeight;
        const id = nextId.current++;
        const strength = 0.55 + Math.min(1, resonance / 2.2) * 0.45;
        setRipples((prev) => [...prev.slice(-11), { id, x: px, y: py, strength }]);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragActive, reducedMotion]);

  useEffect(() => {
    if (ripples.length === 0) return;
    const timer = window.setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [ripples]);

  if (ripples.length === 0) return null;

  return (
    <div className="resonance-imprint" aria-hidden="true">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="resonance-imprint__ring"
          style={{
            left: ripple.x,
            top: ripple.y,
            ["--ripple-strength" as string]: String(ripple.strength),
          }}
        />
      ))}
    </div>
  );
}
