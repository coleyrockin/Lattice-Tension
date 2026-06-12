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
    let lastUpdate = 0;
    let frame = 0;
    const root = document.documentElement;

    const tick = (now: number) => {
      const d = descent.value;
      const chapterIndex = getActiveChapterIndex(d);
      const chapter = CHAPTERS[chapterIndex];
      const sig = chapter.signature;

      root.style.setProperty("--chapter-primary", chapter.palette.primary);
      root.style.setProperty("--chapter-secondary", chapter.palette.secondary);
      root.style.setProperty("--chapter-accent", chapter.palette.accent);
      root.style.setProperty("--chapter-void", chapter.palette.void);
      root.style.setProperty(
        "--atmosphere-strength",
        String(0.08 + sig.nebula * 0.12 + sig.veil * 0.06),
      );
      root.style.setProperty(
        "--vignette-strength",
        String(0.35 + chapter.post.vignette * 0.35 + sig.singularity * 0.2),
      );

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
