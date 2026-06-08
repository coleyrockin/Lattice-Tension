export type Vector3Tuple = [number, number, number];

export type SimulationState = {
  birth: number;
  tension: number;
  order: number;
  collapse: number;
  emergence: number;
  pointerForce: number;
};

export type ChapterPalette = {
  void: string;
  primary: string;
  secondary: string;
  accent: string;
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
  visual: VisualLayerProfile;
  post: ChapterDefinition["post"];
};
