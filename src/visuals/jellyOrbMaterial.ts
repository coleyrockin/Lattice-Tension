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
 *  - iridescent hue-shift fresnel rim with a faint chromatic split
 *  - a glowing gyroid tension-lattice suspended inside, seen through the shell
 */
export function createJellyOrbMaterial(steps: number) {
  const tension = uniform(0.4);
  const speed = uniform(0.6);
  const pulse = uniform(0);
  const tint = uniform(new Color('#5eead4')); // teal shell
  const accent = uniform(new Color('#a78bfa')); // violet inner lattice / iridescence pole
  const lattice = uniform(0.7); // internal lattice brightness
  const pointer = uniform(new Vector2()); // set .value.set(x, y) per frame
  const jiggle = uniform(new Vector3(0, 1, 0)); // wobble axis (spring-driven)
  const squash = uniform(0); // spring displacement: + stretches along jiggle
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
    const amp = tension.mul(0.07).add(pulse.mul(0.14));

    // two breathing timescales: tension-tied + a slow independent ~48s swell
    const breathe = sin(t.mul(0.9)).mul(0.025).mul(tension).add(sin(time.mul(0.13)).mul(0.02));

    // multi-octave domain warp — slow primary swell + finer secondary shimmer
    const lean = vec3(pointer.x.mul(0.05), pointer.y.mul(-0.05), 0);
    const warpA = vec3(
      sin(pt.y.mul(4.2).add(t).add(lean.x)).mul(amp),
      sin(pt.z.mul(3.8).sub(t.mul(0.6))).mul(amp.mul(0.85)),
      sin(pt.x.mul(4.5).add(t.mul(0.4)).add(lean.y)).mul(amp),
    );
    const warpB = vec3(
      sin(pt.z.mul(8.1).sub(t.mul(1.3))).mul(amp.mul(0.35)),
      sin(pt.x.mul(7.4).add(t.mul(0.9))).mul(amp.mul(0.35)),
      sin(pt.y.mul(8.8).sub(t.mul(1.1))).mul(amp.mul(0.35)),
    );
    const q = pt.add(warpA).add(warpB);

    // glacial silhouette morph between a ring-knot and a rounder blob (~125s)
    const morph = sin(time.mul(0.05)).mul(0.5).add(0.5);
    const major = mix(float(0.52), float(0.4), morph).sub(tension.mul(0.06)).add(breathe);
    const minor = float(0.13).add(tension.mul(0.04)).add(pulse.mul(0.03));

    const d1 = length(vec2(length(q.xz).sub(major), q.y)).sub(minor);

    const qzx = vec3(q.z, q.y, q.x);
    const d2 = length(vec2(length(qzx.xz).sub(major.mul(0.82)), qzx.y)).sub(minor.mul(0.78));

    const h12 = max(float(0.11).sub(abs(d1.sub(d2))), 0).div(0.11);
    const shell = min(d1, d2).sub(h12.mul(h12).mul(0.11).mul(0.25));

    const d3 = length(q).sub(minor.mul(0.55).add(tension.mul(0.08)).add(morph.mul(0.05)));

    const blend = float(0.06).add(tension.mul(0.04));
    const hsc = max(blend.sub(abs(shell.sub(d3))), 0).div(blend);
    const core = min(shell, d3).sub(hsc.mul(hsc).mul(blend).mul(0.25));

    // twin travelling ripples crawling over the membrane (interference)
    const r1 = sin(length(pt.xz).mul(9).sub(t.mul(2.2))).mul(sin(pt.y.mul(7).add(t))).mul(amp.mul(0.35));
    const r2 = sin(length(pt.yz).mul(6).add(t.mul(1.4))).mul(sin(pt.x.mul(5).sub(t.mul(0.7)))).mul(amp.mul(0.22));

    return core.sub(r1).sub(r2).sub(pulse.mul(0.06));
  };

  const raymarch = Fn(() => {
    const rd = vec3(0, 0, 1).toVar();
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

        const lightDir = normalize(vec3(0.35, 0.65, 0.55));
        const diff = max(dot(n, lightDir), 0).mul(0.55).add(0.12);
        const ndv = max(dot(n, rd.negate()), 0).toVar();

        // iridescent hue-shift fresnel — rim slides teal → violet → gold as it turns
        const fresT = pow(float(1).sub(ndv), 1.5);
        const iri = cos(vec3(0.0, 0.33, 0.67).add(fresT).add(time.mul(0.03)).mul(6.2831))
          .mul(0.5)
          .add(0.5);
        const iriCol = mix(tint, accent, iri);

        // chromatic-aberration rim: per-channel fresnel split → vibrating silhouette
        const rimR = pow(float(1).sub(ndv.mul(0.97)), 3.2);
        const rimG = pow(float(1).sub(ndv), 3.2);
        const rimB = pow(float(1).sub(ndv.mul(1.03)), 3.2);
        const rim = vec3(rimR, rimG, rimB).mul(0.85).mul(iriCol);

        const fresnel = pow(float(1).sub(ndv), 1.6).mul(0.35);

        // polished-glass specular highlight
        const half = normalize(lightDir.add(rd.negate()));
        const spec = pow(max(dot(n, half), 0), 48.0).mul(0.6);

        const warm = mix(tint, vec3(1, 0.96, 0.88), tension.mul(0.5).add(pulse.mul(0.2)));
        const body = warm.mul(diff.add(fresnel)).add(spec);

        // internal gyroid tension-lattice, seen through the translucent shell:
        // a short inward sub-march from the hit point accumulates the glowing web
        const latGlow = float(0).toVar();
        const lp = p.toVar();
        const gscale = float(7.0).add(tension.mul(3));
        const gphase = vec3(time.mul(0.06), time.mul(-0.04), time.mul(0.05));
        Loop(6, ({ i }) => {
          lp.subAssign(n.mul(0.085)); // step inward along -normal
          const g = gyroid(lp.mul(gscale).add(gphase) as ReturnType<typeof vec3>);
          const band = smoothstep(0.14, 0.0, abs(g)); // bright on the gyroid surface
          const falloff = float(1).sub(float(i).mul(0.14));
          latGlow.addAssign(band.mul(0.13).mul(falloff));
        });
        const latticeCol = accent.mul(latGlow).mul(lattice).mul(float(1).add(tension.mul(0.5)));

        const caustic = sin(p.x.mul(12).add(time.mul(0.4)))
          .mul(sin(p.y.mul(10).sub(time.mul(0.3))))
          .mul(0.04)
          .mul(tension);

        const col = body.add(rim).add(latticeCol).add(accent.mul(caustic));

        // soften silhouette into true black void
        const fog = smoothstep(float(0.2), float(1.1), length(p));
        finalColor.assign(vec4(mix(col, vec3(0), fog.mul(0.45)), 1));
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

  return { material, tension, speed, pulse, tint, accent, lattice, pointer, jiggle, squash, stepCount };
}
