uniform float uTension;
uniform float uTime;
varying float vStress;
varying float vPhase;
varying float vFresnel;
void main() {
  vec3 cool = vec3(0.42, 0.29, 0.54);
  vec3 warm = vec3(0.77, 0.48, 0.54);
  vec3 hot = vec3(0.98, 0.85, 0.45);
  float w = sin(vPhase * 6.0 + uTension * 4.0) * 0.5 + 0.5;
  vec3 base = mix(mix(cool, warm, w), hot, vStress * 0.7);
  float rim = vFresnel * (0.6 + vStress * 0.8);
  float phaseGlow = sin(vPhase * 12.0 + uTime * 0.5) * 0.5 + 0.5;
  float g = 0.7 + vStress * 0.6 + phaseGlow * 0.25 + rim;
  float a = 0.55 + vStress * 0.4 + rim * 0.3;
  float fall = 1.0 - smoothstep(0.0, 0.6, abs(gl_FragCoord.x - 0.5) * 1.2);
  gl_FragColor = vec4(base * g, a * fall);
}