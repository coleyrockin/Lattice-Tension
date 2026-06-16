import { Color, LinearSRGBColorSpace, MathUtils } from "three";
import { CHAPTERS } from "./definitions";
import { ATLAS_MAX, clampAtlasProgress } from "./atlas";
import { useExperienceStore } from "../experience/store";
import type {
  ChapterPalette,
  ChapterSignature,
  SampledExperience,
  SimulationState,
  Vector3Tuple,
  VisualLayerProfile,
} from "./types";

const SIGNATURE_TRANSITION = 0.1;

const mix = (a: number, b: number, t: number) => MathUtils.lerp(a, b, t);

function mixVector(a: Vector3Tuple, b: Vector3Tuple, t: number): Vector3Tuple {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
}

// OKLab transform (Björn Ottosson) operating on LINEAR sRGB. Three's Color is
// linear-light internally (ColorManagement on), so .r/.g/.b feed straight in.
type Oklab = [number, number, number];

function linearRgbToOklab(r: number, g: number, b: number): Oklab {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

const oklabScratch = new Color();

function oklabToHex(L: number, A: number, B: number): string {
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  // setRGB in linear space; getHexString clamps to gamut + encodes to sRGB.
  oklabScratch.setRGB(r, g, b, LinearSRGBColorSpace);
  return `#${oklabScratch.getHexString()}`;
}

// Interpolate in OKLab so complementary hues cross perceptually instead of
// collapsing through achromatic gray (the "muddy blend" at chapter joins).
function mixColor(a: string, b: string, t: number) {
  if (t <= 0) return a.startsWith("#") ? a : `#${new Color(a).getHexString()}`;
  if (t >= 1) return b.startsWith("#") ? b : `#${new Color(b).getHexString()}`;
  const ca = new Color(a);
  const cb = new Color(b);
  const la = linearRgbToOklab(ca.r, ca.g, ca.b);
  const lb = linearRgbToOklab(cb.r, cb.g, cb.b);
  return oklabToHex(
    mix(la[0], lb[0], t),
    mix(la[1], lb[1], t),
    mix(la[2], lb[2], t),
  );
}

function mixPalette(
  a: ChapterPalette,
  b: ChapterPalette,
  t: number,
): ChapterPalette {
  return {
    void: mixColor(a.void, b.void, t),
    primary: mixColor(a.primary, b.primary, t),
    secondary: mixColor(a.secondary, b.secondary, t),
    accent: mixColor(a.accent, b.accent, t),
  };
}

function mixSimulation(
  a: SimulationState,
  b: SimulationState,
  t: number,
): SimulationState {
  return {
    birth: mix(a.birth, b.birth, t),
    tension: mix(a.tension, b.tension, t),
    order: mix(a.order, b.order, t),
    collapse: mix(a.collapse, b.collapse, t),
    emergence: mix(a.emergence, b.emergence, t),
    pointerForce: mix(a.pointerForce, b.pointerForce, t),
    resonance: mix(a.resonance, b.resonance, t),
    interference: mix(a.interference, b.interference, t),
    singularity: mix(a.singularity, b.singularity, t),
    diffusion: mix(a.diffusion, b.diffusion, t),
    curvature: mix(a.curvature, b.curvature, t),
    scale: mix(a.scale, b.scale, t),
  };
}

function mixSignature(
  a: ChapterSignature,
  b: ChapterSignature,
  t: number,
): ChapterSignature {
  const keys = Object.keys(a) as (keyof ChapterSignature)[];
  const out = { ...a };
  for (const key of keys) {
    out[key] = mix(a[key], b[key], t);
  }
  return out;
}

function sampleSignature(rawProgress: number): ChapterSignature {
  const progress = clampAtlasProgress(rawProgress);
  const { from, to, linearProgress } = chapterBlend(progress);
  const chapterIndex = getChapterIndexAt(progress);

  if (linearProgress <= SIGNATURE_TRANSITION) {
    const prev = CHAPTERS[Math.max(0, chapterIndex - 1)].signature;
    const blendT = MathUtils.smootherstep(
      linearProgress / SIGNATURE_TRANSITION,
      0,
      1,
    );
    return mixSignature(prev, from.signature, blendT);
  }

  if (linearProgress >= 1 - SIGNATURE_TRANSITION) {
    const blendT = MathUtils.smootherstep(
      (linearProgress - (1 - SIGNATURE_TRANSITION)) / SIGNATURE_TRANSITION,
      0,
      1,
    );
    return mixSignature(from.signature, to.signature, blendT);
  }

  return { ...from.signature };
}

// Palette gets the SAME plateau as the signature (not a raw smootherstep across
// the whole span). Without this, a chapter's CENTER — where its statement shows
// and its structure plateaus — was a ~50/50 OKLab blend with the NEXT chapter's
// palette (verified: pattern's lime center rendered pure collapse-red). The
// plateau makes each chapter read its OWN color at center; transitions still
// crossfade smoothly in the outer SIGNATURE_TRANSITION band at each end.
function samplePalette(rawProgress: number): ChapterPalette {
  const progress = clampAtlasProgress(rawProgress);
  const { from, to, linearProgress } = chapterBlend(progress);
  const chapterIndex = getChapterIndexAt(progress);

  if (linearProgress <= SIGNATURE_TRANSITION) {
    const prev = CHAPTERS[Math.max(0, chapterIndex - 1)].palette;
    const blendT = MathUtils.smootherstep(
      linearProgress / SIGNATURE_TRANSITION,
      0,
      1,
    );
    return mixPalette(prev, from.palette, blendT);
  }

  if (linearProgress >= 1 - SIGNATURE_TRANSITION) {
    const blendT = MathUtils.smootherstep(
      (linearProgress - (1 - SIGNATURE_TRANSITION)) / SIGNATURE_TRANSITION,
      0,
      1,
    );
    return mixPalette(from.palette, to.palette, blendT);
  }

  return { ...from.palette };
}

function mixVisual(
  a: VisualLayerProfile,
  b: VisualLayerProfile,
  t: number,
): VisualLayerProfile {
  return {
    membraneOpacity: mix(a.membraneOpacity, b.membraneOpacity, t),
    membraneScale: mix(a.membraneScale, b.membraneScale, t),
    contourDensity: mix(a.contourDensity, b.contourDensity, t),
    particleDensity: mix(a.particleDensity, b.particleDensity, t),
    stressIntensity: mix(a.stressIntensity, b.stressIntensity, t),
    collapseDistortion: mix(
      a.collapseDistortion,
      b.collapseDistortion,
      t,
    ),
    cameraProximity: mix(a.cameraProximity, b.cameraProximity, t),
    ribbonDepth: mix(a.ribbonDepth, b.ribbonDepth, t),
    nestedScale: mix(a.nestedScale, b.nestedScale, t),
    filamentIntensity: mix(a.filamentIntensity, b.filamentIntensity, t),
    haloDepth: mix(a.haloDepth, b.haloDepth, t),
    spectralLift: mix(a.spectralLift, b.spectralLift, t),
  };
}

function chapterBlend(rawProgress: number) {
  const progress = clampAtlasProgress(rawProgress);

  let fromIndex = 0;
  for (let index = 0; index < CHAPTERS.length; index += 1) {
    const [start] = CHAPTERS[index].range;
    if (progress >= start) fromIndex = index;
    else break;
  }

  const from = CHAPTERS[fromIndex];
  const toIndex = Math.min(fromIndex + 1, CHAPTERS.length - 1);
  const to = CHAPTERS[toIndex];
  const span = Math.max(1e-6, to.range[0] - from.range[0]);
  const linearProgress = MathUtils.clamp((progress - from.range[0]) / span, 0, 1);

  return {
    fromIndex,
    toIndex,
    from,
    to,
    linearProgress,
  };
}

export function sampleExperience(rawProgress: number): SampledExperience {
  const progress = clampAtlasProgress(rawProgress);
  const { from, to, linearProgress } = chapterBlend(progress);
  const t = MathUtils.smootherstep(linearProgress, 0, 1);

  const sampled = {
    chapterIndex: getChapterIndexAt(progress),
    chapterProgress: linearProgress,
    globalProgress: progress / ATLAS_MAX,
    camera: {
      position: mixVector(from.camera.position, to.camera.position, t),
      target: mixVector(from.camera.target, to.camera.target, t),
      fov: mix(from.camera.fov, to.camera.fov, t),
    },
    palette: samplePalette(progress),
    simulation: mixSimulation(from.simulation, to.simulation, t),
    signature: sampleSignature(progress),
    visual: mixVisual(from.visual, to.visual, t),
    post: {
      bloom: mix(from.post.bloom, to.post.bloom, t),
      aberration: mix(from.post.aberration, to.post.aberration, t),
      vignette: mix(from.post.vignette, to.post.vignette, t),
      depthOfField: mix(
        from.post.depthOfField,
        to.post.depthOfField,
        t,
      ),
    },
  };

  const manualTension = useExperienceStore.getState().manualTension;
  if (manualTension !== null) {
    sampled.simulation.tension = manualTension;
  }

  return sampled;
}

function getChapterIndexAt(progress: number) {
  for (let index = CHAPTERS.length - 1; index >= 0; index -= 1) {
    const [start, end] = CHAPTERS[index].range;
    if (progress >= start && progress < end) return index;
  }
  return CHAPTERS.length - 1;
}
