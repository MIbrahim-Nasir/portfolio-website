// Shaders. No bloom, no glow sprites: lines and points fade with distance from the focal plane
// (a cheap depth of field), and everything else is lit geometry.

// Lines, rings and tick marks. T_MODE 0: no reveal, 1: reveal along uv.x (torus), 2: along aT (instances).
export const lineVert = /* glsl */ `
uniform float uFocus;
uniform float uRange;
uniform float uExplode;
varying float vBlur;
varying float vT;
#if T_MODE == 2
attribute float aT;
#endif
#ifdef EXPLODE
attribute vec3 aCenter;
attribute float aRand;
#endif
void main() {
  vec3 p = position;
  #ifdef EXPLODE
  p += normalize(aCenter) * uExplode * (0.22 + aRand * 0.38);
  #endif
  vec4 mv = vec4(p, 1.0);
  #ifdef USE_INSTANCING
  mv = instanceMatrix * mv;
  #endif
  mv = modelViewMatrix * mv;
  vBlur = clamp(abs(-mv.z - uFocus) / uRange, 0.0, 1.0);
  #if T_MODE == 1
  vT = uv.x;
  #elif T_MODE == 2
  vT = aT;
  #else
  vT = 0.0;
  #endif
  gl_Position = projectionMatrix * mv;
}
`;

export const lineFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
uniform float uDraw;
uniform float uMinA;
varying float vBlur;
varying float vT;
void main() {
  if (vT > uDraw) discard;
  float a = uAlpha * mix(1.0, uMinA, vBlur * vBlur);
  gl_FragColor = vec4(uColor, a);
}
`;

// Dust: in-focus points are single crisp pixels; out-of-focus points open into faint, hard-edged discs.
export const dustVert = /* glsl */ `
uniform float uFocus;
uniform float uRange;
uniform float uPx;
uniform float uTime;
attribute float aSeed;
varying float vBlur;
varying float vA;
void main() {
  vec3 p = position;
  p.y += sin(uTime * 0.15 + aSeed * 40.0) * 0.06;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float b = clamp(abs(-mv.z - uFocus) / (uRange * 3.0), 0.0, 1.0);
  float grow = b * b * 9.0;
  gl_PointSize = (1.1 + grow) * uPx;
  vBlur = b;
  vA = (0.3 + aSeed * 0.45) / (1.0 + grow * 1.6);
  gl_Position = projectionMatrix * mv;
}
`;

export const dustFrag = /* glsl */ `
uniform vec3 uColor;
varying float vBlur;
varying float vA;
void main() {
  float r = length(gl_PointCoord - 0.5);
  float soft = mix(0.5, 0.06, vBlur);
  float a = 1.0 - smoothstep(0.5 - soft, 0.5, r);
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a * vA);
}
`;
