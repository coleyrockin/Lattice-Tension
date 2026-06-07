uniform float uTime;
uniform float uTension;
varying vec3 vWorldPos;
varying vec3 vViewDir;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 p = vWorldPos * 0.035 + vec3(uTime * 0.01, uTime * 0.006, 0.0);
  float density = pow(mix(fbm(p), fbm(p * 1.7 + vec3(0.0, uTime * 0.015, 0.0)), 0.5), 1.5);

  vec3 cool = vec3(0.12, 0.18, 0.45);
  vec3 warm = vec3(0.45, 0.22, 0.08);
  vec3 hot = vec3(0.55, 0.48, 0.15);
  vec3 col = mix(mix(cool, warm, uTension), hot, density * 0.6);
  col += vec3(0.2, 0.14, 0.04) * uTension * density;

  float alpha = density * (0.22 + uTension * 0.18);
  float fres = pow(1.0 - max(dot(normalize(vViewDir), vec3(0.0, 0.0, 1.0)), 0.0), 1.5);
  alpha *= 0.55 + fres * 0.55;

  gl_FragColor = vec4(col, alpha);
}