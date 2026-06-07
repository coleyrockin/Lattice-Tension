'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSparkGeometry } from '@/lib/lattice/particles';
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
}: Props) {
  const group = useRef<THREE.Group>(null!);
  const nodesRef = useRef<THREE.InstancedMesh>(null!);
  const sparkMat = useRef<THREE.PointsMaterial>(null!);
  const nodesInitialized = useRef(false);
  const pulseRef = useRef(pulse);
  const stressBuf = useRef(createStressBuffer(edges.length / 2));
  const peakStressRef = useRef(0);

  const nodeCount = nodes.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const [sparkGeo] = useState(() => createSparkGeometry());

  const nodeGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.034, 1);
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

    if (!nodesInitialized.current && nodesRef.current) {
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

    if (sparkMat.current) {
      sparkMat.current.size = 0.062 * (1 + tension * 1.35 + burst * 2.2);
    }
  });

  const coreOpacity = 0.55 + tension * 0.4;

  return (
    <group ref={group}>
      <instancedMesh
        ref={nodesRef}
        args={[nodeGeo, nodeHandles.material, nodeCount]}
      />
      <FilamentEdges
        nodes={nodes}
        edges={edges}
        edgePhases={edgePhases}
        tension={tension}
        mouse={mouse}
        mousePull={mousePull}
        pulse={pulse}
        stressRef={peakStressRef}
        lineWidth={perf.lineWidth}
      />
      <TSLFlowParticles
        lattice={lattice}
        tension={tension}
        speed={speed}
        burst={burst}
        count={perf.flowCount}
      />
      <points geometry={sparkGeo}>
        <pointsMaterial
          ref={sparkMat}
          size={0.062 * (1 + tension * 0.9 + burst * 1.6)}
          color="#facc15"
          transparent
          opacity={Math.max(0.18, tension * 0.85 + burst * 0.55)}
          sizeAttenuation
        />
      </points>
      <mesh>
        <sphereGeometry args={[0.135]} />
        <meshPhongMaterial
          color="#fff"
          emissive="#facc15"
          emissiveIntensity={tension * 0.72}
          shininess={70}
          transparent
          opacity={coreOpacity}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.21]} />
        <meshBasicMaterial color="#facc15" transparent opacity={tension * 0.14} />
      </mesh>
      <mesh rotation={[1.35 + tension * 0.08, 0.4, tension * 0.15]}>
        <ringGeometry args={[0.21, 0.3, 52]} />
        <meshBasicMaterial
          color="#facc15"
          transparent
          opacity={0.14 + tension * 0.26}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}