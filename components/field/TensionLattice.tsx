'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LATTICE_CONFIG } from '@/lib/constants/motion';
import { generateHelixLattice } from '@/lib/lattice/generateHelix';
import { createFlowGeometry, createSparkGeometry } from '@/lib/lattice/particles';
import {
  edgeVertexShader,
  edgeFragmentShader,
  nodeVertexShader,
  nodeFragmentShader,
} from '@/components/shaders';
import type { MouseState, PulseState } from '@/lib/tension/types';

type Props = {
  tension: number;
  speed?: number;
  mouse: MouseState;
  mousePull: number;
  burst?: number;
  pulse?: PulseState;
};

export function TensionLattice({
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
  const flowRef = useRef<THREE.Points>(null!);
  const flowMat = useRef<THREE.PointsMaterial>(null!);
  const sparkMat = useRef<THREE.PointsMaterial>(null!);
  const nodesInitialized = useRef(false);

  const { nodes, edges, edgePhases } = useMemo(() => generateHelixLattice(), []);

  const nodeCount = nodes.length;
  const edgeCount = edges.length / 2;
  const { flowCount } = LATTICE_CONFIG;

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

  const lattice = useMemo(() => ({ nodes, edges }), [nodes, edges]);
  const [flowGeo] = useState(() => createFlowGeometry(lattice));
  const [sparkGeo] = useState(() => createSparkGeometry());

  const nodeGeo = useMemo(() => new THREE.IcosahedronGeometry(0.034, 1), []);

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

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const effSpeed = speed * (1 + burst * 0.8);
    const pull = mousePull * 0.8 + tension * 0.6;
    const { x: pulseX, y: pulseY, strength: pulseS } = pulse;

    const updateUniforms = (m: THREE.ShaderMaterial) => {
      m.uniforms.uTime.value = t;
      m.uniforms.uTension.value = tension;
      m.uniforms.uMouse.value.set(mouse.x, mouse.y);
      m.uniforms.uPull.value = pull;
      m.uniforms.uPulseX.value = pulseX;
      m.uniforms.uPulseY.value = pulseY;
      m.uniforms.uPulseStrength.value = pulseS;
    };

    if (edgesRef.current) {
      updateUniforms(edgesRef.current.material as THREE.ShaderMaterial);
    }
    if (nodesRef.current) {
      updateUniforms(nodesRef.current.material as THREE.ShaderMaterial);
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
      const type = Math.max(0, Math.min(1, (tension - 0.18) * 1.65));
      const smoothType = 1.0 - type;
      const chaoticType = type;

      const baseSpin = t * (0.018 * effSpeed);
      const smoothWobble = Math.sin(t * 0.28) * 0.048 * smoothType * tension;
      const chaoticWobble = Math.sin(t * (2.8 + tension * 5.5)) * 0.11 * chaoticType * tension;
      const peakJitter = chaoticType * Math.sin(t * 38.0) * 0.038 * tension;
      group.current.rotation.y = baseSpin + smoothWobble + chaoticWobble + peakJitter;

      const xPrecess = Math.sin(t * 0.012 * effSpeed) * 0.032 * tension;
      const xJitter = Math.sin(t * 27.0) * 0.055 * chaoticType * tension;
      const xType = chaoticType * Math.sin(t * (7.5 + tension * 6.5)) * 0.042 * tension;
      group.current.rotation.x = xPrecess + xJitter + xType;

      const zWobble = Math.cos(t * 0.016) * 0.028 * smoothType * tension;
      const zVib = Math.cos(t * (6.0 + tension * 13.0)) * 0.072 * chaoticType * tension;
      const zRelease = smoothType * Math.cos(t * 0.85) * 0.024 * tension;
      group.current.rotation.z = zWobble + zVib + zRelease;

      const smoothBreath = Math.sin(t * (0.65 * effSpeed)) * 0.042 * smoothType * tension;
      const chaoticBreath = Math.sin(t * 36.0) * 0.019 * chaoticType * tension;
      const baseBreath = 1.0 + smoothBreath + chaoticBreath;
      const squash = 1.0 + Math.sin(t * 1.65) * 0.028 * chaoticType * tension;
      const quiver =
        (tension > 0.55 ? Math.sin(t * 31.0) * 0.011 * (tension - 0.55) : 0) * chaoticType;
      const releaseOvershoot =
        (tension < 0.38 ? Math.sin(t * 1.0) * 0.035 * (0.38 - tension) : 0) * smoothType;
      const peakPulse = chaoticType * Math.sin(t * 22.0) * 0.014 * tension;
      group.current.scale.set(
        baseBreath + quiver + releaseOvershoot + peakPulse,
        baseBreath * (1.0 + squash * 0.85),
        (baseBreath + quiver + releaseOvershoot + peakPulse) * (1.0 - squash * 0.48),
      );

      const floatY = Math.sin(t * 0.42) * 0.048 * tension;
      const chaoticFloat = chaoticType * Math.sin(t * 11.0 + tension * 3.0) * 0.032 * tension;
      group.current.position.y = floatY + chaoticFloat;
      group.current.position.x =
        Math.sin(t * 0.09 * smoothType) * 0.032 * tension +
        Math.sin(t * 17.0) * 0.024 * chaoticType * tension;
      group.current.position.z =
        Math.cos(t * 0.07 * smoothType) * 0.026 * tension +
        Math.cos(t * 14.0) * 0.019 * chaoticType * tension;
    }

    if (flowRef.current) {
      const posAttr = flowRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const phaseAttr = flowRef.current.geometry.attributes.phase as THREE.BufferAttribute;
      const spd = (0.7 + tension * 1.5) * effSpeed + burst * 2.5;
      const tLow = Math.max(0, 1.0 - tension * 1.6);
      const tMid = Math.max(0, Math.min(1.0, (tension - 0.3) * 2.2));
      const tHigh = Math.max(0, (tension - 0.55) * 2.4);

      for (let i = 0; i < flowCount; i++) {
        const ph = phaseAttr.getX(i);
        const ei = (i * 5) % edgeCount;
        const a = edges[ei * 2];
        const b = edges[ei * 2 + 1];
        const tt = (t * spd + ph) % 1;

        const p = nodes[a].clone().lerp(nodes[b], tt);
        const radialDir = p.clone().normalize();

        p.x += Math.sin(t * (2.2 * effSpeed) + i * 0.5) * 0.042 * tLow * tension;
        p.y += Math.cos(t * (1.9 * effSpeed) + i * 0.35) * 0.032 * tLow * tension;
        p.z += Math.sin(t * (2.5 * effSpeed) + i * 0.7) * 0.038 * tLow * tension;

        const swirl = Math.sin(t * 3.2 + i * 0.85) * tMid * 0.078;
        p.x += -p.z * swirl * 0.6 + radialDir.x * tMid * 0.035;
        p.z += p.x * swirl * 0.6 + radialDir.z * tMid * 0.035;
        p.y += radialDir.y * tMid * 0.024;

        p.x +=
          Math.sin(t * 17.0 + i * 1.6) * tHigh * 0.055 * tension +
          radialDir.x * tHigh * 0.078 * (Math.sin(t * 9 + i) * 0.5 + 0.5);
        p.y += Math.cos(t * 14.0 + i * 2.0) * tHigh * 0.048 * tension + radialDir.y * tHigh * 0.052;
        p.z +=
          Math.sin(t * 16.0 + i * 1.3) * tHigh * 0.052 * tension +
          radialDir.z * tHigh * 0.072 * (Math.cos(t * 10 + i) * 0.5 + 0.5);

        const release = Math.sin(t * 1.0 + i * 0.25) * Math.max(0, (0.35 - tension) * 2.5);
        p.x += radialDir.x * release * 0.027;
        p.z += radialDir.z * release * 0.022;
        p.y += radialDir.y * release * 0.018;

        posAttr.setXYZ(i, p.x, p.y, p.z);
      }
      posAttr.needsUpdate = true;
    }

    if (flowMat.current) {
      flowMat.current.size = 0.028 * (1 + tension * 0.85 + burst * 1.35);
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
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color="#fff" transparent opacity={tension * 0.55} linewidth={0.8} />
      </lineSegments>
      <points ref={flowRef} geometry={flowGeo}>
        <pointsMaterial
          ref={flowMat}
          size={0.028}
          color="#facc15"
          transparent
          opacity={0.88}
          sizeAttenuation
        />
      </points>
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