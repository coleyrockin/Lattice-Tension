# Aether / Tension Lattice — Audit Remediation Handoff

Full audit: 87 confirmed findings (visual + code). Source report:
`~/agents/logs/aether-audit-2026-06-14.md` (auditor machine).

**Session of 2026-06-14 shipped a subset** (commit fixing raymarch striation /
seam / mid-realm washout). Everything below is **NOT done** and is handed to the
next agent. Each item cites file:line from the audit. Re-verify visually
(Playwright canvas `toDataURL` sweep over progress `[0,0.12,0.27,0.35,0.5,0.58,
0.74,0.9,1.0]`) — the GPU canvas times out native screenshots at the 5s MCP cap.

---

## ✅ Done this session (do not redo)
- gyroidLattice: per-ray dither on march start `t` (striation §2.3).
- gyroidLattice: smooth-abs `sqrt(f²+ε)` for distance fold (removes C0 seam kink, §2.2 — **partial**, see remaining below).
- gyroidLattice: deeper absorption (−12→−19/−8 band, floor 0.55), fog gate `.min(0.05)`, tightened emission (§2.1).
- TslBloom: screen-blend bloom, threshold ≥0.92, dropped upward exposure compensation (§2.1).
- jellyOrb: inner refraction loop 6→10 with rescaled falloff (§2.3 orb).
- interpolate: defensive signature copy `{...from.signature}` (§4 logic, line 97).

## ❌ Remaining — VISUAL (the piece's dominant problem)
- **§2.2 Normal sign-flip seam** — smooth-abs landed but the `g.mul(sign(fgg.f))` normal at `gyroidLatticeMaterial.ts:216` still 180°-flips across `f=0`. Replace with continuous rotation: `n = normalize(g.mul(smoothstep(-band,band,f).mul(2).sub(1)))`. Same construct in `InterferenceMaterial.ts:191`, `EchoMaterial.ts:186`.
- **§2.4 Concentric ring banding** — make `nearFade`/`depth` (`gyroidLatticeMaterial.ts:207,222`) functions of continuous `length(p-ro)`, not quantized `t`; collapse the 5 stacked focal lobes (`:294-304`) into one term.
- **§2.5 Orb loses material identity** mid-descent — keep a minimum refractive rim + specular even at low `orbPresence` (`jellyOrbMaterial.ts:447-448`, `JellyOrb.tsx:158`).
- **§2.6 Bloom "lens-flare" disc** floats beside orb — tie focal glow (`gyroidLatticeMaterial.ts:293-312`) to orb world position, clamp peak.
- **§2.6 RGB hue cross-fade dead zone** at 0.06 — `interpolate.ts mixColor` lerps RGB through gray. Hue-preserving space, or carry teal/bring magenta sooner. (Held this session: dark void→sepia HSL can swing through bad hues — verify carefully.)
- **§2.6 8-bit posterization / chromatic specks** — add blue-noise/ordered dither before output; unify normal floor `.max(0.001)` vs distance floor `.max(0.35)` (`:217`), blend toward `rd.negate()` when `|g|` tiny.
- **§2.6 Orb interior checkerboard** "golf-ball" caustic (`jellyOrbMaterial.ts:370-385`).

## ❌ Remaining — a11y
- **CRITICAL §3 — reduced-motion must STOP the experience** (WCAG 2.3.3). Set Canvas `frameloop="demand"` on `reducedMotion`, zero all motion factors, disable autoplay, stop audio tick. (`ExperienceCanvas.tsx`, `GyroidLattice.tsx:51`, `CameraRig.tsx:20`.) **High-risk against the live WebGPU bloom pipeline — re-verify render still fires.**
- **HIGH — Fragment modal** `role="dialog" aria-modal` with zero focus management (`InterfaceOverlay.tsx:396-415`) — native `<dialog>.showModal()` or trap+restore+`inert`.
- **HIGH — landmarks** — add `<main>`, stable visually-hidden page `<h1>`, skip link, `<noscript>` (`index.html:32-35`).
- MED — HUD contrast (0.28–0.5 alpha, 7–8px) over live canvas, add scrim, ≥0.7/≥11px (`styles.css`).
- MED — resonance/atlas progress via mutating `aria-label` → `role=progressbar`+`aria-valuenow` (`InterfaceOverlay.tsx:186-272`).
- MED — reduced-motion doesn't gate autoplay or `navigateToChapter` smooth scroll.
- LOW — collapsed telemetry slider tabbable in `aria-hidden`; missing `aria-expanded`/`aria-valuetext`.

## ❌ Remaining — performance
- MED — `CameraRig.tsx:16`, `BackgroundDriver.tsx:20`, `TslBloom.tsx:42` re-call `sampleExperience()` per frame — read `frameSample.current` cache instead (~16–24 redundant Color allocs/frame).
- MED — 1.76 MB single JS chunk — `manualChunks` vendor split (`three`/`three/webgpu`/`three/tsl`) + lazy post stack behind `profile?.postprocessing` (`vite.config.ts`).
- MED — per-tier materials `useMemo([tier])` with **no GPU disposal**; resize tier flip at 700/1200px orphans pipelines — debounce + dispose in cleanup (`GyroidLattice.tsx:25-27`).
- LOW — Echo 3× child-gyroid sub-loop: add per-tier child-count uniform (`EchoMaterial.ts:256`).
- LOW — `STEP=0.032` makes march reach vary by tier (depth, not just quality) — scale `STEP=REACH/stepCount`.
- LOW — `InterfaceOverlay` re-renders ~14×/s; DPR fallback `1.25` overshoots low-tier `maxDpr=1`; `useSmoothedDescent` writes 6 CSS vars/rAF with no `document.hidden` guard.

## ❌ Remaining — logic / UX
- LOW — share decode `isNaN`/`parseFloat` accepts trailing garbage → `Number.isFinite` + reject (`AetherExperience.tsx:129-142`).
- UX — autoplay wrap snaps `scrollProgress→0` causing reverse scrub — hard-set `descent.value`/`target=0` on wrap (`AetherExperience.tsx:85-96`).
- UX — audio consent not persisted (no `localStorage`); default reduced-motion to audio-off (`useAetherAudio.ts`).
- UX — UI palette CSS vars **snap** per chapter while scene lerps — drive from `sampleExperience(d).palette` (`useSmoothedDescent.ts:19-36`).
- UX — global keydown hijacks Space/Arrows on a 1200vh page; 9px rail hit targets (<44px WCAG 2.5.5).
- LOW — last chapter `origin_core` `span=1e-6` → `chapterProgress` is a 0→1 step (latent).
- LOW — audio graph can briefly run two `AudioContext`s under fast toggle — force-close prior synchronously.

## ❌ Remaining — build / docs / nits
- LOW — no `og:image`/`twitter:image` → social shares render blank; add 1200×630 lattice render + `og:url` (`index.html:11-22`).
- NIT — export `RESONANCE_MAX` const (magic `2.2` in 9 sites); same for `Math.min(delta,1/30)` dt clamp.
- NIT — dead `pointer` uniform on gyroid/interference/echo (no shader reader); dead `standalone` prop on all three tunnel layers.
- NIT — extract ~110 duplicate lines across Gyroid/Interference/Echo drivers into `useTunnelDriver`; split 417-line `InterfaceOverlay` god-component.
- NIT — `CameraRig` uses `clock.getElapsedTime()` (mutates) vs `.elapsedTime` elsewhere.
- Test gaps — no coverage for damped smoothing, resonance clamp/decay, autoplay wrap, share encode/decode round-trip.

## §5 Uncertain / worth a look
- Unify absorption into one STEP-invariant helper with `absorptionScale` floor (gyroid −12 vs interference −16 vs echo −16/−9).
- Mid-realm pastel descent: defect vs intended — taste call for art direction.
