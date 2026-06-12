import { Color, MathUtils } from "three";
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

function mixColor(a: string, b: string, t: number) {
  return `#${new Color(a).lerp(new Color(b), t).getHexString()}`;
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

  return from.signature;
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
    palette: mixPalette(from.palette, to.palette, t),
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