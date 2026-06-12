import { create } from "zustand";
import type { PerformanceProfile } from "../performance/profile";

/**
 * Smoothed descent — a single eased value the whole scene reads from so the
 * camera dolly, lattice travel, crossfade, palette and structure all glide
 * together instead of snapping per scroll tick. Updated once per frame by
 * <DescentDriver/>; kept as a plain module ref to avoid per-frame re-renders.
 */
export const descent = { value: 0, target: 0 };

export type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

export type InteractionImpulse = {
  nodeId: number;
  startedAt: number;
};

export type FragmentState = {
  nodeId: number;
  text: string;
};

type ExperienceStore = {
  ready: boolean;
  scrollProgress: number;
  pointer: PointerState;
  drag: { x: number; y: number; active: boolean };
  impulse: InteractionImpulse | null;
  selectedFragment: FragmentState | null;
  audioEnabled: boolean;
  reducedMotion: boolean;
  profile: PerformanceProfile | null;
  resonance: number;
  autoplay: boolean;
  telemetryOpen: boolean;
  manualTension: number | null;
  setReady: (ready: boolean) => void;
  setScrollProgress: (progress: number) => void;
  setPointer: (pointer: PointerState) => void;
  setDrag: (drag: { x: number; y: number; active: boolean }) => void;
  fireImpulse: (nodeId: number) => void;
  setSelectedFragment: (fragment: FragmentState | null) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setProfile: (profile: PerformanceProfile) => void;
  addResonance: (delta: number) => void;
  setAutoplay: (autoplay: boolean) => void;
  setTelemetryOpen: (open: boolean) => void;
  setManualTension: (val: number | null) => void;
};

export const useExperienceStore = create<ExperienceStore>((set) => ({
  ready: false,
  scrollProgress: 0,
  pointer: { x: 0, y: 0, active: false },
  drag: { x: 0, y: 0, active: false },
  impulse: null,
  selectedFragment: null,
  audioEnabled: false,
  reducedMotion: false,
  profile: null,
  resonance: 0,
  autoplay: false,
  telemetryOpen: false,
  manualTension: null,
  setReady: (ready) => set({ ready }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setPointer: (pointer) => set({ pointer }),
  setDrag: (drag) => set({ drag }),
  fireImpulse: (nodeId) =>
    set({ impulse: { nodeId, startedAt: performance.now() } }),
  setSelectedFragment: (selectedFragment) => set({ selectedFragment }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setProfile: (profile) => set({ profile }),
  addResonance: (delta) =>
    set((state) => ({ resonance: Math.max(0, Math.min(2.2, state.resonance + delta)) })),
  setAutoplay: (autoplay) => set({ autoplay }),
  setTelemetryOpen: (telemetryOpen) => set({ telemetryOpen }),
  setManualTension: (manualTension) => set({ manualTension }),
}));
