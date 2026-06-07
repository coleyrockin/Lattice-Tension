'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSparkGeometry } from '@/lib/lattice/particles';
import { applyLatticeGroupMotion, updateShaderUniforms } from '@/lib/lattice/latticeMotion';
import {
  edgeVertexShader,
  edgeFragmentShader,
  nodeVertexShader,
  nodeFragmentShader,
} from '@/components/shaders';
import { FlowParticles } from '@/components/field/FlowParticles';
import type { LatticeGeometry, MouseState, PulseState } from '@/lib/tension/types';

type Props = {
  geometry: LatticeGeometry;
  tension: number;
  speed?: number;
  mouse: MouseState;
  mousePull: number;
  burst?: number;
  pulse?: PulseState;
};

export function LatticeOrganism({
  geometry: { nodes, edges, edgePhases, nodePhases },
  tension,
  speed = 0.55,
  mouse,
  mousePull,
  burst = 0,
  pulse = { x: 0, y: 0, strength: 0 },
}: Props) {
  const group = useRef<THREE.Group>(null!);
  const nodesRef = useRef<THREE.InstancedMesh>(null!);
  const edgesRef = useRef<THREE.LineSegments>(null!);
  const sparkMat = useRef<THREE.PointsMaterial>(null!);
  const nodesInitialized = useRef(false);

  const nodeCount = nodes.length;
  const edgeCount = edges.length / 2;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const edgePos = useMemo(() => {
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

  const edgeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
    g.setAttribute('phase', new THREE.BufferAttribute(new Float32Array(edgePhases), 1));
    return g;
  }, [edgePos, edgePhases]);

  const [sparkGeo] = useState(() => createSparkGeometry());

  const nodeGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.034, 1);
    g.setAttribute(
      'nodePhase',
      new THREE.InstancedBufferAttribute(new Float32Array(nodePhases), 1),
    );
    return g;
  }, [nodePhases]);

  const edgeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: edgeVertexShader,
        fragmentShader: edgeFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uTension: { value: 0.6 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uPull: { value: 0 },
          uPulseX: { value: 0 },
          uPulseY: { value: 0 },
          uPulseStrength: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  const nodeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: nodeVertexShader,
        fragmentShader: nodeFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uTension: { value: 0.6 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uPull: { value: 0 },
          uPulseX: { value: 0 },
          uPulseY: { value: 0 },
          uPulseStrength: { value: 0 },
        },
        transparent: true,
      }),
    [],
  );

  const lattice = useMemo(
    () => ({ nodes, edges, edgePhases, nodePhases }),
    [nodes, edges, edgePhases, nodePhases],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pull = mousePull * 0.8 + tension * 0.6;

    if (edgesRef.current) {
      updateShaderUniforms(edgesRef.current.material as THREE.ShaderMaterial, t, tension, mouse, pull, pulse);
    }
    if (nodesRef.current) {
      updateShaderUniforms(nodesRef.current.material as THREE.ShaderMaterial, t, tension, mouse, pull, pulse);
    }

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
      <instancedMesh ref={nodesRef} args={[nodeGeo, nodeMat, nodeCount]} />
      <lineSegments ref={edgesRef} geometry={edgeGeo} material={edgeMat} />
      <FlowParticles lattice={lattice} tension={tension} speed={speed} burst={burst} />
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