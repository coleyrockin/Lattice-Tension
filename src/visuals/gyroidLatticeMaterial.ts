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
  smoothstep,
  uniform,
  vec3,
  vec4,
  cos,
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
  const tint = uniform(new Color("#16d9c8"));
  const accent = uniform(new Color("#a855f7"));
  const stepCount = uniform(steps);

  const FREQ = float(GYROID_FREQ);

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

    const morph = smoothstep(0.82, 0.97, tension).toVar();
    // Pseudo-distance thickness after normalizing the implicit field by its
    // analytic gradient. This keeps the glow confined to the actual surface.
    const thickness = mix(float(0.045), float(0.075), tension).toVar();

    // EMISSIVE VOLUMETRIC: march straight through, accumulate glowing gyroid
    // shells with absorption. You see THROUGH layer after layer into infinite
    // depth — a luminous lattice cathedral that can never present a flat wall.
    const STEP = float(0.032);
    const t = float(0.02).toVar();
    const glow = vec3(0).toVar();
    const trans = float(1).toVar(); // transmittance (1 → clear, 0 → fully absorbed)
    const key = normalize(vec3(0.4, 0.7, 0.55));

    // skip entirely when invisible (crossfade = 0) — saves all 150 march steps
    If(reveal.greaterThan(0.01), () => {
    Loop(stepCount, () => {
      const p = ro.add(rd.mul(t)).toVar();
      // click pulse: a travelling brightening shell
      const pulseRing = exp(length(p.sub(ro)).sub(pulse.mul(7)).pow(2).mul(-0.5)).mul(pulse);

      const fgg = fieldFG(p.mul(FREQ), morph);
      const gradientLength = max(length(fgg.g), 0.35);
      const distanceToSurface = abs(fgg.f).div(gradientLength).div(FREQ);
      const surface = float(1)
        .sub(smoothstep(float(0), thickness, distanceToSurface))
        .toVar();
      // Prevent the first few samples from becoming a luminous windshield.
      const nearFade = smoothstep(0.08, 0.42, t);
      const dens = surface.mul(nearFade).toVar();

      If(dens.greaterThan(0.001), () => {
        const n = normalize(fgg.g.mul(sign(fgg.f))).toVar();
        const ndl = max(dot(n, key), 0).mul(0.55).add(0.45);
        const ndv = max(dot(n, rd.negate()), 0).toVar();

        // Spatial spectral bands keep neighboring layers distinguishable:
        // near shells cyan, middle shells violet, remote shells deep indigo.
        const depth = smoothstep(0.25, 4.2, t);
        const spectralPhase = cos(
          vec3(0.0, 0.34, 0.68)
            .add(p.x.mul(0.13))
            .add(p.y.mul(0.09))
            .add(t.mul(0.055))
            .mul(6.2831),
        )
          .mul(0.5)
          .add(0.5);
        const nearColor = mix(tint, accent, spectralPhase.mul(0.42)).mul(0.64);
        const baseC = mix(nearColor, vec3(0.008, 0.012, 0.08), depth);
        const graze = float(1).sub(ndv).pow(3.0);
        const rimC = mix(baseC, vec3(0.55, 0.28, 1.0), graze.mul(0.58));
        // slow iridescent shimmer over the whole field
        const iri = cos(
          vec3(0.0, 0.35, 0.72).add(ndv.mul(0.7)).add(t.mul(0.04)).add(tension.mul(0.3)).mul(6.2831),
        )
          .mul(0.5)
          .add(0.5);
        const em = mix(rimC, accent, iri.mul(0.16))
          .mul(ndl)
          .add(pulseRing.mul(0.75));
        const surfaceCore = dens.pow(2.4);
        const surfaceLight = em
          .mul(dens.mul(7.4))
          .add(vec3(0.08, 0.92, 1.0).mul(surfaceCore.mul(1.28)));
        glow.addAssign(surfaceLight.mul(trans).mul(STEP));
        // Enough absorption to establish silhouettes while preserving several
        // receding layers and black void between them.
        trans.mulAssign(exp(dens.mul(STEP).mul(-18.0)));
      });

      t.addAssign(STEP);
      // early exit when ray is fully absorbed — skip remaining steps
      If(trans.lessThan(0.025), () => { Break(); });
    });
    }); // end reveal guard

    // no focal core — void between shells is truly black for maximum depth contrast

    // alpha = reveal → crossfades the lattice in over the orb during the descent
    return vec4(glow, reveal);
  });

  const material = new NodeMaterial();
  material.colorNode = raymarch();
  material.vertexNode = vec4(positionGeometry.xy, 0.0, 1.0);
  material.depthTest = false;
  material.depthWrite = false;
  material.transparent = true;

  return { material, ro, fwd, aspect, tension, pulse, reveal, pointer, tint, accent, stepCount };
}
