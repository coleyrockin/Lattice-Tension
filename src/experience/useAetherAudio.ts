import { useEffect, useRef } from "react";
import type { PerformanceTier } from "../performance/profile";
import { organismController, type OrganismSnapshot } from "../simulation/organismController";
import { useExperienceStore } from "./store";

const BASE_FREQUENCIES = [48, 72, 96] as const;
const BASE_DETUNES = [0, 7, -9] as const;

type AudioVoice = {
  oscillator: OscillatorNode;
  gain: GainNode;
  baseFrequency: number;
  index: number;
};

type AudioGraph = {
  context: AudioContext;
  masterGain: GainNode;
  droneGain: GainNode;
  filter: BiquadFilterNode;
  voices: AudioVoice[];
  raf: number;
  closing: boolean;
};

function setGainTarget(graph: AudioGraph, gain: GainNode, value: number, timeConstant: number) {
  if (graph.context.state === "closed") return;
  gain.gain.cancelScheduledValues(graph.context.currentTime);
  gain.gain.setTargetAtTime(value, graph.context.currentTime, timeConstant);
}

function disconnectVoice(voice: AudioVoice) {
  voice.oscillator.disconnect();
  voice.gain.disconnect();
}

function createVoice(graph: AudioGraph, index: number, fadeIn: boolean) {
  const oscillator = graph.context.createOscillator();
  const gain = graph.context.createGain();
  const voice: AudioVoice = {
    oscillator,
    gain,
    baseFrequency: BASE_FREQUENCIES[index]!,
    index,
  };

  oscillator.type = index === 2 ? "triangle" : "sine";
  oscillator.frequency.value = voice.baseFrequency;
  oscillator.detune.value = BASE_DETUNES[index]!;
  gain.gain.value = fadeIn ? 0 : 1;
  oscillator.connect(gain);
  gain.connect(graph.filter);
  oscillator.start();
  oscillator.onended = () => disconnectVoice(voice);

  if (fadeIn) setGainTarget(graph, gain, 1, 0.06);
  return voice;
}

function retireVoice(graph: AudioGraph, voice: AudioVoice) {
  const now = graph.context.currentTime;
  setGainTarget(graph, voice.gain, 0, 0.025);
  voice.oscillator.stop(now + 0.12);
}

function applyPerformanceTier(graph: AudioGraph, tier: PerformanceTier, fade: boolean) {
  const desiredVoiceCount = tier === "low" ? 2 : 3;

  while (graph.voices.length < desiredVoiceCount) {
    graph.voices.push(createVoice(graph, graph.voices.length, fade));
  }

  while (graph.voices.length > desiredVoiceCount) {
    const voice = graph.voices.pop();
    if (voice) retireVoice(graph, voice);
  }
}

function createAudioGraph(AudioContextCtor: typeof AudioContext, tier: PerformanceTier) {
  const context = new AudioContextCtor();

  try {
    const masterGain = context.createGain();
    const droneGain = context.createGain();
    const filter = context.createBiquadFilter();
    const graph: AudioGraph = {
      context,
      masterGain,
      droneGain,
      filter,
      voices: [],
      raf: 0,
      closing: false,
    };

    masterGain.gain.value = 0;
    droneGain.gain.value = 0;
    filter.type = "lowpass";
    filter.frequency.value = 330;
    filter.Q.value = 0.7;
    filter.connect(droneGain);
    droneGain.connect(masterGain);
    masterGain.connect(context.destination);
    applyPerformanceTier(graph, tier, false);
    setGainTarget(graph, droneGain, 0.024, 0.34);
    return graph;
  } catch (error) {
    if (context.state !== "closed") void context.close().catch(() => undefined);
    throw error;
  }
}

function closeAudioGraph(graph: AudioGraph) {
  if (graph.closing) return;
  graph.closing = true;
  cancelAnimationFrame(graph.raf);
  setGainTarget(graph, graph.masterGain, 0, 0.025);

  window.setTimeout(() => {
    graph.voices.forEach((voice) => {
      try {
        voice.oscillator.stop();
      } catch {
        disconnectVoice(voice);
      }
    });
    if (graph.context.state !== "closed") {
      void graph.context.close().catch(() => undefined);
    }
  }, 140);
}

async function resumeAudioGraph(graph: AudioGraph) {
  if (graph.closing || graph.context.state === "closed") return false;

  try {
    if (graph.context.state !== "running") await graph.context.resume();
    return !graph.closing && graph.context.state === "running";
  } catch {
    return false;
  }
}

function playContactTone(graph: AudioGraph, snapshot: OrganismSnapshot) {
  const oscillator = graph.context.createOscillator();
  const gain = graph.context.createGain();
  const now = graph.context.currentTime;
  const pitchSeed = (snapshot.interactionId * 97) % 140;
  const f0 = 330 + pitchSeed + snapshot.energy * 125 + snapshot.contactOrigin[1] * 28;
  const amplitude = Math.min(0.052, 0.016 + snapshot.resonance * 0.022 + snapshot.energy * 0.014);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(Math.max(180, f0), now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(110, f0 * 0.56), now + 0.28);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(amplitude, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0002, now + 0.52);
  oscillator.connect(gain);
  gain.connect(graph.masterGain);
  oscillator.start(now);
  oscillator.stop(now + 0.56);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}

/** Opt-in liquid drone and contact tones, derived from the same snapshot as light. */
export function useAestherAudio() {
  const graphRef = useRef<AudioGraph | null>(null);
  const tierRef = useRef<PerformanceTier>("high");
  const audioEnabled = useExperienceStore((state) => state.audioEnabled);
  const setAudioEnabled = useExperienceStore((state) => state.setAudioEnabled);
  const tier = useExperienceStore((state) => state.profile?.tier ?? "high");

  useEffect(() => {
    tierRef.current = tier;
    const graph = graphRef.current;
    if (!graph || graph.closing) return;

    try {
      applyPerformanceTier(graph, tier, true);
    } catch {
      setGainTarget(graph, graph.masterGain, 0, 0.01);
      setAudioEnabled(false);
    }
  }, [setAudioEnabled, tier]);

  useEffect(() => {
    if (!audioEnabled) {
      const graph = graphRef.current;
      graphRef.current = null;
      if (graph) closeAudioGraph(graph);
      return;
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      setAudioEnabled(false);
      return;
    }

    let graph: AudioGraph;
    try {
      graph = createAudioGraph(AudioContextCtor, tierRef.current);
    } catch {
      setAudioEnabled(false);
      return;
    }

    graphRef.current = graph;
    let disposed = false;
    let lastInteractionId = organismController.snapshot.interactionId;

    const disableAfterFailure = () => {
      if (disposed || graph.closing) return;
      setGainTarget(graph, graph.masterGain, 0, 0.01);
      setAudioEnabled(false);
    };

    const ensureRunning = () => {
      void resumeAudioGraph(graph).then((running) => {
        if (disposed || graph.closing) return;
        if (!running) {
          disableAfterFailure();
          return;
        }

        lastInteractionId = organismController.snapshot.interactionId;
        setGainTarget(graph, graph.masterGain, document.hidden ? 0 : 1, document.hidden ? 0.015 : 0.08);
      });
    };

    const onVisibilityChange = () => {
      lastInteractionId = organismController.snapshot.interactionId;
      if (document.hidden) {
        setGainTarget(graph, graph.masterGain, 0, 0.015);
      } else {
        ensureRunning();
      }
    };

    const tick = () => {
      if (graph.closing) return;
      const snapshot = organismController.snapshot;

      if (document.hidden || graph.context.state !== "running") {
        lastInteractionId = snapshot.interactionId;
      } else {
        if (snapshot.interactionId !== lastInteractionId) {
          lastInteractionId = snapshot.interactionId;
          playContactTone(graph, snapshot);
        }

        const slosh = Math.hypot(...snapshot.slosh);
        const energy = Math.min(snapshot.energy, 1);
        const resonance = Math.min(snapshot.resonance, 1);
        graph.filter.frequency.setTargetAtTime(
          260 + energy * 740 + slosh * 180,
          graph.context.currentTime,
          0.12,
        );
        graph.filter.Q.setTargetAtTime(0.58 + resonance * 1.15, graph.context.currentTime, 0.16);
        graph.droneGain.gain.setTargetAtTime(
          0.019 + energy * 0.012 + resonance * 0.007,
          graph.context.currentTime,
          0.55,
        );

        graph.voices.forEach((voice) => {
          const ratio =
            1 +
            snapshot.strain * (voice.index + 1) * 0.06 +
            snapshot.slosh[voice.index % 3] * 0.035;
          voice.oscillator.frequency.setTargetAtTime(
            voice.baseFrequency * ratio,
            graph.context.currentTime,
            0.18,
          );
          voice.oscillator.detune.setTargetAtTime(
            Math.sin(snapshot.phase * (0.14 + voice.index * 0.025)) * (3 + resonance * 5),
            graph.context.currentTime,
            0.2,
          );
        });
      }

      graph.raf = requestAnimationFrame(tick);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    graph.raf = requestAnimationFrame(tick);
    if (document.hidden) {
      setGainTarget(graph, graph.masterGain, 0, 0.015);
    } else {
      ensureRunning();
    }

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (graphRef.current === graph) graphRef.current = null;
      closeAudioGraph(graph);
    };
  }, [audioEnabled, setAudioEnabled]);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
