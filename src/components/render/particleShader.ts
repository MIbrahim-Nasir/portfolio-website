// Ashima / Stefan Gustavson simplex noise (MIT).
const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uProgress;
uniform float uIntro;
uniform float uChaos;
uniform float uSize;
uniform float uPixelRatio;
uniform float uRot[8];
uniform float uSizeK[8];
uniform float uAlphaK[8];
uniform vec3 uColA[8];
uniform vec3 uColB[8];
uniform vec3 uGlowCol[8];
uniform vec3 uMouse;
uniform float uMouseK;
uniform vec3 uShockPos;
uniform float uShockT;

attribute vec3 aS0;
attribute vec3 aS1;
attribute vec3 aS2;
attribute vec3 aS3;
attribute vec3 aS4;
attribute vec3 aS5;
attribute vec3 aS6;
attribute vec3 aS7;
attribute vec3 aPhoto;
attribute vec4 aGlow;  // x graph · y stack · z globe · w arm  (-1 = none)
attribute vec4 aRand;  // x size · y delay · z tint · w phase

varying vec3 vColor;
varying float vAlpha;

${noise}

vec3 shapePos(int i){
  if(i==0) return aS0;
  if(i==1) return aS1;
  if(i==2) return aS2;
  if(i==3) return aS3;
  if(i==4) return aS4;
  if(i==5) return aS5;
  if(i==6) return aS6;
  return aS7;
}

float shapeGlow(int i){
  if(i==1) return aGlow.z;
  if(i==2) return aGlow.w;
  if(i==3) return aGlow.y;
  if(i==6) return aGlow.x;
  return -1.0;
}

vec3 rotY(vec3 p, float a){
  float c=cos(a), s=sin(a);
  return vec3(p.x*c+p.z*s, p.y, -p.x*s+p.z*c);
}

vec3 shapeColor(int i){
  if(i==4) return aPhoto;
  return mix(uColA[i], uColB[i], aRand.z);
}

void main(){
  float P = clamp(uProgress, 0.0, 7.0);
  float f0 = floor(P);
  int i0 = int(f0);
  int i1 = min(i0 + 1, 7);
  float f = P - f0;
  // stagger: each particle leaves at its own moment
  float t = smoothstep(0.0, 1.0, clamp((f - aRand.y * 0.42) / 0.58, 0.0, 1.0));

  vec3 a = rotY(shapePos(i0), uRot[i0]);
  vec3 b = rotY(shapePos(i1), uRot[i1]);
  vec3 pos = mix(a, b, t);

  // turbulence: strongest mid-flight
  float flight = sin(t * 3.14159);
  float amp = 0.018 + flight * uChaos;
  vec3 q = pos * 0.45 + vec3(0.0, 0.0, uTime * 0.08);
  pos += vec3(snoise(q), snoise(q + 19.1), snoise(q + 47.3)) * amp;

  // intro: particles fall in from a wide scatter
  vec3 scatter = normalize(vec3(sin(aRand.w * 43.1), cos(aRand.y * 71.7), sin(aRand.z * 91.3 + 1.0)) + 1e-3) * (5.0 + aRand.x * 9.0);
  float it = smoothstep(0.0, 1.0, clamp(uIntro * 1.7 - aRand.y * 0.7, 0.0, 1.0));
  pos = mix(scatter, pos, it);

  vec4 world = modelMatrix * vec4(pos, 1.0);

  // pointer: push away + lift
  vec2 dm = world.xy - uMouse.xy;
  float md = length(dm);
  float fm = smoothstep(1.35, 0.0, md) * uMouseK;
  world.xy += (dm / (md + 1e-4)) * fm * 0.5;
  world.z += fm * 0.8;

  // click shockwave
  float st = uTime - uShockT;
  float sd = length(world.xy - uShockPos.xy);
  float rd = (sd - st * 6.0) * 2.2;
  float ring = exp(-rd * rd) * exp(-st * 1.6) * step(0.0, st);
  world.xy += ((world.xy - uShockPos.xy) / (sd + 1e-4)) * ring * 0.7;
  world.z += ring * 0.9;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;

  // pulses travelling along edges / rays / arcs
  float ga = shapeGlow(i0);
  float gb = shapeGlow(i1);
  float qa = (fract(ga * 1.4 - uTime * 0.42 + aRand.w * 0.04) - 0.5) * 12.0;
  float qb = (fract(gb * 1.4 - uTime * 0.42 + aRand.w * 0.04) - 0.5) * 12.0;
  float pa = ga < 0.0 ? 0.0 : exp(-qa * qa);
  float pb = gb < 0.0 ? 0.0 : exp(-qb * qb);
  float pulse = mix(pa, pb, t);
  float lineDim = mix(ga < 0.0 ? 1.0 : 0.55, gb < 0.0 ? 1.0 : 0.55, t);

  vec3 col = mix(shapeColor(i0), shapeColor(i1), t);
  vec3 gcol = mix(uGlowCol[i0], uGlowCol[i1], t);
  col = col * lineDim + gcol * pulse * 2.2;
  col += vec3(1.0, 0.78, 0.55) * (fm * 0.9 + ring * 1.4);
  col *= mix(0.55, 1.0, it);

  float sizeK = mix(uSizeK[i0], uSizeK[i1], t);
  float size = uSize * (0.55 + aRand.x * 0.9) * sizeK * (1.0 + pulse * 1.6 + fm * 0.8 + flight * 0.5);
  gl_PointSize = size * uPixelRatio * (10.0 / -mv.z);

  vAlpha = mix(uAlphaK[i0], uAlphaK[i1], t);
  vColor = col;
}
`;

export const particleFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if(d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a = a * a;
  gl_FragColor = vec4(vColor, a * vAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSeed;
varying float vA;
void main(){
  vec3 p = position;
  p.y += sin(uTime * 0.1 + aSeed * 30.0) * 0.3;
  p.x += cos(uTime * 0.07 + aSeed * 20.0) * 0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.0 + aSeed * 2.5) * uPixelRatio * (12.0 / -mv.z);
  vA = 0.25 + 0.5 * (0.5 + 0.5 * sin(uTime * (0.5 + aSeed) + aSeed * 50.0));
}
`;

export const dustFragment = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if(d > 0.5) discard;
  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vA);
  #include <colorspace_fragment>
}
`;

// full-screen atmosphere behind everything
export const skyVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0);
}
`;

export const skyFragment = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uGlow;
uniform vec2 uGlowPos;
uniform float uAspect;
uniform float uTime;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
  vec2 d = (vUv - uGlowPos) * vec2(uAspect, 1.0);
  float g = exp(-dot(d, d) * 3.2);
  float horizon = exp(-pow(abs(vUv.y - 0.18) * 5.0, 1.5)) * 0.35;
  col += uGlow * (g * 0.9 + horizon);
  // dither to kill banding in the dark gradient
  col += (hash(vUv * 1000.0 + uTime) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;
