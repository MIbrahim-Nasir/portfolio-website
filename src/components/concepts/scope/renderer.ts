// WebGL phosphor pipeline.
// The 2D "beam" canvas is packed: R = trace intensity, G = graticule.
// Pass 1 (persist): acc = max(prev * decay - epsilon, beam)  -> afterglow without stuck pixels.
// Pass 2 (display): barrel curvature, multi-ring bloom, phosphor colour, scanlines, vignette, grain.

const VERT = `
attribute vec2 p;
varying vec2 v;
void main() {
  v = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const PERSIST = `
precision mediump float;
varying vec2 v;
uniform sampler2D uPrev;
uniform sampler2D uBeam;
uniform float uDecay;
void main() {
  vec3 prev = texture2D(uPrev, v).rgb;
  vec3 beam = texture2D(uBeam, v).rgb;
  vec3 faded = max(prev * uDecay - vec3(1.5 / 255.0), vec3(0.0));
  gl_FragColor = vec4(max(faded, beam), 1.0);
}`;

const DISPLAY = `
precision highp float;
varying vec2 v;
uniform sampler2D uAcc;
uniform vec2 uRes;
uniform float uTime;
uniform float uGrid;
uniform float uInt;
uniform float uPower;
uniform vec3 uPhos;

vec2 curve(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  vec2 o = abs(c.yx) / vec2(6.2, 5.4);
  c = c + c * o * o;
  return c * 0.5 + 0.5;
}

float tr(vec2 uv) { return texture2D(uAcc, uv).r; }

void main() {
  vec2 uv = curve(v);
  vec2 px = 1.0 / uRes;

  // soft edge of the tube face
  vec2 e = smoothstep(vec2(0.0), vec2(0.012), uv) * smoothstep(vec2(0.0), vec2(0.012), 1.0 - uv);
  float edge = e.x * e.y;

  vec4 s = texture2D(uAcc, uv);
  float core = s.r;
  float g1 = 0.0;
  float g2 = 0.0;
  float g3 = 0.0;
  float gr = 0.0;
  float c1 = 0.0;
  float c2 = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398 + 0.39;
    vec2 d = vec2(cos(a), sin(a)) * px;
    vec4 n1 = texture2D(uAcc, uv + d * 2.2);
    vec4 n2 = texture2D(uAcc, uv + d * 6.0);
    g1 += n1.r;
    g2 += n2.r;
    g3 += tr(uv + d * 14.0);
    c1 += n1.b;
    c2 += n2.b;
    gr += texture2D(uAcc, uv + d * 1.2).g;
  }
  g1 *= 0.125;
  g2 *= 0.125;
  g3 *= 0.125;
  c1 *= 0.125;
  c2 *= 0.125;
  float grid = s.g * 0.6 + gr * 0.125 * 0.4;

  float t = core * uInt;
  float glow = (g1 * 0.6 + g2 * 0.38 + g3 * 0.24) * uInt;
  // cursor layer: amber, a little less bloom than the phosphor
  float cu = s.b * uInt;
  float cglow = (c1 * 0.55 + c2 * 0.3) * uInt;

  vec3 col = vec3(0.022, 0.034, 0.030);
  col += uPhos * (t * 0.95 + glow * 0.95);
  col += vec3(0.80, 1.0, 0.88) * smoothstep(0.55, 1.0, t) * 0.5;
  col += vec3(1.0, 0.62, 0.24) * (cu * 0.9 + cglow * 0.85);
  col += vec3(1.0, 0.9, 0.75) * smoothstep(0.6, 1.0, cu) * 0.35;

  vec3 gridDark = vec3(0.17, 0.24, 0.21);
  vec3 gridLit = vec3(1.0, 0.60, 0.30);
  col += mix(gridDark * 0.5, gridLit * 0.62, uGrid) * grid;

  // fine horizontal raster
  float sl = 0.94 + 0.06 * sin(gl_FragCoord.y * 2.0944);
  col *= sl;

  // vignette
  vec2 q = (uv * 2.0 - 1.0) * vec2(0.62, 0.7);
  float vig = clamp(1.0 - dot(q, q), 0.0, 1.0);
  col *= mix(0.5, 1.0, smoothstep(0.0, 0.9, vig));

  // grain + mains flicker
  float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime * 61.0, uTime * 17.0), vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.016;
  col *= 0.988 + 0.012 * sin(uTime * 113.0);

  col *= uPower * edge;
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}`;

export type FrameOpts = {
  decay: number;
  grid: number;
  intensity: number;
  time: number;
  power: number;
};

export type Renderer = {
  resize(w: number, h: number): void;
  frame(beam: HTMLCanvasElement, o: FrameOpts): void;
  dispose(): void;
};

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) throw new Error('shader');
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(log ?? 'compile');
  }
  return s;
}

function program(gl: WebGLRenderingContext, frag: string) {
  const p = gl.createProgram();
  if (!p) throw new Error('program');
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, 'p');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p) ?? 'link');
  return p;
}

function makeTex(gl: WebGLRenderingContext, w: number, h: number) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (w > 0 && h > 0) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      w,
      h,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
  }
  return t;
}

export function createRenderer(
  canvas: HTMLCanvasElement,
  phosphor: [number, number, number]
): Renderer | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'default',
    });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const g = gl;

  let pPersist: WebGLProgram;
  let pDisplay: WebGLProgram;
  try {
    pPersist = program(g, PERSIST);
    pDisplay = program(g, DISPLAY);
  } catch {
    return null;
  }

  const quad = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, quad);
  g.bufferData(
    g.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    g.STATIC_DRAW
  );
  g.enableVertexAttribArray(0);
  g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);

  const uP = {
    prev: g.getUniformLocation(pPersist, 'uPrev'),
    beam: g.getUniformLocation(pPersist, 'uBeam'),
    decay: g.getUniformLocation(pPersist, 'uDecay'),
  };
  const uD = {
    acc: g.getUniformLocation(pDisplay, 'uAcc'),
    res: g.getUniformLocation(pDisplay, 'uRes'),
    time: g.getUniformLocation(pDisplay, 'uTime'),
    grid: g.getUniformLocation(pDisplay, 'uGrid'),
    int: g.getUniformLocation(pDisplay, 'uInt'),
    power: g.getUniformLocation(pDisplay, 'uPower'),
    phos: g.getUniformLocation(pDisplay, 'uPhos'),
  };

  const beamTex = makeTex(g, 0, 0);
  let acc: (WebGLTexture | null)[] = [];
  let fbo: (WebGLFramebuffer | null)[] = [];
  let cur = 0;
  let W = 0;
  let H = 0;

  const freeTargets = () => {
    acc.forEach((t) => g.deleteTexture(t));
    fbo.forEach((f) => g.deleteFramebuffer(f));
    acc = [];
    fbo = [];
  };

  const resize = (w: number, h: number) => {
    if (w === W && h === H) return;
    W = w;
    H = h;
    canvas.width = w;
    canvas.height = h;
    freeTargets();
    for (let i = 0; i < 2; i++) {
      const t = makeTex(g, w, h);
      const f = g.createFramebuffer();
      g.bindFramebuffer(g.FRAMEBUFFER, f);
      g.framebufferTexture2D(
        g.FRAMEBUFFER,
        g.COLOR_ATTACHMENT0,
        g.TEXTURE_2D,
        t,
        0
      );
      g.clearColor(0, 0, 0, 1);
      g.clear(g.COLOR_BUFFER_BIT);
      acc.push(t);
      fbo.push(f);
    }
    g.bindFramebuffer(g.FRAMEBUFFER, null);
  };

  const frame = (beam: HTMLCanvasElement, o: FrameOpts) => {
    if (!W || !H || g.isContextLost()) return;

    g.activeTexture(g.TEXTURE1);
    g.bindTexture(g.TEXTURE_2D, beamTex);
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, beam);

    const next = 1 - cur;
    g.bindFramebuffer(g.FRAMEBUFFER, fbo[next]);
    g.viewport(0, 0, W, H);
    g.useProgram(pPersist);
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, acc[cur]);
    g.uniform1i(uP.prev, 0);
    g.uniform1i(uP.beam, 1);
    g.uniform1f(uP.decay, o.decay);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);

    g.bindFramebuffer(g.FRAMEBUFFER, null);
    g.viewport(0, 0, W, H);
    g.useProgram(pDisplay);
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, acc[next]);
    g.uniform1i(uD.acc, 0);
    g.uniform2f(uD.res, W, H);
    g.uniform1f(uD.time, o.time);
    g.uniform1f(uD.grid, o.grid);
    g.uniform1f(uD.int, o.intensity);
    g.uniform1f(uD.power, o.power);
    g.uniform3f(uD.phos, phosphor[0], phosphor[1], phosphor[2]);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);

    cur = next;
  };

  const dispose = () => {
    freeTargets();
    g.deleteTexture(beamTex);
    g.deleteBuffer(quad);
    g.deleteProgram(pPersist);
    g.deleteProgram(pDisplay);
  };

  return { resize, frame, dispose };
}
