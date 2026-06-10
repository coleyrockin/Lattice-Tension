/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — TSL node DSL: runtime-correct, but its operator types can't be
// modeled by TypeScript. App code outside this shader stays fully type-checked.
import { Color, DoubleSide, Vector2, Vector3 } from 'three';
import { NodeMaterial } from 'three/webgpu';
import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  cos,
  dot,
  float,
  length,
  max,
  min,
  mix,
  normalize,
  pow,
  sin,
  smoothstep,
  uniform,
  vec2,
  vec3,
  vec4,
  time,
} from 'three/tsl';
import { RaymarchingBox } from 'three/examples/jsm/tsl/utils/Raymarching.js';

/**
 * The jelly orb. A raymarched SDF membrane (twin tori + core, smooth-blended)
 * floating on black — living glass. Tuned for motion + trippiness:
 *  - multi-octave domain-warp wobble + twin travelling ripples
 *  - slow independent breathing + a glacial silhouette morph
 *  - ocean-blue absorption, a wet fresnel rim, and moving internal caustics
 *  - a glowing gyroid tension-lattice suspended inside, seen through the shell
 */
export function createJellyOrbMaterial(steps: number) {
  const tension = uniform(0.4);
  const speed = uniform(0.6);
  const pulse = uniform(0);
  const tint = uniform(new Color('#003366')); // deeper ocean glass
  const accent = uniform(new Color('#88e0ff')); // brighter rim and caustics
  const highlight = uniform(new Color('#e0faff')); // enhanced wet glints
  const lattice = uniform(1.8); // brighter internal lattice
  const pointer = uniform(new Vector2()); // set .value.set(x, y) per frame
  const jiggle = uniform(new Vector3(0, 1, 0)); // wobble axis (spring-driven)
  const squash = uniform(0); // spring displacement: + stretches along jiggle
  const slosh = uniform(new Vector3()); // delayed liquid mass moving inside shell
  const stepCount = uniform(steps);

  // gyroid field — the hidden geometry suspended inside the jelly
  const gyroid = (x: ReturnType<typeof vec3>) =>
    sin(x.x).mul(cos(x.y)).add(sin(x.y).mul(cos(x.z))).add(sin(x.z).mul(cos(x.x)));

  const map = (p: ReturnType<typeof vec3>) => {
    // jiggle physics: squash-and-stretch the sample space along the wobble axis
    // (inverse-deform the query point → the shape stretches with overshoot).
    const ax = normalize(jiggle.add(vec3(0.0, 0.0001, 0.0)));
    const al = dot(p, ax);
    const perp = p.sub(ax.mul(al));
    const pt = perp
      .mul(float(1).add(squash.mul(0.4)))
      .add(ax.mul(al.mul(float(1).sub(squash.mul(0.55)))));
    const t = time.mul(speed.mul(0.35));
    const amp = float(0.022)
      .add(tension.mul(0.075))
      .add(pulse.mul(0.12));

    // Delayed inner mass bends the membrane differently at opposite poles.
    // The shell begins settling before this term does, creating visible viscosity.
    const sloshWarp = vec3(
      slosh.x.mul(pt.y.mul(1.25).add(sin(time.mul(0.72)).mul(0.22))),
      slosh.y.mul(pt.x.mul(-1.1).add(cos(time.mul(0.61)).mul(0.2))),
      slosh.z.mul(pt.x.add(pt.y).mul(0.55)),
    ).mul(0.28);
    const jellyPt = pt.add(sloshWarp);

    // Multiple slow breathing frequencies keep the volume from inflating uniformly.
    const breathe = sin(t.mul(0.9))
      .mul(0.025)
      .mul(tension)
      .add(sin(time.mul(0.13)).mul(0.02))
      .add(sin(time.mul(0.31).add(jellyPt.y.mul(2.2))).mul(0.009));

    // multi-octave domain warp — slow primary swell + finer secondary shimmer
    const lean = vec3(pointer.x.mul(0.05), pointer.y.mul(-0.05), 0);
    const warpA = vec3(
      sin(jellyPt.y.mul(3.3).add(t).add(lean.x)).mul(amp),
      sin(jellyPt.z.mul(3.1).sub(t.mul(0.6))).mul(amp.mul(0.85)),
      sin(jellyPt.x.mul(3.6).add(t.mul(0.4)).add(lean.y)).mul(amp),
    );
    const warpB = vec3(
      sin(jellyPt.z.mul(6.2).sub(t.mul(1.1))).mul(amp.mul(0.26)),
      sin(jellyPt.x.mul(5.8).add(t.mul(0.8))).mul(amp.mul(0.26)),
      sin(jellyPt.y.mul(6.6).sub(t.mul(0.9))).mul(amp.mul(0.26)),
    );
    const q = jellyPt.add(warpA).add(warpB);

    // glacial silhouette morph between a ring-knot and a rounder blob (~125s)
    const morph = sin(time.mul(0.05)).mul(0.5).add(0.5);
    const major = mix(float(0.36), float(0.31), morph).sub(tension.mul(0.025)).add(breathe);
    const minor = float(0.085).add(tension.mul(0.025)).add(pulse.mul(0.02));

    const d1 = length(vec2(length(q.xz).sub(major), q.y)).sub(minor);

    const qzx = vec3(q.z, q.y, q.x);
    const d2 = length(vec2(length(qzx.xz).sub(major.mul(0.82)), qzx.y)).sub(minor.mul(0.78));

    const h12 = max(float(0.11).sub(abs(d1.sub(d2))), 0).div(0.11);
    const shell = min(d1, d2).sub(h12.mul(h12).mul(0.11).mul(0.25));

    // a substantial core sphere → the silhouette reads as a rounded orb, with
    // the twin tori as molten surface detail rather than a flat ring.
    const d3 = length(q).sub(float(0.42).add(morph.mul(0.045)).add(breathe).add(pulse.mul(0.04)));

    const blend = float(0.085).add(tension.mul(0.04));
    const hsc = max(blend.sub(abs(shell.sub(d3))), 0).div(blend);
    const core = min(shell, d3).sub(hsc.mul(hsc).mul(blend).mul(0.25));

    // twin travelling ripples crawling over the membrane (interference)
    const r1 = sin(length(pt.xz).mul(9).sub(t.mul(2.2))).mul(sin(pt.y.mul(7).add(t))).mul(amp.mul(0.35));
    const r2 = sin(length(pt.yz).mul(6).add(t.mul(1.4))).mul(sin(pt.x.mul(5).sub(t.mul(0.7)))).mul(amp.mul(0.22));

    const surfaceQuiver = sin(q.x.mul(3.1).add(time.mul(0.58)))
      .mul(sin(q.y.mul(2.7).sub(time.mul(0.47))))
      .mul(float(0.014).add(abs(squash).mul(0.024)));
    const gelatinSwell = sin(q.y.mul(2.15).add(time.mul(0.46)))
      .add(sin(q.x.mul(1.8).sub(time.mul(0.37))))
      .mul(0.009);

    return core
      .sub(r1)
      .sub(r2)
      .sub(surfaceQuiver)
      .sub(gelatinSwell)
      .sub(pulse.mul(0.05));
  };

  const raymarch = Fn(() => {
    // The camera looks down -Z. Using +Z here clamps N.V to zero across most
    // of the front face, turning the whole object into a blown-out fresnel rim.
    const rd = vec3(0, 0, -1).toVar();
    const finalColor = vec4(0, 0, 0, 1).toVar(); // pure black void

    RaymarchingBox(stepCount, ({ positionRay }) => {
      const p = positionRay.mul(2.6);
      const d = map(p as ReturnType<typeof vec3>);

      If(d.lessThan(0.0015), () => {
        const e = float(0.0012);
        const n = normalize(
          vec3(
            map(p.add(vec3(e, 0, 0)) as ReturnType<typeof vec3>).sub(map(p.sub(vec3(e, 0, 0)) as ReturnType<typeof vec3>)),
            map(p.add(vec3(0, e, 0)) as ReturnType<typeof vec3>).sub(map(p.sub(vec3(0, e, 0)) as ReturnType<typeof vec3>)),
            map(p.add(vec3(0, 0, e)) as ReturnType<typeof vec3>).sub(map(p.sub(vec3(0, 0, e)) as ReturnType<typeof vec3>)),
          ),
        ).toVar();

        const lightDir = normalize(vec3(-0.42, 0.72, 0.55));
        const fillDir = normalize(vec3(0.68, -0.18, 0.72));
        const diff = max(dot(n, lightDir), 0).mul(0.42).add(0.04);
        const fill = max(dot(n, fillDir), 0).mul(0.18);
        const ndv = max(dot(n, rd.negate()), 0).toVar();

        // Wet fresnel: the body absorbs toward navy while grazing angles catch
        // a clean baby-blue edge. Keeping the center dark creates perceived
        // translucency even though the raymarch resolves one front surface.
        const fresT = pow(float(1).sub(ndv), 1.5);
        const iriCol = mix(tint, accent, fresT.mul(0.94));

        // chromatic-aberration rim: per-channel fresnel split → vibrating silhouette
        const rimR = pow(float(1).sub(ndv.mul(0.97)), 3.2);
        const rimG = pow(float(1).sub(ndv), 3.2);
        const rimB = pow(float(1).sub(ndv.mul(1.03)), 3.2);
        // Sculpt the fresnel flood with the key/fill lights. When the camera
        // dollies inside the shell ndv→0 everywhere, so without this the whole
        // face saturates to one flat accent colour and the volume disappears.
        const rimShade = float(0.42).add(diff.mul(1.15)).add(fill.mul(0.8));
        const rim = vec3(rimR, rimG, rimB)
          .mul(float(0.85).add(abs(squash).mul(0.32)))
          .mul(iriCol)
          .mul(rimShade);
        const wetEdge = accent
          .mul(pow(float(1).sub(ndv), 0.82))
          .mul(0.14)
          .mul(float(0.5).add(diff));

        const fresnel = pow(float(1).sub(ndv), 1.7);

        // Two wet highlights make the membrane feel curved rather than painted.
        const half = normalize(lightDir.add(rd.negate()));
        const fillHalf = normalize(fillDir.add(rd.negate()));
        const spec = accent.mul(
          pow(max(dot(n, half), 0), 118.0).mul(0.72),
        );
        const softSpec = accent.mul(
          pow(max(dot(n, fillHalf), 0), 24.0)
            .mul(0.18)
            .mul(float(1).add(abs(squash).mul(0.7))),
        );
        const movingSheen = accent.mul(
          pow(
            max(
              dot(
                n,
                normalize(
                  vec3(
                    sin(time.mul(0.17)).mul(0.18).sub(0.38),
                    cos(time.mul(0.13)).mul(0.12).add(0.68),
                    -0.62,
                  ),
                ),
              ),
              0,
            ),
            7.0,
          ).mul(0.09),
        );

        const centerDepth = pow(ndv, 1.35);
        const edgeDepth = pow(float(1).sub(ndv), 2.2);
        const glassBase = mix(
          tint.mul(0.1),
          tint.mul(0.27),
          diff.mul(0.44).add(fill).add(edgeDepth.mul(0.16)),
        );
        const backLight = pow(max(dot(n, lightDir.negate()), 0), 2.0);
        const sss = mix(tint, accent, 0.42)
          .mul(backLight.mul(0.075).add(edgeDepth.mul(0.045)));
        const body = glassBase
          .mul(float(0.43).add(fresnel.mul(0.24)))
          .mul(float(1).sub(centerDepth.mul(0.1)))
          .add(tint.mul(0.028))
          .add(spec)
          .add(softSpec)
          .add(movingSheen)
          .add(sss);

        // internal gyroid tension-lattice, seen through the translucent shell:
        // a short inward sub-march from the hit point accumulates the glowing web
        const latGlow = float(0).toVar();
        const lp = p.toVar();
        const gscale = float(7.8).add(tension.mul(3.2));
        const gphase = vec3(time.mul(0.06), time.mul(-0.04), time.mul(0.05))
          .add(slosh.mul(1.8));
        Loop(6, ({ i }) => {
          lp.subAssign(n.mul(0.085)); // step inward along -normal
          const g = gyroid(lp.mul(gscale).add(gphase) as ReturnType<typeof vec3>);
          const band = smoothstep(0.05, 0.0, abs(g)); // bright on the gyroid surface
          const falloff = float(1).sub(float(i).mul(0.14));
          latGlow.addAssign(band.mul(0.22).mul(falloff));
        });
        // soft-cap the accumulated glow so the web reads as filaments instead
        // of flooding the body with a flat saturated fill at high tension
        const latSoft = min(latGlow, float(1.25));
        const latticeHue = mix(tint, accent, latSoft.mul(0.72).add(fresnel.mul(0.12)));
        const latticeCol = latticeHue
          .mul(latSoft.mul(latSoft).mul(0.8))
          .mul(lattice)
          .mul(float(0.95).add(tension.mul(0.45)));

        // Broad, drifting light bands travel at a different speed from the
        // lattice. This separated motion is what makes the interior feel liquid.
        const causticA = sin(
          p.x.mul(8.5)
            .add(p.y.mul(3.2))
            .add(time.mul(0.52))
            .add(slosh.x.mul(5.0)),
        )
          .mul(0.5)
          .add(0.5);
        const causticB = sin(
          p.y.mul(7.0)
            .sub(p.z.mul(4.2))
            .sub(time.mul(0.36))
            .add(slosh.y.mul(4.0)),
        )
          .mul(0.5)
          .add(0.5);
        const caustic = smoothstep(0.72, 1.0, causticA.mul(causticB))
          .mul(float(0.1).add(tension.mul(0.08)))
          .mul(float(0.55).add(fresnel.mul(0.45)));
        const stressGlint = pow(max(dot(n, half), 0), 180.0)
          .mul(float(0.28).add(tension.mul(0.42)));

        const col = body
          .add(rim)
          .add(wetEdge)
          .add(latticeCol)
          .add(accent.mul(caustic))
          .add(highlight.mul(stressGlint));
        // Hue-preserving floor: a faint tint-coloured ambient keeps overlap
        // regions inside the chapter palette instead of clamping to blue.
        const gradedCol = max(col, vec3(0)).add(tint.mul(0.05));

        // soften silhouette into true black void
        const fog = smoothstep(float(0.2), float(1.1), length(p));
        finalColor.assign(vec4(mix(gradedCol, vec3(0), fog.mul(0.24)), 1));
        Break();
      });
    });

    return finalColor;
  });

  const material = new NodeMaterial();
  material.colorNode = raymarch();
  material.transparent = false;
  material.side = DoubleSide;
  material.depthWrite = true;

  return {
    material,
    tension,
    speed,
    pulse,
    tint,
    accent,
    highlight,
    lattice,
    pointer,
    jiggle,
    squash,
    slosh,
    stepCount,
  };
}
