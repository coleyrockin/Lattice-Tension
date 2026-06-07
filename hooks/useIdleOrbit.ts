'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useIdleOrbit(onIdle: () => void, delayMs = 30000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onIdle, delayMs);
  }, [onIdle, delayMs]);

  useEffect(() => {
    reset();
    const events = ['mousemove', 'pointerdown', 'wheel', 'touchstart', 'keydown'] as const;
    for (const event of events) window.addEventListener(event, reset, { passive: true });
    return () => {
      for (const event of events) window.removeEventListener(event, reset);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reset]);
}