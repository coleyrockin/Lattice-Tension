# Tension Lattice — Aether

Real-time WebGPU artistic experience (React + R3F + Three r184 + TSL).

## Core Architecture
- Scroll-driven descent is the single source of truth. All camera, palette, simulation, and visual params flow through `sampleExperience(progress)` in chapters/interpolate.ts.
- Smoothed `descent` ref (in store.ts) + DescentDriver provides critically-damped glide so trackpad/wheel feels continuous.
- Two primary visuals: JellyOrb (raymarched glass membrane + internal lattice + refraction/caustics) and GyroidLattice (fullscreen volumetric raymarch of gyroid/Schwarz-P shells with absorption).
- Materials are created once per performance tier (`create*Material(steps)`) and expose uniforms. All per-frame updates happen in the respective *.tsx useFrame.
- Chapter definitions (definitions.ts) own the poetic narrative + distinct structural signatures (twist, swell, veil, resonance base, etc.). Never hardcode chapter visuals outside the interpolation system.
- Interaction (pointer, drag, impulse) drives both physics springs (jiggle/squash/slosh) and now **resonance imprints**.

## Adding or Changing Features
- New chapter params belong in `SimulationState` + `VisualLayerProfile` (types.ts), then populated in definitions.ts and mixed in interpolate.ts.
- New visual "knobs" → add a `uniform` in the material creator, wire it from the TSX component using the sampled chapter + any user state, then use in TSL.
- User-driven persistent effects (like resonance) accumulate in the zustand store via `addResonance`. Decay in the useFrame loops of the driving components. Feed `sample.simulation.xxx + userResonance` as the effective value.
- New realms (Interference, Singularity, Quantum Fold, Nebulae, Echo) extend the atlas. Add to SimulationState + definitions + interpolate (mix). New materials follow the create*Material factory + TSX driver pattern (see Gyroid/Jelly). Wire effective sim params (including new interference/singularity etc) + resonance. Integrate layered in AetherWorld based on progress/resonance.
- Frame-rate independence: use the precomputed K_* spring constants and `1 - exp(-k * dt)` form (see JellyOrb and GyroidLattice).
- TSL shaders: keep @ts-nocheck only in the material files. All app code stays strictly typed.
- Performance: respect the tier (STEPS high/medium/low). New effects must gracefully scale or be gated by `profile.postprocessing` etc.

## Code Style
- Match existing poetic but precise comments in shaders and drivers.
- No god files. Keep concerns in experience/, visuals/, chapters/, interface/.
- No console.log in production paths.
- Tests cover interpolation and profile only; keep them passing when you touch those modules.
- Build = `tsc -b && vite build`. Always leave it green.

## Theme
The piece is about hidden pressure/connection. New mechanics should feel like the viewer is leaving traces on the aether itself (imprints, memory, resonance) rather than overlay UI or external controls.

When in doubt, read the two material files and the two main visual components first. They are the heart.

