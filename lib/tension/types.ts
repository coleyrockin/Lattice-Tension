export type TensionPreset = 'coherent' | 'strain' | 'peak' | 'release';

export type SimParams = {
  tension: number;
  speed: number;
  pullStrength: number;
};

export type MouseState = { x: number; y: number };

export type PulseState = { x: number; y: number; strength: number };

export type LatticeGeometry = {
  nodes: import('three').Vector3[];
  edges: number[];
  edgePhases: number[];
  nodePhases: number[];
};