'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';

import BlackHole from './BlackHole';
import Starfield from './Starfield';
import Nebula from './Nebula';
import ParticleField from './ParticleField';
import { SectionId } from '@/lib/types';

interface CosmicSceneProps {
  scrollProgress: number;
  currentSection: SectionId;
  mouse: { x: number; y: number };
  intensity: number;
  isReducedMotion?: boolean;
}

// Inner scene that receives live props
function SceneContent({ scrollProgress, currentSection, mouse, intensity, isReducedMotion }: CosmicSceneProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null!);

  // Cinematic camera choreography driven by scroll + section
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const prog = scrollProgress;

    // Base camera distance + subtle dolly
    const baseZ = 9.5 - prog * 3.2;
    const sectionBoost = 
      currentSection === 'hero' ? 1.6 :
      currentSection === 'infinite' ? -1.8 : 0;

    const targetZ = baseZ + sectionBoost;
    camera.position.z += (targetZ - camera.position.z) * 0.035;

    // Gentle orbiting + mouse parallax
    const orbit = prog * 0.7 + t * 0.012;
    const mx = mouse.x * 1.8;
    const my = mouse.y * 1.1;

    camera.position.x = Math.sin(orbit) * (1.8 + prog * 0.6) + mx * 0.6;
    camera.position.y = Math.cos(orbit * 0.7) * (0.9 + prog * 0.4) + my * 0.55 - prog * 1.1;

    camera.lookAt(
      mx * 0.9, 
      my * 0.7 + Math.sin(t * 0.2) * 0.2, 
      -1.5 - prog * 1.8
    );

    // Global group breathing + section tilt
    if (groupRef.current) {
      const breath = 1.0 + Math.sin(t * 0.35) * 0.012 * intensity;
      groupRef.current.scale.setScalar(breath);

      const tilt = (currentSection === 'archive' || currentSection === 'observatory') ? 0.08 : 0;
      groupRef.current.rotation.y = Math.sin(orbit * 0.3) * 0.035 + tilt;
      groupRef.current.rotation.x = Math.cos(t * 0.07) * 0.018;
    }
  });

  // Dynamic intensity per section for bloom/particles
  const sectionIntensity = 
    currentSection === 'hero' ? 1.0 :
    currentSection === 'infinite' ? Math.min(1.0, intensity + 0.4) :
    Math.max(intensity, 0.75);

  const climax = currentSection === 'infinite' ? Math.min(1, scrollProgress * 1.6) : 0;

  return (
    <group ref={groupRef}>
      {/* Deep distant stars — slow parallax layer */}
      <Starfield count={isReducedMotion ? 620 : 2400} radius={58} speed={0.0035} intensity={sectionIntensity * 0.85} />

      {/* Mid layer stars */}
      {!isReducedMotion && (
        <Starfield count={1100} radius={31} speed={0.011} intensity={sectionIntensity * 1.0} />
      )}

      {/* Volumetric nebulae — multiple overlapping for rich gas */}
      <Nebula 
        position={[-9, 4, -22]} 
        rotation={[0.4, 2.1, -0.8]} 
        scale={31} 
        color1="#2a1f4a" 
        color2="#4a2f6e" 
        density={0.78}
        speed={0.6}
        intensity={sectionIntensity * 0.85} 
      />
      <Nebula 
        position={[11, -7, -18]} 
        rotation={[-0.7, -1.6, 0.9]} 
        scale={26} 
        color1="#1f2a3e" 
        color2="#3f2a5e" 
        density={0.65}
        speed={1.15}
        intensity={sectionIntensity * 0.75} 
      />
      <Nebula 
        position={[0, 2, -32]} 
        rotation={[1.1, 0.3, 0.6]} 
        scale={38} 
        color1="#3a1f4a" 
        color2="#5a3a7a" 
        density={0.55}
        speed={0.4}
        intensity={sectionIntensity * 0.6} 
      />

      {/* Central reactive singularity */}
      <BlackHole 
        mouse={mouse} 
        intensity={sectionIntensity} 
        climax={climax} 
      />

      {/* Living particle field — code, runes, sparks */}
      <ParticleField 
        count={isReducedMotion ? 280 : 620} 
        intensity={sectionIntensity} 
        mouse={mouse} 
        mousePull={Math.min(1, Math.hypot(mouse.x, mouse.y) * 1.4)} 
      />

      {/* Extra foreground sparks on high energy sections */}
      {(currentSection === 'infinite' || currentSection === 'hero') && !isReducedMotion && (
        <ParticleField 
          count={190} 
          intensity={sectionIntensity * 1.1} 
          mouse={mouse} 
          mousePull={0.6} 
        />
      )}
    </group>
  );
}

// Main exported component — fixed immersive canvas
export default function CosmicScene({ 
  scrollProgress, 
  currentSection, 
  mouse, 
  intensity,
  isReducedMotion = false 
}: CosmicSceneProps) {
  const [glContextLost, setGlContextLost] = useState(false);

  // Graceful fallback if WebGL dies
  useEffect(() => {
    const handler = () => setGlContextLost(true);
    window.addEventListener('webglcontextlost', handler, false);
    return () => window.removeEventListener('webglcontextlost', handler);
  }, []);

  if (glContextLost) {
    return (
      <div className="fixed inset-0 z-[-1] bg-[#050818] flex items-center justify-center">
        <div className="text-[#f8f4ff]/40 text-sm tracking-[3px] mono">THE VOID IS QUIET TODAY</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas
        camera={{ position: [0, 0.6, 9.8], fov: 44, near: 0.1, far: 180 }}
        style={{ background: '#000000' }}
        gl={{
          powerPreference: 'high-performance',
          alpha: false,
          antialias: !isReducedMotion,
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
        }}
        dpr={isReducedMotion ? [1, 1.35] : [1, 1.85]}
      >
        <Suspense fallback={null}>
          <SceneContent 
            scrollProgress={scrollProgress} 
            currentSection={currentSection} 
            mouse={mouse} 
            intensity={intensity} 
            isReducedMotion={isReducedMotion}
          />

          {/* Post-processing — the cinematic soul */}
          <EffectComposer multisampling={isReducedMotion ? 0 : 4}>
            <Bloom
              intensity={1.65 + intensity * 1.1}
              luminanceThreshold={0.12}
              luminanceSmoothing={0.78}
              kernelSize={3}
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={[0.0009 + intensity * 0.0018, 0.0006]}
            />
            <Noise
              premultiply
              blendFunction={BlendFunction.OVERLAY}
              opacity={0.035 + intensity * 0.025}
            />
            <Vignette
              offset={0.22}
              darkness={0.72}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Subtle vignette overlay for extra depth */}
      <div 
        className="absolute inset-0 pointer-events-none z-10" 
        style={{
          background: 'radial-gradient(ellipse 82% 68% at 50% 48%, transparent 38%, rgba(0,0,0,0.72) 100%)'
        }}
      />
    </div>
  );
}
