import { create } from "zustand";
import type { PerformanceProfile } from "../performance/profile";

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
  setReady: (ready: boolean) => void;
  setScrollProgress: (progress: number) => void;
  setPointer: (pointer: PointerState) => void;
  setDrag: (drag: { x: number; y: number; active: boolean }) => void;
  fireImpulse: (nodeId: number) => void;
  setSelectedFragment: (fragment: FragmentState | null) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setProfile: (profile: PerformanceProfile) => void;
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
}));
