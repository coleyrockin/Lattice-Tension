'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Vector3 } from 'three';
import { PointsNodeMaterial } from 'three/webgpu';
import { float, mix, uniform, vec3 } from 'three/tsl';
import type { LatticeGeometry } from '@/lib/tension/types';

type Props = {
  lattice: LatticeGeometry;
  tension: number;
  speed: number;
  burst?: number;
  count: number;
};

type ParticleSeed = { edgeIndex: number; phase: number };

function buildSeeds(edgeCount: number, count: number): ParticleSeed[] {
  const seeds: ParticleSeed[] = [];
  for (let i = 0; i < count; i++) {
    seeds.push({
      edgeIndex: Math.floor(Math.random() * edgeCount),
      phase: Math.random(),
    });
  }
  return seeds;
}

export function TSLFlowParticles({ lattice, tension, speed, burst = 0, count }: Props) {
  const edgeCount = lattice.edges.length / 2;
  const seeds = useMemo(() => buildSeeds(edgeCount, count), [edgeCount, count]);

  const { geometry, material, tensionUniform, sizeUniform } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));

    const tensionUniform = uniform(0.6);
    const sizeUniform = uniform(4.5);
    const mat = new PointsNodeMaterial();
    mat.colorNode = mix(vec3(0.98, 0.8, 0.08), vec3(1.0, 0.95, 0.65), tensionUniform);
    mat.sizeNode = sizeUniform;
    mat.transparent = true;
    mat.depthWrite = false;

    return { geometry: geo, material: mat, tensionUniform, sizeUniform, positions };
  }, [count]);

  const positions = geometry.attributes.position.array as Float32Array;
  const scratch = useMemo(() => new Vector3(), []);
  const end = useMemo(() => new Vector3(), []);

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame updates GPU buffers
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    tensionUniform.value = tension;
    sizeUniform.value = 3.2 + tension * 2.8 + burst * 3.5;

    const { nodes, edges } = lattice;
    const spd = (0.7 + tension * 1.5) * speed + burst * 2.5;

    for (let i = 0; i < seeds.length; i++) {
      const { edgeIndex, phase } = seeds[i];
      const a = edges[edgeIndex * 2];
      const b = edges[edgeIndex * 2 + 1];
      const tt = ((t * spd * 0.15 + phase) % 1 + 1) % 1;

      scratch.set(nodes[a].x, nodes[a].y, nodes[a].z);
      end.set(nodes[b].x, nodes[b].y, nodes[b].z);
      scratch.lerp(end, tt);

      positions[i * 3] = scratch.x;
      positions[i * 3 + 1] = scratch.y;
      positions[i * 3 + 2] = scratch.z;
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} />;
}