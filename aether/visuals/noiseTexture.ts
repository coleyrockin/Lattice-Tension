import { Data3DTexture, LinearFilter, RedFormat, Vector3 } from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

export function createCloudTexture(size = 128) {
  const data = new Uint8Array(size * size * size);
  const perlin = new ImprovedNoise();
  const v = new Vector3();
  let i = 0;
  const scale = 0.048;

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const d = 1 - v.set(x, y, z).subScalar(size / 2).divideScalar(size).length();
        const n = perlin.noise(x * scale * 1.4, y * scale, z * scale * 1.4);
        data[i++] = (128 + 128 * n) * d * d;
      }
    }
  }

  const tex = new Data3DTexture(data, size, size, size);
  tex.format = RedFormat;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}