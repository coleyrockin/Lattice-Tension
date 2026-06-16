import { CHAPTERS } from "./definitions";

/** Full scrollable atlas extent — last chapter range end. */
export const ATLAS_MAX = CHAPTERS[CHAPTERS.length - 1].range[1];

/** Viewport height budget per atlas unit (0 → ATLAS_MAX). */
export const SCROLL_VH_PER_UNIT = 600;

export function clampAtlasProgress(value: number) {
  return Math.max(0, Math.min(ATLAS_MAX, value));
}

export function getActiveChapterIndex(atlasProgress: number) {
  const progress = clampAtlasProgress(atlasProgress);
  for (let index = CHAPTERS.length - 1; index >= 0; index -= 1) {
    if (progress >= CHAPTERS[index].range[0]) return index;
  }
  return 0;
}

export function getChapterCenterProgress(index: number) {
  const chapter = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, index))];
  return clampAtlasProgress((chapter.range[0] + chapter.range[1]) * 0.5);
}

export function atlasProgressFromScroll(scrollY: number) {
  const maxScroll = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  return clampAtlasProgress((scrollY / maxScroll) * ATLAS_MAX);
}

export function scrollYForAtlasProgress(atlasProgress: number) {
  const maxScroll = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  return (clampAtlasProgress(atlasProgress) / ATLAS_MAX) * maxScroll;
}

/** Normalized 0–1 share param (compact URLs). */
export function normalizeAtlasForShare(atlasProgress: number) {
  return clampAtlasProgress(atlasProgress) / ATLAS_MAX;
}

export function atlasFromShareParam(param: number) {
  return clampAtlasProgress(param * ATLAS_MAX);
}
