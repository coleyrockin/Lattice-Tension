export type Vector3Tuple = [number, number, number];

export type SimulationState = {
  birth: number;
  tension: number;
  order: number;
  collapse: number;
  emergence: number;
  pointerForce: number;
  resonance: number;
  // new realm params for multi-universe atlas (interference waves, singularity curvature, diffusion scatter, scale for micro/macro, etc.)
  interference: number;
  singularity: number;
  diffusion: number;
  curvature: number;
  scale: number;
};

export type ChapterPalette = {
  void: string;
  primary: string;
  secondary: string;
  accent: string;
};

export type ChapterSignature = {
  /** Lattice layer opacity — 0 is orb-only void, 1 is full tunnel */
  latticeReveal: number;
  /** Jelly orb scale/presence */
  orbPresence: number;
  twist: number;
  swell: number;
  veil: number;
  crystalline: number;
  fringe: number;
  singularity: number;
  quantum: number;
  nebula: number;
  echo: number;
  interferenceLayer: number;
  echoLayer: number;
  shellThickness: number;
  cellDensity: number;
  absorption: number;
  focalGlow: number;
  chromatic: number;
  orbDistortion: number;
  interiorCrystalline: number;
};

export type VisualLayerProfile = {
  membraneOpacity: number;
  membraneScale: number;
  contourDensity: number;
  particleDensity: number;
  stressIntensity: number;
  collapseDistortion: number;
  cameraProximity: number;
  ribbonDepth: number;
  nestedScale: number;
  filamentIntensity: number;
  haloDepth: number;
  spectralLift: number;
};

export type ChapterDefinition = {
  id: string;
  index: number;
  title: string;
  statement: string;
  fragment: string;
  range: [number, number];
  camera: {
    position: Vector3Tuple;
    target: Vector3Tuple;
    fov: number;
  };
  palette: ChapterPalette;
  simulation: SimulationState;
  signature: ChapterSignature;
  visual: VisualLayerProfile;
  post: {
    bloom: number;
    aberration: number;
    vignette: number;
    depthOfField: number;
  };
};

export type SampledExperience = {
  chapterIndex: number;
  chapterProgress: number;
  globalProgress: number;
  camera: ChapterDefinition["camera"];
  palette: ChapterPalette;
  simulation: SimulationState;
  signature: ChapterSignature;
  visual: VisualLayerProfile;
  post: ChapterDefinition["post"];
};
