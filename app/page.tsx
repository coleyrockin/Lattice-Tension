'use client';

import { useState, useEffect, useRef, useMemo, Component, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';

// Simple error boundary for Canvas robustness (visual art fallback)
class CanvasErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    // eslint-disable-next-line no-console
    console.error('Lattice Tension Canvas error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center mono text-[#f8f4ff]/40 text-sm tracking-[3px]">
          LATTICE TENSION — WEBGL REQUIRED FOR FULL EXPERIENCE
        </div>
      );
    }
    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LATTICE TENSION
// A single, pure 3D artistic experience.
// Counter-rotating helical shells under procedural tension.
// Filaments strain, particles flow, the structure breathes toward coherence.
// ═══════════════════════════════════════════════════════════════════════════

const PRESETS = {
  coherent: { tension: 0.18, speed: 0.55, pullStrength: 0.12 },
  strain:   { tension: 0.58, speed: 1.05, pullStrength: 0.48 },
  peak:     { tension: 0.88, speed: 1.55, pullStrength: 0.82 },
  release:  { tension: 0.32, speed: 0.78, pullStrength: 0.22 },
};

// Custom shaders for visual tension (vertex displaces, fragment stresses color/glow)
// This moves work to GPU for smoothness and rich per-filament visuals.
const edgeVertexShader = `
  uniform float uTime;
  uniform float uTension;
  uniform vec2 uMouse;
  uniform float uPull;
  uniform float uPulseX;
  uniform float uPulseY;
  uniform float uPulseStrength;
  attribute float phase;
  varying float vStress;
  varying float vPhase;
  varying float vFresnel;
  void main() {
    vec3 pos = position;
    vec3 toC = -pos;
    float d = length(toC) + 0.0001;
    vec3 dir = toC / d;
    pos += dir * (uTension * 0.22 + uPull * 0.08);
    vec3 mDir = vec3(uMouse.x * 1.8, uMouse.y * 1.2, 0.0);
    pos += mDir * uPull * 0.07;
    // local pluck pulse for ripples
    vec3 pulsePos = vec3(uPulseX * 4.0, uPulseY * 3.0, 0.0);
    vec3 pDir = pos - pulsePos;
    float pd = length(pDir) + 0.001;
    pos -= normalize(pDir) * uPulseStrength * 0.35 * exp(-pd * 1.8);
    float damp = 1.0 - uTension * 0.6;
    pos.x += sin(uTime * 1.2 + phase) * 0.035 * damp;
    pos.z += cos(uTime * 1.1 + phase) * 0.035 * damp;
    // extra organic curl at high tension for "alive" feel
    float curl = uTension * 0.04 * sin(phase * 5.0 + uTime * 0.8);
    pos += vec3(sin(phase * 3.0), 0.0, cos(phase * 4.0)) * curl;
    
    // Dynamic type motion: low tension = smooth organic wave; high tension adds fast vibration + global propagating wave + twist (amplified for visibility)
    float waveType = uTension;
    float globalWave = sin(uTime * 0.4 + length(pos) * 0.15) * waveType * 0.085;
    pos += normalize(pos) * globalWave;
    float vibFreq = 8.0 + uTension * 25.0;
    float vibration = sin(uTime * vibFreq + phase * 2.0) * waveType * 0.042;
    pos += vec3(0.0, vibration, 0.0);
    float twist = uTension * 0.19 * sin(uTime * 0.6 + pos.y * 0.4 + phase);
    float cs = cos(twist);
    float sn = sin(twist);
    float tx = pos.x * cs - pos.z * sn;
    float tz = pos.x * sn + pos.z * cs;
    pos.x = tx;
    pos.z = tz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vStress = uTension;
    vPhase = phase;
    // fake fresnel for rim glow on "cables"
    vec3 viewDir = normalize((modelViewMatrix * vec4(pos, 1.0)).xyz);
    vFresnel = pow(1.0 - abs(dot(normalize(pos), viewDir)), 2.0);
  }
`;

const edgeFragmentShader = `
  uniform float uTension;
  uniform float uTime;
  varying float vStress;
  varying float vPhase;
  varying float vFresnel;
  void main() {
    // rich iridescent stress palette - deep to electric
    vec3 cool = vec3(0.42, 0.29, 0.54);
    vec3 warm = vec3(0.77, 0.48, 0.54);
    vec3 hot = vec3(0.98, 0.85, 0.45);
    float w = sin(vPhase * 6.0 + uTension * 4.0) * 0.5 + 0.5;
    vec3 base = mix(mix(cool, warm, w), hot, vStress * 0.7);
    // fresnel rim + phase variation for cable "sheen"
    float rim = vFresnel * (0.6 + vStress * 0.8);
    float phaseGlow = sin(vPhase * 12.0 + uTime * 0.5) * 0.5 + 0.5;
    float g = 0.7 + vStress * 0.6 + phaseGlow * 0.25 + rim;
    float a = 0.55 + vStress * 0.4 + rim * 0.3;
    // soft falloff for volumetric "thick cable" illusion
    float fall = 1.0 - smoothstep(0.0, 0.6, abs(gl_FragCoord.x - 0.5) * 1.2);
    gl_FragColor = vec4(base * g, a * fall);
  }
`;

// Node shader for full GPU displacement (best perf + complex visuals)
const nodeVertexShader = `
  uniform float uTime;
  uniform float uTension;
  uniform vec2 uMouse;
  uniform float uPull;
  uniform float uPulseX;
  uniform float uPulseY;
  uniform float uPulseStrength;
  attribute float nodePhase;
  varying float vHeat;
  varying vec3 vNormal;
  varying float vFres;
  void main() {
    vec3 pos = position;
    vec3 instanceOffset = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    pos += instanceOffset;
    // core tension + mouse + pulse (same logic as edges for cohesion)
    vec3 toC = -pos;
    float d = length(toC) + 0.0001;
    pos += (toC / d) * (uTension * 0.3 + uPull * 0.1);
    pos.x += uMouse.x * uPull * 0.75;
    pos.y += uMouse.y * uPull * 0.6;
    vec3 pulsePos = vec3(uPulseX * 4.0, uPulseY * 3.0, 0.0);
    vec3 pDir = pos - pulsePos;
    float pd = length(pDir) + 0.001;
    pos -= normalize(pDir) * uPulseStrength * 0.3 * exp(-pd * 1.6);
    float damp = 1.0 - uTension * 0.6;
    pos.x += sin(uTime * 1.2 + nodePhase) * 0.04 * damp;
    pos.z += cos(uTime * 1.1 + nodePhase) * 0.04 * damp;
    pos += normalize(vec3(sin(nodePhase*4.0), cos(nodePhase*3.0), sin(nodePhase*5.0))) * uTension * 0.025;
    
    // Dynamic type motion for nodes (mirrors edges but per-node phase for varied "personality")
    float waveType = uTension;
    float globalWave = sin(uTime * 0.35 + length(pos) * 0.12) * waveType * 0.068;
    pos += normalize(pos) * globalWave;
    float vibFreq = 7.0 + uTension * 22.0;
    float vibration = sin(uTime * vibFreq + nodePhase * 1.8) * waveType * 0.034;
    pos += vec3(vibration * 0.6, vibration, vibration * 0.4);
    float twist = uTension * 0.16 * sin(uTime * 0.5 + pos.y * 0.3 + nodePhase);
    float cs = cos(twist);
    float sn = sin(twist);
    float tx = pos.x * cs - pos.z * sn;
    float tz = pos.x * sn + pos.z * cs;
    pos.x = tx;
    pos.z = tz;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vHeat = uTension * 0.6 + sin(uTime * 3.0 + nodePhase) * 0.3;
    vNormal = normalize(normalMatrix * normal);
    // fresnel for crystal rim
    vec3 viewDir = normalize(-mvPosition.xyz);
    vFres = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const nodeFragmentShader = `
  uniform float uTension;
  uniform float uTime;
  varying float vHeat;
  varying vec3 vNormal;
  varying float vFres;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vec3(0.0, 0.0, 1.0));
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    // rich glowing node palette - crystal to plasma
    vec3 coolCore = vec3(0.6, 0.7, 0.95);
    vec3 warmCore = vec3(0.95, 0.82, 0.55);
    vec3 hotCore = vec3(1.0, 0.95, 0.8);
    vec3 core = mix(mix(coolCore, warmCore, uTension), hotCore, vHeat * 0.5);
    vec3 rim = mix(vec3(0.35, 0.25, 0.55), vec3(0.85, 0.55, 0.45), uTension * 0.7);
    vec3 col = mix(rim, core, 0.6 + vFres * 0.4);
    // subtle internal shimmer
    col += vec3(0.15) * sin(uTime * 4.0 + vHeat * 8.0) * (0.3 + uTension * 0.4);
    float alpha = 0.75 + vFres * 0.35 + vHeat * 0.25;
    gl_FragColor = vec4(col, clamp(alpha, 0.65, 1.0));
  }
`;

function TensionLattice({ 
  tension, 
  speed = 0.55, 
  pullStrength = 0.12, 
  mouse, 
  mousePull, 
  burst = 0,
  pulse = {x:0, y:0, strength:0}
}: { 
  tension: number; 
  speed?: number; 
  pullStrength?: number; 
  mouse: { x: number; y: number }; 
  mousePull: number; 
  burst?: number;
  pulse?: {x: number, y: number, strength: number};
}) {
  const group = useRef<THREE.Group>(null!);
  const nodesRef = useRef<THREE.InstancedMesh>(null!);
  const edgesRef = useRef<THREE.LineSegments>(null!);
  const flowRef = useRef<THREE.Points>(null!);
  const flowMat = useRef<THREE.PointsMaterial>(null!);
  const sparkMat = useRef<THREE.PointsMaterial>(null!);
  const nodesInitialized = useRef(false);

  const { nodes, edges, edgePhases, nodePhases } = useMemo(() => {
    const nodes: THREE.Vector3[] = [];
    const edges: number[] = [];
    const edgePhases: number[] = [];
    const nodePhases: number[] = [];

    const LAYERS = 7;
    const STRANDS = 10;
    const PER = 8;

    // Central core
    nodes.push(new THREE.Vector3(0, 0, 0));
    nodePhases.push(0);

    for (let l = 0; l < LAYERS; l++) {
      const r = 0.48 + l * 0.36;
      const h = 2.7 - l * 0.14;
      const twist = (l % 2 === 0 ? 1 : -1) * (2.1 + l * 0.55);

      for (let s = 0; s < STRANDS; s++) {
        const base = (s / STRANDS) * Math.PI * 2 + l * 0.65;

        for (let p = 0; p < PER; p++) {
          const t = p / (PER - 1);
          let y = (t - 0.5) * h;

          let ang = base + t * twist * 3.0 + l * 0.9;
          let x = Math.cos(ang) * r;
          let z = Math.sin(ang) * r;

          // Organic ridge displacement (fixed base shape; tension applied in shader)
          const disp = Math.sin(t * 12 + l * 1.4) * 0.07 + Math.cos(s * 2.3) * 0.05;
          x += (x / r) * disp * 0.7;
          z += (z / r) * disp * 0.7;

          const idx = nodes.length;
          nodes.push(new THREE.Vector3(x, y, z));
          nodePhases.push(base + t * twist * 0.5 + l);

          if (p > 0) {
            edges.push(idx - 1, idx);
            edgePhases.push(base + t * twist);
          }
          if (s > 0 && p % 2 === 0) {
            const prevBase = (l * STRANDS + (s - 1)) * PER;
            edges.push(prevBase + p, idx);
            edgePhases.push(base);
          }
        }
      }
    }

    // Radial tension struts (the "tension" connections)
    for (let l = 1; l < LAYERS; l++) {
      for (let s = 0; s < STRANDS; s++) {
        const outer = (l * STRANDS + s) * PER;
        const inner = ((l - 1) * STRANDS + s) * PER;
        for (let p = 0; p < PER; p += 2) {
          edges.push(outer + p, inner + p);
          edgePhases.push(0.5);
        }
      }
    }

    return { nodes, edges, edgePhases, nodePhases };
  }, []);

  const nodeCount = nodes.length;
  const edgeCount = edges.length / 2;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const edgePos = useMemo(() => {
    const arr = new Float32Array(edgeCount * 6);
    for (let i = 0; i < edgeCount; i++) {
      const a = edges[i * 2], b = edges[i * 2 + 1];
      arr[i * 6] = nodes[a].x; arr[i * 6 + 1] = nodes[a].y; arr[i * 6 + 2] = nodes[a].z;
      arr[i * 6 + 3] = nodes[b].x; arr[i * 6 + 4] = nodes[b].y; arr[i * 6 + 5] = nodes[b].z;
    }
    return arr;
  }, [nodes, edges, edgeCount]);

  const edgeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
    g.setAttribute('phase', new THREE.BufferAttribute(new Float32Array(edgePhases), 1));
    return g;
  }, [edgePos, edgePhases]);

  const flowCount = 260;
  const flowGeo = useMemo(() => {
    const pos = new Float32Array(flowCount * 3);
    const ph = new Float32Array(flowCount);
    for (let i = 0; i < flowCount; i++) {
      const ei = Math.floor(Math.random() * edgeCount);
      const a = edges[ei * 2], b = edges[ei * 2 + 1];
      const tt = Math.random();
      const p = nodes[a].clone().lerp(nodes[b], tt);
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      ph[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
    return g;
  }, [edgeCount, edges, nodes]);

  // Richer particles: "charge sparks" - brighter, pulse with high tension + burst (visual energy pop)
  const sparkCount = 48;
  const sparkGeo = useMemo(() => {
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
  }, []);

  const nodeGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.034, 1);
    return g;
  }, []);

  // ShaderMaterials — GPU does the tension deformation, stress color, fresnel, wave/vib/twist for distinct motion personalities
  const edgeMat = useMemo(() => new THREE.ShaderMaterial({
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
  }), []);

  const nodeMat = useMemo(() => new THREE.ShaderMaterial({
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
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const effSpeed = speed * (1 + burst * 0.8);
    const pull = mousePull * 0.8 + tension * 0.6;

    // Drive shader uniforms every frame — GPU deformation + color + dynamic wave/vib/twist
    const pulseX = pulse.x;
    const pulseY = pulse.y;
    const pulseS = pulse.strength;

    if (edgesRef.current) {
      const m = edgesRef.current.material as THREE.ShaderMaterial;
      if (m && m.uniforms) {
        m.uniforms.uTime.value = t;
        m.uniforms.uTension.value = tension;
        m.uniforms.uMouse.value.set(mouse.x, mouse.y);
        m.uniforms.uPull.value = pull;
        if (m.uniforms.uPulseX) m.uniforms.uPulseX.value = pulseX;
        if (m.uniforms.uPulseY) m.uniforms.uPulseY.value = pulseY;
        if (m.uniforms.uPulseStrength) m.uniforms.uPulseStrength.value = pulseS;
      }
    }
    if (nodesRef.current) {
      const m = nodesRef.current.material as THREE.ShaderMaterial;
      if (m && m.uniforms) {
        m.uniforms.uTime.value = t;
        m.uniforms.uTension.value = tension;
        m.uniforms.uMouse.value.set(mouse.x, mouse.y);
        m.uniforms.uPull.value = pull;
        if (m.uniforms.uPulseX) m.uniforms.uPulseX.value = pulseX;
        if (m.uniforms.uPulseY) m.uniforms.uPulseY.value = pulseY;
        if (m.uniforms.uPulseStrength) m.uniforms.uPulseStrength.value = pulseS;
      }
    }

    // init home positions for instanced nodes once (shader will displace)
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
      // Dynamic multi-type motion — personalities are extreme so they are obvious on sight
      // coherent: slow smooth wave breathing + gentle precession
      // strain: directed pull + twist precession
      // peak: violent high-freq jitter, vibration, squash, explosive offsets
      // release: slow lingering spirals + big overshoot settle + low-freq breathing
      const type = Math.max(0, Math.min(1, (tension - 0.18) * 1.65));
      const smoothType = 1.0 - type;
      const chaoticType = type;

      // Y: base helical + smooth breathing vs fast chaotic + peak micro-jitter
      const baseSpin = t * (0.018 * effSpeed);
      const smoothWobble = Math.sin(t * 0.28) * 0.048 * smoothType * tension;
      const chaoticWobble = Math.sin(t * (2.8 + tension * 5.5)) * 0.11 * chaoticType * tension;
      const peakJitter = chaoticType * Math.sin(t * 38.0) * 0.038 * tension;
      group.current.rotation.y = baseSpin + smoothWobble + chaoticWobble + peakJitter;

      // X: gentle nod vs fast nodding + high-freq shake
      const xPrecess = Math.sin(t * 0.012 * effSpeed) * 0.032 * tension;
      const xJitter = Math.sin(t * 27.0) * 0.055 * chaoticType * tension;
      const xType = chaoticType * Math.sin(t * (7.5 + tension * 6.5)) * 0.042 * tension;
      group.current.rotation.x = xPrecess + xJitter + xType;

      // Z: counter vs rolling vib vs release slow ring
      const zWobble = Math.cos(t * 0.016) * 0.028 * smoothType * tension;
      const zVib = Math.cos(t * (6.0 + tension * 13.0)) * 0.072 * chaoticType * tension;
      const zRelease = smoothType * Math.cos(t * 0.85) * 0.024 * tension;
      group.current.rotation.z = zWobble + zVib + zRelease;

      // Scale: breathing vs squash + quiver + big release overshoot + peak pulse
      const smoothBreath = Math.sin(t * (0.65 * effSpeed)) * 0.042 * smoothType * tension;
      const chaoticBreath = Math.sin(t * 36.0) * 0.019 * chaoticType * tension;
      const baseBreath = 1.0 + smoothBreath + chaoticBreath;
      const squash = 1.0 + (Math.sin(t * 1.65) * 0.028 * chaoticType * tension);
      const quiver = (tension > 0.55 ? Math.sin(t * 31.0) * 0.011 * (tension - 0.55) : 0) * chaoticType;
      const releaseOvershoot = (tension < 0.38 ? Math.sin(t * 1.0) * 0.035 * (0.38 - tension) : 0) * smoothType;
      const peakPulse = chaoticType * Math.sin(t * 22.0) * 0.014 * tension;
      group.current.scale.set(
        baseBreath + quiver + releaseOvershoot + peakPulse,
        baseBreath * (1.0 + squash * 0.85),
        (baseBreath + quiver + releaseOvershoot + peakPulse) * (1.0 - squash * 0.48)
      );

      // Position drift — coherent slow orbit, peak erratic jitter, release slow settle
      const floatY = Math.sin(t * 0.42) * 0.048 * tension;
      const chaoticFloat = chaoticType * Math.sin(t * 11.0 + tension * 3.0) * 0.032 * tension;
      group.current.position.y = floatY + chaoticFloat;
      group.current.position.x = Math.sin(t * 0.09 * smoothType) * 0.032 * tension + Math.sin(t * 17.0) * 0.024 * chaoticType * tension;
      group.current.position.z = Math.cos(t * 0.07 * smoothType) * 0.026 * tension + Math.cos(t * 14.0) * 0.019 * chaoticType * tension;
    }

    // Flow particles - faster and more chaotic with tension + speed + burst
    // Rich layered dynamic "type" motion that evolves with tension:
    // coherent (low): smooth, undulating laminar flow with slow 3D helices
    // strain (mid): swirling pulls, tangential shear, increasing radial components
    // peak (high): high-frequency jitter, explosive radial ejections, chaotic vibration + noise
    // release: slow lingering spirals, gentle overshoot waves, settling drift
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
        const a = edges[ei * 2], b = edges[ei * 2 + 1];
        const tt = ((t * spd + ph) % 1);

        const p = nodes[a].clone().lerp(nodes[b], tt);
        
        // coherent-type smooth undulation (multi-axis gentle waves)
        p.x += Math.sin(t * (2.2 * effSpeed) + i * 0.5) * 0.042 * tLow * tension;
        p.y += Math.cos(t * (1.9 * effSpeed) + i * 0.35) * 0.032 * tLow * tension;
        p.z += Math.sin(t * (2.5 * effSpeed) + i * 0.7) * 0.038 * tLow * tension;
        
        // strain-type: swirl + shear + radial pull
        const radialDir = p.clone().normalize();
        const swirl = Math.sin(t * 3.2 + i * 0.85) * tMid * 0.078;
        p.x += -p.z * swirl * 0.6 + radialDir.x * tMid * 0.035;
        p.z += p.x * swirl * 0.6 + radialDir.z * tMid * 0.035;
        p.y += radialDir.y * tMid * 0.024;
        
        // peak-type: high-freq jitter + explosive radial ejections + vibration
        p.x += Math.sin(t * 17.0 + i * 1.6) * tHigh * 0.055 * tension + radialDir.x * tHigh * 0.078 * (Math.sin(t * 9 + i) * 0.5 + 0.5);
        p.y += Math.cos(t * 14.0 + i * 2.0) * tHigh * 0.048 * tension + radialDir.y * tHigh * 0.052;
        p.z += Math.sin(t * 16.0 + i * 1.3) * tHigh * 0.052 * tension + radialDir.z * tHigh * 0.072 * (Math.cos(t * 10 + i) * 0.5 + 0.5);
        
        // release-type: slow settling spirals and soft lingering waves
        const release = Math.sin(t * 1.0 + i * 0.25) * Math.max(0, (0.35 - tension) * 2.5);
        p.x += radialDir.x * release * 0.027;
        p.z += radialDir.z * release * 0.022;
        p.y += radialDir.y * release * 0.018;

        posAttr.setXYZ(i, p.x, p.y, p.z);
      }
      posAttr.needsUpdate = true;
    }

    // Dynamic particle size for richer visual pop with tension/burst
    if (flowMat.current) {
      flowMat.current.size = 0.028 * (1 + tension * 0.85 + burst * 1.35);
    }
    if (sparkMat.current) {
      sparkMat.current.size = 0.062 * (1 + tension * 1.35 + burst * 2.2);
    }
  });

  // Tension-driven for core (filaments now in shader)
  const coreOpacity = 0.55 + tension * 0.4;

  return (
    <group ref={group}>
      {/* Nodes now fully GPU displaced via custom shader for best perf and visuals */}
      <instancedMesh ref={nodesRef} args={[nodeGeo, nodeMat, nodeCount]} />

      {/* Main filaments - GPU shaded for deformation + stress visuals */}
      <lineSegments ref={edgesRef} geometry={edgeGeo} material={edgeMat} />

      {/* Stress core lines (brighter, "tighter" under high tension) */}
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color="#fff" transparent opacity={tension * 0.55} linewidth={0.8} />
      </lineSegments>

      <points ref={flowRef} geometry={flowGeo}>
        <pointsMaterial ref={flowMat} size={0.028} color="#facc15" transparent opacity={0.88} sizeAttenuation />
      </points>

      {/* Richer particles: charge sparks layer - brighter/larger at high tension + burst for visual "energy" pop */}
      <points geometry={sparkGeo}>
        <pointsMaterial ref={sparkMat} 
          size={0.062 * (1 + tension * 0.9 + burst * 1.6)} 
          color="#facc15" 
          transparent 
          opacity={Math.max(0.18, tension * 0.85 + burst * 0.55)} 
          sizeAttenuation 
        />
      </points>

      {/* Central tension core - brighter and more luminous under strain */}
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

      {/* Extra corona for drama and god-ray hint when tense */}
      <mesh>
        <sphereGeometry args={[0.21]} />
        <meshBasicMaterial color="#facc15" transparent opacity={tension * 0.14} />
      </mesh>

      {/* Slow rotating "accretion" tension ring – high-end cosmic detail, strongly reactive */}
      <mesh rotation={[1.35 + tension * 0.08, 0.4, tension * 0.15]}>
        <ringGeometry args={[0.21, 0.30, 52]} />
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

function BackgroundStars() {
  const pointsRef = useRef<THREE.Points>(null!);
  const { positions, sizes, phases } = useMemo(() => {
    const count = 1400;
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 11 + Math.random() * 32;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = 0.5 + Math.random() * 1.6;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, sizes: sz, phases: ph };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    return g;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.0025;
      // very subtle twinkle via size (GPU friendly)
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      if (mat) {
        mat.size = 0.85 + Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
      }
    }
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial size={0.9} color="#f4f0ff" transparent opacity={0.38} sizeAttenuation />
    </points>
  );
}

// Volumetric nebula planes with soft procedural feel for cosmic depth
function NebulaField({ tension }: { tension: number }) {
  const m1 = useRef<THREE.Mesh>(null!);
  const m2 = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (m1.current) {
      m1.current.rotation.z = state.clock.elapsedTime * 0.0015 + tension * 0.02;
      m1.current.rotation.y = state.clock.elapsedTime * 0.0008;
    }
    if (m2.current) {
      m2.current.rotation.z = -state.clock.elapsedTime * 0.0012 - tension * 0.015;
    }
  });
  const opacity1 = 0.048 + tension * 0.035;
  const opacity2 = 0.038 + tension * 0.028;
  return (
    <>
      <mesh ref={m1} position={[-10, 3.5, -26]} rotation={[0.35, 1.15, -0.25]}>
        <planeGeometry args={[38, 38]} />
        <meshBasicMaterial color="#2a1f4a" transparent opacity={opacity1} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={m2} position={[12, -4, -22]} rotation={[-0.45, -0.95, 0.35]}>
        <planeGeometry args={[32, 32]} />
        <meshBasicMaterial color="#1f2a3e" transparent opacity={opacity2} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function CameraRig({ tension, mouse, reducedDamp = 1 }: { tension: number; mouse: { x: number; y: number }; reducedDamp?: number }) {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Dynamic camera: low tension = smooth slow breathing/parallax; high tension = faster, more erratic "alive" motion with type shift
    const camFreq = 0.35 + tension * 0.45; // type change: higher freq at strain
    const bob = Math.sin(t * camFreq) * 0.014 * tension * reducedDamp;
    camera.position.y = 0.6 + bob + mouse.y * 0.05 * tension * reducedDamp;
    camera.position.x = mouse.x * 0.035 * tension * reducedDamp;
    // high-tension adds subtle circular "searching" sway (different motion type)
    const sway = tension * 0.025 * Math.sin(t * 0.08) * reducedDamp;
    camera.position.z = 8.2 + Math.cos(t * 0.06) * sway;
    // look target also gets dynamic offset for "focus" change
    const lookY = 0.1 + bob * 0.6 + (tension > 0.6 ? Math.sin(t * 2.5) * 0.03 * (tension - 0.6) : 0);
    camera.lookAt(0, lookY, 0);
  });
  return null;
}

function ArtScene({ 
  tension, 
  speed, 
  pullStrength, 
  mouse, 
  burst = 0,
  reducedDamp = 1,
  pulse = {x:0, y:0, strength:0}
}: { 
  tension: number; 
  speed: number; 
  pullStrength: number; 
  mouse: { x: number; y: number }; 
  burst?: number;
  reducedDamp?: number;
  pulse?: {x: number, y: number, strength: number};
}) {
  const mousePull = Math.min(1, Math.hypot(mouse.x, mouse.y) * 1.25) * pullStrength;

  return (
    <>
      <CameraRig tension={tension} mouse={mouse} reducedDamp={reducedDamp} />
      <TensionLattice 
        tension={tension} 
        speed={speed} 
        pullStrength={pullStrength} 
        mouse={mouse} 
        mousePull={mousePull} 
        burst={burst} 
        pulse={pulse}
      />
      <EffectComposer multisampling={0}>
        <Bloom 
          intensity={(1.85 + tension * 1.25 + (tension > 0.72 ? 0.75 : 0)) * reducedDamp} 
          luminanceThreshold={0.07} 
          luminanceSmoothing={0.62} 
          kernelSize={3}
        />
        <ChromaticAberration offset={[0.00072 + tension * 0.00155, 0.00038]} />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={(0.032 + tension * 0.024) * reducedDamp} />
        <Vignette offset={0.17} darkness={0.68} />
      </EffectComposer>
    </>
  );
}

export default function LatticeTension() {
  const [simParams, setSimParams] = useState({ tension: 0.62, speed: 0.95, pullStrength: 0.38 });
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [audioOn, setAudioOn] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [burst, setBurst] = useState(0);
  const [pulse, setPulse] = useState({ x: 0, y: 0, strength: 0 });

  const audioRef = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);

  // Reduced motion: damp visuals for calmer but still beautiful experience (visual priority)
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
  }, []);
  const visualDamp = reduced ? 0.4 : 1;

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = ((e.clientX / window.innerWidth) - 0.5) * 2;
      const y = ((e.clientY / window.innerHeight) - 0.5) * 2;

      // velocity for visual burst (extra particle energy on fast moves)
      const dx = x - lastMouse.x;
      const dy = y - lastMouse.y;
      const vel = Math.min(1, Math.hypot(dx, dy) * 8);
      setBurst(vel);
      setLastMouse({ x, y });

      setMouse({ x, y });

      // decay burst quickly
      if (vel > 0.1) {
        setTimeout(() => setBurst(0), 120);
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [lastMouse]);

  // Basic touch support: pointer events for strain (covers touch drag)
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const x = ((e.clientX / window.innerWidth) - 0.5) * 2;
      const y = ((e.clientY / window.innerHeight) - 0.5) * 2;
      setMouse({ x, y });
    };
    const container = document.getElementById('lattice-container');
    if (container) {
      container.addEventListener('pointermove', onPointer);
      return () => container.removeEventListener('pointermove', onPointer);
    }
  }, []);

  // Simple two-finger pinch for micro tension (extra pull)
  useEffect(() => {
    let prevDist = 0;
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (prevDist > 0) {
          const delta = (dist - prevDist) * 0.002;
          setSimParams(p => ({ ...p, tension: Math.max(0.1, Math.min(0.95, p.tension + delta)) }));
        }
        prevDist = dist;
      }
    };
    const container = document.getElementById('lattice-container');
    if (container) {
      container.addEventListener('touchmove', onTouch, { passive: true });
      const reset = () => { prevDist = 0; };
      container.addEventListener('touchend', reset);
      return () => {
        container.removeEventListener('touchmove', onTouch);
        container.removeEventListener('touchend', reset);
      };
    }
  }, []);

  // Click to "pluck" local tension pulse (visual ripple via shader)
  const handlePluck = (e: React.MouseEvent) => {
    const x = ((e.clientX / window.innerWidth) - 0.5) * 2;
    const y = ((e.clientY / window.innerHeight) - 0.5) * 2;
    setPulse({ x, y, strength: 1.0 });
    // decay pulse
    setTimeout(() => setPulse(p => ({...p, strength: 0})), 550);
  };

  const toggleAudio = () => {
    if (!audioRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 39;

      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 360;

      const g = ctx.createGain();
      g.gain.value = 0.001;

      const comp = ctx.createDynamicsCompressor();
      osc.connect(filt); filt.connect(g); g.connect(comp); comp.connect(ctx.destination);
      osc.start();

      audioRef.current = { ctx, osc, gain: g };
    }

    const { ctx, gain } = audioRef.current;
    if (audioOn) {
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      setAudioOn(false);
    } else {
      if (ctx.state === 'suspended') ctx.resume();
      gain.gain.linearRampToValueAtTime(0.014 + simParams.tension * 0.026, ctx.currentTime + 0.5);
      setAudioOn(true);
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioOn) return;
    a.gain.gain.linearRampToValueAtTime(0.011 + simParams.tension * 0.03, a.ctx.currentTime + 0.55);
  }, [simParams.tension, audioOn]);

  const applyPreset = (name: keyof typeof PRESETS) => {
    const tgt = PRESETS[name];
    const from = { ...simParams };
    gsap.to(from, {
      tension: tgt.tension,
      speed: tgt.speed,
      pullStrength: tgt.pullStrength,
      duration: 1.45,
      ease: 'power2.inOut',
      onUpdate() {
        setSimParams({ ...from });
      }
    });
  };

  useEffect(() => {
    const onScroll = () => {
      const scrollP = Math.min(1, window.scrollY / (window.innerHeight * 1.4));
      setSimParams(prev => ({ ...prev, tension: 0.28 + scrollP * 0.62 }));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-demo on load: cycle the four tension personalities so the distinct motion (smooth wave vs shear vs high-freq jitter vs settling overshoot) is immediately obvious
  useEffect(() => {
    const order: (keyof typeof PRESETS)[] = ['coherent', 'strain', 'peak', 'release'];
    let idx = 0;
    const t0 = setTimeout(() => {
      const step = () => {
        if (idx >= order.length) return;
        const name = order[idx++];
        const tgt = PRESETS[name];
        const from = { ...simParams };
        gsap.to(from, {
          tension: tgt.tension,
          speed: tgt.speed,
          pullStrength: tgt.pullStrength,
          duration: idx === 3 ? 1.8 : 0.95,
          ease: idx === 3 ? 'power2.out' : 'power2.inOut',
          onUpdate() { setSimParams({ ...from }); },
          onComplete() { if (idx < order.length) setTimeout(step, 680); }
        });
      };
      step();
    }, 1350);
    return () => clearTimeout(t0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="lattice-container" className="relative h-[100dvh] w-full overflow-hidden bg-black text-[#f8f4ff]" onClick={handlePluck}>
      <CanvasErrorBoundary>
      <Canvas
        camera={{ position: [0, 0.6, 8.2], fov: 45 }}
        style={{ background: '#000' }}
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.08} />
        <pointLight position={[0, 0, 0]} intensity={0.6 + simParams.tension * 0.8} color="#facc15" />
        <pointLight position={[1.5, 1, 2]} intensity={0.4} color="#c084fc" />
        <BackgroundStars />
        <NebulaField tension={simParams.tension} />

        <ArtScene 
          tension={simParams.tension} 
          speed={simParams.speed} 
          pullStrength={simParams.pullStrength} 
          mouse={mouse} 
          burst={burst * visualDamp} 
          reducedDamp={visualDamp} 
          pulse={pulse} 
        />
      </Canvas>
      </CanvasErrorBoundary>

      {/* Minimal elegant overlay - pure art, no distractions */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <div className="mono text-[10px] tracking-[6px] text-[#facc15]/55 mb-2">PROCEDURAL ART</div>
          <div className="font-display text-[clamp(3.8rem,11vw,7.2rem)] tracking-[-3.6px] text-white/95 drop-shadow-[0_2px_30px_rgba(0,0,0,0.6)]">LATTICE TENSION</div>
          {/* Visual micro-detail: tension-tied stress line under title (brightens and widens with strain) */}
          <div 
            className="h-px w-3/4 mx-auto mt-1.5 bg-gradient-to-r from-transparent via-[#facc15] to-transparent"
            style={{ 
              opacity: simParams.tension * 0.65 + 0.1, 
              transform: `scaleX(${0.4 + simParams.tension * 0.6})`,
              transition: 'transform 80ms linear, opacity 80ms linear'
            }}
          />
          <div className="mt-1.5 text-xs text-white/35 tracking-[2px]">counter-rotating helical filaments under procedural strain</div>
        </motion.div>
      </div>

      {/* Tension states */}
      <div className="pointer-events-auto absolute bottom-7 left-1/2 -translate-x-1/2 flex gap-1.5">
        {Object.keys(PRESETS).map((k) => (
          <button
            key={k}
            onClick={() => applyPreset(k as keyof typeof PRESETS)}
            className="mono text-[9px] tracking-[2px] px-3.5 py-1 border border-white/15 text-white/55 hover:border-[#facc15] hover:text-[#facc15] transition"
          >
            {k}
          </button>
        ))}
        <button
          onClick={toggleAudio}
          className="mono text-[9px] tracking-[2px] px-3.5 py-1 border border-white/15 text-white/55 hover:border-[#facc15] hover:text-[#facc15] transition ml-1"
        >
          {audioOn ? 'MUTE' : 'TONE'}
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 mono text-[8px] tracking-[2.5px] text-white/20">
        MOUSE • SCROLL • STATES
      </div>

      {/* Minimal error boundary note for canvas (robustness) */}
      {/* If WebGL fails, the black + title still reads as the art */}
    </div>
  );
}
