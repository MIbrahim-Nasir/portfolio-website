// Procedural point clouds. Every shape returns exactly `n` points so the
// particle field can morph between any two of them one-to-one.
//
// Shape order (must match the shader + scene keyframes):
// 0 name · 1 photo · 2 pergola · 3 agent graph · 4 layered backend
// 5 robot arm · 6 globe · 7 portal

export const SHAPES = 8;
export const GLOW_GRAPH = 0;
export const GLOW_STACK = 1;
export const GLOW_GLOBE = 2;
export const GLOW_ARM = 3;

type V3 = [number, number, number];

export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Cloud {
  pos: Float32Array;
  glow: Float32Array;
  i = 0;
  constructor(
    public n: number,
    public r: () => number
  ) {
    this.pos = new Float32Array(n * 3);
    this.glow = new Float32Array(n).fill(-1);
  }
  push(x: number, y: number, z: number, g = -1) {
    if (this.i >= this.n) return;
    const k = this.i * 3;
    this.pos[k] = x;
    this.pos[k + 1] = y;
    this.pos[k + 2] = z;
    this.glow[this.i] = g;
    this.i++;
  }
  // fill whatever is left by re-using random existing points with jitter
  finish(j = 0.02) {
    const filled = Math.max(1, this.i);
    while (this.i < this.n) {
      const s = Math.floor(this.r() * filled) * 3;
      this.push(
        this.pos[s] + (this.r() - 0.5) * j,
        this.pos[s + 1] + (this.r() - 0.5) * j,
        this.pos[s + 2] + (this.r() - 0.5) * j,
        this.glow[s / 3]
      );
    }
    return this;
  }
  rotX(a: number) {
    const c = Math.cos(a),
      s = Math.sin(a);
    for (let i = 0; i < this.n; i++) {
      const k = i * 3;
      const y = this.pos[k + 1],
        z = this.pos[k + 2];
      this.pos[k + 1] = y * c - z * s;
      this.pos[k + 2] = y * s + z * c;
    }
    return this;
  }
  rotY(a: number) {
    const c = Math.cos(a),
      s = Math.sin(a);
    for (let i = 0; i < this.n; i++) {
      const k = i * 3;
      const x = this.pos[k],
        z = this.pos[k + 2];
      this.pos[k] = x * c + z * s;
      this.pos[k + 2] = -x * s + z * c;
    }
    return this;
  }
}

// ---------- primitive samplers ----------

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
}

function onSphere(r: () => number): V3 {
  const u = r() * 2 - 1;
  const t = r() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(t), u, s * Math.sin(t)];
}

function box(
  c: Cloud,
  n: number,
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number
) {
  const ax = sy * sz,
    ay = sx * sz,
    az = sx * sy;
  const tot = ax + ay + az;
  for (let i = 0; i < n; i++) {
    const f = c.r() * tot;
    const sgn = c.r() < 0.5 ? -0.5 : 0.5;
    let x = (c.r() - 0.5) * sx,
      y = (c.r() - 0.5) * sy,
      z = (c.r() - 0.5) * sz;
    if (f < ax) x = sgn * sx;
    else if (f < ax + ay) y = sgn * sy;
    else z = sgn * sz;
    c.push(cx + x, cy + y, cz + z);
  }
}

function tube(c: Cloud, n: number, a: V3, b: V3, rad: number, glow = false) {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const w: V3 = [d[0] / len, d[1] / len, d[2] / len];
  const up: V3 = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  // u = normalize(up x w), v = w x u
  let u: V3 = [
    up[1] * w[2] - up[2] * w[1],
    up[2] * w[0] - up[0] * w[2],
    up[0] * w[1] - up[1] * w[0],
  ];
  const ul = Math.hypot(u[0], u[1], u[2]);
  u = [u[0] / ul, u[1] / ul, u[2] / ul];
  const v: V3 = [
    w[1] * u[2] - w[2] * u[1],
    w[2] * u[0] - w[0] * u[2],
    w[0] * u[1] - w[1] * u[0],
  ];
  for (let i = 0; i < n; i++) {
    const t = c.r();
    const th = c.r() * Math.PI * 2;
    const rr = rad * (0.85 + c.r() * 0.15);
    const ox = Math.cos(th) * rr,
      oy = Math.sin(th) * rr;
    c.push(
      a[0] + d[0] * t + u[0] * ox + v[0] * oy,
      a[1] + d[1] * t + u[1] * ox + v[1] * oy,
      a[2] + d[2] * t + u[2] * ox + v[2] * oy,
      glow ? t : -1
    );
  }
}

function ball(
  c: Cloud,
  n: number,
  cx: number,
  cy: number,
  cz: number,
  rad: number
) {
  for (let i = 0; i < n; i++) {
    const p = onSphere(c.r);
    c.push(cx + p[0] * rad, cy + p[1] * rad, cz + p[2] * rad);
  }
}

function bezier(
  c: Cloud,
  n: number,
  a: V3,
  m: V3,
  b: V3,
  jit: number,
  glow: boolean,
  reverse = false
) {
  for (let i = 0; i < n; i++) {
    const t = c.r();
    const it = 1 - t;
    const x = it * it * a[0] + 2 * it * t * m[0] + t * t * b[0];
    const y = it * it * a[1] + 2 * it * t * m[1] + t * t * b[1];
    const z = it * it * a[2] + 2 * it * t * m[2] + t * t * b[2];
    c.push(
      x + gauss(c.r) * jit,
      y + gauss(c.r) * jit,
      z + gauss(c.r) * jit,
      glow ? (reverse ? 1 - t : t) : -1
    );
  }
}

function split(n: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.floor((n * w) / sum));
}

// ---------- 0 · name ----------

export function nameShape(n: number, text: string, font: string) {
  const c = new Cloud(n, mulberry(11));
  // tall canvas: the wordmark face is condensed, so it hits the width limit late
  const W = 1600,
    H = 560;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 300;
  g.font = `900 ${size}px ${font}`;
  if ('letterSpacing' in g)
    (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      '0.06em';
  const m = g.measureText(text);
  size = Math.min(500, (size * (W * 0.94)) / m.width);
  g.font = `900 ${size}px ${font}`;
  g.fillText(text, W / 2, H / 2 + size * 0.04);
  const data = g.getImageData(0, 0, W, H).data;
  const pts: number[] = [];
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2)
      if (data[(y * W + x) * 4] > 128) pts.push(x, y);
  const count = pts.length / 2 || 1;
  const sx = 7.2 / W;
  for (let i = 0; i < n; i++) {
    const k = Math.floor(c.r() * count) * 2;
    const x = (pts[k] + c.r() * 2 - W / 2) * sx;
    const y = -(pts[k + 1] + c.r() * 2 - H / 2) * sx;
    // a few stragglers make the edges feel alive
    const stray = c.r() < 0.04 ? gauss(c.r) * 0.25 : 0;
    c.push(x + stray, y + stray * 0.5, gauss(c.r) * 0.06);
  }
  return c;
}

// ---------- 1 · photo (sampled from an image, keeps its colors) ----------

export function photoShape(n: number, img: HTMLImageElement | null) {
  const c = new Cloud(n, mulberry(23));
  const col = new Float32Array(n * 3);
  const W = 240,
    H = 160;
  const pw = 5.4,
    ph = 3.6;
  if (!img) {
    for (let i = 0; i < n; i++) {
      c.push((c.r() - 0.5) * pw, (c.r() - 0.5) * ph, 0);
      col.set([0.9, 0.6, 0.35], i * 3);
    }
    return { cloud: c, color: col };
  }
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, W, H);
  const d = g.getImageData(0, 0, W, H).data;
  let i = 0;
  let guard = 0;
  while (i < n && guard < n * 20) {
    guard++;
    const x = c.r() * W,
      y = c.r() * H;
    const k = ((y | 0) * W + (x | 0)) * 4;
    const R = d[k] / 255,
      G = d[k + 1] / 255,
      B = d[k + 2] / 255;
    const lum = 0.299 * R + 0.587 * G + 0.114 * B;
    // denser where the image is bright, but keep shadows readable
    if (c.r() > 0.18 + lum * 0.95) continue;
    c.push((x / W - 0.5) * pw, -(y / H - 0.5) * ph, lum * 0.35 - 0.1);
    col[i * 3] = R;
    col[i * 3 + 1] = G;
    col[i * 3 + 2] = B;
    i++;
  }
  while (i < n) {
    c.push((c.r() - 0.5) * pw, (c.r() - 0.5) * ph, 0);
    col.set([0.2, 0.15, 0.1], i * 3);
    i++;
  }
  return { cloud: c, color: col };
}

// ---------- 2 · pergola render ----------

export function pergolaShape(n: number) {
  const c = new Cloud(n, mulberry(37));
  const [floor, wall, posts, beams, rafters, sofa, table, palm, pot] = split(
    n,
    [0.22, 0.1, 0.1, 0.07, 0.15, 0.12, 0.04, 0.14, 0.06]
  );
  const fy = -1.4;
  // pavers: points snapped onto a staggered grid
  for (let i = 0; i < floor; i++) {
    let x = (c.r() - 0.5) * 5.2;
    let z = (c.r() - 0.5) * 3.2;
    const row = Math.floor((z + 1.6) / 0.32);
    if (c.r() < 0.55) z = -1.6 + Math.round((z + 1.6) / 0.32) * 0.32;
    else if (c.r() < 0.85) {
      const off = row % 2 ? 0.28 : 0;
      x = Math.round((x + off) / 0.56) * 0.56 - off;
    }
    c.push(x, fy, z);
  }
  // block wall
  for (let i = 0; i < wall; i++) {
    let x = (c.r() - 0.5) * 5.2;
    let y = fy + c.r() * 1.1;
    const row = Math.floor((y - fy) / 0.22);
    if (c.r() < 0.5) y = fy + Math.round((y - fy) / 0.22) * 0.22;
    else if (c.r() < 0.8) {
      const off = row % 2 ? 0.2 : 0;
      x = Math.round((x + off) / 0.4) * 0.4 - off;
    }
    c.push(x, y, -1.6);
  }
  const P: [number, number][] = [
    [-1.5, -1.0],
    [1.5, -1.0],
    [-1.5, 1.0],
    [1.5, 1.0],
  ];
  P.forEach(([x, z]) =>
    box(c, Math.floor(posts / 4), x, fy + 1.15, z, 0.16, 2.3, 0.16)
  );
  box(c, Math.floor(beams / 2), 0, 0.95, -1.0, 3.7, 0.16, 0.14);
  box(c, Math.floor(beams / 2), 0, 0.95, 1.0, 3.7, 0.16, 0.14);
  const nr = 13;
  for (let k = 0; k < nr; k++)
    box(
      c,
      Math.floor(rafters / nr),
      -1.8 + (3.6 * k) / (nr - 1),
      1.1,
      0,
      0.06,
      0.09,
      2.6
    );
  // L-sofa
  box(c, Math.floor(sofa * 0.35), 0.5, -1.18, -0.62, 1.7, 0.34, 0.62);
  box(c, Math.floor(sofa * 0.2), 0.5, -0.86, -0.88, 1.7, 0.36, 0.14);
  box(c, Math.floor(sofa * 0.3), 1.42, -1.18, 0.05, 0.62, 0.34, 1.35);
  box(c, Math.floor(sofa * 0.15), 1.68, -0.86, 0.05, 0.14, 0.36, 1.35);
  box(c, table, 0.25, -1.24, 0.25, 0.75, 0.16, 0.5);
  // palm: curved trunk + drooping fronds
  const trunk = Math.floor(palm * 0.4);
  for (let i = 0; i < trunk; i++) {
    const t = c.r();
    const x = -2.15 + Math.sin(t * 1.4) * 0.25;
    const y = fy + t * 3.0;
    const th = c.r() * Math.PI * 2;
    const rr = 0.1 * (1 - t * 0.3);
    c.push(x + Math.cos(th) * rr, y, -0.7 + Math.sin(th) * rr);
  }
  const crown: V3 = [-2.15 + Math.sin(1.4) * 0.25, fy + 3.0, -0.7];
  const fronds = 9;
  for (let f = 0; f < fronds; f++) {
    const a = (f / fronds) * Math.PI * 2;
    const tip: V3 = [
      crown[0] + Math.cos(a) * 1.15,
      crown[1] - 0.55,
      crown[2] + Math.sin(a) * 1.15,
    ];
    const mid: V3 = [
      crown[0] + Math.cos(a) * 0.6,
      crown[1] + 0.35,
      crown[2] + Math.sin(a) * 0.6,
    ];
    bezier(c, Math.floor((palm * 0.6) / fronds), crown, mid, tip, 0.04, false);
  }
  // planter
  tube(c, pot, [2.25, fy, 0.9], [2.25, fy + 0.45, 0.9], 0.26);
  c.finish();
  return c.rotX(0.32).rotY(-0.45);
}

// ---------- 3 · agent graph ----------

export const graphNodes: { id: string; p: V3; r: number }[] = [
  { id: 'input', p: [-2.75, 0.1, 0], r: 0.24 },
  { id: 'planner', p: [-1.35, 0.1, 0.3], r: 0.36 },
  { id: 'rag', p: [-1.35, -1.65, -0.2], r: 0.26 },
  { id: 'render', p: [0.25, 1.05, 0], r: 0.28 },
  { id: 'boq', p: [0.25, -0.95, 0.2], r: 0.24 },
  { id: 'eval', p: [1.65, 1.05, -0.2], r: 0.26 },
  { id: 'out', p: [2.8, 0.0, 0.1], r: 0.3 },
];

const graphEdges: [string, string, number, number][] = [
  // from, to, bend y, bend z
  ['input', 'planner', 0.25, 0],
  ['planner', 'rag', 0, 0.55],
  ['rag', 'planner', 0, -0.55],
  ['planner', 'render', 0.2, 0],
  ['planner', 'boq', -0.2, 0],
  ['render', 'eval', 0.15, 0],
  ['eval', 'render', 1.05, 0.2],
  ['eval', 'out', 0.1, 0],
  ['boq', 'out', -0.2, 0],
];

export function graphShape(n: number) {
  const c = new Cloud(n, mulberry(41));
  const node = new Map(graphNodes.map((g) => [g.id, g]));
  const nodePts = Math.floor(n * 0.42);
  graphNodes.forEach((g) => {
    const share = Math.floor(
      (nodePts * (g.r * g.r)) / graphNodes.reduce((a, b) => a + b.r * b.r, 0)
    );
    ball(c, Math.floor(share * 0.7), g.p[0], g.p[1], g.p[2], g.r);
    // orbit ring
    for (let i = 0; i < share * 0.3; i++) {
      const a = c.r() * Math.PI * 2;
      const rr = g.r * 1.65;
      c.push(
        g.p[0] + Math.cos(a) * rr,
        g.p[1] + Math.sin(a) * rr * 0.28,
        g.p[2] + Math.sin(a) * rr * 0.6
      );
    }
  });
  const lens = graphEdges.map(([a, b]) => {
    const A = node.get(a)!.p,
      B = node.get(b)!.p;
    return Math.hypot(A[0] - B[0], A[1] - B[1]);
  });
  const total = lens.reduce((a, b) => a + b, 0);
  const edgePts = n - c.i;
  graphEdges.forEach(([a, b, by, bz], k) => {
    const A = node.get(a)!.p,
      B = node.get(b)!.p;
    const M: V3 = [
      (A[0] + B[0]) / 2,
      (A[1] + B[1]) / 2 + by,
      (A[2] + B[2]) / 2 + bz,
    ];
    bezier(c, Math.floor((edgePts * lens[k]) / total), A, M, B, 0.022, true);
  });
  c.finish(0.01);
  return c;
}

// ---------- 4 · layered backend ----------

export function stackShape(n: number) {
  const c = new Cloud(n, mulberry(53));
  const [plates, db, streams] = split(n, [0.62, 0.18, 0.2]);
  const levels = [1.25, 0.4, -0.45];
  const w = 3.0,
    d = 1.8;
  levels.forEach((y, li) => {
    const per = Math.floor(plates / 3);
    for (let i = 0; i < per; i++) {
      let x = (c.r() - 0.5) * w,
        z = (c.r() - 0.5) * d;
      if (c.r() < 0.38) {
        // outline
        if (c.r() < 0.5) x = (c.r() < 0.5 ? -0.5 : 0.5) * w;
        else z = (c.r() < 0.5 ? -0.5 : 0.5) * d;
      } else {
        const s = 0.16 + li * 0.02;
        x = Math.round(x / s) * s;
        z = Math.round(z / s) * s;
      }
      c.push(x, y + gauss(c.r) * 0.008, z);
    }
  });
  // database cylinder
  const top = -1.2,
    bot = -2.0,
    R = 0.75;
  for (let i = 0; i < db; i++) {
    const a = c.r() * Math.PI * 2;
    const f = c.r();
    let y = bot + c.r() * (top - bot);
    if (f < 0.45) y = [top, (top + bot) / 2, bot][Math.floor(c.r() * 3)];
    c.push(Math.cos(a) * R, y, Math.sin(a) * R);
  }
  // request streams through the layers
  const cols: [number, number][] = [
    [-1.0, -0.4],
    [-0.4, 0.5],
    [0.3, -0.2],
    [0.9, 0.45],
    [0.0, 0.0],
    [1.2, -0.55],
  ];
  for (let i = 0; i < streams; i++) {
    const [x, z] = cols[Math.floor(c.r() * cols.length)];
    const t = c.r();
    const y = 1.7 - t * 3.0;
    c.push(x + gauss(c.r) * 0.012, y, z + gauss(c.r) * 0.012, t);
  }
  c.finish(0.01);
  return c.rotX(0.5).rotY(0.55);
}

// ---------- 5 · robot arm with a camera that watches it ----------

export function armShape(n: number) {
  const c = new Cloud(n, mulberry(67));
  const [base, links, joints, grip, obj, cam, rays] = split(
    n,
    [0.17, 0.3, 0.13, 0.08, 0.08, 0.06, 0.18]
  );
  tube(c, Math.floor(base * 0.6), [0, -2.0, 0], [0, -1.78, 0], 0.85);
  tube(c, Math.floor(base * 0.4), [0, -1.78, 0], [0, -1.4, 0], 0.45);
  const S: V3 = [0, -1.25, 0];
  const E: V3 = [0.95, 0.45, 0];
  const Wr: V3 = [-0.35, 1.1, 0];
  tube(c, Math.floor(links * 0.55), S, E, 0.19);
  tube(c, Math.floor(links * 0.45), E, Wr, 0.14);
  ball(c, Math.floor(joints * 0.45), S[0], S[1], S[2], 0.3);
  ball(c, Math.floor(joints * 0.35), E[0], E[1], E[2], 0.24);
  ball(c, Math.floor(joints * 0.2), Wr[0], Wr[1], Wr[2], 0.16);
  tube(c, Math.floor(grip / 2), Wr, [-0.6, 0.55, 0], 0.045);
  tube(c, Math.floor(grip / 2), Wr, [-0.12, 0.55, 0], 0.045);
  box(c, obj, -0.36, 0.25, 0, 0.36, 0.36, 0.36);
  // camera body above-left
  const C: V3 = [-2.4, 1.9, 0.4];
  box(c, cam, C[0], C[1], C[2], 0.42, 0.28, 0.3);
  // vision rays: camera -> object corners
  const corners: V3[] = [
    [-0.54, 0.43, 0.18],
    [-0.18, 0.43, -0.18],
    [-0.54, 0.07, -0.18],
    [-0.18, 0.07, 0.18],
  ];
  corners.forEach((k) => {
    for (let i = 0; i < rays / 4; i++) {
      const t = c.r();
      c.push(
        C[0] + (k[0] - C[0]) * t,
        C[1] + (k[1] - C[1]) * t,
        C[2] + (k[2] - C[2]) * t,
        t
      );
    }
  });
  c.finish(0.01);
  return c.rotY(0.35);
}

// ---------- 6 · globe with the Dubai ⇄ Hyderabad arc ----------

const deg = Math.PI / 180;
export const GLOBE_R = 2.0;
export const cities = {
  dubai: { lat: 25.2, lon: 55.3 },
  hyderabad: { lat: 17.4, lon: 78.5 },
};
export const GLOBE_FACE = -67 * deg; // rotation that brings the region to the front

export function llToXYZ(lat: number, lon: number, r = GLOBE_R): V3 {
  const la = lat * deg,
    lo = lon * deg;
  return [
    r * Math.cos(la) * Math.sin(lo),
    r * Math.sin(la),
    r * Math.cos(la) * Math.cos(lo),
  ];
}

function slerp(a: V3, b: V3, t: number): V3 {
  const dot = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (GLOBE_R * GLOBE_R);
  const om = Math.acos(Math.min(1, Math.max(-1, dot)));
  const s = Math.sin(om) || 1;
  const ka = Math.sin((1 - t) * om) / s,
    kb = Math.sin(t * om) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

export function globeShape(n: number) {
  const c = new Cloud(n, mulberry(79));
  const [lines, fill, spikes, arcs] = split(n, [0.52, 0.22, 0.06, 0.2]);
  for (let i = 0; i < lines; i++) {
    if (c.r() < 0.5) {
      const lat = Math.round((c.r() * 160 - 80) / 20) * 20 * deg;
      const lon = c.r() * Math.PI * 2;
      c.push(
        GLOBE_R * Math.cos(lat) * Math.sin(lon),
        GLOBE_R * Math.sin(lat),
        GLOBE_R * Math.cos(lat) * Math.cos(lon)
      );
    } else {
      const lon = Math.round((c.r() * 360) / 20) * 20 * deg;
      const lat = (c.r() * 180 - 90) * deg;
      c.push(
        GLOBE_R * Math.cos(lat) * Math.sin(lon),
        GLOBE_R * Math.sin(lat),
        GLOBE_R * Math.cos(lat) * Math.cos(lon)
      );
    }
  }
  for (let i = 0; i < fill; i++) {
    const p = onSphere(c.r);
    c.push(p[0] * GLOBE_R, p[1] * GLOBE_R, p[2] * GLOBE_R);
  }
  const D = llToXYZ(cities.dubai.lat, cities.dubai.lon);
  const H = llToXYZ(cities.hyderabad.lat, cities.hyderabad.lon);
  [D, H].forEach((p) => {
    for (let i = 0; i < spikes / 2; i++) {
      const t = c.r();
      const k = 1 + t * 0.35;
      c.push(
        p[0] * k + gauss(c.r) * 0.01,
        p[1] * k + gauss(c.r) * 0.01,
        p[2] * k + gauss(c.r) * 0.01,
        1 - t
      );
    }
  });
  // outbound (high) and return (low) arcs
  for (let i = 0; i < arcs; i++) {
    const out = c.r() < 0.5;
    const t = c.r();
    const p = slerp(D, H, t);
    const lift = 1 + Math.sin(t * Math.PI) * (out ? 0.42 : 0.2);
    c.push(p[0] * lift, p[1] * lift, p[2] * lift, out ? t : 1 - t);
  }
  c.finish(0.01);
  return c;
}

// ---------- 7 · portal ----------

export function portalShape(n: number) {
  const c = new Cloud(n, mulberry(97));
  const [ring, disk, core] = split(n, [0.38, 0.58, 0.04]);
  for (let i = 0; i < ring; i++) {
    const a = c.r() * Math.PI * 2;
    const R = 2.15 + gauss(c.r) * 0.03;
    c.push(Math.cos(a) * R, Math.sin(a) * R, gauss(c.r) * 0.03);
  }
  for (let i = 0; i < disk; i++) {
    const t = Math.pow(c.r(), 0.7);
    const R = 0.9 + t * 1.2;
    const arm = Math.floor(c.r() * 3);
    const a = arm * ((Math.PI * 2) / 3) + t * 5.5 + gauss(c.r) * 0.22;
    c.push(Math.cos(a) * R, Math.sin(a) * R, gauss(c.r) * 0.06 * (1 - t));
  }
  ball(c, core, 0, 0, 0, 0.12);
  c.finish();
  return c.rotX(-0.35);
}
