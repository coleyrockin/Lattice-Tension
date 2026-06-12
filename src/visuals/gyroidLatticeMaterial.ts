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

/** Cell density — many lattice cells across the view. THE framing knob. */
export const GYROID_FREQ = 4.6;
/** Descent heading: the (1,1,1) body diagonal — the gyroid's screw axis. */
export const GYROID_HEADING: readonly [number, number, number] = [1, 1, 1];

/**
 * GYROID // The Hidden Geometry — the centerpiece.
 *
 * One fullscreen unbounded sphere-traced march of the solid gyroid shell. You
 * fall down the (1,1,1) screw axis through an infinite teal spiral tunnel that
 * recedes into a glowing core. The lattice IS the level-set; tension is the
 * wall thickness; at peak tension it morphs toward Schwarz-P.
 *
 * Self-contained shader camera (ro/fwd/aspect uniforms) — independent of R3F's
 * camera so it can fall forever.
 */
export function createGyroidLatticeMaterial(steps: number) {
  const ro = uniform(new Vector3());
  const fwd = uniform(new Vector3(1, 1, 1).normalize());
  const aspect = uniform(1);
  const tension = uniform(0.16);
  const pulse = uniform(0);
  const reveal = uniform(1); // 0 = invisible (black), 1 = full (for the crossfade)
  const pointer = uniform(new Vector2());
  const collapse = uniform(0);
  const emergence = uniform(0);
  const order = uniform(0);
  const stress = uniform(0.5);
  const resonance = uniform(0); // user imprints — scars and resonant filaments left by interaction
  const interference = uniform(0); // Interference realm — crossed wave modulation
  const singularity = uniform(0); // Singularity — radial distortion / pull
  const diffusion = uniform(0); // Nebula — volumetric scatter / glow
  const curvature = uniform(0);
  const fringeAmp = uniform(0);
  const quantumFold = uniform(0);
  const nebulaFog = uniform(0);
  const crystalline = uniform(0);
  const absorptionScale = uniform(1);
  const shellScale = uniform(1);
  const focalGlow = uniform(0.3);
  // per-chapter structural signatures (not just recolors):
  const twist = uniform(0); // Collapse — helical shear of cells around the axis
  const swell = uniform(0); // Emergence — cell size breathes along the path
  const veil = uniform(0); // Aether — thin shells + low absorption → deep layers
  const tint = uniform(new Color("#16d9c8"));
  const accent = uniform(new Color("#a855f7"));
  const highlight = uniform(new Color("#ffc66d"));
  const stepCount = uniform(steps);
  // per-chapter cell density — drives how tight or cathedral-wide the lattice reads
  const freq = uniform(GYROID_FREQ);

  const FREQ = freq;

  const raymarch = Fn(() => {
    // --- in-shader camera ---
    const uv = screenUV.mul(2).sub(1).toVar();
    uv.x.mulAssign(aspect);
    const tanFov = float(0.55).add(tension.mul(0.12));
    const f = normalize(fwd).toVar();
    const right = normalize(cross(f, vec3(0, 1, 0))).toVar();
    const up = normalize(cross(right, f)).toVar();
    const rd = normalize(
      f.add(right.mul(uv.x.mul(tanFov))).add(up.mul(uv.y.mul(tanFov))),
    ).toVar();

    // peak tension OR high order both reshape the lattice toward Schwarz-P,
    // so ordered chapters read structurally different, not just recoloured.
    const morph = max(
      max(
        smoothstep(0.82, 0.97, tension),
        smoothstep(0.55, 0.95, order).mul(0.85),
      ),
      smoothstep(0.18, 0.92, crystalline),
    ).toVar();
    const thickness = mix(float(0.026), float(0.048), tension)
      .mul(float(1).sub(order.mul(0.28)))
      .mul(float(1).sub(veil.mul(0.45)))
      .mul(shellScale)
      .toVar();

    // fixed orthonormal frame around the descent axis, for the Collapse twist
    const axisH = vec3(0.5774, 0.5774, 0.5774);
    const axisR = vec3(-0.7071, 0.0, 0.7071);
    const axisU = vec3(-0.4082, 0.8165, -0.4082);

    // skip all march work while invisible (crossfade = 0). NOTE: this must be
    // a discard, NOT If(reveal>0)→Loop — a uniform-conditional wrapping the
    // march loop silently compiles to a no-op on WebGPU (glow stays 0 forever).
    reveal.lessThan(0.01).discard();

    // EMISSIVE VOLUMETRIC: march straight through, accumulate glowing gyroid
    // shells with absorption. You see THROUGH layer after layer into infinite
    // depth — a luminous lattice cathedral that can never present a flat wall.
    const STEP = float(0.032);
    const t = float(0.02).toVar();
    const glow = vec3(0).toVar();
    const trans = float(1).toVar(); // transmittance (1 → clear, 0 → fully absorbed)
    const key = normalize(vec3(0.4, 0.7, 0.55));

    Loop(stepCount, () => {
      const p = ro.add(rd.mul(t)).toVar();
      // click pulse: a travelling brightening shell
      const pulseRing = exp(length(p.sub(ro)).sub(pulse.mul(7)).pow(2).mul(-0.5)).mul(pulse);

      // COLLAPSE twist: shear the cells helically around the descent axis —
      // the tunnel itself torques, structurally unlike any other chapter.
      const axial = dot(p, axisH);

      // RESONANCE IMPRINTS (user scars): accumulated interaction leaves slow
      // axial ridges and bright filaments. The lattice remembers where it was
      // touched — stronger in high-tension chapters, blooms in Emergence/Aether.
      const scarPhase = axial.mul(7.4).add(time.mul(0.031));
      const scar = resonance
        .mul(0.014)
        .mul(sin(scarPhase).mul(0.6).add(0.7))
        .mul(smoothstep(0.2, 0.95, resonance))
        .max(0.0)
        .clamp(0.0, 1.0);
      const echo = resonance
        .mul(0.9)
        .mul(
          exp(
            length(p.sub(ro))
              .sub(resonance.mul(3.8))
              .pow(2)
              .mul(-0.11),
          ),
        )
        .max(0.0)
        .clamp(0.0, 1.0);
      const radial = p.sub(axisH.mul(axial));
      const radialLen = length(radial);
      const singPull = singularity.mul(exp(radialLen.mul(-0.38)).mul(0.62));
      const pulled = axisH.mul(axial).add(radial.mul(float(1).sub(singPull))).toVar();

      const theta = axial.mul(twist.mul(0.42));
      const x1 = dot(pulled.sub(axisH.mul(axial)), axisR);
      const x2 = dot(pulled.sub(axisH.mul(axial)), axisU);
      const ct = cos(theta);
      const st = sin(theta);
      const pT = axisH
        .mul(axial)
        .add(axisR.mul(x1.mul(ct).sub(x2.mul(st))))
        .add(axisU.mul(x1.mul(st).add(x2.mul(ct))))
        .add(
          vec3(
            sin(pulled.x.mul(19).add(time.mul(0.12))).mul(quantumFold.mul(0.095)),
            sin(pulled.y.mul(23).sub(time.mul(0.09))).mul(quantumFold.mul(0.095)),
            sin(pulled.z.mul(21).add(time.mul(0.07))).mul(quantumFold.mul(0.095)),
          ),
        )
        .toVar();

      const localFreq = FREQ.mul(
        float(1).sub(swell.mul(0.26).mul(sin(axial.mul(0.55)))),
      ).toVar();

      const fgg = fieldFG(pT.mul(localFreq), morph);
      const gradientLength = max(length(fgg.g), 0.35);
      const distanceToSurface = abs(fgg.f).div(gradientLength).div(localFreq);
      const waveA = sin(p.x.mul(localFreq.mul(1.82)).add(time.mul(0.068)));
      const waveB = sin(p.z.mul(localFreq.mul(2.11)).add(time.mul(-0.055)));
      const crossed = waveA.mul(waveB);
      const fringe = crossed
        .mul(fringeAmp)
        .mul(interference.mul(0.85).add(0.18));
      const scarredDist = distanceToSurface.sub(scar.mul(0.6)).add(fringe.mul(0.78));
      const surface = float(1)
        .sub(smoothstep(float(0), thickness, scarredDist))
        .max(0.0)
        .min(1.0)
        .toVar();
      // Prevent the first few samples from becoming a luminous windshield.
      const nearFade = smoothstep(0.08, 0.42, t);
      const dens = surface.mul(nearFade).toVar();
      const fogDens = nebulaFog
        .mul(exp(distanceToSurface.mul(-4.8)))
        .mul(float(1).sub(dens))
        .mul(0.24);
      glow.addAssign(mix(tint, accent, 0.42).mul(fogDens).mul(trans).mul(STEP));

      If(dens.greaterThan(0.001), () => {
        const g = fgg.g.mul(sign(fgg.f));
        const n = g.div( length(g).max(0.001) ).toVar();
        const ndl = max(dot(n, key), 0).mul(0.58).add(0.44);
        const ndv = max(dot(n, rd.negate()), 0).toVar();

        // Preserve several readable shells before they recede into indigo-black.
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
        // slow iridescent shimmer over the whole field
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
        const fringeGlow = mix(tint, highlight, 0.55)
          .mul(abs(crossed).mul(0.62))
          .mul(fringeAmp)
          .mul(dens);
        const surfaceLight = em
          .mul(dens.mul(float(5.8).add(stress.mul(2.4)).add(veil.mul(3.0))))
          .add(mix(tint, highlight, 0.62).mul(surfaceCore.mul(1.05)))
          .add(highlight.mul(stressLine.mul(1.4)))
          .add(echo.mul(0.85))
          .add(fringeGlow)
          .max(vec3(0))
          .clamp(vec3(0), vec3(10)); // prevent NaN
        const resonanceBoost = resonance.mul(0.6).mul(dens);
        glow.addAssign(surfaceLight.mul(trans).mul(STEP).add(resonanceBoost.mul(STEP)));
        // AETHER veil: absorption falls away so the ray survives through many
        // thin shells — layer behind layer receding into transparent depth.
        // The absorption mix is gentler on the low end (was -16) so even dense
        // chapters still let a few shells breathe through.
        trans.mulAssign(
          exp(
            dens
              .mul(STEP)
              .mul(mix(float(-12).sub(collapse.mul(6)), float(-5.0), veil))
              .mul(absorptionScale),
          ),
        );
      });

      t.addAssign(STEP);
      // early exit when ray is fully absorbed — skip remaining steps
      If(trans.lessThan(0.01), () => { Break(); });
    });

    glow.mulAssign(0.92);
    glow.assign( glow.max( vec3(0) ).clamp( vec3(0), vec3(10) ) );
    const focalPosition = uv.sub(vec2(0.42, -0.06));
    const focalCore = exp(length(focalPosition).pow(2).mul(-28))
      .mul(emergence.mul(0.28).add(order.mul(0.04)).add(focalGlow.mul(0.55)));
    const focalSpark = exp(length(focalPosition).pow(2).mul(-180))
      .mul(emergence.mul(0.2).add(focalGlow.mul(0.35)));
    // resonance makes the deep focal "remember" — brighter memory core when engaged
    const memCore = exp(length(focalPosition).pow(2).mul(-52))
      .mul(resonance.mul(0.55));
    const diffCore = exp(length(focalPosition).pow(2).mul(-40))
      .mul(diffusion.mul(0.6));
    const curvSpark = exp(length(focalPosition).pow(2).mul(-100))
      .mul(curvature.mul(0.3));
    glow.addAssign(
      mix(accent, tint, 0.42)
        .mul(focalCore)
        .add(highlight.mul(focalSpark))
        .add(highlight.mul(memCore))
        .add(tint.mul(diffCore))
        .add(accent.mul(curvSpark)),
    );

    // alpha = reveal → crossfades the lattice in over the orb during the descent
    return vec4(glow, reveal);
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
    interference,
    singularity,
    diffusion,
    curvature,
    fringeAmp,
    quantumFold,
    nebulaFog,
    crystalline,
    absorptionScale,
    shellScale,
    focalGlow,
    twist,
    swell,
    veil,
    tint,
    accent,
    highlight,
    stepCount,
  };
}
