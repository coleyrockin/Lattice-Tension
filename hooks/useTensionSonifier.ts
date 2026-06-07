'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PRESETS } from '@/lib/constants/presets';
import type { TensionPreset } from '@/lib/tension/types';

type Voice = {
  osc: OscillatorNode;
  gain: GainNode;
  preset: TensionPreset;
};

const VOICE_ORDER: TensionPreset[] = ['coherent', 'strain', 'peak', 'release'];
const VOICE_FREQ: Record<TensionPreset, number> = {
  coherent: 55,
  strain: 82,
  peak: 128,
  release: 44,
};
const VOICE_TYPE: Record<TensionPreset, OscillatorType> = {
  coherent: 'sine',
  strain: 'triangle',
  peak: 'sawtooth',
  release: 'sine',
};

function presetWeight(tension: number, preset: TensionPreset) {
  const target = PRESETS[preset].tension;
  const spread = preset === 'peak' ? 0.22 : 0.18;
  const d = Math.abs(tension - target);
  return Math.max(0, 1 - d / spread);
}

function normalizeWeights(weights: Record<TensionPreset, number>) {
  const sum = VOICE_ORDER.reduce((s, k) => s + weights[k], 0) || 1;
  for (const k of VOICE_ORDER) weights[k] /= sum;
}

export function useTensionSonifier(tension: number) {
  const [audioOn, setAudioOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const voicesRef = useRef<Voice[]>([]);

  const ensureGraph = useCallback(() => {
    if (ctxRef.current) return;

    const ctx = new (window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
    const master = ctx.createGain();
    master.gain.value = 0.001;

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 520;

    const comp = ctx.createDynamicsCompressor();
    master.connect(filt);
    filt.connect(comp);
    comp.connect(ctx.destination);

    const voices = VOICE_ORDER.map((preset) => {
      const osc = ctx.createOscillator();
      osc.type = VOICE_TYPE[preset];
      osc.frequency.value = VOICE_FREQ[preset];
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      return { osc, gain, preset };
    });

    ctxRef.current = ctx;
    masterRef.current = master;
    voicesRef.current = voices;
  }, []);

  const toggleAudio = useCallback(() => {
    ensureGraph();
    const ctx = ctxRef.current!;
    const master = masterRef.current!;

    if (audioOn) {
      master.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      setAudioOn(false);
    } else {
      if (ctx.state === 'suspended') void ctx.resume();
      master.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 0.55);
      setAudioOn(true);
    }
  }, [audioOn, ensureGraph]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const voices = voicesRef.current;
    const master = masterRef.current;
    if (!ctx || !voices.length || !master || !audioOn) return;

    const weights = {
      coherent: presetWeight(tension, 'coherent'),
      strain: presetWeight(tension, 'strain'),
      peak: presetWeight(tension, 'peak'),
      release: presetWeight(tension, 'release'),
    };
    normalizeWeights(weights);

    const now = ctx.currentTime;
    for (const voice of voices) {
      const w = weights[voice.preset];
      voice.gain.gain.linearRampToValueAtTime(0.004 + w * 0.028, now + 0.4);
      voice.osc.frequency.linearRampToValueAtTime(
        VOICE_FREQ[voice.preset] * (0.92 + tension * 0.35),
        now + 0.4,
      );
    }

    master.gain.linearRampToValueAtTime(0.014 + tension * 0.02, now + 0.35);
  }, [tension, audioOn]);

  return { audioOn, toggleAudio };
}