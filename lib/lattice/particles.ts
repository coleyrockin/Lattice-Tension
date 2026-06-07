import * as THREE from 'three';
import { LATTICE_CONFIG } from '@/lib/constants/motion';
type FlowLattice = Pick<import('@/lib/tension/types').LatticeGeometry, 'nodes' | 'edges'>;

export function createStarField() {
  const count = LATTICE_CONFIG.starCount;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = 11 + Math.random() * 32;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 0.5 + Math.random() * 1.6;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  return geo;
}

export function createFlowGeometry(lattice: FlowLattice) {
  const { nodes, edges } = lattice;
  const edgeCount = edges.length / 2;
  const { flowCount } = LATTICE_CONFIG;

  const pos = new Float32Array(flowCount * 3);
  const ph = new Float32Array(flowCount);

  for (let i = 0; i < flowCount; i++) {
    const ei = Math.floor(Math.random() * edgeCount);
    const a = edges[ei * 2];
    const b = edges[ei * 2 + 1];
    const tt = Math.random();
    const p = nodes[a].clone().lerp(nodes[b], tt);
    pos[i * 3] = p.x;
    pos[i * 3 + 1] = p.y;
    pos[i * 3 + 2] = p.z;
    ph[i] = Math.random() * Math.PI * 2;
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  return g;
}

export function createSparkGeometry() {
  const { sparkCount } = LATTICE_CONFIG;
  const arr = new Float32Array(sparkCount * 3);

  for (let i = 0; i < sparkCount; i++) {
    const r = 0.3 + Math.random() * 3.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
    arr[i * 3 + 2] = r * Math.cos(phi);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  return g;
}