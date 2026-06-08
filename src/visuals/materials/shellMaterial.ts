import { Color, DoubleSide, ShaderMaterial, Vector2 } from "three";

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
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vPressure;
  varying float vVein;
  varying float vPhase;

  void main() {
    vec3 p = position;
    vec3 direction = normalize(position);
    float slow = sin(p.x * 1.7 + p.y * 2.3 + p.z * 1.4 + uTime * 0.35 + uPhase);
    float detail = sin(p.x * 4.4 - p.y * 3.2 + p.z * 2.6 - uTime * 0.28);
    float pressure = exp(-length(p.xy - uPointer * 1.9) * 0.52) * uTension * (0.7 + uStressIntensity * 0.45);
    float fold = sin(p.y * 3.0 + p.z * 2.0 + uTime * 0.8 + uPhase) * uCollapse * (0.55 + uCollapseDistortion);
    float twist = sin(p.y * 2.2 + uTime * 0.22 + uPhase) * (uTension * 0.08 + uEmergence * 0.06);

    p += direction * (slow * 0.2 + detail * 0.06 + pressure * 0.34);
    p.x += fold * 0.32 + p.z * twist;
    p.y -= fold * p.x * 0.075;
    p.z -= p.x * twist * 0.42;
    p *= 0.76 + uBirth * 0.24 + uEmergence * 0.1 - uCollapse * 0.14;

    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorldPosition = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vPressure = pressure + abs(fold) * 0.18;
    vVein = slow * 0.5 + detail * 0.5;
    vPhase = uPhase;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = `
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;
  uniform float uOpacity;
  uniform float uTension;
  uniform float uOrder;
  uniform float uStressIntensity;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vPressure;
  varying float vVein;
  varying float vPhase;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(normalize(vWorldNormal), viewDirection)), 2.35);
    float vein = pow(abs(sin(vVein * 11.0 + vWorldPosition.y * 1.7)), 24.0);
    float contour = pow(abs(sin(length(vWorldPosition.xy) * (5.0 + uOrder * 4.0))), 30.0);
    float webA = pow(abs(sin(vWorldPosition.x * 1.9 + vWorldPosition.y * 0.8 + vPhase)), 16.0);
    float webB = pow(abs(sin(vWorldPosition.y * 2.15 - vWorldPosition.z * 0.9 - vPhase)), 18.0);
    float webC = pow(abs(sin(vWorldPosition.z * 2.4 + vWorldPosition.x * 0.75 + vPhase * 0.6)), 20.0);
    float web = max(webA, max(webB, webC));
    float spectralBand = sin(vWorldPosition.x * 0.52 + vWorldPosition.y * 0.38 + vPhase);
    vec3 color = mix(uPrimary, uSecondary, smoothstep(-0.32, 0.32, spectralBand));
    color = mix(color, uAccent, clamp(vPressure * 0.75 + web * uTension * 0.14, 0.0, 0.38));
    float structure = max(web, fresnel * 0.88);
    if (structure < 0.3 && vPressure < 0.06) discard;
    float alpha = (fresnel * 0.046 + web * 0.1 + vein * 0.018 + contour * 0.009 + vPressure * 0.042) * uOpacity;
    gl_FragColor = vec4(color * (0.58 + fresnel * 1.62 + web * (0.72 + uStressIntensity * 0.34)), alpha);
  }
`;

export type ShellMaterial = ShaderMaterial & {
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

export function createShellMaterial(phase: number, opacity: number) {
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
      uPrimary: { value: new Color("#acc8ff") },
      uSecondary: { value: new Color("#9266ee") },
      uAccent: { value: new Color("#efc67e") },
      uOpacity: { value: opacity },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  }) as ShellMaterial;
}
