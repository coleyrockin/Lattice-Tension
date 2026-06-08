import { Color, MathUtils } from "three";
import { CHAPTERS } from "./definitions";
import type {
  ChapterPalette,
  SampledExperience,
  SimulationState,
  Vector3Tuple,
  VisualLayerProfile,
} from "./types";

const clamp01 = (value: number) => MathUtils.clamp(value, 0, 1);
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
  };
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

export function sampleExperience(rawProgress: number): SampledExperience {
  const progress = clamp01(rawProgress);
  const scaled = progress * (CHAPTERS.length - 1);
  const fromIndex = Math.min(Math.floor(scaled), CHAPTERS.length - 1);
  const toIndex = Math.min(fromIndex + 1, CHAPTERS.length - 1);
  const linearProgress = scaled - fromIndex;
  const t = MathUtils.smootherstep(linearProgress, 0, 1);
  const from = CHAPTERS[fromIndex];
  const to = CHAPTERS[toIndex];

  return {
    chapterIndex: Math.min(
      CHAPTERS.length - 1,
      Math.floor(progress * CHAPTERS.length),
    ),
    chapterProgress: linearProgress,
    globalProgress: progress,
    camera: {
      position: mixVector(from.camera.position, to.camera.position, t),
      target: mixVector(from.camera.target, to.camera.target, t),
      fov: mix(from.camera.fov, to.camera.fov, t),
    },
    palette: mixPalette(from.palette, to.palette, t),
    simulation: mixSimulation(from.simulation, to.simulation, t),
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
}
