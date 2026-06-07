import * as THREE from 'three';
import type { PulseState } from '@/lib/tension/types';

export function deformLatticeVertex(
  pos: THREE.Vector3,
  phase: number,
  t: number,
  tension: number,
  mouse: { x: number; y: number },
  pull: number,
  pulse: PulseState,
): THREE.Vector3 {
  const out = pos.clone();
  const toC = out.clone().negate();
  const d = toC.length() + 0.0001;
  const dir = toC.divideScalar(d);
  out.addScaledVector(dir, tension * 0.22 + pull * 0.08);

  const mDir = new THREE.Vector3(mouse.x * 1.8, mouse.y * 1.2, 0);
  out.addScaledVector(mDir, pull * 0.07);

  const pulsePos = new THREE.Vector3(pulse.x * 4, pulse.y * 3, 0);
  const pDir = out.clone().sub(pulsePos);
  const pd = pDir.length() + 0.001;
  out.addScaledVector(pDir.normalize(), -pulse.strength * 0.35 * Math.exp(-pd * 1.8));

  const damp = 1 - tension * 0.6;
  out.x += Math.sin(t * 1.2 + phase) * 0.035 * damp;
  out.z += Math.cos(t * 1.1 + phase) * 0.035 * damp;

  const curl = tension * 0.04 * Math.sin(phase * 5 + t * 0.8);
  out.x += Math.sin(phase * 3) * curl;
  out.z += Math.cos(phase * 4) * curl;

  const globalWave = Math.sin(t * 0.4 + out.length() * 0.15) * tension * 0.085;
  out.addScaledVector(out.clone().normalize(), globalWave);

  const vibFreq = 8 + tension * 25;
  out.y += Math.sin(t * vibFreq + phase * 2) * tension * 0.042;

  const twist = tension * 0.19 * Math.sin(t * 0.6 + out.y * 0.4 + phase);
  const cs = Math.cos(twist);
  const sn = Math.sin(twist);
  const tx = out.x * cs - out.z * sn;
  const tz = out.x * sn + out.z * cs;
  out.x = tx;
  out.z = tz;

  return out;
}