import * as THREE from 'three';
import { LATTICE_CONFIG } from '@/lib/constants/motion';
import { generateHelixLattice } from '@/lib/lattice/generateHelix';
import type { LatticeGeometry } from '@/lib/tension/types';

export type OrganismPlacement = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
};

export type FieldBridge = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  phase: number;
};

export type TensionFieldData = {
  organisms: { geometry: LatticeGeometry; placement: OrganismPlacement }[];
  bridges: FieldBridge[];
};

const ORGANISM_LAYOUT: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}[] = [
  { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 },
  { position: [-4.6, 0.9, -2.4], rotation: [0.12, 0.85, 0], scale: 0.72 },
  { position: [4.4, -0.7, 2.0], rotation: [-0.08, -1.05, 0.04], scale: 0.78 },
];

function outerNodeIndex(strand: number, period: number): number {
  const { layers, strands, periods } = LATTICE_CONFIG;
  return 1 + (layers - 1) * strands * periods + strand * periods + period;
}

export function generateTensionField(): TensionFieldData {
  const organisms = ORGANISM_LAYOUT.map((layout) => ({
    geometry: generateHelixLattice(),
    placement: {
      position: new THREE.Vector3(...layout.position),
      rotation: new THREE.Euler(...layout.rotation),
      scale: layout.scale,
    },
  }));

  const bridges: FieldBridge[] = [];
  const pairs: [number, number, number, number][] = [
    [0, 1, 2, 6],
    [0, 2, 5, 3],
    [1, 2, 7, 1],
  ];

  for (const [orgA, orgB, strandA, strandB] of pairs) {
    const geoA = organisms[orgA].geometry;
    const geoB = organisms[orgB].geometry;
    const idxA = outerNodeIndex(strandA, 4);
    const idxB = outerNodeIndex(strandB, 4);
    const placeA = organisms[orgA].placement;
    const placeB = organisms[orgB].placement;

    const from = geoA.nodes[idxA].clone().multiplyScalar(placeA.scale).applyEuler(placeA.rotation).add(placeA.position);
    const to = geoB.nodes[idxB].clone().multiplyScalar(placeB.scale).applyEuler(placeB.rotation).add(placeB.position);

    bridges.push({ from, to, phase: strandA * 0.7 + strandB * 0.3 });
  }

  return { organisms, bridges };
}