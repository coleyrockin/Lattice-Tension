'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { LineSegments2 } from 'three/examples/jsm/lines/webgpu/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { createFilamentMaterial } from '@/engine/tsl/filamentMaterial';
import { getAtmosphere } from '@/lib/atmosphere/interpolate';
import type { FieldBridge } from '@/lib/lattice/generateField';

type Props = {
  bridges: FieldBridge[];
  tension: number;
  lineWidth?: number;
};

export function FilamentBridge({ bridges, tension, lineWidth = 0.04 }: Props) {
  const meshRef = useRef<LineSegments2>(null!);

  const { mesh, tensionUniform, accentUniform } = useMemo(() => {
    const positions = new Float32Array(bridges.length * 6);
    bridges.forEach((b, i) => {
      positions[i * 6] = b.from.x;
      positions[i * 6 + 1] = b.from.y;
      positions[i * 6 + 2] = b.from.z;
      positions[i * 6 + 3] = b.to.x;
      positions[i * 6 + 4] = b.to.y;
      positions[i * 6 + 5] = b.to.z;
    });
    const geo = new LineSegmentsGeometry();
    geo.setPositions(positions);
    const { material, tensionUniform, accentUniform } = createFilamentMaterial(lineWidth);
    material.opacity = 0.55;
    return { mesh: new LineSegments2(geo, material), tensionUniform, accentUniform };
  }, [bridges, lineWidth]);

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame mutates Three.js objects
  useFrame(() => {
    tensionUniform.value = tension * 0.85;
    accentUniform.value.set(getAtmosphere(tension).accent);
    mesh.material.linewidth = lineWidth * (0.85 + tension * 0.25);
    mesh.material.opacity = 0.35 + tension * 0.35;
  });

  return <primitive ref={meshRef} object={mesh} />;
}