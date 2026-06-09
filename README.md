# Tension Lattice

A real-time WebGPU art piece about the hidden geometry of the universe — a single
descent from an object into the structure beneath it.

You begin on a molten glass orb floating in the void. Scroll, and the camera falls
*into* it: the glass membrane gives way and you emerge inside an infinite, luminous
**gyroid lattice** — a triply-periodic minimal surface rendered as glowing
translucent shells you can see through, layer after layer, into a spiral vortex.
The lattice **is** the level-set of one equation; tension is the wall thickness
inside it; at peak tension it morphs toward the Schwarz-P surface.

## How it works

- **Renderer:** Three.js r184 `WebGPURenderer` with TSL (Three Shading Language)
  node materials, driven through React Three Fiber. Falls back losslessly to
  WebGL2 (`forceWebGL`) where WebGPU is unavailable.
- **The orb** (`src/visuals/jellyOrbMaterial.ts`) — a bounded raymarched SDF
  membrane: twin tori + core, multi-octave domain-warp wobble, iridescent
  fresnel, chromatic rim, an internal lattice seen through the glass, and a
  spring-damper jiggle (click it / flick the cursor — it lurches with momentum).
- **The lattice** (`src/visuals/gyroidLatticeMaterial.ts`) — a fullscreen
  emissive volumetric march: glowing gyroid shells accumulated with absorption,
  a self-contained shader camera (`ro`/`fwd`/`aspect`) descending the (1,1,1)
  screw axis, depth-graded teal→indigo color, and a focal vortex core.
- **The journey** — `scrollProgress` drives a camera dolly into the orb and an
  alpha crossfade from orb to lattice (`src/visuals/AetherWorld.tsx`).
- **Post** — a TSL `RenderPipeline` bloom pass over the output luminance, run by
  taking over the R3F render loop with a priority `useFrame`
  (`src/visuals/TslBloom.tsx`).

## Develop

```bash
npm install
npm run dev      # http://127.0.0.1:5173
```

## Validate

```bash
npm run lint
npm run build
npm run test
```

## Deploy

Push to `main` → Vercel builds and deploys automatically.
