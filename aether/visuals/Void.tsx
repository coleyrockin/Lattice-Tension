'use client';

import { useMemo } from 'react';
import { BackSide } from 'three';
import { NodeMaterial } from 'three/webgpu';
import { Fn, mix, normalize, positionWorld, vec3 } from 'three/tsl';

export function Void() {
  const material = useMemo(() => {
    const mat = new NodeMaterial();
    mat.side = BackSide;
    mat.colorNode = Fn(() => {
      const dir = normalize(positionWorld);
      const top = vec3(0.01, 0.018, 0.04);
      const bottom = vec3(0, 0, 0);
      return mix(bottom, top, dir.y.mul(0.5).add(0.5));
    })();
    return mat;
  }, []);

  return (
    <mesh scale={12}>
      <sphereGeometry args={[1, 32, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}