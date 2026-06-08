import { Vector3 } from "three";
import { createSeededRandom, randomBetween } from "./seeded";
import type { SimulationState } from "../chapters/types";
import type { PointerState, InteractionImpulse } from "../experience/store";

export type NodeData = {
  id: number;
  base: Vector3;
  phase: number;
};

export type EdgeData = {
  from: number;
  to: number;
  phase: number;
};

export type LatticeField = {
  nodes: NodeData[];
  edges: EdgeData[];
};

export function createLatticeField(count: number, seed = 42042): LatticeField {
  const random = createSeededRandom(seed);
  const nodes: NodeData[] = [];

  for (let index = 0; index < count; index += 1) {
    const t = index / Math.max(1, count - 1);
    const theta = index * 2.399963229728653;
    const y = 1 - 2 * t;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const shell = randomBetween(random, 2.1, 5.0);
    const wobble = randomBetween(random, -0.5, 0.5);
    nodes.push({
      id: index,
      phase: randomBetween(random, 0, Math.PI * 2),
      base: new Vector3(
        Math.cos(theta) * radius * shell * 1.38 + wobble,
        y * shell * 0.72 + Math.sin(theta * 0.5) * 0.42,
        Math.sin(theta) * radius * shell * 0.72,
      ),
    });
  }

  const edgeKeys = new Set<string>();
  const edges: EdgeData[] = [];

  nodes.forEach((node) => {
    const nearest = nodes
      .filter((candidate) => candidate.id !== node.id)
      .map((candidate) => ({
        id: candidate.id,
        distance: candidate.base.distanceTo(node.base),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    nearest.forEach(({ id, distance }) => {
      if (distance > 4.6) return;
      const from = Math.min(node.id, id);
      const to = Math.max(node.id, id);
      const key = `${from}:${to}`;
      if (edgeKeys.has(key)) return;
      edgeKeys.add(key);
      edges.push({ from, to, phase: randomBetween(random, 0, Math.PI * 2) });
    });
  });

  return { nodes, edges };
}

export function impulseStrength(
  impulse: InteractionImpulse | null,
  nodeId: number,
  now: number,
) {
  if (!impulse) return 0;
  const age = Math.max(0, now - impulse.startedAt) / 1000;
  if (age > 1.8) return 0;
  const distance = Math.abs(nodeId - impulse.nodeId);
  const wave = Math.sin(age * 10 - distance * 0.35);
  return Math.max(0, wave) * Math.exp(-age * 1.7);
}

export function deformNode(
  node: NodeData,
  simulation: SimulationState,
  pointer: PointerState,
  impulse: InteractionImpulse | null,
  time: number,
): Vector3 {
  const base = node.base;
  const result = base.clone();
  const breath =
    Math.sin(time * 0.55 + node.phase) * 0.08 +
    Math.sin(time * 0.21 + node.phase * 1.7) * 0.04;
  const tensionStretch = simulation.tension * 0.42;
  const collapsePull = simulation.collapse * 0.68;
  const emergenceBloom = simulation.emergence * 0.36;
  const impulseWave = impulseStrength(impulse, node.id, time * 1000);
  const pointerDepth =
    pointer.active && !Number.isNaN(pointer.x)
      ? (pointer.x * base.y - pointer.y * base.x) *
        0.15 *
        simulation.pointerForce
      : 0;

  result.x *= 1 + tensionStretch * Math.sign(base.x) * 0.12;
  result.y *= 1 - collapsePull * 0.18 + simulation.order * 0.04;
  result.z *= 1 + emergenceBloom * 0.16;
  result.addScaledVector(base.clone().normalize(), breath + impulseWave * 0.45);
  result.x += pointer.x * simulation.pointerForce * 0.35;
  result.y += pointer.y * simulation.pointerForce * 0.22;
  result.z += pointerDepth;
  result.multiplyScalar(1 - collapsePull * 0.32 + simulation.birth * 0.08);

  return result;
}

export function createAttractorPoints(count = 520) {
  const points: Vector3[] = [];
  let x = 0.01;
  let y = 0;
  let z = 0;
  const dt = 0.0075;

  for (let index = 0; index < count; index += 1) {
    const dx = 10 * (y - x);
    const dy = x * (28 - z) - y;
    const dz = x * y - (8 / 3) * z;
    x += dx * dt;
    y += dy * dt;
    z += dz * dt;
    if (index > 35) {
      points.push(new Vector3(x * 0.08, (z - 24) * 0.07, y * 0.08));
    }
  }

  return points;
}
