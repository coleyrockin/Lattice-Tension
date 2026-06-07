export type Preset = 'coherent' | 'strain' | 'peak' | 'release';

export type Sim = {
  tension: number;
  speed: number;
};

export type Pointer = { x: number; y: number };

export type Pulse = { x: number; y: number; strength: number };