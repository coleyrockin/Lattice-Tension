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
  const drag = useExperienceStore((s) => s.drag);
  const pointer = useExperienceStore((s) => s.pointer);
  const resonance = useExperienceStore((s) => s.resonance);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);
  const lastSpawn = useRef(0);
  const pointerRef = useRef(pointer);

  pointerRef.current = pointer;

  useEffect(() => {
    if (!drag.active || reducedMotion) return;

    let frame = 0;
    const tick = (now: number) => {
      if (document.hidden) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const interval = Math.max(90, 220 - resonance * 45);
      if (now - lastSpawn.current >= interval) {
        lastSpawn.current = now;
        const { x, y } = pointerRef.current;
        const px = ((x + 1) / 2) * window.innerWidth;
        const py = ((1 - y) / 2) * window.innerHeight;
        const id = nextId.current++;
        const strength = 0.55 + Math.min(1, resonance / 2.2) * 0.45;
        setRipples((prev) => [...prev.slice(-11), { id, x: px, y: py, strength }]);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [drag.active, reducedMotion, resonance]);

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
