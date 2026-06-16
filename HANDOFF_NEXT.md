# Aether — Next-Agent Handoff (2026-06-16)

Supersedes `PERFECTION_HANDOFF.md`. Scope so far: **visual only** (no a11y/SEO/features).
Goal: every one of the 12 chapters so beautiful a stranger says "holy shit, what IS this."

## Current state
- `main` @ `ab5d399` (pushed to `github.com/coleyrockin/Lattice-Tension`, Vercel auto-deploys on `main`).
- A 12-chapter visual overhaul just shipped. All 12 now read as distinct, vivid, structured
  frames with real blacks (was washed milk / dots-on-black). Gate green: `npm run build` +
  10/10 tests + lint.
- Reference contact sheet of the shipped look: `~/agents/screenshots/aether/contact_FIN.jpg`
  (individual frames: `~/agents/screenshots/aether/NN_<name>_FIN.jpg`).

### What shipped (so you don't redo it)
1. Absorption range compressed to a 0.62–1.08 band (remap in the 3 `*Layer.tsx`) + coupled
   emission-multiplier drop + halved extinction coeff + veil clamp, in all 3 march materials
   (`gyroidLatticeMaterial.ts`, `InterferenceMaterial.ts`, `EchoMaterial.ts`). This was the
   master fix — high absorption used to extinguish the ray to a focal dot, low absorption blew
   to white foam.
2. March-frequency floor `Math.max(1.8, …)` in `GyroidLattice.tsx` (Nebula's freq was NEGATIVE
   → DC field → flat wall).
3. Per-chapter color grade WIRED in `TslBloom.tsx` (was static): blackPoint/contrast/saturation
   driven from signature; contrast S-curve pivot lowered 0.5→0.35 (lifts low-mids).
4. Focal glow recentered (was off-center `vec2(0.42,-0.06)` "status LED"), field-energy gated,
   recolored in-palette (was always raw `highlight` → universal orange). In all 3 march mats.
5. Jelly orb: interior fill (`deepBody` 0.62→0.88), body alpha floor 0.18→0.42 (was a hollow
   rim), centered (`JellyOrb.tsx` x 0.095→0, origin camera target.x→0); origin ghost-cathedral
   `latticeReveal` 0→0.15; origin/origin_core `interiorCrystalline` up. Nebula fog turbulence.
6. Palette fidelity: 3rd palette colour folded into emission (gentle 0.15 weight — 0.35 muddied
   identity, don't raise it).
7. Luminance-based highlight roll-off (hue-preserving) — bright realms keep colour instead of
   desaturating to white (Aether now violet).
8. `samplePalette` plateau in `interpolate.ts` — chapter CENTER now shows its own colour (was a
   ~50/50 OKLab blend with the next chapter — pattern's lime centre rendered collapse-red).
9. Nebula primary↔secondary swapped to blue-led (pure gold `#ffd700` skews to CRIMSON under
   ACESFilmic + the saturation grade on dim chapters).

## HOW TO VERIFY (read this before touching shaders — the capture is the hard part)
- WebGPU canvas: native/CDP screenshots and `drawImage(webgpuCanvas→2dCtx)` come back BLACK.
  Only `canvas.toDataURL('image/jpeg', q)` called DIRECTLY on the WebGPU canvas works, and it
  TEARS to near-black most grabs. Use **brightest-of-30-grabs** per frame, with DENSE luma on a
  160×100 proxy (sample every pixel — sparse sampling misses thin/dark features).
- Position deterministically with the dev-only `window.__snapDescent(atlasValue)` hook
  (`store.ts`, `import.meta.env.DEV` gated). Scroll-driven descent lags under the throttled MCP
  rAF and lands on the wrong chapter. Chapter centers = range midpoints: origin 0.083,
  tension 0.25, pattern 0.417, collapse 0.583, emergence 0.75, aether 0.917, interference 1.083,
  singularity 1.25, quantum 1.417, nebula 1.583, echo 1.75, origin_core 1.917.
- The FIRST snap after a fresh page load can be a fluke → do a warm-up snap first. Wait ~3s
  after navigate before `__snapDescent` exists (module init).
- Dev server: `npx vite --port 5182 --strictPort` via a BACKGROUND runner (plain `&`/`nohup`
  instances kept dying; 5173 gets grabbed by other projects). HMR websocket fails under the MCP
  browser → re-navigate to pick up edits (vite still serves current file contents per request).
- Drive the browser via `playwright-personal-2`. Write ALL output under `~/agents/` (never the
  repo or home root) EXCEPT committed docs like this one.

## NEXT TASKS (priority order)

### A. Live motion review (do first — only static frames have been verified)
Watch the deployed/dev site scroll end-to-end: chapter transitions, the orb jiggle/drag
interaction, the resonance imprints on click. Confirm nothing regressed in motion and the
crossfades between chapters read smoothly. ~10 min.

### B. Performance backlog (the other half of "portfolio-grade" — must be buttery on a mid laptop)
Untouched, carried from the original handoff:
- GPU material/render-target disposal leaks (dispose on unmount / tier change; TslBloom targets).
- Per-frame `sampleExperience` cache for CameraRig/BackgroundDriver/TslBloom (they each
  re-derive it; `frameSample.current` already exists in store — reuse it like the layers do).
- Echo child sub-loop tier-gate (HIGH GPU on low tiers), harder reduced-motion / low-tier gating,
  adaptive runtime FPS step-down.
Target: 60fps on a normal laptop + a graceful mobile/low-tier story. Verify with the perf HUD.

### C. Dark-chapter lift (optional polish)
- `tension` and `singularity` render dark/moody. Singularity is a black hole so darkness suits
  it, but both could show more visible electric lattice structure. Nudge their emission or
  reveal; keep singularity's deep-black sink.

### D. Nebula hue (optional)
- Now magenta-purple, intended gold/blue. Striking as-is. If chasing the intended hue, the enemy
  is the ACES gold-skew (see #9) — work in a hue that survives ACES, don't fight it with raw gold.

### E. Presentation polish (for the portfolio framing)
- Loading state, typography pass, a one-line concept intro, sound design check, zero console
  errors. A 20–40s screen-capture video for résumé/LinkedIn (most viewers won't run WebGPU).

## Gotchas
- ACES + the saturation grade skews pure gold → red on dim chapters (see Nebula).
- Tuned signature values are covered by `interpolate.test.ts` — if you change one, update the
  expected value in the same commit (don't delete coverage).
- The 3 march materials are siblings with near-identical structure — apply shader changes to all
  three or chapters drift apart.
- `__snapDescent` is a DEV-only test affordance; fine to leave (stripped from prod build).
