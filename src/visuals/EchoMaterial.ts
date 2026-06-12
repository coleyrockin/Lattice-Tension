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

/** Cell density — tuned slightly for the witness scale (self-referential depth). */
export const ECHO_FREQ = 4.3;
/** Descent heading reused from the atlas screw axis. */
export const ECHO_HEADING: readonly [number, number, number] = [1, 1, 1];

/**
 * ECHO (WITNESS) — meta final evolution of the lattice.
 *
 * The pattern no longer only receives. When the viewer has pressed
 * sufficient resonance into the aether (high user imprint), the scars
 * become self-referential: they emit waves whose phases birth faint
 * generative offspring filaments — child structures that remember
 * and extend the question the user asked by touching.
 *
 * "The pattern now contains your question."
 *
 * Built strictly on gyroidLatticeMaterial patterns:
 * - identical raymarch camera + volumetric emissive absorption
 * - full reuse of fieldFG + descent/store/interp driven uniforms
 * - tiered STEPS for march fidelity
 * - resonance effective (base + user) wired exactly as Gyroid/Jelly
 * - poetic but precise TSL comments
 * - scars now self-referential waves; new child generations only
 *   coherently structured/bright when imprint high (user marks)
 *
 * History simulation: phase-delayed axial waves stand in for
 * accumulated resonance past. Each "past mark" seeds a micro-offset
 * child gyroid sample at higher local frequency — generative, not static.
 */
export function createEchoMaterial(steps: number) {
  const ro = uniform(new Vector3());
  const fwd = uniform(new Vector3(1, 1, 1).normalize());
  const aspect = uniform(1);
  const tension = uniform(0.16);
  const pulse = uniform(0);
  const reveal = uniform(1); // 0 = invisible (black), gated by high progress + high resonance
  const pointer = uniform(new Vector2());
  const collapse = uniform(0);
  const emergence = uniform(0);
  const order = uniform(0);
  const stress = uniform(0.5);
  const resonance = uniform(0); // user imprints — scars and resonant filaments
  // per-chapter structural signatures (reused for continuity with atlas)
  const twist = uniform(0);
  const swell = uniform(0);
  const veil = uniform(0);
  const tint = uniform(new Color("#16d9c8"));
  const accent = uniform(new Color("#a855f7"));
  const highlight = uniform(new Color("#ffc66d"));
  const stepCount = uniform(steps);
  const freq = uniform(ECHO_FREQ);

  // ECHO WITNESS specific: imprint strength gates generative offspring.
  // Only high userResonance (effective > ~0.95 with contribution) unlocks
  // structured child filaments. Below threshold they remain near-invisible.
  const imprint = uniform(0);

  const FREQ = freq;

  const raymarch = Fn(() => {
    // --- in-shader camera (identical framing to gyroid) ---
    const uv = screenUV.mul(2).sub(1).toVar();
    uv.x.mulAssign(aspect);
    const tanFov = float(0.55).add(tension.mul(0.12));
    const f = normalize(fwd).toVar();
    const right = normalize(cross(f, vec3(0, 1, 0))).toVar();
    const up = normalize(cross(right, f)).toVar();
    const rd = normalize(
      f.add(right.mul(uv.x.mul(tanFov))).add(up.mul(uv.y.mul(tanFov))),
    ).toVar();

    // morph toward Schwarz-P on high tension/order (reused)
    const morph = max(
      smoothstep(0.82, 0.97, tension),
      smoothstep(0.55, 0.95, order).mul(0.85),
    ).toVar();
    const thickness = mix(float(0.026), float(0.048), tension)
      .mul(float(1).sub(order.mul(0.28)))
      .mul(float(1).sub(veil.mul(0.45)))
      .toVar();

    // fixed orthonormal frame around descent axis (reused for twist)
    const axisH = vec3(0.5774, 0.5774, 0.5774);
    const axisR = vec3(-0.7071, 0.0, 0.7071);
    const axisU = vec3(-0.4082, 0.8165, -0.4082);

    // skip march while reveal near zero (crossfade / threshold gate)
    reveal.lessThan(0.01).discard();

    // EMISSIVE VOLUMETRIC march — identical structure to gyroid
    const STEP = float(0.032);
    const t = float(0.02).toVar();
    const glow = vec3(0).toVar();
    const trans = float(1).toVar();
    const key = normalize(vec3(0.4, 0.7, 0.55));

    Loop(stepCount, () => {
      const p = ro.add(rd.mul(t)).toVar();
      // click pulse (reused)
      const pulseRing = exp(length(p.sub(ro)).sub(pulse.mul(7)).pow(2).mul(-0.5)).mul(pulse);

      // RESONANCE IMPRINTS — scars now self-referential waves.
      // The axial ridges remember the touch; their phase feeds back
      // (resonance term inside the sin) so the "scar" is the lattice
      // answering itself. This is the seed for offspring.
      const axial = dot(p, axisH);
      const scarPhase = axial.mul(7.4).add(time.mul(0.031));
      const scar = resonance
        .mul(0.014)
        .mul(sin(scarPhase.add(resonance.mul(1.6))).mul(0.6).add(0.7)) // self-referential feedback
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
        )
        .mul(imprint.mul(0.35).add(0.75)); // echo filaments gain presence with user imprint

      // COLLAPSE twist (reused)
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

      // EMERGENCE swell (reused)
      const localFreq = FREQ.mul(
        float(1).sub(swell.mul(0.26).mul(sin(axial.mul(0.55)))),
      ).toVar();

      const fgg = fieldFG(pT.mul(localFreq), morph);
      const gradientLength = max(length(fgg.g), 0.35);
      const distanceToSurface = abs(fgg.f).div(gradientLength).div(localFreq);
      const scarredDist = distanceToSurface.sub(scar.mul(0.6));
      const surface = float(1)
        .sub(smoothstep(float(0), thickness, scarredDist))
        .toVar();
      const nearFade = smoothstep(0.08, 0.42, t);
      const dens = surface.mul(nearFade).toVar();

      If(dens.greaterThan(0.001), () => {
        const n = normalize(fgg.g.mul(sign(fgg.f))).toVar();
        const ndl = max(dot(n, key), 0).mul(0.58).add(0.44);
        const ndv = max(dot(n, rd.negate()), 0).toVar();

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
        const surfaceLight = em
          .mul(dens.mul(float(4.8).add(stress.mul(2.4)).add(veil.mul(2.6))))
          .add(mix(tint, highlight, 0.62).mul(surfaceCore.mul(0.95)))
          .add(highlight.mul(stressLine.mul(1.4)))
          .add(echo.mul(0.85));

        const resonanceBoost = resonance.mul(0.6).mul(dens);
        glow.addAssign(surfaceLight.mul(trans).mul(STEP).add(resonanceBoost.mul(STEP)));

        // AETHER veil absorption (reused, slightly gentler for echo depth)
        trans.mulAssign(
          exp(
            dens
              .mul(STEP)
              .mul(mix(float(-16).sub(collapse.mul(8)), float(-5.6), veil)),
          ),
        );
      });

      // ECHO WITNESS: generative offspring filaments from accumulated resonance history.
      // History is simulated procedurally via phase-shifted waves (past "touches"
      // at delayed times). Each history seed spawns a faint child gyroid at a
      // micro-perturbed locus. Child structures are only coherently bright and
      // geometrically resolved when user imprint is high — the lattice has
      // internalized the viewer's question and now generates from it.
      // These are additive, low-density, higher-frequency children.
      const histBase = resonance.mul(imprint).mul(0.9);
      If(histBase.greaterThan(0.012), () => {
        // Three generations of history simulation (unrolled — fixed cost, tier-safe)
        // Phase delays stand in for accumulated past resonance deposits.
        for (let k = 0; k < 3; k++) {
          const delay = float(k).mul(0.87);
          const histPhase = time.mul(0.021).sub(delay);
          // self-referential wave: scar phase now modulated by its own history echo
          const histWave = sin(
            axial
              .mul(4.1 + k * 0.65)
              .add(histPhase.mul(2.15))
              .add(resonance.mul(0.7)), // feeds its own accumulated memory
          )
            .mul(0.5)
            .add(0.5);

          const childSeed = histBase
            .mul(0.016)
            .mul(histWave)
            .mul(smoothstep(0.48, 1.15, resonance));

          // faint child offset — generative displacement born from the wave
          const childPerturb = vec3(
            sin(axial.mul(2.3 + k * 0.9)).mul(0.029),
            cos(axial.mul(1.85 + k * 0.6)).mul(0.024),
            sin(axial.mul(2.65 + k * 0.3)).mul(0.019),
          ).mul(childSeed.mul(1.9));

          const childPt = pT.add(childPerturb);
          const childLocalFreq = localFreq.mul(1.72 + k * 0.09); // children are finer
          const cgg = fieldFG(childPt.mul(childLocalFreq), morph);
          const cGradL = max(length(cgg.g), 0.28);
          const cDist = abs(cgg.f).div(cGradL).div(childLocalFreq);
          // thinner child shells — they are filaments, not the main lattice
          const childSurf = float(1)
            .sub(smoothstep(float(0), thickness.mul(0.58), cDist))
            .mul(nearFade)
            .mul(childSeed.mul(5.2));

          If(childSurf.greaterThan(0.0015), () => {
            const cN = normalize(cgg.g.mul(sign(cgg.f))).toVar();
            const cNdl = max(dot(cN, key), 0).mul(0.36).add(0.28);
            // child color leans cooler/self-referential toward the viewer's accent
            const childCol = mix(tint, accent, 0.58 + k * 0.12);
            const childLight = childCol
              .mul(childSurf)
              .mul(cNdl)
              .mul(imprint); // gated: only structured when high user imprint
            // add very faintly so main structure remains dominant
            glow.addAssign(childLight.mul(trans).mul(STEP * 0.55));
          });
        }
      });

      t.addAssign(STEP);
      If(trans.lessThan(0.01), () => {
        Break();
      });
    });

    glow.mulAssign(0.92);
    const focalPosition = uv.sub(vec2(0.42, -0.06));
    const focalCore = exp(length(focalPosition).pow(2).mul(-28))
      .mul(emergence.mul(0.28).add(order.mul(0.04)));
    const focalSpark = exp(length(focalPosition).pow(2).mul(-180))
      .mul(emergence.mul(0.2));
    const memCore = exp(length(focalPosition).pow(2).mul(-52))
      .mul(resonance.mul(0.55));
    // generative offspring focal memory — the question returns brighter only with imprint
    const offspringCore = exp(length(focalPosition).pow(2).mul(-36))
      .mul(imprint.mul(0.72));
    glow.addAssign(
      mix(accent, tint, 0.42)
        .mul(focalCore)
        .add(highlight.mul(focalSpark))
        .add(highlight.mul(memCore))
        .add(highlight.mul(offspringCore)),
    );

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
    twist,
    swell,
    veil,
    tint,
    accent,
    highlight,
    stepCount,
    imprint,
  };
}
