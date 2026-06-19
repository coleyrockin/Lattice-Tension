import { useEffect, useRef } from "react";
import { sampleExperience } from "../chapters/interpolate";
import { descent, useExperienceStore } from "./store";

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
    graph.gain.gain.setTargetAtTime(0, graph.context.currentTime, 0.05);
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
    const baseFrequencies = [55, 82.5, 110, 165, 220];
    const oscillators = baseFrequencies.map((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type =
        index % 3 === 0 ? "sine" : index % 3 === 1 ? "triangle" : "sawtooth";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index * 5 - 14;
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
    gain.gain.setTargetAtTime(0.04, context.currentTime, 0.25);
    void context.resume();

    const graph: AudioGraph = {
      context,
      gain,
      filter,
      oscillators,
      raf: 0,
      closing: false,
    };

    const tick = () => {
      if (document.hidden || graph.closing) {
        graph.raf = requestAnimationFrame(tick);
        return;
      }

      const progress = descent.value;
      const imprint = useExperienceStore.getState().resonance;
      const sampled = sampleExperience(progress);
      const sig = sampled.signature;
      const tension = sampled.simulation.tension;

      // 1. Biquad filter frequency and Q sweeps
      let targetFilterFreq = 280 +
        tension * 820 +
        sig.crystalline * 620 +
        sig.fringe * 380 +
        sig.nebula * 260 +
        imprint * 120;

      if (sig.singularity > 0.05) {
        // lowpass drone: sweep filter frequency lower as singularity increases
        targetFilterFreq = (targetFilterFreq - sig.singularity * 450) * (1.0 - 0.72 * Math.min(1.0, sig.singularity));
        targetFilterFreq = Math.max(110, targetFilterFreq);
      }

      if (sig.quantum > 0.05) {
        // open filter wide for high frequency noise
        targetFilterFreq += sig.quantum * 1800;
      }

      filter.frequency.setTargetAtTime(
        targetFilterFreq,
        context.currentTime,
        0.1,
      );

      // High resonance for Pattern (crystalline), medium for Singularity, low for others
      const targetQ = 0.45 + sig.crystalline * 1.85 + sig.singularity * 0.95;
      filter.Q.setTargetAtTime(
        targetQ,
        context.currentTime,
        0.14,
      );

      // 2. Oscillators updates
      oscillators.forEach((oscillator, index) => {
        // Dynamically change oscillator types based on active signatures
        let oscType: OscillatorType;
        if (sig.singularity > 0.3 || sig.twist > 0.3) {
          // Brooding drone: sawtooth
          oscType = "sawtooth";
        } else if (sig.crystalline > 0.3) {
          // Pattern: glittering crystal-clear sine & triangle
          oscType = index % 2 === 0 ? "sine" : "triangle";
        } else if (sig.quantum > 0.3) {
          // Quantum: triangle or sine
          oscType = "triangle";
        } else {
          // Default mix
          oscType = index % 3 === 0 ? "sine" : index % 3 === 1 ? "triangle" : "sawtooth";
        }

        if (oscillator.type !== oscType) {
          oscillator.type = oscType;
        }

        // Frequencies shifting based on signatures
        let targetFreq = baseFrequencies[index]!;
        if (sig.singularity > 0.05) {
          // brood drone: pitch down
          targetFreq = targetFreq * (1.0 - 0.36 * Math.min(1.0, sig.singularity));
        } else if (sig.crystalline > 0.05) {
          // crystal harmony: perfect octaves/fifth shifts
          targetFreq = targetFreq * (1.0 + 0.5 * sig.crystalline);
        } else if (sig.quantum > 0.05) {
          // quantum drift: high-frequency
          targetFreq = targetFreq * (2.2 + 3.8 * sig.quantum);
        }
        targetFreq += sig.fringe * index * 8;

        oscillator.frequency.setTargetAtTime(
          targetFreq,
          context.currentTime,
          0.2,
        );

        // Detunes shifting
        const drift = Math.sin(context.currentTime * (0.12 + index * 0.03)) * 6;
        let extraDetune = 0;
        if (sig.singularity > 0.05) {
          // thick detuned drone
          extraDetune = (index + 1) * 25 * sig.singularity;
        }
        if (sig.quantum > 0.05) {
          // high frequency drifting noise detunes
          extraDetune = Math.sin(context.currentTime * (3.8 + index * 1.2)) * 120 * sig.quantum;
        }

        oscillator.detune.setTargetAtTime(
          drift +
            tension * (index + 1) * 4 +
            sig.twist * (index + 2) * 3 +
            sig.quantum * index * 2.5 +
            sig.echo * 5 +
            imprint * (index % 2 ? 6 : 3) +
            extraDetune,
          context.currentTime,
          0.16,
        );
      });

      // Gain breathes with the chapter — singularity/collapse are louder,
      // nebula/aether are quieter. Range kept narrow (0.028–0.058) so it never
      // feels like a volume jump, only a presence shift.
      const targetGain =
        0.04 +
        sig.singularity * 0.018 +
        sig.twist * 0.008 -
        sig.nebula * 0.012 -
        sig.veil * 0.008 +
        imprint * 0.006;
      gain.gain.setTargetAtTime(
        Math.max(0.012, Math.min(0.065, targetGain)),
        context.currentTime,
        0.8,
      );

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