import { useEffect, useRef } from "react";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "./store";

type AudioGraph = {
  context: AudioContext;
  gain: GainNode;
  filter: BiquadFilterNode;
  oscillators: OscillatorNode[];
  raf: number;
  closing: boolean;
};

function closeAudioGraph(graph: AudioGraph) {
  if (graph.closing) return;
  graph.closing = true;
  cancelAnimationFrame(graph.raf);

  if (graph.context.state !== "closed") {
    graph.gain.gain.setTargetAtTime(
      0,
      graph.context.currentTime,
      0.05,
    );
  }

  window.setTimeout(() => {
    graph.oscillators.forEach((oscillator) => oscillator.stop());
    if (graph.context.state !== "closed") {
      void graph.context.close();
    }
  }, 160);
}

export function useAetherAudio() {
  const graphRef = useRef<AudioGraph | null>(null);
  const audioEnabled = useExperienceStore((state) => state.audioEnabled);

  useEffect(() => {
    if (!audioEnabled) {
      const graph = graphRef.current;
      graphRef.current = null;
      if (graph) closeAudioGraph(graph);
      return;
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextCtor();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const baseFrequencies = [55, 82.5, 110, 165];
    const oscillators = baseFrequencies.map((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index % 2 === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index * 7 - 11;
      oscillator.connect(filter);
      oscillator.start();
      return oscillator;
    });

    filter.type = "lowpass";
    filter.frequency.value = 520;
    filter.Q.value = 0.65;
    filter.connect(gain);
    gain.gain.value = 0;
    gain.connect(context.destination);
    gain.gain.setTargetAtTime(0.035, context.currentTime, 0.25);

    const graph: AudioGraph = {
      context,
      gain,
      filter,
      oscillators,
      raf: 0,
      closing: false,
    };

    const tick = () => {
      const progress = useExperienceStore.getState().scrollProgress;
      const sampled = sampleExperience(progress);
      const tension = sampled.simulation.tension;
      const order = sampled.simulation.order;
      filter.frequency.setTargetAtTime(
        420 + tension * 950 + order * 360,
        context.currentTime,
        0.12,
      );
      oscillators.forEach((oscillator, index) => {
        const drift = Math.sin(context.currentTime * 0.16 + index) * 5;
        oscillator.detune.setTargetAtTime(
          drift + tension * (index + 1) * 5,
          context.currentTime,
          0.18,
        );
      });
      graph.raf = requestAnimationFrame(tick);
    };

    graph.raf = requestAnimationFrame(tick);
    graphRef.current = graph;

    return () => {
      if (graphRef.current === graph) graphRef.current = null;
      closeAudioGraph(graph);
    };
  }, [audioEnabled]);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
