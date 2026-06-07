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

export function AtmosphereController({ tension, accentRef, emissiveRef }: Props) {
  const { scene } = useThree();
  const fogRef = useRef<THREE.Fog | null>(null);
  const bgRef = useRef(new THREE.Color('#0a0618'));

  useFrame(() => {
    const atm = getAtmosphere(tension);
    bgRef.current.set(atm.bg);
    // eslint-disable-next-line react-hooks/immutability
    scene.background = bgRef.current;

    if (!fogRef.current) {
      fogRef.current = new THREE.Fog(atm.bg, atm.fogNear, atm.fogFar);
      scene.fog = fogRef.current;
    } else {
      fogRef.current.color.set(atm.bg);
      fogRef.current.near = atm.fogNear;
      fogRef.current.far = atm.fogFar;
    }

    if (accentRef.current) {
      accentRef.current.color.set(atm.accent);
      accentRef.current.intensity = 0.65 + tension * 0.9;
    }
    if (emissiveRef.current) {
      emissiveRef.current.color.set(atm.secondary);
    }
  });

  return null;
}