import { sin, cos, mix, vec3, float } from "three/tsl";

/**
 * The hidden geometry. Two triply-periodic minimal surfaces and their
 * closed-form gradients — no finite differences. The analytic gradient is
 * needed for both lighting AND to normalize the pseudo-SDF march (gyroid |f| is
 * not a true distance), so one eval gives distance and normal.
 *
 *   gyroid:    f = sin x cos y + sin y cos z + sin z cos x
 *   Schwarz-P: f = cos x + cos y + cos z
 */
type Vec = ReturnType<typeof vec3>;

/** Morphed field value `f` and its gradient `g` at point `p`. */
export function fieldFG(p: Vec, morph: ReturnType<typeof float>) {
  const sx = sin(p.x);
  const sy = sin(p.y);
  const sz = sin(p.z);
  const cx = cos(p.x);
  const cy = cos(p.y);
  const cz = cos(p.z);

  const fg = sx.mul(cy).add(sy.mul(cz)).add(sz.mul(cx));
  const gg = vec3(
    cx.mul(cy).sub(sz.mul(sx)),
    sx.mul(sy).negate().add(cy.mul(cz)),
    sy.mul(sz).negate().add(cz.mul(cx)),
  );

  const fp = cx.add(cy).add(cz);
  const gp = vec3(sx.negate(), sy.negate(), sz.negate());

  return { f: mix(fg, fp, morph), g: mix(gg, gp, morph) };
}
