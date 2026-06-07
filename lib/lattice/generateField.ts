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

/** One monumental helix + two distant echoes — clarity over clutter. */
const FIELD_LAYOUT: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}[] = [
  { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1.85 },
  { position: [-14, 2.5, -8], rotation: [0.12, 0.7, 0.04], scale: 0.42 },
  { position: [12, -1.8, 9], rotation: [-0.08, -0.9, 0], scale: 0.38 },
];

function outerNodeIndex(strand: number, period: number) {
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
  const organisms = FIELD_LAYOUT.map((layout) => ({
    geometry: generateHelixLattice(),
    placement: {
      position: new THREE.Vector3(...layout.position),
      rotation: new THREE.Euler(...layout.rotation),
      scale: layout.scale,
    },
  }));

  const bridges: FieldBridge[] = [];
  const hero = organisms[0];
  const echoes = organisms.slice(1);

  for (const echo of echoes) {
    bridges.push({
      from: worldNode(hero.geometry, hero.placement, outerNodeIndex(2, 4)),
      to: worldNode(echo.geometry, echo.placement, outerNodeIndex(5, 3)),
      phase: Math.random() * Math.PI * 2,
    });
    bridges.push({
      from: worldNode(hero.geometry, hero.placement, outerNodeIndex(7, 6)),
      to: worldNode(echo.geometry, echo.placement, outerNodeIndex(1, 2)),
      phase: Math.random() * Math.PI * 2,
    });
  }

  return { organisms, bridges };
}