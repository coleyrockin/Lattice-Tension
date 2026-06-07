uniform float uTension;
uniform float uTime;
varying float vHeat;
varying vec3 vNormal;
varying float vFres;
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vec3(0.0, 0.0, 1.0));
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 coolCore = vec3(0.6, 0.7, 0.95);
  vec3 warmCore = vec3(0.95, 0.82, 0.55);
  vec3 hotCore = vec3(1.0, 0.95, 0.8);
  vec3 core = mix(mix(coolCore, warmCore, uTension), hotCore, vHeat * 0.5);
  vec3 rim = mix(vec3(0.35, 0.25, 0.55), vec3(0.85, 0.55, 0.45), uTension * 0.7);
  vec3 col = mix(rim, core, 0.6 + vFres * 0.4);
  col += vec3(0.15) * sin(uTime * 4.0 + vHeat * 8.0) * (0.3 + uTension * 0.4);
  float alpha = 0.75 + vFres * 0.35 + vHeat * 0.25;
  gl_FragColor = vec4(col, clamp(alpha, 0.65, 1.0));
}