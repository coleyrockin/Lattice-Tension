export type TileKind = 'still' | 'procedural' | 'video' | 'three';

export type FieldParams = {
  ridgeFreq?: number;
  ridgePhase?: number;
  discX?: number;
  starRot?: number;
  warmBias?: number;
  flow?: number;
  observerStrength?: number; // attention/stir intensity — drives perturbation in both 2D Field and 3D studies
};

export type ObservationState = {
  version: number; // for future evolution of the serializable shape
  id: string;
  seed: number;
  params: FieldParams;
  time: number; // current simulation time offset (for exact moment restore)
  threeCamera?: {
    position: [number, number, number];
    target?: [number, number, number];
  };
  observerMode?: 'pointer' | 'sustained' | 'velocity';
};

export interface Journey {
  id: string;
  seed: number;
  title: string;
  category: string;
  kind: TileKind;
  src?: string;
  desc: string;
  tags: string[];
  fieldParams?: FieldParams;
}
