'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';

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

function TensionLattice({ tension, mouse, mousePull }: { tension: number; mouse: { x: number; y: number }; mousePull: number }) {
  const group = useRef<THREE.Group>(null!);
  const nodesRef = useRef<THREE.InstancedMesh>(null!);
  const edgesRef = useRef<THREE.LineSegments>(null!);
  const flowRef = useRef<THREE.Points>(null!);

  const { nodes, edges, edgePhases } = useMemo(() => {
    const nodes: THREE.Vector3[] = [];
    const edges: number[] = [];
    const edgePhases: number[] = [];

    const LAYERS = 7;
    const STRANDS = 10;
    const PER = 8;

    // Central core
    nodes.push(new THREE.Vector3(0, 0, 0));

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

          // Organic ridge displacement (tension warps the helix)
          const disp = Math.sin(t * 12 + l * 1.4) * 0.07 + Math.cos(s * 2.3) * 0.05;
          x += (x / r) * disp * (0.7 + tension * 0.4);
          z += (z / r) * disp * (0.7 + tension * 0.4);

          const idx = nodes.length;
          nodes.push(new THREE.Vector3(x, y, z));

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

    return { nodes, edges, edgePhases };
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

  const flowCount = 220;
  const flowPos = useMemo(() => new Float32Array(flowCount * 3), []);
  const flowPhase = useMemo(() => new Float32Array(flowCount), []);

  useMemo(() => {
    for (let i = 0; i < flowCount; i++) {
      const ei = Math.floor(Math.random() * edgeCount);
      const a = edges[ei * 2], b = edges[ei * 2 + 1];
      const tt = Math.random();
      const p = nodes[a].clone().lerp(nodes[b], tt);
      flowPos[i * 3] = p.x; flowPos[i * 3 + 1] = p.y; flowPos[i * 3 + 2] = p.z;
      flowPhase[i] = Math.random() * Math.PI * 2;
    }
  }, []);

  const flowGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
    g.setAttribute('phase', new THREE.BufferAttribute(flowPhase, 1));
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pull = mousePull * 0.8 + tension * 0.6;

    if (group.current) {
      group.current.rotation.y = t * 0.018 + Math.sin(t * 0.25) * 0.03 * tension;
      const s = 1 + Math.sin(t * 0.6) * 0.018 * tension;
      group.current.scale.setScalar(s);
    }

    // Nodes pulled by tension + mouse (the "tension" visualization)
    if (nodesRef.current) {
      for (let i = 1; i < nodeCount; i++) {
        const home = nodes[i];
        const pos = home.clone();

        const dir = pos.clone().negate().normalize();
        pos.add(dir.multiplyScalar(tension * 0.3 + pull * 0.1));

        // Mouse directional strain
        pos.x += mouse.x * pull * 0.75;
        pos.y += mouse.y * pull * 0.6;

        // Helical breathing, damped by high tension (feels "locked" when strained)
        const ph = (i % 13) * 0.5;
        const damp = 1 - tension * 0.6;
        pos.x += Math.sin(t * 1.2 + ph) * 0.04 * damp;
        pos.z += Math.cos(t * 1.1 + ph) * 0.04 * damp;

        dummy.position.copy(pos);
        dummy.updateMatrix();
        nodesRef.current.setMatrixAt(i, dummy.matrix);
      }
      nodesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Tense filaments - bow and brighten with tension
    if (edgesRef.current) {
      const attr = edgesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < edgeCount; i++) {
        const a = edges[i * 2], b = edges[i * 2 + 1];
        const pa = nodes[a].clone();
        const pb = nodes[b].clone();

        const mid = pa.clone().lerp(pb, 0.5);
        const force = mid.clone().negate().normalize().multiplyScalar(tension * 0.22 + pull * 0.08);
        pa.add(force); pb.add(force);

        attr.setXYZ(i * 2, pa.x, pa.y, pa.z);
        attr.setXYZ(i * 2 + 1, pb.x, pb.y, pb.z);
      }
      attr.needsUpdate = true;
    }

    // Flow particles - faster and more chaotic with tension
    if (flowRef.current) {
      const attr = flowRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const spd = 0.7 + tension * 1.5;

      for (let i = 0; i < flowCount; i++) {
        const ei = (i * 5) % edgeCount;
        const a = edges[ei * 2], b = edges[ei * 2 + 1];
        const tt = ((t * spd + flowPhase[i]) % 1);

        const p = nodes[a].clone().lerp(nodes[b], tt);
        p.x += Math.sin(t * 2.4 + i) * 0.03 * tension;
        p.z += Math.cos(t * 2.0 + i) * 0.03 * tension;

        attr.setXYZ(i, p.x, p.y, p.z);
      }
      attr.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodeCount]}>
        <icosahedronGeometry args={[0.034, 1]} />
        <meshBasicMaterial color="#f8f4ff" transparent opacity={0.95} />
      </instancedMesh>

      <lineSegments ref={edgesRef} geometry={edgeGeo}>
        <lineBasicMaterial color="#c084fc" transparent opacity={0.75} linewidth={1.5} />
      </lineSegments>

      <points ref={flowRef} geometry={flowGeo}>
        <pointsMaterial size={0.024} color="#facc15" transparent opacity={0.85} sizeAttenuation />
      </points>

      {/* Central tension core - brighter under strain */}
      <mesh>
        <sphereGeometry args={[0.12]} />
        <meshBasicMaterial color="#fff" transparent opacity={0.6 + tension * 0.35} />
      </mesh>
    </group>
  );
}

function BackgroundStars() {
  const pointsRef = useRef<THREE.Points>(null!);
  const { positions, sizes } = useMemo(() => {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 12 + Math.random() * 28;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = 0.6 + Math.random() * 1.4;
    }
    return { positions: pos, sizes: sz };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.003;
    }
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial size={0.9} color="#f8f4ff" transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

function ArtScene({ tension, mouse }: { tension: number; mouse: { x: number; y: number } }) {
  const mousePull = Math.min(1, Math.hypot(mouse.x, mouse.y) * 1.25);

  return (
    <>
      <TensionLattice tension={tension} mouse={mouse} mousePull={mousePull} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.55 + tension * 0.85} luminanceThreshold={0.1} luminanceSmoothing={0.72} />
        <ChromaticAberration offset={[0.0007 + tension * 0.0011, 0.0004]} />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.03 + tension * 0.018} />
        <Vignette offset={0.2} darkness={0.68} />
      </EffectComposer>
    </>
  );
}

export default function LatticeTension() {
  const [tension, setTension] = useState(0.42);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [audioOn, setAudioOn] = useState(false);
  const [reduced, setReduced] = useState(false);

  const audioRef = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = ((e.clientX / window.innerWidth) - 0.5) * 2;
      const y = ((e.clientY / window.innerHeight) - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

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
      gain.gain.linearRampToValueAtTime(0.014 + tension * 0.026, ctx.currentTime + 0.5);
      setAudioOn(true);
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioOn) return;
    a.gain.gain.linearRampToValueAtTime(0.011 + tension * 0.03, a.ctx.currentTime + 0.55);
  }, [tension, audioOn]);

  const applyPreset = (name: keyof typeof PRESETS) => {
    const tgt = PRESETS[name];
    gsap.to({ val: tension }, {
      val: tgt.tension,
      duration: 1.45,
      ease: 'power2.inOut',
      onUpdate() { setTension(this.targets()[0].val); }
    });
  };

  useEffect(() => {
    const onScroll = () => {
      const p = Math.min(1, window.scrollY / (window.innerHeight * 1.4));
      setTension(0.28 + p * 0.62);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black text-[#f8f4ff]">
      <Canvas
        camera={{ position: [0, 0.6, 8.2], fov: 45 }}
        style={{ background: '#000' }}
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.08} />
        <pointLight position={[0, 0, 0]} intensity={0.6 + tension * 0.8} color="#facc15" />
        <pointLight position={[1.5, 1, 2]} intensity={0.4} color="#c084fc" />
        <BackgroundStars />
        <ArtScene tension={tension} mouse={mouse} />
      </Canvas>

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
          <div className="mt-2 text-xs text-white/35 tracking-[2px]">counter-rotating helical filaments under procedural strain</div>
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
    </div>
  );
}
