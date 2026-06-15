# Aether — Visual + Performance "Perfection" Handoff

Scope locked with Boyd: **visual + performance only.** No a11y, no SEO/build-robustness,
no new features (share link explicitly out). Goal: orbs look amazing, the descent feels
amazing, remove fluff that costs frames. Orb ambition = "bugs + tasteful enhancement".

Verification method that WORKS for this WebGPU canvas (native screenshots time out):
- `npm run dev` (127.0.0.1:5173), drive via Playwright (`playwright-personal-2` — personal
  profile was busy), capture with `canvas.toDataURL('image/jpeg',0.85)` saved to a file,
  decode base64 → jpeg, Read it. Note: `toDataURL` occasionally tears (catches a frame
  mid-present → looks half-clipped); just re-capture once to confirm.
- Baseline + after frames in `~/agents/screenshots/aether-fix-*.jpeg`.
- Full adversarially-verified audit (115 findings, 45 refuted): `~/agents/logs/aether-audit-2026-06-14-full.md`.

---

## ✅ Shipped this session (verified on real pixels, build + 10 tests green)

### Orb (`src/visuals/jellyOrbMaterial.ts`) — the headline
1. **True per-pixel view ray** — replaced hardcoded `vec3(0,0,-1)` with
   `normalize(positionGeometry - modelWorldMatrixInverse·cameraPosition)`. This was THE
   bug flattening the orb: every view-dependent term (fresnel/refraction/reflection/spec)
   was only correct dead-centre. Now glass across the whole sphere.
2. **`DoubleSide` → `FrontSide` + `depthTest=false`** — the true ray exposed a hard
   vertical seam from back-face double-compositing; also a 2× overdraw perf win on the
   scene's heaviest shader.
3. **NaN-guarded normal** — `grad / max(length(grad),1e-5)` (core gradient → 0 → NaN).
4. **Dithered interior lattice march** (`lp` start jittered by per-pixel hash) — killed the
   concentric stair-step rings.
5. **Softened alias sources** — `frostN` 34/31→13/11.5, `sparkMask` 31.7/26.3→18.3/15.1.
6. **Tasteful enhancement** — luminous dispersive fresnel rim-glow (subtle chromatic
   split), brighter glassy env reflection floor, reduced absorption for translucency.

### Tunnel / descent (`InterferenceMaterial.ts`, `EchoMaterial.ts`)
Propagated the gyroid-only shipped fixes that were never copied to the siblings — this is
what fixed the milky mid-descent washout (deep blacks now form):
- per-ray march-start **dither** (added `fract` import)
- **smooth-abs** distance fold `sqrt(f²+ε)` (added `sqrt` import; Echo child too)
- **deeper absorption** −16→−19 dense end (Interference low end −6→−7, Echo −9→−8)

---

## ⏳ NOT done — next agent, in priority order (all from the audit report)

### Visual (still open)
- **Normal sign-flip seam** `g.mul(sign(fgg.f))` still in all 3 tunnel materials
  (gyroid:~231, interference:~191, echo:~186) + jelly. Audit fix: continuous rotation
  `normalize(g.mul(smoothstep(-band,band,f).mul(2).sub(1)))`. Deferred — higher risk, verify shading.
- **Output dither** in `TslBloom.tsx` — 8-bit banding on the dark void/bloom gradients.
  Add a small screen-space dither before output (note: ACES + sRGB are applied by the
  renderer after the pipeline outputNode, so it's pre-tonemap linear — tune amplitude, or
  use `renderOutput` + `outputColorTransform=false` to dither post-tonemap).
- **OKLab color transitions** — `interpolate.ts mixColor` (HIGH) lerps palette hues through
  gray; saturation collapses at chapter joins. Mix in OKLab/HSL.
- **Focal-glow disc** computed in aspect-stretched UV → off-centre ellipse on widescreen,
  decoupled from orb (gyroid/interference/echo). Make circular + anchor to orb screen pos.
- **`absorptionScale` uniform** for interference/echo (parity w/ gyroid) so layers densify
  per-chapter — needs wiring in `InterferenceLayer.tsx` / `EchoLayer.tsx` from `sig.absorption`.
- Dead final chapter `origin_core` span `1e-6` (`interpolate.ts`) — frozen end.

### Performance / de-fluff (Boyd: "take out fluff slowing the site")
- **GPU disposal**: materials `useMemo([tier])` recreate pipelines on resize tier-flip with
  no `dispose()` (GyroidLattice:27, JellyOrb:50, Interference/Echo); TslBloom render targets
  never disposed. Real leaks.
- **Bundle**: single 1.76 MB chunk — add `manualChunks` vendor split (three/webgpu/tsl) in
  `vite.config.ts`; and `sourcemap: false` for prod (7.9 MB map generated).
- **Reduced-motion / low tier** still runs 4 full-step raymarches at full DPR — gate harder.
- **Runtime FPS downgrade** — tier is a one-way width/cores guess; add adaptive step-down.
- **Per-frame `sampleExperience`** re-called in CameraRig:16 / BackgroundDriver:20 /
  TslBloom:44 instead of `frameSample.current` cache (~24 Color allocs/frame).
- **CSS-var thrash** — `useSmoothedDescent.ts` writes 6 `:root` vars every rAF, no
  `document.hidden` guard, no diffing (HIGH perf).
- **DPR fallback** `?? 1.25` → `?? 1` (ExperienceCanvas:35).
- Echo child sub-loop 3× `fieldFG` per step, no tier scaling (HIGH GPU cost).

### Possible further orb polish (taste)
Interior is elegant but a touch empty at ORIGIN; could lift the suspended lattice glow
slightly. Rim glow strength (`rimGlow.mul(0.55)`) is tunable. Don't overcook.
