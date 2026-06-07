// ═══════════════════════════════════════════════════════════════════════════
// VOIDBOYD — Custom GLSL Shaders
// High-quality procedural cosmic effects for the living digital temple
// ═══════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────
// BLACK HOLE / SINGULARITY — Event horizon + accretion disk + lensing
// ───────────────────────────────────────────────────────────────────────────
export const blackHoleVertexShader = `
  uniform float uTime;
  uniform float uMousePull;
  uniform vec2 uMouse;
  uniform float uIntensity;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vDistToCenter;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    float dist = length(pos);
    vDistToCenter = dist;

    // Gentle gravitational lensing distortion on vertices
    float pull = uMousePull * 0.6 + uIntensity * 0.25;
    vec3 toCenter = -pos / (dist + 0.0001);
    
    // Mouse direction influence (spacetime drag)
    vec3 mouseDir = vec3(uMouse.x * 0.8, uMouse.y * 0.4, 0.0);
    pos += toCenter * pull * (0.8 + sin(uTime * 1.3) * 0.1);
    pos += mouseDir * pull * 0.15;

    // Subtle breathing on outer disk
    if (dist > 0.6) {
      pos *= 1.0 + sin(uTime * 0.7 + dist * 3.0) * 0.015 * uIntensity;
    }

    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const blackHoleFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uMousePull;
  uniform vec2 uMouse;
  uniform float uClimax;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vDistToCenter;

  // Hash + noise helpers
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    float a = hash(i);
    float b = hash(i + vec2(1.0,0.0));
    float c = hash(i + vec2(0.0,1.0));
    float d = hash(i + vec2(1.0,1.0));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }

  void main() {
    vec3 col = vec3(0.0);
    float dist = vDistToCenter;

    // Core event horizon — deep void with subtle rim
    float core = smoothstep(0.18, 0.0, dist);
    col += vec3(0.015, 0.01, 0.03) * core;

    // Accretion disk — fiery gold + lavender plasma
    float disk = smoothstep(0.22, 1.35, dist) * (1.0 - smoothstep(1.6, 2.8, dist));
    float diskAngle = atan(vPosition.y, vPosition.x);
    float diskWave = sin(diskAngle * 7.0 + uTime * 1.8) * 0.5 + 0.5;
    float diskPulse = sin(uTime * 0.9 + dist * 4.0) * 0.5 + 0.5;

    vec3 diskColor = mix(
      vec3(0.96, 0.72, 0.28), 
      vec3(0.72, 0.42, 0.98), 
      sin(diskAngle * 1.6 + uTime * 0.4) * 0.5 + 0.5 + uIntensity * 0.3
    );

    col += diskColor * disk * (0.7 + diskWave * 0.9 + diskPulse * 0.4) * (0.65 + uIntensity * 0.6);

    // Gravitational lensing glow ring
    float lens = pow(1.0 - abs(dist - 1.05), 6.0) * 1.6;
    col += vec3(0.85, 0.75, 0.98) * lens * (0.4 + uMousePull * 0.6);

    // Mouse spacetime drag highlight
    float mouseInfluence = length(vUv - (uMouse * 0.5 + 0.5));
    float drag = exp(-mouseInfluence * 5.5) * uMousePull * 1.8;
    col += vec3(0.4, 0.6, 1.0) * drag * 0.6;

    // Climax convergence — pure white hot bloom
    col = mix(col, vec3(1.0), uClimax * 0.85 * smoothstep(0.0, 1.3, dist));

    // Subtle vertical scan / energy
    float scan = sin(vPosition.y * 18.0 + uTime * 2.2) * 0.5 + 0.5;
    col += col * scan * 0.06 * uIntensity;

    // Soft vignette inside the mesh
    float vig = smoothstep(2.2, 0.6, dist);
    col *= vig;

    gl_FragColor = vec4(col, 0.96);
  }
`;

// ───────────────────────────────────────────────────────────────────────────
// NEBULA VOLUMETRIC — gas clouds (used on transparent planes)
// ───────────────────────────────────────────────────────────────────────────
export const nebulaVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const nebulaFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uDensity;
  uniform float uSpeed;
  uniform float uIntensity;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }

  float noise3(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f*f*(3.0-2.0*f);
    float n = mix(
      mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
          mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
          mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
    return n;
  }

  void main() {
    vec3 p = vWorldPos * 0.018 + vec3(uTime * uSpeed * 0.03, uTime * uSpeed * 0.015, 0.0);
    
    float n1 = noise3(p * 1.0);
    float n2 = noise3(p * 2.4 + 17.0);
    float n3 = noise3(p * 4.7 - 9.0);
    
    float fbm = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;
    fbm = pow(fbm, 1.35);

    float alpha = fbm * uDensity * (0.6 + uIntensity * 0.7);
    alpha = smoothstep(0.05, 0.92, alpha);

    vec3 col = mix(uColor1, uColor2, fbm * 1.1);
    col += vec3(0.1, 0.12, 0.22) * (n2 * 0.6); // extra cosmic teal lift

    // Soft edges
    alpha *= smoothstep(0.0, 0.6, length(vUv - 0.5) * -1.0 + 1.1);

    gl_FragColor = vec4(col, alpha * 0.72);
  }
`;

// ───────────────────────────────────────────────────────────────────────────
// PARTICLE / SPARK — used for multiple systems
// ───────────────────────────────────────────────────────────────────────────
export const particleVertexShader = `
  attribute float aSize;
  attribute float aPhase;
  attribute float aType; // 0=spark, 1=rune, 2=code

  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uMouse;
  uniform float uMousePull;

  varying float vAlpha;
  varying float vType;
  varying vec3 vColor;

  void main() {
    vec3 pos = position;

    float t = uTime * (0.6 + aType * 0.3);
    float phase = aPhase;

    // Flowing motion — different per type
    pos.x += sin(t * 0.8 + phase * 6.28) * (0.6 - aType * 0.25);
    pos.y += cos(t * 0.6 + phase) * (0.45 + aType * 0.1);
    pos.z += sin(t * 1.1 + phase * 3.0) * 0.35;

    // Mouse gravity well
    vec3 toMouse = vec3(uMouse.x * 6.0, uMouse.y * 4.0, -2.0) - pos;
    float md = length(toMouse) + 0.001;
    pos += normalize(toMouse) * (uMousePull * 1.6) / (md * 0.6 + 1.0);

    // Gentle breathing with intensity
    float breathe = 1.0 + sin(uTime * 1.4 + phase) * 0.035 * uIntensity;
    pos *= breathe;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (260.0 / -mvPosition.z) * (1.0 + uIntensity * 0.6);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = 0.4 + 0.6 * sin(uTime * 2.0 + phase) * (0.5 + uIntensity * 0.5);
    vType = aType;
    vColor = mix(vec3(0.65,0.82,1.0), vec3(0.96,0.78,0.42), aType);
  }
`;

export const particleFragmentShader = `
  uniform float uIntensity;

  varying float vAlpha;
  varying float vType;
  varying vec3 vColor;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);

    // Different shapes per type
    float shape = 1.0;
    if (vType > 1.5) {
      // code bit — sharper rect
      shape = 1.0 - max(abs(c.x), abs(c.y)) * 1.8;
    } else if (vType > 0.5) {
      // rune — hex-ish
      float hex = max(abs(c.x) + abs(c.y) * 0.577, abs(c.x * 0.5 + c.y * 0.866));
      shape = 1.0 - hex * 1.9;
    } else {
      // spark — soft glow
      shape = exp(-d * d * 18.0);
    }

    float alpha = shape * vAlpha * (0.65 + uIntensity * 0.45);
    if (alpha < 0.012) discard;

    vec3 col = vColor;
    col += vec3(0.2, 0.35, 0.6) * uIntensity * 0.5; // extra bloom lift

    gl_FragColor = vec4(col, alpha);
  }
`;

// ───────────────────────────────────────────────────────────────────────────
// Simple star / distant point
// ───────────────────────────────────────────────────────────────────────────
export const starVertexShader = `
  attribute float aSize;
  attribute float aTwinkle;

  uniform float uTime;

  varying float vTwinkle;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (180.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
    vTwinkle = aTwinkle;
  }
`;

export const starFragmentShader = `
  uniform float uTime;

  varying float vTwinkle;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float star = exp(-d * d * 22.0);
    float tw = sin(uTime * 3.5 + vTwinkle * 18.0) * 0.5 + 0.5;
    float a = star * (0.65 + tw * 0.55);
    gl_FragColor = vec4(0.92, 0.94, 1.0, a);
  }
`;
