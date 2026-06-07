'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Props = { tension: number };

function buildArcPoints(
  radius: number,
  startAngle: number,
  arcLength: number,
  segments: number,
  yOffset: number,
): Float32Array {
  const pts = new Float32Array(segments * 3);
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const ang = startAngle + t * arcLength;
    pts[i * 3] = Math.cos(ang) * radius;
    pts[i * 3 + 1] = yOffset + Math.sin(ang * 2.0) * 0.4;
    pts[i * 3 + 2] = Math.sin(ang) * radius - 6;
  }
  return pts;
}

export function MacroArcs({ tension }: Props) {
  const group = useRef<THREE.Group>(null!);

  const lines = useMemo(() => {
    const configs: [number, number, number, number][] = [
      [9.5, 0.4, 2.8, 0.6],
      [11.2, 2.5, 2.2, -0.8],
      [8.8, 4.8, 3.4, 0.2],
      [12.5, 1.2, 1.8, -1.2],
    ];
    return configs.map(([r, start, len, y], i) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(buildArcPoints(r, start, len, 64, y), 3));
      const mat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? '#c084fc' : '#7dd3fc',
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Line(geo, mat);
    });
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.004;
    group.current.rotation.x = Math.sin(t * 0.08) * 0.04 * tension;
    lines.forEach((line) => {
      (line.material as THREE.LineBasicMaterial).opacity = 0.08 + tension * 0.12;
    });
  });

  return (
    <group ref={group}>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}