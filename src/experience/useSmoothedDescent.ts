import { useEffect, useState } from "react";
import { CHAPTERS } from "../chapters/definitions";
import { getActiveChapterIndex } from "../chapters/atlas";
import { descent } from "./store";

/**
 * Mirrors smoothed descent into React state (throttled) while updating CSS
 * atmosphere vars every frame so UI palette glides with the 3D scene.
 */
export function useSmoothedDescent(throttleMs = 72) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let lastChapter = -1;
    let lastPaletteChapter = -1;
    let lastAtm = "";
    let lastVig = "";
    let lastUpdate = 0;
    let frame = 0;
    const root = document.documentElement;

    const tick = (now: number) => {
      // Skip all DOM writes while backgrounded — rAF still fires (throttled),
      // but custom-prop writes here fan out to 50+ shadow/color-mix rules and
      // would schedule wasted style recalc the moment the tab returns.
      if (document.hidden) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const d = descent.value;
      const chapterIndex = getActiveChapterIndex(d);
      const chapter = CHAPTERS[chapterIndex];
      const sig = chapter.signature;

      // Palette strings only change on chapter boundaries — writing them 60x/s
      // forced a full-document style recalc for unchanged values.
      if (chapterIndex !== lastPaletteChapter) {
        lastPaletteChapter = chapterIndex;
        root.style.setProperty("--chapter-primary", chapter.palette.primary);
        root.style.setProperty("--chapter-secondary", chapter.palette.secondary);
        root.style.setProperty("--chapter-accent", chapter.palette.accent);
        root.style.setProperty("--chapter-void", chapter.palette.void);
      }

      // Numeric atmosphere/vignette glide continuously — diff at display
      // precision so we only write (and recalc) when the rendered value moves.
      const atm = (0.08 + sig.nebula * 0.12 + sig.veil * 0.06).toFixed(3);
      if (atm !== lastAtm) {
        lastAtm = atm;
        root.style.setProperty("--atmosphere-strength", atm);
      }
      const vig = (
        0.35 +
        chapter.post.vignette * 0.35 +
        sig.singularity * 0.2
      ).toFixed(3);
      if (vig !== lastVig) {
        lastVig = vig;
        root.style.setProperty("--vignette-strength", vig);
      }

      if (chapterIndex !== lastChapter || now - lastUpdate > throttleMs) {
        lastChapter = chapterIndex;
        lastUpdate = now;
        setProgress(d);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [throttleMs]);

  return progress;
}
