'use client';

import { useEffect, useState, useCallback, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import type { MouseState, PulseState, SimParams } from '@/lib/tension/types';

export function useTensionInput(
  setSimParams: React.Dispatch<React.SetStateAction<SimParams>>,
  onInteract?: () => void,
) {
  const [mouse, setMouse] = useState<MouseState>({ x: 0, y: 0 });
  const lastMouseRef = useRef<MouseState>({ x: 0, y: 0 });
  const [burst, setBurst] = useState(0);
  const [pulse, setPulse] = useState<PulseState>({ x: 0, y: 0, strength: 0 });
  const wheelTensionRef = useRef(0.62);

  const interact = useCallback(() => {
    onInteract?.();
  }, [onInteract]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      interact();
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      const dx = x - lastMouseRef.current.x;
      const dy = y - lastMouseRef.current.y;
      const vel = Math.min(1, Math.hypot(dx, dy) * 8);
      setBurst(vel);
      lastMouseRef.current = { x, y };
      setMouse({ x, y });

      if (vel > 0.1) {
        setTimeout(() => setBurst(0), 120);
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [interact]);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      interact();
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    const container = document.getElementById('lattice-container');
    if (!container) return;
    container.addEventListener('pointermove', onPointer);
    return () => container.removeEventListener('pointermove', onPointer);
  }, [interact]);

  useEffect(() => {
    let prevDist = 0;
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      interact();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (prevDist > 0) {
        const delta = (dist - prevDist) * 0.002;
        setSimParams((p) => ({
          ...p,
          tension: Math.max(0.1, Math.min(0.95, p.tension + delta)),
        }));
      }
      prevDist = dist;
    };
    const container = document.getElementById('lattice-container');
    if (!container) return;
    container.addEventListener('touchmove', onTouch, { passive: true });
    const reset = () => { prevDist = 0; };
    container.addEventListener('touchend', reset);
    return () => {
      container.removeEventListener('touchmove', onTouch);
      container.removeEventListener('touchend', reset);
    };
  }, [setSimParams, interact]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      interact();
      wheelTensionRef.current = Math.max(
        0.1,
        Math.min(0.95, wheelTensionRef.current + e.deltaY * 0.0008),
      );
      setSimParams((prev) => ({ ...prev, tension: wheelTensionRef.current }));
    };
    const container = document.getElementById('lattice-container');
    if (!container) return;
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [setSimParams, interact]);

  const handlePluck = useCallback(
    (e: ReactMouseEvent) => {
      interact();
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setPulse({ x, y, strength: 1.0 });
      setTimeout(() => setPulse((p) => ({ ...p, strength: 0 })), 550);
    },
    [interact],
  );

  return { mouse, burst, pulse, handlePluck };
}