import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
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

/**
 * Adaptive resolution: the scene is four full-screen raymarches whose cost is
 * quadratic in DPR. On a GPU that can't hold frame rate, step DPR down until it
 * can — render resolution is the cheapest quality to spend, and the emissive
 * glow + bloom hide the drop almost entirely (same rationale as profile.maxDpr).
 *
 * Design choices that keep this safe to ship without live FPS telemetry:
 *  - ONE-DIRECTIONAL: only ever steps down, never back up, so it cannot
 *    oscillate/thrash the swapchain. Worst case it settles a notch low.
 *  - WARMUP IGNORE: skips the first ~2s so first-frame shader-compile spikes
 *    don't trigger a needless drop.
 *  - EMA + COOLDOWN: decides on a smoothed frame time and waits after each step
 *    for the resize to settle before measuring again.
 *  - No-op on reduced-motion / low tier (already at minimum) and on fast GPUs
 *    (frame time never crosses the threshold).
 */
function AdaptiveResolution() {
  const setDpr = useThree((s) => s.setDpr);
  const gl = useThree((s) => s.gl);
  const profile = useExperienceStore((s) => s.profile);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const ema = useRef(0);
  const warmup = useRef(0);
  const cooldown = useRef(0);
  const dpr = useRef<number | null>(null);
  const floorReached = useRef(false);

  useFrame((_, delta) => {
    if (reducedMotion || profile?.tier === "low" || floorReached.current) return;
    const dt = Math.min(delta, 0.1);
    if (warmup.current < 2) {
      warmup.current += dt;
      return;
    }
    if (dpr.current === null) dpr.current = gl.getPixelRatio();
    // smoothed frame time so a single GC/scroll spike can't trip a drop
    ema.current = ema.current === 0 ? dt : ema.current + (dt - ema.current) * 0.05;
    if (cooldown.current > 0) {
      cooldown.current -= dt;
      return;
    }
    const fps = 1 / ema.current;
    const floor = Math.max(0.85, (profile?.maxDpr ?? 1) * 0.6);
    if (fps < 48 && dpr.current > floor + 0.001) {
      dpr.current = Math.max(floor, dpr.current - 0.12);
      setDpr(dpr.current);
      ema.current = 0; // re-measure cleanly once the resize settles
      cooldown.current = 1.5;
      if (dpr.current <= floor + 0.001) floorReached.current = true;
    }
  });
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
      dpr={[1, profile?.maxDpr ?? 1]}
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
        <AdaptiveResolution />
        <AetherWorld />
        {!reducedMotion && profile?.postprocessing ? <TslBloom /> : null}
      </Suspense>
    </Canvas>
  );
}
