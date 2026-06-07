# Aether — Implementation Roadmap

**North star:** A tension field you inhabit — immense, luminous, alive.

**Approach:** Field refactor (multi-scale organisms, stress physics, volumetric atmosphere, cinematic camera). Single URL, procedural only, four tension personalities preserved.

---

## Phase 1 — Foundation (complete)

**Goal:** Modular architecture with zero visual regression.

| Deliverable | Done when |
|---|---|
| `docs/aether-roadmap.md` | This file committed |
| `lib/constants/` | Presets, palette, motion constants extracted |
| `lib/tension/types.ts` | Shared simulation types |
| `lib/lattice/generateHelix.ts` | Pure geometry generator |
| `components/shaders/` | Vertex/fragment shaders isolated |
| `components/canvas/` | Error boundary, camera, post, experience shell |
| `components/field/` | Lattice + art scene |
| `components/environment/` | Stars, nebula |
| `components/ui/` | HUD, controls |
| `hooks/useTensionInput.ts` | Mouse, scroll, touch, pluck |
| `hooks/useTensionAudio.ts` | Tone toggle + tension sync |
| `app/page.tsx` | ≤50 lines, imports experience only |

**Exit criteria:** `npm run build` and `npm run lint` pass. Visual parity with pre-refactor.

---

## Phase 2 — Scale (complete)

**Goal:** Scene feels vast — multiple organisms, GPU particles, volumetric depth.

| Deliverable | Done when |
|---|---|
| `lib/lattice/generateField.ts` | 3–5 organisms + bridge topology |
| `LatticeOrganism.tsx` | Single organism from generator |
| `FilamentBridge.tsx` | Inter-organism stress connections |
| `MacroArcs.tsx` | Large background filament arcs |
| `useGPUParticles.ts` | Replace CPU flow loop; 20k+ particles @60fps |
| `NebulaVolume.tsx` | Shader volume replaces flat planes |

**Exit criteria:** Desktop sustains 60fps with 3 organisms. First impression reads as *field*, not *object*.

---

## Phase 3 — Beauty

**Goal:** Four tension states look like four artworks.

| Deliverable | Done when |
|---|---|
| `lib/constants/atmosphere.ts` | Per-state palette + fog + bloom uniforms |
| `AtmosphereController.tsx` | Cross-fades environment on preset change |
| `CameraDirector.tsx` upgrade | Orbit, lean, jitter, release pullback per state |
| Filament/node shader v2 | Iridescence, subsurface, stress-driven sheen |
| `PostPipeline.tsx` upgrade | ACES tone map, tension grain, lens bloom |

**Exit criteria:** Screenshot test — coherent/strain/peak/release are visually distinct at a glance.

---

## Phase 4 — Life

**Goal:** Interaction feels causal; audio reinforces state.

| Deliverable | Done when |
|---|---|
| `lib/tension/propagation.ts` | Edge stress graph + impulse damping |
| `useTensionSimulation.ts` | Mouse injects local stress, propagates along filaments |
| `TensionSonifier.tsx` | 4-voice crossfading drone |
| `TensionHUD.tsx` v2 | Ambient glass UI; fades on idle; state labels on transition |

**Exit criteria:** Click produces visible ripple through connected filaments. Preset change shifts atmosphere + camera + audio together.

---

## Phase 5 — Polish

**Goal:** Production-ready across devices.

| Deliverable | Done when |
|---|---|
| Perf tiers | Desktop / mobile / reduced-motion profiles |
| Load sequence | Void → field reveal over 2s |
| Idle orbit | 30s no-input auto coherent→release cycle |
| Profiling pass | Document fps budgets per tier |

**Exit criteria:** Mobile playable at 30fps+. `prefers-reduced-motion` respected.

---

## File Budget

- No source file >200 lines (shaders exempt)
- No logic in `app/page.tsx` beyond composition
- All new systems behind typed interfaces in `lib/`

## Sacred Constraints

- Procedural only — no external assets
- Single experience — one route, one canvas
- Black void canvas; minimal UI
- Four states: coherent · strain · peak · release