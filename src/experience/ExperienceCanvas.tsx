import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { WebGPURenderer } from "three/webgpu";
import { useExperienceStore } from "./store";
import { AetherWorld } from "../visuals/AetherWorld";
import { TslBloom } from "../visuals/TslBloom";

export function ExperienceCanvas() {
  const profile = useExperienceStore((state) => state.profile);
  const reducedMotion = useExperienceStore((state) => state.reducedMotion);
  const setReady = useExperienceStore((state) => state.setReady);

  return (
    <Canvas
      className="aether-canvas"
      dpr={[1, profile?.maxDpr ?? 1.25]}
      camera={{ position: [0, 0, 2.35], fov: 50, near: 0.1, far: 20 }}
      gl={async (props) => {
        const renderer = new WebGPURenderer({
          canvas: props.canvas as HTMLCanvasElement,
          antialias: profile?.antialias ?? true,
          alpha: false,
          powerPreference: "high-performance",
        });
        await renderer.init();
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.72;
        return renderer;
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#020207", 1);
        setReady(true);
      }}
    >
      <Suspense fallback={null}>
        <AetherWorld />
        {!reducedMotion ? <TslBloom /> : null}
      </Suspense>
    </Canvas>
  );
}
