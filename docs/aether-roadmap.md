# Aether — WebGPU Roadmap

**North star:** Visible transformation — thick luminous filaments, real atmosphere, minimal HUD.

**Stack:** WebGPURenderer + TSL (materials, post); WebGL2 fallback tiers A/B/C.

---

## Phase 0 — Visual Reset (complete)

- AETHER branding, corner HUD, auto-fade
- Removed centered "LATTICE TENSION" overlay

## Phase 1 — WebGPU Bootstrap (complete)

- `engine/renderer/createRenderer.ts` — WebGPURenderer with tiered `forceWebGL`
- `engine/renderer/capability.ts` — A/B/C detection (WebGPU, WebGL2, Reduced)

## Phase 2 — TSL Filament Tubes (complete)

- `engine/tsl/filamentMaterial.ts` — Line2NodeMaterial glow
- `components/field/FilamentEdges.tsx` — thick deformed filaments
- Replaced 1px `LineSegments` wireframe

## Phase 3 — Beauty (complete)

- `lib/constants/atmosphere.ts` — per-state bloom/fog/camera presets
- `components/environment/NebulaVolume.tsx` — layered TSL volumetric shell
- `components/canvas/TSLPostPipeline.tsx` — bloom + film grain via RenderPipeline
- `engine/tsl/nodeMaterial.ts` — TSL instanced node glow
- `components/field/TSLFlowParticles.tsx` — GPU-rendered flow particles
- `components/canvas/CameraDirector.tsx` — state-driven orbit/jitter/pullback

## Phase 4 — Life (complete)

- `lib/tension/propagation.ts` — edge stress graph + pulse injection
- Click ripple visible on filaments (stress → width/color boost)
- `hooks/useTensionSonifier.ts` — 4-voice crossfading drone
- `components/ui/AetherHUD.tsx` — glass UI + state label flash on transition

## Phase 5 — Polish (complete)

- `lib/constants/perfTiers.ts` — Desktop / mobile / reduced-motion profiles
- Tier-scaled particles, stars, nebula segments, bloom, line width, DPR
- Void → field reveal (2s fade on load)
- `hooks/useIdleOrbit.ts` — 30s idle restarts coherent→release cycle
- Removed `gsap`, `framer-motion`, `@react-three/postprocessing`

---

## Perf Budgets (target)

| Tier | Particles | Stars | Bloom | DPR |
|------|-----------|-------|-------|-----|
| A    | 280       | 1400  | full  | 2   |
| B    | 150       | 700   | 70%   | 1.5 |
| C    | 60        | 320   | off   | 1   |