import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { WebGPURenderer } from "three/webgpu";
import { useExperienceStore } from "./store";
import { AetherWorld } from "../visuals/AetherWorld";
import { TslBloom } from "../visuals/TslBloom";

/**
 * Pause the render loop while the tab is hidden. WebGPU setAnimationLoop is not
 * reliably throttled when backgrounded, so four full-screen raymarch shaders can
 * keep burning the GPU on an invisible tab — heating the machine and worsening
 * foreground performance after a tab switch. frameloop "never" stops all frames.
 */
function VisibilityPause() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    const onVis = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [setFrameloop]);
  return null;
}

export function ExperienceCanvas() {
  const profile = useExperienceStore((state) => state.profile);
  const reducedMotion = useExperienceStore((state) => state.reducedMotion);
  const setReady = useExperienceStore((state) => state.setReady);
  const setRenderError = useExperienceStore((state) => state.setRenderError);

  return (
    <Canvas
      className="aether-canvas"
      dpr={[1, profile?.maxDpr ?? 1.25]}
      camera={{ position: [0, 0, 0.65], fov: 50, near: 0.1, far: 20 }}
      gl={async (props) => {
        const renderer = new WebGPURenderer({
          canvas: props.canvas as HTMLCanvasElement,
          antialias: profile?.antialias ?? true,
          alpha: false,
          powerPreference: "high-performance",
          forceWebGL:
            typeof navigator !== "undefined" &&
            !(navigator as unknown as { gpu?: unknown }).gpu,
        });
        try {
          await renderer.init();
        } catch {
          setRenderError(true);
          throw new Error("WebGPU renderer initialization failed");
        }
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.51;
        return renderer;
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#020207", 1);
        setReady(true);
      }}
    >
      <Suspense fallback={null}>
        <VisibilityPause />
        <AetherWorld />
        {!reducedMotion && profile?.postprocessing ? <TslBloom /> : null}
      </Suspense>
    </Canvas>
  );
}
