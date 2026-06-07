import * as THREE from 'three';
import { LATTICE_CONFIG } from '@/lib/constants/motion';
import type { LatticeGeometry } from '@/lib/tension/types';

export function generateHelixLattice(): LatticeGeometry {
  const nodes: THREE.Vector3[] = [];
  const edges: number[] = [];
  const edgePhases: number[] = [];
  const nodePhases: number[] = [];

  const { layers: LAYERS, strands: STRANDS, periods: PER } = LATTICE_CONFIG;

  nodes.push(new THREE.Vector3(0, 0, 0));
  nodePhases.push(0);

  for (let l = 0; l < LAYERS; l++) {
    const r = 0.48 + l * 0.36;
    const h = 2.7 - l * 0.14;
    const twist = (l % 2 === 0 ? 1 : -1) * (2.1 + l * 0.55);

    for (let s = 0; s < STRANDS; s++) {
      const base = (s / STRANDS) * Math.PI * 2 + l * 0.65;

      for (let p = 0; p < PER; p++) {
        const t = p / (PER - 1);
        const y = (t - 0.5) * h;

        const ang = base + t * twist * 3.0 + l * 0.9;
        let x = Math.cos(ang) * r;
        let z = Math.sin(ang) * r;

        const disp = Math.sin(t * 12 + l * 1.4) * 0.07 + Math.cos(s * 2.3) * 0.05;
        x += (x / r) * disp * 0.7;
        z += (z / r) * disp * 0.7;

        const idx = nodes.length;
        nodes.push(new THREE.Vector3(x, y, z));
        nodePhases.push(base + t * twist * 0.5 + l);

        if (p > 0) {
          edges.push(idx - 1, idx);
          edgePhases.push(base + t * twist);
        }
        if (s > 0 && p % 2 === 0) {
          const prevBase = (l * STRANDS + (s - 1)) * PER;
          edges.push(prevBase + p, idx);
          edgePhases.push(base);
        }
      }
    }
  }

  for (let l = 1; l < LAYERS; l++) {
    for (let s = 0; s < STRANDS; s++) {
      const outer = (l * STRANDS + s) * PER;
      const inner = ((l - 1) * STRANDS + s) * PER;
      for (let p = 0; p < PER; p += 2) {
        edges.push(outer + p, inner + p);
        edgePhases.push(0.5);
      }
    }
  }

  return { nodes, edges, edgePhases, nodePhases };
}