import * as THREE from 'three';

export function applyLatticeGroupMotion(
  group: THREE.Group,
  t: number,
  tension: number,
  speed: number,
  burst: number,
) {
  const effSpeed = speed * (1 + burst * 0.8);
  const type = Math.max(0, Math.min(1, (tension - 0.18) * 1.65));
  const smoothType = 1.0 - type;
  const chaoticType = type;

  const baseSpin = t * (0.018 * effSpeed);
  const smoothWobble = Math.sin(t * 0.28) * 0.048 * smoothType * tension;
  const chaoticWobble = Math.sin(t * (2.8 + tension * 5.5)) * 0.11 * chaoticType * tension;
  const peakJitter = chaoticType * Math.sin(t * 38.0) * 0.038 * tension;
  group.rotation.y = baseSpin + smoothWobble + chaoticWobble + peakJitter;

  const xPrecess = Math.sin(t * 0.012 * effSpeed) * 0.032 * tension;
  const xJitter = Math.sin(t * 27.0) * 0.055 * chaoticType * tension;
  const xType = chaoticType * Math.sin(t * (7.5 + tension * 6.5)) * 0.042 * tension;
  group.rotation.x = xPrecess + xJitter + xType;

  const zWobble = Math.cos(t * 0.016) * 0.028 * smoothType * tension;
  const zVib = Math.cos(t * (6.0 + tension * 13.0)) * 0.072 * chaoticType * tension;
  const zRelease = smoothType * Math.cos(t * 0.85) * 0.024 * tension;
  group.rotation.z = zWobble + zVib + zRelease;

  const smoothBreath = Math.sin(t * (0.65 * effSpeed)) * 0.042 * smoothType * tension;
  const chaoticBreath = Math.sin(t * 36.0) * 0.019 * chaoticType * tension;
  const baseBreath = 1.0 + smoothBreath + chaoticBreath;
  const squash = 1.0 + Math.sin(t * 1.65) * 0.028 * chaoticType * tension;
  const quiver =
    (tension > 0.55 ? Math.sin(t * 31.0) * 0.011 * (tension - 0.55) : 0) * chaoticType;
  const releaseOvershoot =
    (tension < 0.38 ? Math.sin(t * 1.0) * 0.035 * (0.38 - tension) : 0) * smoothType;
  const peakPulse = chaoticType * Math.sin(t * 22.0) * 0.014 * tension;
  group.scale.set(
    baseBreath + quiver + releaseOvershoot + peakPulse,
    baseBreath * (1.0 + squash * 0.85),
    (baseBreath + quiver + releaseOvershoot + peakPulse) * (1.0 - squash * 0.48),
  );

  const floatY = Math.sin(t * 0.42) * 0.048 * tension;
  const chaoticFloat = chaoticType * Math.sin(t * 11.0 + tension * 3.0) * 0.032 * tension;
  group.position.y = floatY + chaoticFloat;
  group.position.x =
    Math.sin(t * 0.09 * smoothType) * 0.032 * tension +
    Math.sin(t * 17.0) * 0.024 * chaoticType * tension;
  group.position.z =
    Math.cos(t * 0.07 * smoothType) * 0.026 * tension +
    Math.cos(t * 14.0) * 0.019 * chaoticType * tension;
}

export function updateShaderUniforms(
  material: THREE.ShaderMaterial,
  t: number,
  tension: number,
  mouse: { x: number; y: number },
  pull: number,
  pulse: { x: number; y: number; strength: number },
) {
  material.uniforms.uTime.value = t;
  material.uniforms.uTension.value = tension;
  material.uniforms.uMouse.value.set(mouse.x, mouse.y);
  material.uniforms.uPull.value = pull;
  material.uniforms.uPulseX.value = pulse.x;
  material.uniforms.uPulseY.value = pulse.y;
  material.uniforms.uPulseStrength.value = pulse.strength;
}