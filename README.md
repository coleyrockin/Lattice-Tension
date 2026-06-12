# Tension Lattice

<div align="center">
  <a href="https://github.com/coleyrockin/Lattice-Tension/stargazers"><img src="https://img.shields.io/github/stars/coleyrockin/Lattice-Tension?style=flat-square" alt="Stars"></a>
  <a href="https://github.com/coleyrockin/Lattice-Tension/issues"><img src="https://img.shields.io/github/issues/coleyrockin/Lattice-Tension?style=flat-square" alt="Issues"></a>
</div>

---

## Overview

_Tension Lattice_ (Aether Atlas) is a **real‑time WebGPU art piece** exploring the hidden geometry of the universe across multiple realms. Scroll-driven descent through the gyroid lattice + new cosmic layers (Interference waves, Singularity horizons, Quantum folds, Nebula veils, Echo memory). Resonance imprints let your interactions permanently scar and evolve the aether — your personal universe is shareable via URL.

The lattice’s shape is the level‑set of a single equation; *tension* controls the wall thickness. At peak tension the form morphs toward the classic Schwarz‑P surface, creating a hypnotic vortex that feels both organic and crystalline.

---

## Features

- ✨ **WebGPU first** – Powered by Three.js `WebGPURenderer` with TSL (Three Shading Language) node materials.
- 📱 **Responsive fallback** – Seamlessly degrades to WebGL2 (`forceWebGL`) when WebGPU isn’t available.
- 🎮 **Interactive physics** – Click‑drag the orb to impart momentum; the lattice reacts with spring‑damper dynamics.
- 🎨 **Custom shaders** – Full‑screen emissive volumetric march, depth‑graded teal→indigo palette, and bloom post‑processing.
- 🖱️ **Scroll‑driven narrative** – `scrollProgress` drives a camera dolly and a smooth cross‑fade from orb to lattice.

---

## Tech Stack

- **Framework**: React with React‑Three‑Fiber (R3F)
- **Graphics**: Three.js r184, WebGPU & WebGL2
- **Shaders**: Three Shading Language (TSL) and custom GLSL
- **Build**: Vite + TypeScript
- **Deployment**: Vercel (auto‑deploy on `main` push)

---

## Getting Started

```bash
# Install dependencies
npm ci

# Run the development server
npm run dev      # → http://127.0.0.1:5173
```

The app will automatically detect WebGPU support. If you want to force WebGL2 for testing, set the `forceWebGL` flag in `src/experience/ExperienceCanvas.tsx`.

---

## Development

- **Linting** – `npm run lint`
- **Testing** – `npm run test`
- **Building** – `npm run build` (runs `tsc -b` type-checking first)

All scripts are defined in `package.json`. Code style is enforced via ESLint.

---

## Deploy

Push to the `main` branch – Vercel will pick up the changes, run `npm run build`, and serve the production bundle.

---

## Contributing

Contributions are welcome! Please open an issue before submitting a PR. Follow the existing code style, write tests for new features, and keep the documentation up‑to‑date.
