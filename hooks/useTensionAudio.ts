'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type AudioNodes = { ctx: AudioContext; osc: OscillatorNode; gain: GainNode };

export function useTensionAudio(tension: number) {
  const [audioOn, setAudioOn] = useState(false);
  const audioRef = useRef<AudioNodes | null>(null);

  const toggleAudio = useCallback(() => {
    if (!audioRef.current) {
      const ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 39;

      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 360;

      const gain = ctx.createGain();
      gain.gain.value = 0.001;

      const comp = ctx.createDynamicsCompressor();
      osc.connect(filt);
      filt.connect(gain);
      gain.connect(comp);
      comp.connect(ctx.destination);
      osc.start();

      audioRef.current = { ctx, osc, gain };
    }

    const { ctx, gain } = audioRef.current;
    if (audioOn) {
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      setAudioOn(false);
    } else {
      if (ctx.state === 'suspended') void ctx.resume();
      gain.gain.linearRampToValueAtTime(0.014 + tension * 0.026, ctx.currentTime + 0.5);
      setAudioOn(true);
    }
  }, [audioOn, tension]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioOn) return;
    a.gain.gain.linearRampToValueAtTime(0.011 + tension * 0.03, a.ctx.currentTime + 0.55);
  }, [tension, audioOn]);

  return { audioOn, toggleAudio };
}