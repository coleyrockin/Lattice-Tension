import { Color, DoubleSide } from 'three';
import { NodeMaterial } from 'three/webgpu';
import {
  Break,
  Fn,
  If,
  abs,
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

export function createShellMaterial(steps: number) {
  const tension = uniform(0.35);
  const speed = uniform(0.5);
  const pulse = uniform(0);
  const tint = uniform(new Color('#5eead4'));
  const stepCount = uniform(steps);

  const map = (p: ReturnType<typeof vec3>) => {
    const pt = p;
    const t = time.mul(speed.mul(0.35));
    const amp = tension.mul(0.07).add(pulse.mul(0.14));
    const breathe = sin(t.mul(0.9)).mul(0.025).mul(tension);

    const warp = vec3(
      sin(pt.y.mul(4.2).add(t)).mul(amp),
      sin(pt.z.mul(3.8).sub(t.mul(0.6))).mul(amp.mul(0.85)),
      sin(pt.x.mul(4.5).add(t.mul(0.4))).mul(amp),
    );

    const q = pt.add(warp);

    const major = float(0.52).sub(tension.mul(0.06)).add(breathe);
    const minor = float(0.13).add(tension.mul(0.04)).add(pulse.mul(0.03));

    const d1 = length(vec2(length(q.xz).sub(major), q.y)).sub(minor);

    const qzx = vec3(q.z, q.y, q.x);
    const d2 = length(vec2(length(qzx.xz).sub(major.mul(0.82)), qzx.y)).sub(minor.mul(0.78));

    const d3 = length(q).sub(minor.mul(0.55).add(tension.mul(0.08)));

    const h12 = max(float(0.11).sub(abs(d1.sub(d2))), 0).div(0.11);
    const shell = min(d1, d2).sub(h12.mul(h12).mul(0.11).mul(0.25));

    const blend = float(0.06).add(tension.mul(0.04));
    const hsc = max(blend.sub(abs(shell.sub(d3))), 0).div(blend);
    const core = min(shell, d3).sub(hsc.mul(hsc).mul(blend).mul(0.25));

    const ripple = sin(length(pt.xz).mul(9).sub(t.mul(2.2)))
      .mul(sin(pt.y.mul(7).add(t)))
      .mul(amp.mul(0.35));

    return core.sub(ripple).sub(pulse.mul(0.06));
  };

  const raymarch = Fn(() => {
    const rd = vec3(0, 0, 1).toVar();
    const finalColor = vec4(0.008, 0.012, 0.028, 1).toVar();

    RaymarchingBox(stepCount, ({ positionRay }) => {
      const p = positionRay.mul(2.6);
      const d = map(p as ReturnType<typeof vec3>);

      If(d.lessThan(0.0015), () => {
        const e = float(0.0012);
        const n = normalize(
          vec3(
            map(p.add(vec3(e, 0, 0)) as ReturnType<typeof vec3>).sub(
              map(p.sub(vec3(e, 0, 0)) as ReturnType<typeof vec3>),
            ),
            map(p.add(vec3(0, e, 0)) as ReturnType<typeof vec3>).sub(
              map(p.sub(vec3(0, e, 0)) as ReturnType<typeof vec3>),
            ),
            map(p.add(vec3(0, 0, e)) as ReturnType<typeof vec3>).sub(
              map(p.sub(vec3(0, 0, e)) as ReturnType<typeof vec3>),
            ),
          ),
        );

        const lightDir = normalize(vec3(0.35, 0.65, 0.55));
        const diff = max(dot(n, lightDir), 0).mul(0.55).add(0.12);
        const ndv = max(dot(n, rd.negate()), 0);
        const rim = pow(float(1).sub(ndv), 3.2).mul(0.85);
        const fresnel = pow(float(1).sub(ndv), 1.6).mul(0.35);

        const warm = mix(tint, vec3(1, 0.96, 0.88), tension.mul(0.65).add(pulse.mul(0.2)));
        const body = warm.mul(diff.add(fresnel));
        const glow = warm.mul(rim).mul(float(1.1).add(tension.mul(0.4)));
        const caustic = sin(p.x.mul(12).add(time.mul(0.4)))
          .mul(sin(p.y.mul(10).sub(time.mul(0.3))))
          .mul(0.04)
          .mul(tension);
        const col = body.add(glow).add(vec3(caustic));

        const fog = smoothstep(float(0.2), float(1.1), length(p));
        finalColor.assign(vec4(mix(col, finalColor.rgb, fog.mul(0.35)), 1));
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

  return { material, tension, speed, pulse, tint, stepCount };
}