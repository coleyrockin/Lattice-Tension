'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_SIM, PRESET_CYCLE, PRESETS } from '@/aether/core/presets';
import { stopAll, tweenSim } from '@/aether/core/ease';
import type { Pointer, Preset, Pulse, Sim } from '@/aether/core/types';

export function useAether() {
  const [sim, setSim] = useState<Sim>(DEFAULT_SIM);
  const simRef = useRef(sim);
  useEffect(() => {
    simRef.current = sim;
  }, [sim]);

  const [pointer, setPointer] = useState<Pointer>({ x: 0, y: 0 });
  const [pulse, setPulse] = useState<Pulse>({ x: 0, y: 0, strength: 0 });
  const [audioOn, setAudioOn] = useState(false);
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode; osc: OscillatorNode } | null>(
    null,
  );

  const demoOff = useRef(false);
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearDemo = useCallback(() => {
    demoOff.current = true;
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
    stopAll();
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    demoTimers.current.push(id);
  }, []);

  const runDemo = useCallback(() => {
    demoOff.current = false;
    let i = 0;
    const step = () => {
      if (demoOff.current || i >= PRESET_CYCLE.length) return;
      const name = PRESET_CYCLE[i++];
      tweenSim(simRef.current, PRESETS[name], setSim, i === PRESET_CYCLE.length ? 2.2 : 1.5, () => {
        if (!demoOff.current && i < PRESET_CYCLE.length) schedule(step, 2200);
      });
    };
    schedule(step, 4000);
  }, [schedule]);

  useEffect(() => {
    runDemo();
    return () => {
      demoOff.current = true;
      demoTimers.current.forEach(clearTimeout);
      stopAll();
    };
  }, [runDemo]);

  useEffect(() => {
    const resetIdle = () => {
      clearDemo();
      runDemo();
    };
    const idleMs = 28000;
    let timer = setTimeout(resetIdle, idleMs);
    const poke = () => {
      clearTimeout(timer);
      timer = setTimeout(resetIdle, idleMs);
    };
    const events = ['mousemove', 'pointerdown', 'wheel', 'keydown'] as const;
    events.forEach((e) => window.addEventListener(e, poke, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, poke));
    };
  }, [clearDemo, runDemo]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      clearDemo();
      setPointer({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [clearDemo]);

  useEffect(() => {
    const el = document.getElementById('aether');
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      clearDemo();
      setSim((s) => ({
        ...s,
        tension: Math.max(0.08, Math.min(0.95, s.tension + e.deltaY * 0.0007)),
      }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clearDemo]);

  const setPreset = useCallback(
    (name: Preset) => {
      clearDemo();
      tweenSim(simRef.current, PRESETS[name], setSim);
    },
    [clearDemo],
  );

  const pluck = useCallback(
    (clientX: number, clientY: number) => {
      clearDemo();
      const x = (clientX / window.innerWidth - 0.5) * 2;
      const y = (clientY / window.innerHeight - 0.5) * 2;
      setPulse({ x, y, strength: 1 });
      setTimeout(() => setPulse((p) => ({ ...p, strength: 0 })), 480);
    },
    [clearDemo],
  );

  const toggleAudio = useCallback(() => {
    if (!audioRef.current) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 48;
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioRef.current = { ctx, gain, osc };
    }
    const { ctx, gain, osc } = audioRef.current;
    if (audioOn) {
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      setAudioOn(false);
    } else {
      if (ctx.state === 'suspended') void ctx.resume();
      gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 0.4);
      setAudioOn(true);
    }
    osc.frequency.linearRampToValueAtTime(40 + sim.tension * 90, ctx.currentTime + 0.5);
  }, [audioOn, sim.tension]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioOn) return;
    a.gain.gain.linearRampToValueAtTime(0.012 + sim.tension * 0.02, a.ctx.currentTime + 0.35);
    a.osc.frequency.linearRampToValueAtTime(40 + sim.tension * 90, a.ctx.currentTime + 0.35);
  }, [sim.tension, audioOn]);

  return { sim, pointer, pulse, audioOn, setPreset, pluck, toggleAudio };
}