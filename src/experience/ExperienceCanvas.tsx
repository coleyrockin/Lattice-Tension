import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useExperienceStore } from "./store";
import { CameraRig } from "../visuals/CameraRig";
import { AetherWorld } from "../visuals/AetherWorld";
import { PostEffects } from "../visuals/PostEffects";

export function ExperienceCanvas() {
  const profile = useExperienceStore((state) => state.profile);
  const reducedMotion = useExperienceStore((state) => state.reducedMotion);
  const setReady = useExperienceStore((state) => state.setReady);

  return (
    <Canvas
      className="aether-canvas"
      dpr={[1, profile?.maxDpr ?? 1.25]}
      camera={{ position: [0, 0.2, 12.6], fov: 42, near: 0.1, far: 90 }}
      gl={{
        antialias: profile?.antialias ?? true,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#020207", 1);
        setReady(true);
      }}
    >
      <Suspense fallback={null}>
        <CameraRig />
        <AetherWorld />
        {!reducedMotion && profile?.postprocessing ? <PostEffects /> : null}
      </Suspense>
    </Canvas>
  );
}
