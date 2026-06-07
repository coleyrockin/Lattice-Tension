uniform float uTension;
uniform float uTime;
varying float vStress;
varying float vPhase;
varying float vFresnel;
void main() {
  vec3 cool = vec3(0.35, 0.45, 0.82);
  vec3 warm = vec3(0.92, 0.55, 0.28);
  vec3 hot = vec3(1.0, 0.95, 0.65);
  float w = sin(vPhase * 6.0 + uTension * 4.0) * 0.5 + 0.5;
  vec3 base = mix(mix(cool, warm, w), hot, vStress * 0.75);
  float rim = vFresnel * (0.75 + vStress * 1.1);
  float phaseGlow = sin(vPhase * 12.0 + uTime * 0.5) * 0.5 + 0.5;
  float g = 0.85 + vStress * 0.75 + phaseGlow * 0.35 + rim;
  float a = 0.62 + vStress * 0.38 + rim * 0.25;
  gl_FragColor = vec4(base * g, a);
}