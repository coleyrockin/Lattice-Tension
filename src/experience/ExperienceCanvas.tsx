import { addAfterEffect, Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { WebGPURenderer } from "three/webgpu";
import { useExperienceStore } from "./store";
import { AetherWorld } from "../visuals/AetherWorld";
import { TslBloom } from "../visuals/TslBloom";

const RENDERER_INIT_TIMEOUT_MS = 8000;

/**
 * Pause the live organism while the tab is hidden. This prevents a background
 * raymarch and fixed-step simulation from burning GPU time on an invisible tab.
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

function RendererFailureMonitor() {
  const canvas = useThree((state) => state.gl.domElement);
  const setReady = useExperienceStore((state) => state.setReady);
  const setRenderError = useExperienceStore((state) => state.setRenderError);

  useEffect(() => {
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setReady(false);
      setRenderError(true);
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    return () => canvas.removeEventListener("webglcontextlost", onContextLost);
  }, [canvas, setReady, setRenderError]);

  return null;
}

function RenderedFrameReadySignal() {
  const profile = useExperienceStore((state) => state.profile);
  const setReady = useExperienceStore((state) => state.setReady);
  const frameStarted = useRef(false);

  useLayoutEffect(() => {
    setReady(false);
    frameStarted.current = false;

    const removeAfterEffect = addAfterEffect(() => {
      if (!frameStarted.current) return;
      frameStarted.current = false;
      setReady(true);
      removeAfterEffect();
    });

    return () => {
      removeAfterEffect();
      frameStarted.current = false;
      setReady(false);
    };
  }, [profile, setReady]);

  useFrame(() => {
    frameStarted.current = true;
  });

  return null;
}

/**
 * Adaptive resolution: the raymarched organism is quadratic in DPR. On a GPU
 * that can't hold frame rate, step DPR down until it
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

  useEffect(() => {
    const deviceDpr = Math.max(window.devicePixelRatio || 1, 1);
    const targetDpr = Math.min(deviceDpr, profile?.maxDpr ?? 1);

    ema.current = 0;
    warmup.current = 0;
    cooldown.current = 0;
    dpr.current = targetDpr;
    floorReached.current = false;
    setDpr(targetDpr);
  }, [profile, reducedMotion, setDpr]);

  useFrame((_, delta) => {
    if (reducedMotion || profile?.tier === "low" || floorReached.current) return;
    const dt = Math.min(delta, 0.1);
    if (warmup.current < 2) {
      warmup.current += dt;
      return;
    }
    if (dpr.current === null) dpr.current = gl.getPixelRatio();
    // Smoothed frame time so a single GC spike cannot trip a quality drop.
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
  const setRenderError = useExperienceStore((state) => state.setRenderError);

  if (!profile) return null;

  return (
    <Canvas
      key={profile.antialias ? "antialias-on" : "antialias-off"}
      className="aether-canvas"
      dpr={[1, profile.maxDpr]}
      camera={{ position: [0, 0, 0.64], fov: 48, near: 0.1, far: 20 }}
      gl={async (props) => {
        const preferWebGPU =
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).has("webgpu");
        const renderer = new WebGPURenderer({
          canvas: props.canvas as HTMLCanvasElement,
          antialias: profile.antialias,
          alpha: false,
          powerPreference: "high-performance",
          // The WebGPU adapter path can hang on some embedded browsers before
          // it can reject. Default to Three's stable TSL WebGL backend and keep
          // native WebGPU available as an explicit `?webgpu` opt-in.
          forceWebGL: !preferWebGPU,
        });
        let initTimeout: number | undefined;

        try {
          await Promise.race([
            renderer.init(),
            new Promise<never>((_, reject) => {
              initTimeout = window.setTimeout(
                () => reject(new Error("WebGPU renderer initialization timed out")),
                RENDERER_INIT_TIMEOUT_MS,
              );
            }),
          ]);
        } catch (error) {
          setRenderError(true);
          throw new Error("WebGPU renderer initialization failed", {
            cause: error,
          });
        } finally {
          if (initTimeout !== undefined) window.clearTimeout(initTimeout);
        }
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.51;
        return renderer;
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#010716", 1);
      }}
    >
      <RendererFailureMonitor />
      <VisibilityPause />
      <AdaptiveResolution />
      <Suspense fallback={null}>
        <AetherWorld />
        {!reducedMotion && profile.postprocessing ? <TslBloom /> : null}
        <RenderedFrameReadySignal />
      </Suspense>
    </Canvas>
  );
}
