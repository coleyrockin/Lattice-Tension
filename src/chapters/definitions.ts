import type { ChapterDefinition } from "./types";
import { CHAPTER_SIGNATURES } from "./signatures";

function withSignature(
  chapter: Omit<ChapterDefinition, "signature">,
): ChapterDefinition {
  const signature = CHAPTER_SIGNATURES[chapter.id];
  // Hard fail on a missing/typo'd id instead of spreading `undefined` into the
  // signature — that silently feeds NaN into every shader uniform and renders a
  // black/garbage chapter with no error.
  if (!signature) {
    throw new Error(
      `No ChapterSignature defined for chapter id "${chapter.id}"`,
    );
  }
  return {
    ...chapter,
    signature,
  };
}

export const CHAPTERS: ChapterDefinition[] = [
  withSignature({
    id: "origin",
    index: 0,
    title: "Origin",
    statement: "Nothing has crossed yet. The field is whole.",
    fragment:
      "Before the first crossing, every point in the lattice is defined by what it might reach. The field is whole because nothing has named the distance yet.",
    range: [0, 1],
    camera: { position: [0.25, 0.28, 11.9], target: [0.0, 0, -0.45], fov: 42 },
    palette: {
      void: "#020308",
      primary: "#7cc9ff",
      secondary: "#9fc0ff",
      accent: "#ffe7bd",
    },
    simulation: {
      birth: 0.28,
      tension: 0.05,
      order: 0.12,
      collapse: 0,
      emergence: 0,
      pointerForce: 0.2,
      resonance: 0.05,
      interference: 0.05,
      singularity: 0.02,
      diffusion: 0.08,
      curvature: 0.04,
      scale: 1.0,
    },
    visual: {
      membraneOpacity: 0.58,
      membraneScale: 0.90,
      contourDensity: 0.28,
      particleDensity: 0.34,
      stressIntensity: 0.50,
      collapseDistortion: 0,
      cameraProximity: 0.18,
      ribbonDepth: 0.36,
      nestedScale: 0.34,
      filamentIntensity: 1.0,
      haloDepth: 0.62,
      spectralLift: 0.58,
    },
    post: { bloom: 0.82, aberration: 0.0001, vignette: 0.60, depthOfField: 0.14 },
  }),
];

export const PHILOSOPHICAL_FRAGMENTS = CHAPTERS.map((chapter) => chapter.fragment);
