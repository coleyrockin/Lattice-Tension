# Aesther

**Aesther** is one interactive ocean-blue organism made from raymarched water-glass, modal physics, and responsive light. It is deliberately a single screen: there are no chapters, scroll narrative, cards, or hidden destinations.

Every press, pull, flick, and release passes through one fixed-step controller. That controller drives the shell deformation, delayed slosh, surface-wave memory, sparse stress field, optical energy, and opt-in sound together.

## Controls

- Press directly on the orb to compress its surface.
- Drag across it to pull the shell and internal mass.
- On iPad, use two or more fingers to pinch, spread, and twist the organism. Aesther combines up to five simultaneous contacts into one bounded physical response.
- Release a drag to send momentum, spin, and outward waves through the organism. Flick velocity decays naturally if the orb is held still before release.
- Tap for a shallow compression and a single radial wave.
- Use `Enter` or `Space` for a center touch; arrow keys issue bounded directional impulses.
- Sound is off by default. Use the control in the upper-right corner to enable the generative liquid drone.

## Architecture

- `src/simulation/organismController.ts` owns the 120 Hz fixed-step modal simulation, aggregates simultaneous contacts into compression, stretch, shear, and torsion, and exposes a read-only `OrganismSnapshot`.
- `src/visuals/JellyOrb.tsx` maps that snapshot into the TSL raymarcher: volume-preserving strain, local pressure, surface waves, liquid veils, and wet optics.
- `src/visuals/contactGesture.ts` samples pointer motion and turns release timing into bounded, time-decayed momentum.
- `src/visuals/SpectralStressField.tsx` stays almost invisible at rest and wakes only when organism energy and waves rise.
- `src/experience/useAetherAudio.ts` provides deterministic, opt-in contact tones and a liquid drone from that same snapshot.
- Zustand holds only low-frequency application state: readiness, sound, reduced-motion preference, quality profile, and renderer failure.

## Performance and Accessibility

- Fixed simulation step: 120 Hz, clamped and damped to settle safely.
- Adaptive DPR and high/medium/low profiles scale raymarch steps, stress-field density, postprocessing, and audio detail.
- Reduced-motion mode scales simulation, shader phase, postprocessing, and camera movement together; it never enables sound automatically.
- Loading clears only after a completed frame. Renderer errors and context loss show a designed static fallback instead of a blank page.

## Development

```bash
npm ci
npm run dev
# Opens at http://127.0.0.1:5182/
npm run test
npm run test:coverage
npm run lint
npm run build
```

The default renderer uses Three's stable TSL WebGL backend. Add `?webgpu` to the local URL to request the WebGPU backend where supported.
