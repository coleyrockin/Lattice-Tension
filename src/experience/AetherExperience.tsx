import { useEffect, useState } from "react";
import {
  arePerformanceProfilesEqual,
  detectPerformanceProfile,
} from "../performance/profile";
import { InterfaceOverlay } from "../interface/InterfaceOverlay";
import { organismController } from "../simulation/organismController";
import { ExperienceErrorBoundary } from "./ExperienceErrorBoundary";
import { ExperienceCanvas } from "./ExperienceCanvas";
import { useAestherAudio } from "./useAetherAudio";
import { useReducedMotionPreference } from "./useReducedMotion";
import { WebGLFallback } from "./WebGLFallback";
import { hasUsableWebGL } from "./webgl";
import { useExperienceStore } from "./store";

export function AestherExperience() {
  const reducedMotion = useReducedMotionPreference();
  const setReducedMotion = useExperienceStore((state) => state.setReducedMotion);
  const setProfile = useExperienceStore((state) => state.setProfile);
  const profile = useExperienceStore((state) => state.profile);
  const renderError = useExperienceStore((state) => state.renderError);
  const setRenderError = useExperienceStore((state) => state.setRenderError);
  const [webglAvailable] = useState(hasUsableWebGL);

  useAestherAudio();

  useEffect(() => {
    setReducedMotion(reducedMotion);
    const nextProfile = detectPerformanceProfile(reducedMotion);
    if (
      !arePerformanceProfilesEqual(
        useExperienceStore.getState().profile,
        nextProfile,
      )
    ) {
      setProfile(nextProfile);
    }
  }, [reducedMotion, setProfile, setReducedMotion]);

  useEffect(() => {
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const nextProfile = detectPerformanceProfile(reducedMotion);
        if (
          !arePerformanceProfilesEqual(
            useExperienceStore.getState().profile,
            nextProfile,
          )
        ) {
          setProfile(nextProfile);
        }
      }, 180);
    };

    window.addEventListener("resize", onResize);
    return () => {
      organismController.cancelContact();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [reducedMotion, setProfile]);

  if (!webglAvailable || renderError) {
    return <WebGLFallback />;
  }

  return (
    <ExperienceErrorBoundary onError={() => setRenderError(true)}>
      <main className="aesther">
        <div className="stage">
          {profile ? <ExperienceCanvas /> : null}
          <InterfaceOverlay />
        </div>
      </main>
    </ExperienceErrorBoundary>
  );
}
