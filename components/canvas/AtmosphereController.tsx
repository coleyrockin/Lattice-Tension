'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getAtmosphere } from '@/lib/atmosphere/interpolate';

type Props = {
  tension: number;
  accentRef: React.RefObject<THREE.PointLight | null>;
  emissiveRef: React.RefObject<THREE.PointLight | null>;
};

export function AtmosphereController({ tension, accentRef }: Props) {
  const { scene } = useThree();
  const bgRef = useRef(new THREE.Color('#010108'));

  // eslint-disable-next-line react-hooks/immutability -- R3F useFrame drives scene atmosphere
  useFrame(() => {
    const atm = getAtmosphere(tension);
    bgRef.current.set('#000000');
    scene.background = null;
    scene.fog = null;

    if (accentRef.current) {
      accentRef.current.color.set(atm.accent);
      accentRef.current.intensity = 1.1 + tension * 0.6;
    }
  });

  return null;
}