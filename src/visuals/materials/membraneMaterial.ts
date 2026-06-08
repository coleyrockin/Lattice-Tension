import {
  Color,
  DoubleSide,
  ShaderMaterial,
  Vector2,
} from "three";

const vertexShader = `
  uniform float uTime;
  uniform float uBirth;
  uniform float uTension;
  uniform float uOrder;
  uniform float uCollapse;
  uniform float uEmergence;
  uniform float uCollapseDistortion;
  uniform float uStressIntensity;
  uniform float uPhase;
  uniform vec2 uPointer;
  varying vec2 vUv;
  varying float vWave;
  varying float vRadius;
  varying float vPressure;

  void main() {
    vUv = uv;
    vec3 p = position;
    vec2 centered = (uv - 0.5) * 2.0;
    float radius = length(centered);
    float radial = sin(radius * (12.0 + uOrder * 8.0) - uTime * 0.75 + uPhase);
    float crossWave = sin((p.x * 1.5 + p.y * 0.85) + uTime * 0.32 + uPhase);
    float pointerDistance = max(0.08, distance(centered, uPointer * 0.46));
    float pointerWell = exp(-pointerDistance * 2.55) * uTension * (0.65 + uStressIntensity * 0.5);
    float collapseFold = sin(p.x * 2.8 + p.y * 3.1 + uTime * 1.8) * uCollapse * (0.5 + uCollapseDistortion);
    float torque = sin(centered.x * 2.2 - centered.y * 1.7 + uTime * 0.24 + uPhase);
    float wave = radial * 0.17 + crossWave * 0.12 + torque * 0.055 * uEmergence;

    p.z += wave * (0.58 + uBirth * 0.7);
    p.z += pointerWell * 0.95;
    p.x += centered.y * collapseFold * 0.36;
    p.y += centered.x * collapseFold * 0.28;
    p.xy *= 0.64 + uBirth * 0.34 + uEmergence * 0.08 - uCollapse * 0.16;

    vWave = radial * 0.5 + 0.5;
    vRadius = radius;
    vPressure = pointerWell + abs(collapseFold) * 0.3;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;
  uniform float uOpacity;
  uniform float uOrder;
  uniform float uTension;
  uniform float uBirth;
  uniform float uStressIntensity;
  varying vec2 vUv;
  varying float vWave;
  varying float vRadius;
  varying float vPressure;

  void main() {
    float edge = smoothstep(1.35, 0.15, vRadius);
    float ring = pow(abs(sin(vRadius * (28.0 + uOrder * 30.0))), 28.0);
    float contour = pow(abs(sin((vUv.x + vUv.y) * 17.0 + vWave * 2.0)), 18.0);
    float caustic = pow(abs(sin((vUv.x - vUv.y) * 13.0 + vRadius * 4.0)), 22.0);
    float body = (0.009 + vWave * 0.018 + vPressure * 0.075) * edge;
    float lines = (ring * 0.052 + contour * 0.078 * uOrder + caustic * 0.07 * uStressIntensity) * edge;
    vec3 spectral = mix(uPrimary, uSecondary, vUv.x * 0.62 + vWave * 0.22);
    spectral = mix(spectral, uAccent, clamp(vPressure * 0.9 + ring * uTension * 0.25, 0.0, 0.55));
    spectral = mix(spectral, vec3(1.0), caustic * 0.16 + vPressure * 0.08);
    float alpha = (body + lines) * uOpacity * (0.26 + uOrder * 0.48 + uTension * 0.18 + uStressIntensity * 0.16) * smoothstep(0.02, 0.22, uBirth);

    gl_FragColor = vec4(spectral * (0.72 + ring * 0.72 + caustic * 1.15 + vPressure * 0.65), alpha);
  }
`;

export type MembraneMaterial = ShaderMaterial & {
  uniforms: {
    uTime: { value: number };
    uBirth: { value: number };
    uTension: { value: number };
    uOrder: { value: number };
    uCollapse: { value: number };
    uEmergence: { value: number };
    uCollapseDistortion: { value: number };
    uStressIntensity: { value: number };
    uPhase: { value: number };
    uPointer: { value: Vector2 };
    uPrimary: { value: Color };
    uSecondary: { value: Color };
    uAccent: { value: Color };
    uOpacity: { value: number };
  };
};

export function createMembraneMaterial(
  phase: number,
  opacity: number,
): MembraneMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBirth: { value: 0 },
      uTension: { value: 0 },
      uOrder: { value: 0 },
      uCollapse: { value: 0 },
      uEmergence: { value: 0 },
      uCollapseDistortion: { value: 0 },
      uStressIntensity: { value: 0 },
      uPhase: { value: phase },
      uPointer: { value: new Vector2() },
      uPrimary: { value: new Color("#a7c8ff") },
      uSecondary: { value: new Color("#885ee8") },
      uAccent: { value: new Color("#efc777") },
      uOpacity: { value: opacity },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  }) as MembraneMaterial;
}
