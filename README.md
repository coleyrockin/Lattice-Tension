# Tension Lattice — Aether Atlas

<div align="center">

**[→ Live Demo](https://aether-five-liard.vercel.app)**

<a href="https://github.com/coleyrockin/Lattice-Tension/stargazers"><img src="https://img.shields.io/github/stars/coleyrockin/Lattice-Tension?style=flat-square" alt="Stars"></a>
<a href="https://github.com/coleyrockin/Lattice-Tension/issues"><img src="https://img.shields.io/github/issues/coleyrockin/Lattice-Tension?style=flat-square" alt="Issues"></a>

</div>

---

## Overview

_Tension Lattice — Aether Atlas_ is a **real-time WebGPU art piece** — a scroll-driven descent through twelve realms of hidden geometry. Each realm is a distinct visual world: raymarched gyroid lattice, jelly glass orbs, interference wave fields, singularity horizons, nebula veils, echo memory. Your interactions leave resonance imprints that scar and evolve the aether; your personal descent is shareable via URL.

The lattice's shape is the level-set of a single equation; _tension_ controls the wall thickness. At peak tension the form morphs toward the classic Schwarz-P surface, creating a hypnotic vortex that feels both organic and crystalline.

---

## The Twelve Realms

| # | Realm | Character |
|---|-------|-----------|
| 01 | Origin | Glass orb awakening in deep blue |
| 02 | Tension | Crystalline lattice under pressure |
| 03 | Pattern | Gyroid geometry at full resolution |
| 04 | Collapse | Structure fracturing inward |
| 05 | Emergence | Form resolving from chaos |
| 06 | Aether | Violet cathedral, maximum crystalline |
| 07 | Interference | Wave-field superposition |
| 08 | Singularity | Gravitational horizon |
| 09 | Quantum | Probability fold |
| 10 | Nebula | Veil of stellar dust |
| 11 | Echo | Memory web, pink filament lattice |
| 12 | Origin Core | Return — warm glass orb in cream light |

---

## Features

- **WebGPU first** — Three.js `WebGPURenderer` + TSL (Three Shading Language) node materials. Full volumetric raymarching in-shader.
- **WebGL2 fallback** — Seamlessly degrades when WebGPU isn't available.
- **Interactive physics** — Click-drag the orb to impart momentum; spring-damper jiggle + slosh simulation respond in real time.
- **Resonance imprints** — Pointer interactions accumulate resonance that modifies the field. Shareable via URL query params.
- **Scroll-driven narrative** — Critically-damped camera dolly + per-chapter color/structure crossfades driven by scroll position.
- **Adaptive quality** — Three performance tiers (high/medium/low) auto-selected by GPU capability.

---

## Tech Stack

- **Framework**: React 19 + React-Three-Fiber (R3F) v9
- **Graphics**: Three.js r184, WebGPU & WebGL2
- **Shaders**: Three Shading Language (TSL) node materials — no raw GLSL
- **Build**: Vite 8 + TypeScript 6
- **State**: Zustand
- **Deployment**: Vercel (auto-deploy on `main` push)

---

## Getting Started

```bash
npm ci
npm run dev      # → http://127.0.0.1:5173
```

WebGPU is required for the full experience. Chrome 113+ or Edge 113+ recommended. To force WebGL2 fallback for testing, set the `forceWebGL` flag in `src/experience/ExperienceCanvas.tsx`.

---

## Development

```bash
npm run lint     # ESLint
npm run test     # Vitest (unit tests)
npm run build    # tsc -b + vite build (full gate)
npm run preview  # Preview the production build locally
```

---

## Deploy

Push to `main` — Vercel auto-deploys via the GitHub integration. The `vercel.json` at the repo root is required; without it Vercel won't run the build step.

Live: **https://aether-five-liard.vercel.app**
