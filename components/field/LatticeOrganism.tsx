'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { applyLatticeGroupMotion } from '@/lib/lattice/latticeMotion';
import { FilamentEdges } from '@/components/field/FilamentEdges';
import { TSLFlowParticles } from '@/components/field/TSLFlowParticles';
import { createNodeMaterial, syncNodeMaterial } from '@/engine/tsl/nodeMaterial';
import {
  createStressBuffer,
  injectPulseStress,
  maxStress,
  stepStressPropagation,
} from '@/lib/tension/propagation';
import type { LatticeGeometry, MouseState, PulseState } from '@/lib/tension/types';
import type { PerfProfile } from '@/lib/constants/perfTiers';

type Props = {
  geometry: LatticeGeometry;
  tension: number;
  speed?: number;
  mouse: MouseState;
  mousePull: number;
  burst?: number;
  pulse?: PulseState;
  perf: PerfProfile;
  lineWidth: number;
};

export function LatticeOrganism({
  geometry: { nodes, edges, edgePhases, nodePhases },
  tension,
  speed = 0.55,
  mouse,
  mousePull,
  burst = 0,
  pulse = { x: 0, y: 0, strength: 0 },
  perf,
  lineWidth,
}: Props) {
  const group = useRef<THREE.Group>(null!);
  const nodesRef = useRef<THREE.InstancedMesh>(null!);
  const nodesInitialized = useRef(false);
  const pulseRef = useRef(pulse);
  const stressBuf = useRef(createStressBuffer(edges.length / 2));
  const peakStressRef = useRef(0);

  const nodeCount = nodes.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const nodeGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.022, 0);
    g.setAttribute(
      'nodePhase',
      new THREE.InstancedBufferAttribute(new Float32Array(nodePhases), 1),
    );
    return g;
  }, [nodePhases]);

  const nodeHandles = useMemo(() => createNodeMaterial(), []);

  const lattice = useMemo(
    () => ({ nodes, edges, edgePhases, nodePhases }),
    [nodes, edges, edgePhases, nodePhases],
  );

  const particleCount = Math.max(12, Math.round(perf.flowCount * Math.min(1, lineWidth / 0.085)));

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const stress = stressBuf.current;

    if (pulse.strength > pulseRef.current.strength) {
      injectPulseStress(stress, nodes, edges, pulse);
    }
    pulseRef.current = pulse;
    stepStressPropagation(stress, edges, nodeCount, Math.min(delta, 0.05));

    peakStressRef.current = maxStress(stress);
    syncNodeMaterial(nodeHandles, tension, peakStressRef.current);

    if (perf.showNodes && !nodesInitialized.current && nodesRef.current) {
      for (let i = 0; i < nodeCount; i++) {
        dummy.position.copy(nodes[i]);
        dummy.updateMatrix();
        nodesRef.current.setMatrixAt(i, dummy.matrix);
      }
      nodesRef.current.instanceMatrix.needsUpdate = true;
      nodesInitialized.current = true;
    }

    if (group.current) {
      applyLatticeGroupMotion(group.current, t, tension, speed, burst);
    }
  });

  return (
    <group ref={group}>
      {perf.showNodes && (
        <instancedMesh ref={nodesRef} args={[nodeGeo, nodeHandles.material, nodeCount]} />
      )}
      <FilamentEdges
        nodes={nodes}
        edges={edges}
        edgePhases={edgePhases}
        tension={tension}
        mouse={mouse}
        mousePull={mousePull}
        pulse={pulse}
        stressRef={peakStressRef}
        lineWidth={lineWidth}
      />
      {particleCount > 0 && (
        <TSLFlowParticles
          lattice={lattice}
          tension={tension}
          speed={speed}
          burst={burst}
          count={particleCount}
        />
      )}
    </group>
  );
}