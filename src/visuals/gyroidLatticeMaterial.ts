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
  clamp,
  cross,
  dot,
  exp,
  float,
  length,
  max,
  mix,
  normalize,
  positionGeometry,
  pow,
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
  const tint = uniform(new Color("#5eead4"));
  const accent = uniform(new Color("#a78bfa"));
  const stepCount = uniform(steps);

  const FREQ = float(GYROID_FREQ);
  const FAR = float(22);
  const EPS = float(0.0015);
  const MIN_STEP = float(0.005);
  const BG = vec3(0.006, 0.012, 0.022);

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
    // shell half-thickness for the glowing membrane (denser with tension)
    const thickness = mix(float(0.16), float(0.5), tension).toVar();

    // EMISSIVE VOLUMETRIC: march straight through, accumulate glowing gyroid
    // shells with absorption. You see THROUGH layer after layer into infinite
    // depth — a luminous lattice cathedral that can never present a flat wall.
    const STEP = float(0.04);
    const t = float(0.02).toVar();
    const glow = vec3(0).toVar();
    const trans = float(1).toVar(); // transmittance (1 → clear, 0 → fully absorbed)
    const key = normalize(vec3(0.4, 0.7, 0.55));

    Loop(stepCount, () => {
      const p = ro.add(rd.mul(t)).toVar();
      // click pulse: a travelling brightening shell
      const pulseRing = exp(length(p.sub(ro)).sub(pulse.mul(7)).pow(2).mul(-0.5)).mul(pulse);

      const fgg = fieldFG(p.mul(FREQ), morph);
      const af = abs(fgg.f).toVar();
      // density: bright on the gyroid surface (|f|→0), soft falloff to the shell edge
      const dens = smoothstep(thickness, thickness.mul(0.08), af).toVar();

      If(dens.greaterThan(0.001), () => {
        const n = normalize(fgg.g.mul(sign(fgg.f))).toVar();
        const ndl = max(dot(n, key), 0).mul(0.55).add(0.45);
        const ndv = max(dot(n, rd.negate()), 0).toVar();
        // iridescent emission sliding teal↔violet by facing angle + depth
        const iri = cos(
          vec3(0.0, 0.33, 0.67).add(ndv.mul(0.6)).add(t.mul(0.05)).add(tension.mul(0.3)).mul(6.2831),
        )
          .mul(0.5)
          .add(0.5);
        const em = mix(tint, accent, iri.mul(0.55)).mul(ndl).add(pulseRing.mul(0.6));
        glow.addAssign(em.mul(dens).mul(trans).mul(STEP).mul(9.0));
        trans.mulAssign(exp(dens.mul(STEP).mul(-7.0)));
      });

      t.addAssign(STEP);
    });

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
