/* eslint-disable react-hooks/immutability -- R3F useFrame drives scene.background */
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { descent, frameSample, useExperienceStore } from "./store";

// scratch — avoid per-frame allocation
const ACCENT = new Color();

/** Lerp scene void color from the active chapter palette. */
export function BackgroundDriver() {
  const scene = useThree((state) => state.scene);
  const target = useRef(new Color("#020207"));
  const current = useRef(new Color("#020207"));

  useEffect(() => {
    scene.background = current.current;
  }, [scene]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const sample = frameSample.current ?? sampleExperience(descent.value);
    target.current.set(sample.palette.void);
    // the room warms with play: user resonance tips the void a few percent
    // toward the accent, then relaxes back as the imprint decays.
    const resonance = useExperienceStore.getState().resonance;
    if (resonance > 0.01) {
      ACCENT.set(sample.palette.accent);
      target.current.lerp(ACCENT, Math.min(0.08, resonance * 0.045));
    }
    current.current.lerp(target.current, 1 - Math.exp(-3.5 * dt));
    if (scene.background instanceof Color) {
      scene.background.copy(current.current);
    }
  });

  return null;
}