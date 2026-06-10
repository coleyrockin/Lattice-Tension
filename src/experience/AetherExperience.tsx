import { useEffect, useMemo, useRef, useState } from "react";
import { CHAPTERS } from "../chapters/definitions";
import { detectPerformanceProfile } from "../performance/profile";
import { InterfaceOverlay } from "../interface/InterfaceOverlay";
import { ExperienceCanvas } from "./ExperienceCanvas";
import { useAetherAudio } from "./useAetherAudio";
import { useReducedMotionPreference } from "./useReducedMotion";
import { WebGLFallback } from "./WebGLFallback";
import { hasUsableWebGL } from "./webgl";
import { useExperienceStore } from "./store";

const SCROLL_MULTIPLIER = 5.75;

export function AetherExperience() {
  const reducedMotion = useReducedMotionPreference();
  const setReducedMotion = useExperienceStore((state) => state.setReducedMotion);
  const setProfile = useExperienceStore((state) => state.setProfile);
  const setScrollProgress = useExperienceStore(
    (state) => state.setScrollProgress,
  );
  const setPointer = useExperienceStore((state) => state.setPointer);
  const setDrag = useExperienceStore((state) => state.setDrag);
  const [webglAvailable] = useState(hasUsableWebGL);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const dragValue = useRef({ x: 0, y: 0 });

  useAetherAudio();

  useEffect(() => {
    setReducedMotion(reducedMotion);
    setProfile(detectPerformanceProfile(reducedMotion));
  }, [reducedMotion, setProfile, setReducedMotion]);

  useEffect(() => {
    const updateScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setScrollProgress(window.scrollY / maxScroll);
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    return () => {
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, [setScrollProgress]);

  const scrollHeight = useMemo(
    () => `${Math.max(CHAPTERS.length, SCROLL_MULTIPLIER) * 100}vh`,
    [],
  );

  if (!webglAvailable) {
    return <WebGLFallback />;
  }

  return (
    <div className="aether">
      <div
        className="stage"
        onPointerMove={(event) => {
          const x = (event.clientX / window.innerWidth) * 2 - 1;
          const y = -((event.clientY / window.innerHeight) * 2 - 1);
          setPointer({ x, y, active: true });

          if (dragOrigin.current) {
            dragValue.current = {
              x: (event.clientX - dragOrigin.current.x) / window.innerWidth,
              y: (event.clientY - dragOrigin.current.y) / window.innerHeight,
            };
            setDrag({ ...dragValue.current, active: true });
          }
        }}
        onPointerLeave={() => setPointer({ x: 0, y: 0, active: false })}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-aether-ui]")) return;
          dragOrigin.current = { x: event.clientX, y: event.clientY };
          (event.currentTarget as HTMLElement).setPointerCapture(
            event.pointerId,
          );
        }}
        onPointerUp={(event) => {
          dragOrigin.current = null;
          dragValue.current = { x: 0, y: 0 };
          setDrag({ x: 0, y: 0, active: false });
          (event.currentTarget as HTMLElement).releasePointerCapture(
            event.pointerId,
          );
        }}
        onPointerCancel={() => {
          dragOrigin.current = null;
          dragValue.current = { x: 0, y: 0 };
          setDrag({ x: 0, y: 0, active: false });
        }}
      >
        <ExperienceCanvas />
        <InterfaceOverlay />
      </div>
      <div className="scroll-depth" style={{ height: scrollHeight }} />
    </div>
  );
}
