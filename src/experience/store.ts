import { create } from "zustand";
import type { PerformanceProfile } from "../performance/profile";

/**
 * React state is deliberately reserved for application-level state. The living
 * organism runs outside React at 120 Hz in `OrganismController`.
 */
type ExperienceStore = {
  ready: boolean;
  audioEnabled: boolean;
  reducedMotion: boolean;
  profile: PerformanceProfile | null;
  renderError: boolean;
  setReady: (ready: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setProfile: (profile: PerformanceProfile) => void;
  setRenderError: (failed: boolean) => void;
};

export const useExperienceStore = create<ExperienceStore>((set) => ({
  ready: false,
  audioEnabled: false,
  reducedMotion: false,
  profile: null,
  renderError: false,
  setReady: (ready) => set({ ready }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setProfile: (profile) => set({ profile }),
  setRenderError: (renderError) => set({ renderError }),
}));
