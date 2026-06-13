/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — TSL node DSL: runtime-correct, but its operator types can't be
// modeled by TypeScript. App code outside this shader stays fully type-checked.
import { Color, Vector2, Vector3 } from "three";
import { NodeMaterial } from "three/webgpu";
import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  cross,
  dot,
  exp,
  float,
  length,
  max,
  mix,
  normalize,
  positionGeometry,
  screenUV,
  sign,
  sin,
  smoothstep,
  uniform,
  vec2,
  vec3,
  vec4,
  cos,
  time,
} from "three/tsl";
import { fieldFG } from "./sdf";

/** Cell density — tuned for crossed-wave fringe scale. */
export const INTERFERENCE_FREQ = 4.9;
/** Descent heading: the (1,1,1) body diagonal — crossings along the screw. */
export const INTERFERENCE_HEADING: readonly [number, number, number] = [1, 1, 1];

/**
 * INTERFERENCE // Crossed Waves.
 *
 * Every crossing leaves a trace that was not there before. A volumetric
 * gyroid shell layer whose distance bands are etched by orthogonal sin waves.
 * Fringes appear where waves cross; resonance scars make those fringes
 * persistent and brighter — the lattice remembers the shape of its questions.
 *
 * Modeled 1:1 on gyroidLatticeMaterial: same self-contained camera, fieldFG
 * normalized distance, volumetric emissive/absorption march, scar/echo,
 * structural uniforms (twist/swell/veil), tiered STEPS, reveal discard.
 * Added: interference + fringeAmp uniforms; crossed-wave modulation applied
 * directly to the surface band (distanceToSurface) so fringes are geometric,
 * not just color. Resonance amplifies fringe depth and echo carry.
 *
 * Poetic but precise. No new deps.
 */
export function createInterferenceMaterial(steps: number) {
  const ro = uniform(new Vector3());
  const fwd = uniform(new Vector3(1, 1, 1).normalize());
  const aspect = uniform(1);
  const tension = uniform(0.16);
  const pulse = uniform(0);
  const reveal = uniform(1); // 0 = invisible (black), 1 = full (gated by realm progress)
  const pointer = uniform(new Vector2());
  const collapse = uniform(0);
  const emergence = uniform(0);
  const order = uniform(0);
  const stress = uniform(0.5);
  const resonance = uniform(0); // user imprints — scars and resonant filaments
  // per-chapter structural signatures (reused for atlas continuity)
  const twist = uniform(0);
  const swell = uniform(0);
  const veil = uniform(0);
  const tint = uniform(new Color("#4fd8ff"));
  const accent = uniform(new Color("#ff6bb3"));
  const highlight = uniform(new Color("#aaff88"));
  const stepCount = uniform(steps);
  // per-chapter cell density — Interference realm tightens for visible crossings
  const freq = uniform(INTERFERENCE_FREQ);

  // Interference-specific: wave crossing strength + fringe amplitude.
  // Resonance will amplify both so fringes persist and scars echo louder.
  const interference = uniform(0);
  const fringeAmp = uniform(0.55);

  const FREQ = freq;

  const raymarch = Fn(() => {
    // --- in-shader camera (identical framing) ---
    const uv = screenUV.mul(2).sub(1).toVar();
    uv.x.mulAssign(aspect);
    const tanFov = float(0.55).add(tension.mul(0.12));
    const f = normalize(fwd).toVar();
    const right = normalize(cross(f, vec3(0, 1, 0))).toVar();
    const up = normalize(cross(right, f)).toVar();
    const rd = normalize(
      f.add(right.mul(uv.x.mul(tanFov))).add(up.mul(uv.y.mul(tanFov))),
    ).toVar();

    // peak tension OR high order both reshape the lattice toward Schwarz-P
    const morph = max(
      smoothstep(0.82, 0.97, tension),
      smoothstep(0.55, 0.95, order).mul(0.85),
    ).toVar();
    const thickness = mix(float(0.026), float(0.048), tension)
      .mul(float(1).sub(order.mul(0.28)))
      .mul(float(1).sub(veil.mul(0.45)))
      .toVar();

    // fixed orthonormal frame around the descent axis
    const axisH = vec3(0.5774, 0.5774, 0.5774);
    const axisR = vec3(-0.7071, 0.0, 0.7071);
    const axisU = vec3(-0.4082, 0.8165, -0.4082);

    // skip all march work while invisible
    reveal.lessThan(0.01).discard();

    // EMISSIVE VOLUMETRIC: march straight through, accumulate glowing shells
    const STEP = float(0.032);
    const t = float(0.02).toVar();
    const glow = vec3(0).toVar();
    const trans = float(1).toVar();
    const key = normalize(vec3(0.4, 0.7, 0.55));

    Loop(stepCount, () => {
      const p = ro.add(rd.mul(t)).toVar();
      // click pulse: a travelling brightening shell
      const pulseRing = exp(length(p.sub(ro)).sub(pulse.mul(7)).pow(2).mul(-0.5)).mul(pulse);

      // COLLAPSE twist: shear the cells helically around the descent axis
      const axial = dot(p, axisH);

      // RESONANCE IMPRINTS (user scars): axial ridges + filaments.
      // In Interference these become the seeds that amplify the crossed fringes.
      const scarPhase = axial.mul(7.4).add(time.mul(0.031));
      const scar = resonance
        .mul(0.014)
        .mul(sin(scarPhase).mul(0.6).add(0.7))
        .mul(smoothstep(0.2, 0.95, resonance));
      const echo = resonance
        .mul(0.9)
        .mul(
          exp(
            length(p.sub(ro))
              .sub(resonance.mul(3.8))
              .pow(2)
              .mul(-0.11),
          ),
        );
      const theta = axial.mul(twist.mul(0.42));
      const radial = p.sub(axisH.mul(axial));
      const x1 = dot(radial, axisR);
      const x2 = dot(radial, axisU);
      const ct = cos(theta);
      const st = sin(theta);
      const pT = axisH
        .mul(axial)
        .add(axisR.mul(x1.mul(ct).sub(x2.mul(st))))
        .add(axisU.mul(x1.mul(st).add(x2.mul(ct))))
        .toVar();

      // EMERGENCE swell: cell size breathes in slow waves along the path
      const localFreq = FREQ.mul(
        float(1).sub(swell.mul(0.26).mul(sin(axial.mul(0.55)))),
      ).toVar();

      const fgg = fieldFG(pT.mul(localFreq), morph);
      const gradientLength = max(length(fgg.g), 0.35);
      const distanceToSurface = abs(fgg.f).div(gradientLength).div(localFreq);

      // CROSSED WAVE INTERFERENCE — the heart of the realm.
      // Two sin waves on roughly orthogonal projections (x/z here for visible
      // crossing independent of descent axis) produce moiré fringes exactly
      // where paths meet. The product yields clean alternating reinforcement.
      // Resonance scars + chapter interference value amplify fringe depth and
      // make the pattern persist (echoes do not wash out immediately).
      const waveA = sin(p.x.mul(localFreq.mul(1.82)).add(time.mul(0.068)));
      const waveB = sin(p.z.mul(localFreq.mul(2.11)).add(time.mul(-0.055)));
      const crossed = waveA.mul(waveB);
      const fringeBoost = interference.mul(0.9).add(resonance.mul(0.48));
      const fringe = crossed.mul(fringeAmp).mul(fringeBoost);
      // scars amplify the fringes/echoes; interference displaces the band
      const scarredDist = distanceToSurface.sub(scar.mul(0.55)).add(fringe.mul(0.82));
      const surface = float(1)
        .sub(smoothstep(float(0), thickness, scarredDist))
        .toVar();
      // Prevent the first few samples from becoming a luminous windshield.
      const nearFade = smoothstep(0.08, 0.42, t);
      const dens = surface.mul(nearFade).toVar();

      If(dens.greaterThan(0.001), () => {
        const g = fgg.g.mul(sign(fgg.f));
        const n = g.div(length(g).max(0.001)).toVar();
        const ndl = max(dot(n, key), 0).mul(0.58).add(0.44);
        const ndv = max(dot(n, rd.negate()), 0).toVar();

        // Preserve several readable shells before they recede.
        const depth = smoothstep(0.3, 6.0, t);
        const spectralPhase = cos(
          vec3(0.0, 0.34, 0.68)
            .add(p.x.mul(0.13))
            .add(p.y.mul(0.09))
            .add(t.mul(0.055))
            .mul(6.2831),
        )
          .mul(0.5)
          .add(0.5);
        const nearColor = mix(tint, accent, spectralPhase.mul(0.5));
        const baseC = mix(nearColor, tint.mul(0.12), depth);
        const graze = float(1).sub(ndv).pow(3.0);
        const rimC = mix(baseC, accent, graze.mul(0.55));
        // slow iridescent shimmer
        const iri = cos(
          vec3(0.0, 0.35, 0.72).add(ndv.mul(0.7)).add(t.mul(0.04)).add(tension.mul(0.3)).mul(6.2831),
        )
          .mul(0.5)
          .add(0.5);
        const em = mix(rimC, accent, iri.mul(0.28))
          .mul(ndl)
          .add(pulseRing.mul(0.75));
        const surfaceCore = dens.pow(2.4);
        const stressPhase = cos(
          p.x
            .mul(1.7)
            .add(p.y.mul(1.15))
            .sub(p.z.mul(1.3))
            .add(t.mul(0.16)),
        )
          .mul(0.5)
          .add(0.5);
        const stressLine = smoothstep(0.94, 1.0, stressPhase)
          .mul(surfaceCore)
          .mul(stress);
        const fringeGlow = mix(tint, highlight, 0.5)
          .mul(abs(crossed).mul(0.55))
          .mul(fringeAmp)
          .mul(dens);
        const surfaceLight = em
          .mul(dens.mul(float(4.8).add(stress.mul(2.4)).add(veil.mul(2.6))))
          .add(mix(tint, highlight, 0.62).mul(surfaceCore.mul(0.95)))
          .add(highlight.mul(stressLine.mul(1.4)))
          .add(echo.mul(0.85))
          .add(fringeGlow); // crossed fringes contribute emissive trace
        const resonanceBoost = resonance.mul(0.6).mul(dens);
        glow.addAssign(surfaceLight.mul(trans).mul(STEP).add(resonanceBoost.mul(STEP)));
        // AETHER veil absorption (reused for depth continuity)
        trans.mulAssign(
          exp(
            dens
              .mul(STEP)
              .mul(mix(float(-16).sub(collapse.mul(8)), float(-6.0), veil)),
          ),
        );
      });

      t.addAssign(STEP);
      // early exit when ray is fully absorbed
      If(trans.lessThan(0.01), () => { Break(); });
    });

    glow.mulAssign(0.92);
    const focalPosition = uv.sub(vec2(0.42, -0.06));
    const focalCore = exp(length(focalPosition).pow(2).mul(-28))
      .mul(emergence.mul(0.28).add(order.mul(0.04)));
    const focalSpark = exp(length(focalPosition).pow(2).mul(-180))
      .mul(emergence.mul(0.2));
    // resonance makes the deep focal remember — Interference adds fringe memory
    const memCore = exp(length(focalPosition).pow(2).mul(-52))
      .mul(resonance.mul(0.55));
    const fringeCore = exp(length(focalPosition).pow(2).mul(-41))
      .mul(interference.mul(0.38)).mul(fringeAmp);
    glow.addAssign(
      mix(accent, tint, 0.42)
        .mul(focalCore)
        .add(highlight.mul(focalSpark))
        .add(highlight.mul(memCore))
        .add(highlight.mul(fringeCore)),
    );

    // Highlight roll-off: dense / low-absorption realms accumulate enough
    // emission to flood past the bloom threshold and wash to white under ACES.
    // A per-channel soft knee leaves the black void and mids (< ~0.62) linear
    // and only compresses the brights — restoring colour and contrast.
    const rolledGlow = glow.div(
      vec3(1).add(max(glow.sub(vec3(0.62)), vec3(0)).mul(0.85)),
    );
    // alpha = reveal → crossfades / gates the layer
    return vec4(rolledGlow, reveal);
  });

  const material = new NodeMaterial();
  material.colorNode = raymarch();
  material.vertexNode = vec4(positionGeometry.xy, 0.0, 1.0);
  material.depthTest = false;
  material.depthWrite = false;
  material.transparent = true;

  return {
    material,
    ro,
    fwd,
    aspect,
    freq,
    tension,
    pulse,
    reveal,
    pointer,
    collapse,
    emergence,
    order,
    stress,
    resonance,
    twist,
    swell,
    veil,
    tint,
    accent,
    highlight,
    stepCount,
    interference,
    fringeAmp,
  };
}
