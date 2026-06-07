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
  { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1.05 },
  { position: [-6.2, 1.2, -3.0], rotation: [0.15, 0.95, 0.05], scale: 0.82 },
  { position: [5.8, -0.9, 2.6], rotation: [-0.1, -1.15, 0], scale: 0.88 },
  { position: [-2.4, -2.1, 4.2], rotation: [0.2, 0.4, -0.12], scale: 0.68 },
  { position: [3.1, 2.3, -4.8], rotation: [-0.18, -0.55, 0.1], scale: 0.74 },
];

function outerNodeIndex(strand: number, period: number): number {
  const { layers, strands, periods } = LATTICE_CONFIG;
  return 1 + (layers - 1) * strands * periods + strand * periods + period;
}

function worldNode(
  geo: LatticeGeometry,
  placement: OrganismPlacement,
  nodeIdx: number,
): THREE.Vector3 {
  return geo.nodes[nodeIdx]
    .clone()
    .multiplyScalar(placement.scale)
    .applyEuler(placement.rotation)
    .add(placement.position);
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
  const pairs: [number, number, number, number, number, number][] = [
    [0, 1, 2, 4, 3, 5],
    [0, 2, 5, 3, 2, 6],
    [0, 3, 1, 6, 4, 2],
    [0, 4, 7, 4, 6, 3],
    [1, 2, 7, 1, 5, 4],
    [1, 3, 4, 5, 8, 2],
    [2, 4, 3, 6, 9, 5],
    [3, 4, 6, 3, 1, 7],
  ];

  for (const [orgA, orgB, strandA, periodA, strandB, periodB] of pairs) {
    const idxA = outerNodeIndex(strandA, periodA);
    const idxB = outerNodeIndex(strandB, periodB);
    bridges.push({
      from: worldNode(organisms[orgA].geometry, organisms[orgA].placement, idxA),
      to: worldNode(organisms[orgB].geometry, organisms[orgB].placement, idxB),
      phase: strandA * 0.5 + strandB * 0.5,
    });
  }

  return { organisms, bridges };
}