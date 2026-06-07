# VOIDBOYD — Searching the Cosmos

A production-ready, jaw-dropping cosmic cyber-mystical 3D artistic website built with **Next.js (App Router) + React Three Fiber + Three.js + Tailwind + Framer Motion + GSAP**.

Theme: "Searching for the Meaning and Answers of the Universe" — a living digital temple of volumetric nebulae, a reactive black hole singularity, holographic archives, live celestial data, and a fully interactive procedural universe explorer.

## What Makes It Special

- **Insanely beautiful custom GLSL**: Black hole with gravitational lensing, accretion disk, mouse-reactive spacetime drag. Volumetric nebulae via fBM noise. Multiple particle species (sparks, runes, code fragments).
- **Cinematic post-processing**: Bloom + Chromatic Aberration + Film Grain + Vignette, all intensity-reactive.
- **Scroll-synced camera choreography** + global mouse that affects the entire universe in real time.
- **The Archive**: Live GitHub projects as gorgeous clickable holographic artifacts.
- **The Observatory**: Real SpaceX launches + crypto prices as pulsing celestial bodies.
- **The Infinite**: First-person flyable universe (PointerLock) with hidden discovery nodes that deliver poetic transmissions.
- **Reactive procedural audio drone** that breathes with scene energy.
- **Performance-first**: Instancing, smart DPR, reduced-motion path, mobile-friendly.
- **Production**: Fully typed, builds cleanly, Vercel deploy ready.

## Run Locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Build & Deploy

```bash
npm run build
npm start
```

Push to GitHub → Vercel (connected) will auto-deploy on every push to main.

## Project Structure

```
app/
  layout.tsx          # SEO, cosmic metadata, Toaster
  page.tsx            # The entire infinite-scroll temple
  globals.css         # Deep void + neon lavender cyber aesthetics

components/3d/
  CosmicScene.tsx     # Main fixed living canvas + composer
  BlackHole.tsx       # The beating heart (custom shaders)
  Starfield.tsx
  Nebula.tsx
  ParticleField.tsx
  InfiniteExplorer.tsx # Standalone flyable procedural universe

lib/
  shaders.ts          # All custom GLSL (blackhole, nebula, particles)
  types.ts
```

## Notes

- No external assets required. Everything is procedural.
- GitHub / SpaceX / CoinGecko data fetched client-side with graceful artistic fallbacks.
- The old LATTICE experience lives in spirit inside this new temple.

Built to make people stop scrolling and whisper "holy shit".

Continue.
