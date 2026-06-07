import type { Vector3 } from 'three';
import type { PulseState } from '@/lib/tension/types';

export function createStressBuffer(edgeCount: number) {
  return new Float32Array(edgeCount);
}

export function injectPulseStress(
  stress: Float32Array,
  nodes: Vector3[],
  edges: number[],
  pulse: PulseState,
  amount = 1.15,
) {
  if (pulse.strength <= 0.01) return;

  const px = pulse.x * 4.2;
  const py = pulse.y * 3.2;
  const edgeCount = edges.length / 2;

  for (let i = 0; i < edgeCount; i++) {
    const a = edges[i * 2];
    const b = edges[i * 2 + 1];
    const mx = (nodes[a].x + nodes[b].x) * 0.5;
    const my = (nodes[a].y + nodes[b].y) * 0.5;
    const mz = (nodes[a].z + nodes[b].z) * 0.5;
    const dist = Math.hypot(mx - px, my - py, mz * 0.35);
    if (dist < 3.2) {
      const impulse = amount * Math.exp(-dist * 0.75) * pulse.strength;
      stress[i] = Math.min(1, stress[i] + impulse);
    }
  }
}

export function stepStressPropagation(
  stress: Float32Array,
  edges: number[],
  nodeCount: number,
  dt: number,
) {
  const edgeCount = stress.length;
  const nodeStress = new Float32Array(nodeCount);
  const next = new Float32Array(edgeCount);

  for (let i = 0; i < edgeCount; i++) {
    const a = edges[i * 2];
    const b = edges[i * 2 + 1];
    nodeStress[a] += stress[i];
    nodeStress[b] += stress[i];
  }

  for (let i = 0; i < edgeCount; i++) {
    const a = edges[i * 2];
    const b = edges[i * 2 + 1];
    const spread = (nodeStress[a] + nodeStress[b]) * 0.12;
    next[i] = stress[i] * (1 - dt * 2.8) + spread * dt * 4.2;
    if (next[i] < 0.001) next[i] = 0;
  }

  stress.set(next);
}

export function maxStress(stress: Float32Array) {
  let max = 0;
  for (let i = 0; i < stress.length; i++) {
    if (stress[i] > max) max = stress[i];
  }
  return max;
}