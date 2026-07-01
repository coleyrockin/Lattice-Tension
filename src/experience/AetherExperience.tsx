import { useEffect, useMemo, useRef, useState } from "react";
import {
  ATLAS_MAX,
  SCROLL_VH_PER_UNIT,
  atlasFromShareParam,
  atlasProgressFromScroll,
  getActiveChapterIndex,
  scrollYForAtlasProgress,
} from "../chapters/atlas";
import { detectPerformanceProfile } from "../performance/profile";
import { InterfaceOverlay } from "../interface/InterfaceOverlay";
import { ExperienceCanvas } from "./ExperienceCanvas";
import { useAetherAudio } from "./useAetherAudio";
import { useReducedMotionPreference } from "./useReducedMotion";
import { WebGLFallback } from "./WebGLFallback";
import { hasUsableWebGL } from "./webgl";
import { useExperienceStore } from "./store";

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
  const renderError = useExperienceStore((state) => state.renderError);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const dragValue = useRef({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });

  useAetherAudio();

  useEffect(() => {
    setReducedMotion(reducedMotion);
    setProfile(detectPerformanceProfile(reducedMotion));
  }, [reducedMotion, setProfile, setReducedMotion]);

  useEffect(() => {
    let resizeTimer = 0;
    const updateScroll = () => {
      setScrollProgress(atlasProgressFromScroll(window.scrollY));
    };
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        updateScroll();
        setProfile(detectPerformanceProfile(reducedMotion));
      }, 180);
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [reducedMotion, setProfile, setScrollProgress]);

  // load shared state from ?p= &r= (from share button)
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const params = new URLSearchParams(window.location.search);
    const p = parseFloat(params.get("p") || "");
    const r = parseFloat(params.get("r") || "");
    if (!isNaN(p)) {
      window.scrollTo({
        top: scrollYForAtlasProgress(atlasFromShareParam(p)),
        behavior: "auto",
      });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    if (!isNaN(r)) {
      useExperienceStore.setState({ resonance: Math.max(0, Math.min(2.2, r)) });
    }
  }, []);

  const scrollHeight = useMemo(
    () => `${ATLAS_MAX * SCROLL_VH_PER_UNIT}vh`,
    [],
  );

  if (!webglAvailable || renderError) {
    return <WebGLFallback />;
  }

  const resetDrag = () => {
    dragOrigin.current = null;
    dragValue.current = { x: 0, y: 0 };
    setDrag({ x: 0, y: 0, active: false });
  };

  return (
    <div className="aether">
      <div
        className="stage"
        onPointerMove={(event) => {
          const x = (event.clientX / window.innerWidth) * 2 - 1;
          const y = -((event.clientY / window.innerHeight) * 2 - 1);
          lastPointer.current = { x, y };
          setPointer({ x, y, active: true });

          if (dragOrigin.current) {
            dragValue.current = {
              x: (event.clientX - dragOrigin.current.x) / window.innerWidth,
              y: (event.clientY - dragOrigin.current.y) / window.innerHeight,
            };
            setDrag({ ...dragValue.current, active: true });
          }
        }}
        onPointerLeave={() => {
          setPointer({ x: 0, y: 0, active: false });
          resetDrag();
        }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-aether-ui]")) return;
          dragOrigin.current = { x: event.clientX, y: event.clientY };
          (event.currentTarget as HTMLElement).setPointerCapture(
            event.pointerId,
          );
        }}
        onPointerUp={(event) => {
          if (dragOrigin.current) {
            const dx = event.clientX - dragOrigin.current.x;
            const dy = event.clientY - dragOrigin.current.y;
            const travel = Math.hypot(dx, dy);
            if (
              travel < 14 &&
              !(event.target as HTMLElement).closest("[data-aether-ui]")
            ) {
              const { scrollProgress, fireImpulse } =
                useExperienceStore.getState();
              fireImpulse(getActiveChapterIndex(scrollProgress));
              useExperienceStore.getState().addResonance(0.08);
            }
          }
          dragOrigin.current = null;
          dragValue.current = { x: 0, y: 0 };
          setDrag({ x: 0, y: 0, active: false });
          (event.currentTarget as HTMLElement).releasePointerCapture(
            event.pointerId,
          );
        }}
        onPointerCancel={() => {
          resetDrag();
        }}
      >
        <ExperienceCanvas />
        <InterfaceOverlay />
      </div>
      <div className="scroll-depth" style={{ height: scrollHeight }} />
    </div>
  );
}
