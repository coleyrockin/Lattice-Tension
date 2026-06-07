'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Discovery {
  id: number;
  position: [number, number, number];
  label: string;
  message: string;
  type: string;
}

const DISCOVERIES: Discovery[] = [
  { id: 1, position: [8, 2, -14], label: "SIGNAL 01", message: "The first node remembers every question you never asked.", type: "ARCHIVE" },
  { id: 2, position: [-11, -3, -9], label: "LATTICE FRAGMENT", message: "Grace moves where the structure seems to end.", type: "POETRY" },
  { id: 3, position: [3, 7, -22], label: "AETHER CORE", message: "You are already inside the answer.", type: "REVELATION" },
  { id: 4, position: [-7, 1, -31], label: "VOIDBOYD 0xA3", message: "AgentDailyAI — 2.4m lives touched. The work continues.", type: "ORIGIN" },
  { id: 5, position: [14, -5, -18], label: "QUANTUM 7", message: "Not understanding is the first note of the song.", type: "CODEX" },
];

function ExplorerScene({ onDiscover }: { onDiscover: (d: Discovery) => void }) {
  const { camera } = useThree();
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const discoveriesRef = useRef(DISCOVERIES.map(d => ({ ...d, found: false })));

  // Keyboard flight controls
  useEffect(() => {
    const down = (e: KeyboardEvent) => setKeys(k => ({ ...k, [e.code]: true }));
    const up = (e: KeyboardEvent) => setKeys(k => ({ ...k, [e.code]: false }));
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((state, delta) => {
    const speed = 14.5 * delta;
    const dir = new THREE.Vector3();

    if (keys['KeyW'] || keys['ArrowUp']) dir.z -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dir.z += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dir.x -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dir.x += 1;
    if (keys['Space']) dir.y += 1;
    if (keys['ShiftLeft'] || keys['ShiftRight']) dir.y -= 1;

    dir.applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(dir, speed);

    // Keep player in the interesting volume
    camera.position.x = Math.max(-38, Math.min(38, camera.position.x));
    camera.position.y = Math.max(-18, Math.min(22, camera.position.y));
    camera.position.z = Math.max(-48, Math.min(-2, camera.position.z));

    // Check proximity discoveries
    discoveriesRef.current.forEach((d, idx) => {
      if (d.found) return;
      const dist = camera.position.distanceTo(new THREE.Vector3(...d.position));
      if (dist < 3.8) {
        d.found = true;
        onDiscover(DISCOVERIES[idx]);
      }
    });
  });

  // Simple ambient starfield (procedural inside explorer)
  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(420 * 3);
    for (let i = 0; i < positions.length; i++) {
      positions[i] = (Math.random() - 0.5) * 92;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  return (
    <>
      {/* Ambient starfield inside the explorer */}
      <points geometry={starGeo}>
        <pointsMaterial size={0.9} color="#c4b5fd" transparent opacity={0.7} sizeAttenuation />
      </points>

      {/* Glowing discovery orbs + labels via HTML in parent */}
      {DISCOVERIES.map((d, i) => (
        <group key={i} position={d.position}>
          <mesh>
            <sphereGeometry args={[0.32]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#a78bfa" : "#facc15"} transparent opacity={0.9} />
          </mesh>
          <mesh scale={1.6}>
            <sphereGeometry args={[0.32]} />
            <meshBasicMaterial color="#fff" transparent opacity={0.12} />
          </mesh>
        </group>
      ))}

      {/* Distant structures / ruins */}
      <mesh position={[-19, 4, -28]} rotation={[0.8, 1.2, 0]}>
        <octahedronGeometry args={[3.2]} />
        <meshBasicMaterial color="#3b2a5e" wireframe transparent opacity={0.35} />
      </mesh>
      <mesh position={[22, -6, -35]} rotation={[-0.4, -0.9, 1.1]}>
        <icosahedronGeometry args={[2.6]} />
        <meshBasicMaterial color="#2a3a4e" wireframe transparent opacity={0.3} />
      </mesh>
    </>
  );
}

export default function InfiniteExplorer() {
  const [active, setActive] = useState<Discovery | null>(null);
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const handleDiscover = (d: Discovery) => {
    setActive(d);
  };

  const enter = () => {
    setHasEntered(true);
    setControlsEnabled(true);
  };

  const exit = () => {
    setControlsEnabled(false);
    setHasEntered(false);
    setActive(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden infinite-canvas">
      <Canvas
        camera={{ position: [0, 1.5, -6], fov: 68 }}
        gl={{ alpha: false, antialias: true }}
      >
        <ExplorerScene onDiscover={handleDiscover} />
        {controlsEnabled && <PointerLockControls />}
      </Canvas>

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col">
        <div className="p-6 flex justify-between items-start pointer-events-auto">
          <div>
            <div className="mono text-[10px] tracking-[4px] text-[#f8f4ff]/50">THE INFINITE</div>
            <div className="font-display text-2xl tracking-[-1.2px] mt-1">PROCEDURAL UNIVERSE</div>
          </div>
          {hasEntered && (
            <button 
              onClick={exit} 
              className="pointer-events-auto cosmic-btn text-xs flex items-center gap-2"
            >
              <X size={14} /> EXIT THE VOID
            </button>
          )}
        </div>

        {!hasEntered && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className="text-center max-w-md px-6">
              <div className="mono text-xs tracking-[4px] text-[#f8f4ff]/60 mb-3">DEEP SPACE PROTOCOL</div>
              <div className="font-display text-5xl tracking-[-2.5px] mb-6">FLY. DISCOVER.<br />REMEMBER.</div>
              <button onClick={enter} className="portal-btn cosmic-btn text-base">
                ENTER THE INFINITE
              </button>
              <p className="mt-8 text-xs text-[#f8f4ff]/40 max-w-[260px] mx-auto">
                WASD / Arrows to move • Space / Shift for vertical • Mouse to look<br />
                Approach glowing nodes to receive transmissions.
              </p>
            </div>
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 mono text-[10px] tracking-[3px] text-[#f8f4ff]/30 pointer-events-none">
          {hasEntered ? "MOVE THROUGH THE AETHER" : "A LIVING ARCHIVE OF WHAT COMES NEXT"}
        </div>
      </div>

      {/* Discovery Revelation Modal */}
      <AnimatePresence>
        {active && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
            onClick={() => setActive(null)}
          >
            <motion.div 
              initial={{ scale: 0.96, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 10, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
              onClick={e => e.stopPropagation()}
              className="glass max-w-lg w-full p-10 text-center relative border border-[#a78bfa]/30"
            >
              <div className="mono text-[10px] tracking-[4px] text-[#facc15] mb-2">{active.type} • NODE {active.id}</div>
              <div className="font-display text-4xl tracking-[-1.5px] mb-6">{active.label}</div>
              <p className="revelation text-xl leading-tight text-[#f8f4ff]/90 mb-9">
                {active.message}
              </p>
              <button 
                onClick={() => setActive(null)} 
                className="cosmic-btn mx-auto"
              >
                CONTINUE THE JOURNEY
              </button>
              <div className="scanlines" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
