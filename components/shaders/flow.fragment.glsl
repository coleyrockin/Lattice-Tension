varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float soft = 1.0 - smoothstep(0.3, 0.5, d);
  gl_FragColor = vec4(0.98, 0.8, 0.08, vAlpha * soft);
}