'use client';

import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/webgpu/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { deformLatticeVertex } from '@/lib/lattice/deformEdge';
import { createFilamentMaterial } from '@/engine/tsl/filamentMaterial';
import { getAtmosphere } from '@/lib/atmosphere/interpolate';
import type { PulseState } from '@/lib/tension/types';

type Props = {
  nodes: Vector3[];
  edges: number[];
  edgePhases: number[];
  tension: number;
  mouse: { x: number; y: number };
  mousePull: number;
  pulse: PulseState;
  stressRef?: RefObject<number>;
  lineWidth?: number;
};

export function FilamentEdges({
  nodes,
  edges,
  edgePhases,
  tension,
  mouse,
  mousePull,
  pulse,
  stressRef,
  lineWidth = 3.5,
}: Props) {
  const meshRef = useRef<LineSegments2>(null!);
  const edgeCount = edges.length / 2;
  const pull = mousePull * 0.8 + tension * 0.6;

  const basePositions = useMemo(() => {
    const arr = new Float32Array(edgeCount * 6);
    for (let i = 0; i < edgeCount; i++) {
      const a = edges[i * 2];
      const b = edges[i * 2 + 1];
      arr[i * 6] = nodes[a].x;
      arr[i * 6 + 1] = nodes[a].y;
      arr[i * 6 + 2] = nodes[a].z;
      arr[i * 6 + 3] = nodes[b].x;
      arr[i * 6 + 4] = nodes[b].y;
      arr[i * 6 + 5] = nodes[b].z;
    }
    return arr;
  }, [nodes, edges, edgeCount]);

  const { mesh, geometry, tensionUniform, stressUniform, accentUniform } = useMemo(() => {
    const geo = new LineSegmentsGeometry();
    geo.setPositions(basePositions);
    const { material, tensionUniform, stressUniform, accentUniform } = createFilamentMaterial(lineWidth);
    return {
      mesh: new LineSegments2(geo, material),
      geometry: geo,
      tensionUniform,
      stressUniform,
      accentUniform,
    };
  }, [basePositions, lineWidth]);

  const scratchA = useMemo(() => new Vector3(), []);
  const scratchB = useMemo(() => new Vector3(), []);
  const positions = useMemo(() => new Float32Array(edgeCount * 6), [edgeCount]);

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame mutates Three.js objects by design
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    tensionUniform.value = tension;
    const stress = stressRef?.current ?? 0;
    stressUniform.value = stress;
    accentUniform.value.set(getAtmosphere(tension).accent);
    mesh.material.linewidth = lineWidth * (1 + stress * 0.85 + tension * 0.15);

    for (let i = 0; i < edgeCount; i++) {
      const a = edges[i * 2];
      const b = edges[i * 2 + 1];
      const phase = edgePhases[i];

      scratchA.set(nodes[a].x, nodes[a].y, nodes[a].z);
      scratchB.set(nodes[b].x, nodes[b].y, nodes[b].z);

      const da = deformLatticeVertex(scratchA, phase, t, tension, mouse, pull, pulse);
      const db = deformLatticeVertex(scratchB, phase, t, tension, mouse, pull, pulse);

      positions[i * 6] = da.x;
      positions[i * 6 + 1] = da.y;
      positions[i * 6 + 2] = da.z;
      positions[i * 6 + 3] = db.x;
      positions[i * 6 + 4] = db.y;
      positions[i * 6 + 5] = db.z;
    }

    geometry.setPositions(positions);
    geometry.attributes.instanceStart.needsUpdate = true;
    geometry.attributes.instanceEnd.needsUpdate = true;
  });

  return <primitive ref={meshRef} object={mesh} />;
}