'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LATTICE_CONFIG } from '@/lib/constants/motion';
import { buildNodeTexture, buildEdgeTexture } from '@/lib/lattice/gpuTextures';
import { flowVertexShader, flowFragmentShader } from '@/components/shaders';
import type { LatticeGeometry } from '@/lib/tension/types';

type Props = {
  lattice: LatticeGeometry;
  tension: number;
  speed: number;
  burst?: number;
};

function createFlowAttributes(edgeCount: number) {
  const { flowCount } = LATTICE_CONFIG;
  const edgeIndices = new Float32Array(flowCount);
  const phases = new Float32Array(flowCount);
  const ids = new Float32Array(flowCount);
  for (let i = 0; i < flowCount; i++) {
    edgeIndices[i] = Math.floor(Math.random() * edgeCount);
    phases[i] = Math.random() * Math.PI * 2;
    ids[i] = i;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('aEdgeIndex', new THREE.BufferAttribute(edgeIndices, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aParticleId', new THREE.BufferAttribute(ids, 1));
  return geo;
}

export function FlowParticles({ lattice, tension, speed, burst = 0 }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const edgeCount = lattice.edges.length / 2;

  const geo = useMemo(() => createFlowAttributes(edgeCount), [edgeCount]);

  const { nodeTex, edgeTex } = useMemo(() => ({
    nodeTex: buildNodeTexture(lattice.nodes),
    edgeTex: buildEdgeTexture(lattice.edges, edgeCount),
  }), [lattice, edgeCount]);

  useFrame((state) => {
    if (!matRef.current) return;
    const m = matRef.current;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uTension.value = tension;
    m.uniforms.uSpeed.value = speed;
    m.uniforms.uBurst.value = burst;
  });

  return (
    <points geometry={geo}>
      <shaderMaterial
        ref={matRef}
        vertexShader={flowVertexShader}
        fragmentShader={flowFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uTension: { value: 0.6 },
          uSpeed: { value: 1 },
          uBurst: { value: 0 },
          uNodeTex: { value: nodeTex },
          uNodeCount: { value: lattice.nodes.length },
          uEdgeTex: { value: edgeTex },
          uEdgeCount: { value: edgeCount },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}