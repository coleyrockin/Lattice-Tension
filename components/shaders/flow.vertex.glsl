uniform float uTime;
uniform float uTension;
uniform float uSpeed;
uniform float uBurst;
uniform sampler2D uNodeTex;
uniform float uNodeCount;
uniform sampler2D uEdgeTex;
uniform float uEdgeCount;
attribute float aEdgeIndex;
attribute float aPhase;
attribute float aParticleId;

varying float vAlpha;

vec3 fetchNode(float idx) {
  float u = (idx + 0.5) / uNodeCount;
  return texture2D(uNodeTex, vec2(u, 0.5)).rgb;
}

void main() {
  float ei = aEdgeIndex;
  float eu = (ei + 0.5) / uEdgeCount;
  vec2 edge = texture2D(uEdgeTex, vec2(eu, 0.5)).rg;
  float nodeA = edge.r;
  float nodeB = edge.g;

  float spd = (0.7 + uTension * 1.5) * uSpeed + uBurst * 2.5;
  float tt = mod(uTime * spd + aPhase, 1.0);

  vec3 pA = fetchNode(nodeA);
  vec3 pB = fetchNode(nodeB);
  vec3 pos = mix(pA, pB, tt);

  float tLow = max(0.0, 1.0 - uTension * 1.6);
  float tMid = clamp((uTension - 0.3) * 2.2, 0.0, 1.0);
  float tHigh = max(0.0, (uTension - 0.55) * 2.4);
  vec3 radialDir = normalize(pos + vec3(0.0001));

  pos.x += sin(uTime * 2.2 * uSpeed + aParticleId * 0.5) * 0.055 * tLow * uTension;
  pos.y += cos(uTime * 1.9 * uSpeed + aParticleId * 0.35) * 0.042 * tLow * uTension;
  pos.z += sin(uTime * 2.5 * uSpeed + aParticleId * 0.7) * 0.048 * tLow * uTension;

  float swirl = sin(uTime * 3.2 + aParticleId * 0.85) * tMid * 0.095;
  pos.x += -pos.z * swirl * 0.6 + radialDir.x * tMid * 0.045;
  pos.z += pos.x * swirl * 0.6 + radialDir.z * tMid * 0.045;

  pos.x += sin(uTime * 17.0 + aParticleId * 1.6) * tHigh * 0.065 * uTension;
  pos.y += cos(uTime * 14.0 + aParticleId * 2.0) * tHigh * 0.055 * uTension;
  pos.z += sin(uTime * 16.0 + aParticleId * 1.3) * tHigh * 0.06 * uTension;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 42.0 * (1.0 + uTension * 1.1 + uBurst * 1.5) * (320.0 / max(-mv.z, 1.0));
  vAlpha = 0.95;
}