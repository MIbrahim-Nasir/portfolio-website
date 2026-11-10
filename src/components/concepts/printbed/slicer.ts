/*
  A small, honest slicer. Each part is a signed distance field (mm, negative
  inside). Every layer is sampled on a 0.25 mm grid, then:
    walls   marching-squares contours at -(w/2 + k*w), inner first, seam at the rear
    skin    bottom 3 / top 4 layers, solid lines at ±45°, alternating per layer
    bridge  anything with air directly below it, solid lines along the span
    sparse  gyroid (or rectilinear) clipped to the infill region
  and the result is a list of moves with real widths, heights, feeds and
  extrusion lengths, ordered the way a printer would run them.
*/

export type SDF = (x: number, y: number, z: number) => number;

export const F = {
  SKIRT: 0,
  OUTER: 1,
  INNER: 2,
  SPARSE: 3,
  SOLID: 4,
  TOP: 5,
  BRIDGE: 6,
  TRAVEL: 7,
} as const;
export type Feat = (typeof F)[keyof typeof F];

/** PrusaSlicer names and preview colours, so anyone who slices recognises them */
export const FEAT: { name: string; color: string }[] = [
  { name: 'Skirt/Brim', color: '#00876E' },
  { name: 'External perimeter', color: '#FF7D38' },
  { name: 'Perimeter', color: '#FFE64D' },
  { name: 'Internal infill', color: '#B03029' },
  { name: 'Solid infill', color: '#9654CC' },
  { name: 'Top solid infill', color: '#F04040' },
  { name: 'Bridge infill', color: '#4D80BA' },
  { name: 'Travel', color: '#6c7380' },
];

export const PROFILE = {
  nozzle: 0.4,
  lh: 0.25,
  lh0: 0.3,
  w: 0.45,
  w0: 0.5,
  walls: 2,
  top: 4,
  bottom: 3,
  res: 0.25,
  skirtGap: 3,
  retract: 0.8,
  retractV: 35,
  retractMin: 2,
  filD: 1.75,
  // mm/s
  v: {
    skirt: 30,
    outer: 30,
    inner: 50,
    sparse: 90,
    solid: 60,
    top: 40,
    bridge: 25,
    first: 25,
    travel: 180,
  },
  nozzleT: 215,
  bedT: 60,
};

export type Infill = { kind: 'gyroid' | 'rect'; density: number };

export type Shape = {
  id: string;
  file: string;
  /** bounding box, local mm, origin at min corner */
  w: number;
  d: number;
  h: number;
  /** plate position of the local origin */
  ox: number;
  oy: number;
  sdf: SDF;
  infill: Infill;
  /** bridge line direction in degrees for a given z */
  bridgeAngle?: (z: number) => number;
};

export type Toolpath = {
  n: number;
  nExt: number;
  layers: number;
  x0: Float32Array;
  y0: Float32Array;
  x1: Float32Array;
  y1: Float32Array;
  z: Float32Array;
  w: Float32Array;
  h: Float32Array;
  v: Float32Array;
  f: Uint8Array;
  lay: Uint16Array;
  retract: Uint8Array;
  /** cumulative time at the end of each move, s */
  t: Float64Array;
  /** instance index for extrusions (count of extrusions before this move) */
  ext: Int32Array;
  layerStart: Int32Array;
  layerZ: Float32Array;
  time: number;
  /** mm of 1.75 mm filament */
  filament: number;
  grams: number;
};

/* ------------------------------------------------------------- primitives */

export const box2 = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  hx: number,
  hy: number,
  r = 0
) => {
  const qx = Math.abs(x - cx) - hx + r;
  const qy = Math.abs(y - cy) - hy + r;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
};
export const circ = (x: number, y: number, cx: number, cy: number, r: number) =>
  Math.hypot(x - cx, y - cy) - r;
export const seg2 = (
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  r: number
) => {
  const px = x - ax;
  const py = y - ay;
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - dx * t, py - dy * t) - r;
};
/** extrude a 2D distance between z0 and z1 */
export const ext = (d: number, z: number, z0: number, z1: number) =>
  Math.max(d, z0 - z, z - z1);

/* ------------------------------------------------------- marching squares */

type Poly = { p: number[]; closed: boolean };

class Contourer {
  nx: number;
  ny: number;
  x0: number;
  y0: number;
  res: number;
  nbA: Int32Array;
  nbB: Int32Array;
  ex: Float32Array;
  ey: Float32Array;
  seen: Uint8Array;
  touched: number[] = [];

  constructor(nx: number, ny: number, x0: number, y0: number, res: number) {
    this.nx = nx;
    this.ny = ny;
    this.x0 = x0;
    this.y0 = y0;
    this.res = res;
    const m = nx * ny * 2;
    this.nbA = new Int32Array(m).fill(-1);
    this.nbB = new Int32Array(m).fill(-1);
    this.ex = new Float32Array(m);
    this.ey = new Float32Array(m);
    this.seen = new Uint8Array(m);
  }

  private reset() {
    for (const e of this.touched) {
      this.nbA[e] = -1;
      this.nbB[e] = -1;
      this.seen[e] = 0;
    }
    this.touched.length = 0;
  }

  private pt(v: ArrayLike<number>, e: number, lvl: number) {
    const { nx, res, x0, y0 } = this;
    const node = e >> 1;
    const i = node % nx;
    const j = (node / nx) | 0;
    const a = v[node];
    if ((e & 1) === 0) {
      const b = v[node + 1];
      const t = b === a ? 0.5 : (lvl - a) / (b - a);
      this.ex[e] = x0 + (i + t) * res;
      this.ey[e] = y0 + j * res;
    } else {
      const b = v[node + nx];
      const t = b === a ? 0.5 : (lvl - a) / (b - a);
      this.ex[e] = x0 + i * res;
      this.ey[e] = y0 + (j + t) * res;
    }
  }

  private link(v: ArrayLike<number>, lvl: number, a: number, b: number) {
    for (const e of [a, b]) {
      if (this.nbA[e] === -1 && this.nbB[e] === -1) {
        this.touched.push(e);
        this.pt(v, e, lvl);
      }
    }
    if (this.nbA[a] === -1) this.nbA[a] = b;
    else this.nbB[a] = b;
    if (this.nbA[b] === -1) this.nbA[b] = a;
    else this.nbB[b] = a;
  }

  /** contours of v at lvl; cellOk filters cells (used to clip gyroid to the infill region) */
  run(
    v: ArrayLike<number>,
    lvl: number,
    cellOk?: (k: number) => boolean
  ): Poly[] {
    this.reset();
    const { nx, ny } = this;
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const k = j * nx + i;
        const a = v[k];
        const b = v[k + 1];
        const c = v[k + nx + 1];
        const d = v[k + nx];
        const cs =
          (a < lvl ? 1 : 0) |
          (b < lvl ? 2 : 0) |
          (c < lvl ? 4 : 0) |
          (d < lvl ? 8 : 0);
        if (cs === 0 || cs === 15) continue;
        if (cellOk && !cellOk(k)) continue;
        const E0 = 2 * k;
        const E1 = 2 * (k + 1) + 1;
        const E2 = 2 * (k + nx);
        const E3 = 2 * k + 1;
        switch (cs) {
          case 1:
          case 14:
            this.link(v, lvl, E3, E0);
            break;
          case 2:
          case 13:
            this.link(v, lvl, E0, E1);
            break;
          case 3:
          case 12:
            this.link(v, lvl, E3, E1);
            break;
          case 4:
          case 11:
            this.link(v, lvl, E1, E2);
            break;
          case 6:
          case 9:
            this.link(v, lvl, E0, E2);
            break;
          case 7:
          case 8:
            this.link(v, lvl, E2, E3);
            break;
          case 5:
          case 10: {
            const centerIn = (a + b + c + d) / 4 < lvl;
            const aIn = cs === 5;
            if (centerIn === aIn) {
              this.link(v, lvl, E0, E1);
              this.link(v, lvl, E2, E3);
            } else {
              this.link(v, lvl, E3, E0);
              this.link(v, lvl, E1, E2);
            }
            break;
          }
        }
      }
    }
    const out: Poly[] = [];
    const walk = (start: number, closed: boolean) => {
      const p: number[] = [];
      let prev = -1;
      let cur = start;
      while (cur !== -1 && !this.seen[cur]) {
        this.seen[cur] = 1;
        p.push(this.ex[cur], this.ey[cur]);
        const a = this.nbA[cur];
        const b = this.nbB[cur];
        const next =
          a !== prev && a !== -1 && !this.seen[a]
            ? a
            : b !== prev && b !== -1 && !this.seen[b]
              ? b
              : -1;
        prev = cur;
        cur = next;
      }
      if (p.length >= 4) out.push({ p, closed });
    };
    for (const e of this.touched)
      if (!this.seen[e] && (this.nbA[e] === -1) !== (this.nbB[e] === -1))
        walk(e, false);
    for (const e of this.touched) if (!this.seen[e]) walk(e, true);
    return out;
  }
}

/* --------------------------------------------------------------- helpers */

function rdp(p: number[], eps: number): number[] {
  const n = p.length / 2;
  if (n < 3) return p;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const ax = p[2 * a];
    const ay = p[2 * a + 1];
    const dx = p[2 * b] - ax;
    const dy = p[2 * b + 1] - ay;
    const L = Math.hypot(dx, dy) || 1e-9;
    let md = -1;
    let mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((p[2 * i] - ax) * dy - (p[2 * i + 1] - ay) * dx) / L;
      if (d > md) {
        md = d;
        mi = i;
      }
    }
    if (md > eps && mi > 0) {
      keep[mi] = 1;
      stack.push([a, mi], [mi, b]);
    }
  }
  const o: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) o.push(p[2 * i], p[2 * i + 1]);
  return o;
}

function polyLen(p: number[]) {
  let L = 0;
  for (let i = 2; i < p.length; i += 2)
    L += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]);
  return L;
}

/** closed loop: start at the rearmost vertex (aligned rear seam), simplify, close */
function seamLoop(p: number[], eps: number): number[] {
  const n = p.length / 2;
  let best = 0;
  for (let i = 1; i < n; i++)
    if (p[2 * i + 1] > p[2 * best + 1] + 1e-6) best = i;
  const r: number[] = [];
  for (let k = 0; k <= n; k++) {
    const i = (best + k) % n;
    r.push(p[2 * i], p[2 * i + 1]);
  }
  // simplify the two halves so the seam vertex survives
  const half = Math.floor(n / 2);
  const a = rdp(r.slice(0, 2 * (half + 1)), eps);
  const b = rdp(r.slice(2 * half), eps);
  return a.concat(b.slice(2));
}

const yieldFrame = () => new Promise<void>((res) => setTimeout(res, 0));

/* ----------------------------------------------------------------- slice */

type Path = { p: number[]; f: Feat; closed: boolean; fixed?: boolean };

export async function slice(shape: Shape): Promise<Toolpath> {
  const P = PROFILE;
  const res = P.res;
  const M = P.skirtGap + 1;
  const gx0 = -M;
  const gy0 = -M;
  const nx = Math.ceil((shape.w + 2 * M) / res) + 1;
  const ny = Math.ceil((shape.d + 2 * M) / res) + 1;
  const N = nx * ny;

  // layer tops
  const tops: number[] = [];
  for (let z = P.lh0; z - P.lh / 2 < shape.h - 0.02; z += P.lh)
    tops.push(+z.toFixed(3));
  const L = tops.length;
  const lh = (l: number) => (l === 0 ? P.lh0 : P.lh);
  const zc = (l: number) => tops[l] - lh(l) / 2;

  // sample every layer
  const grids: Float32Array[] = [];
  let tick = performance.now();
  for (let l = 0; l < L; l++) {
    const g = new Float32Array(N);
    const z = zc(l);
    for (let j = 0; j < ny; j++) {
      const y = gy0 + j * res;
      for (let i = 0; i < nx; i++)
        g[j * nx + i] = shape.sdf(gx0 + i * res, y, z);
    }
    grids.push(g);
    if (performance.now() - tick > 10) {
      await yieldFrame();
      tick = performance.now();
    }
  }

  const C = new Contourer(nx, ny, gx0, gy0, res);
  const cls = new Uint8Array(N);
  const gyr = new Float32Array(N);

  // move buffers
  const mx0: number[] = [];
  const my0: number[] = [];
  const mx1: number[] = [];
  const my1: number[] = [];
  const mz: number[] = [];
  const mw: number[] = [];
  const mh: number[] = [];
  const mv: number[] = [];
  const mf: number[] = [];
  const ml: number[] = [];
  const mr: number[] = [];
  const layerStart: number[] = [];

  let cx = shape.w / 2;
  let cy = shape.d + 4;
  const ox = shape.ox;
  const oy = shape.oy;

  const feed = (f: Feat, l: number) => {
    if (f === F.TRAVEL) return P.v.travel;
    if (l === 0) return P.v.first;
    return f === F.SKIRT
      ? P.v.skirt
      : f === F.OUTER
        ? P.v.outer
        : f === F.INNER
          ? P.v.inner
          : f === F.SPARSE
            ? P.v.sparse
            : f === F.SOLID
              ? P.v.solid
              : f === F.TOP
                ? P.v.top
                : P.v.bridge;
  };

  const push = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    l: number,
    f: Feat,
    w: number,
    retract = 0
  ) => {
    mx0.push(x0 + ox);
    my0.push(y0 + oy);
    mx1.push(x1 + ox);
    my1.push(y1 + oy);
    mz.push(tops[l]);
    mw.push(f === F.TRAVEL ? 0 : w);
    mh.push(lh(l));
    mv.push(feed(f, l));
    mf.push(f);
    ml.push(l);
    mr.push(retract);
  };

  const scan = (
    l: number,
    angleDeg: number,
    spacing: number,
    want: (c: number) => Feat | -1,
    phase = 0
  ) => {
    const a = (angleDeg * Math.PI) / 180;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const vx = -uy;
    const vy = ux;
    const corners = [
      [0, 0],
      [shape.w, 0],
      [0, shape.d],
      [shape.w, shape.d],
    ];
    let smin = Infinity;
    let smax = -Infinity;
    let tmin = Infinity;
    let tmax = -Infinity;
    for (const [x, y] of corners) {
      const s = x * vx + y * vy;
      const t = x * ux + y * uy;
      smin = Math.min(smin, s);
      smax = Math.max(smax, s);
      tmin = Math.min(tmin, t);
      tmax = Math.max(tmax, t);
    }
    const out: Path[] = [];
    const step = res * 0.7;
    const k0 = Math.ceil((smin - phase) / spacing);
    let li = 0;
    for (let s = k0 * spacing + phase; s <= smax; s += spacing, li++) {
      let cur: Feat | -1 = -1;
      let start = 0;
      const segs: Path[] = [];
      for (let t = tmin - step; t <= tmax + step; t += step) {
        const x = s * vx + t * ux;
        const y = s * vy + t * uy;
        const i = Math.round((x - gx0) / res);
        const j = Math.round((y - gy0) / res);
        const c =
          i >= 0 && j >= 0 && i < nx && j < ny ? want(cls[j * nx + i]) : -1;
        if (c !== cur) {
          if (cur !== -1 && t - step - start > P.w * 0.6) {
            const te = t - step;
            segs.push({
              p: [
                s * vx + start * ux,
                s * vy + start * uy,
                s * vx + te * ux,
                s * vy + te * uy,
              ],
              f: cur,
              closed: false,
            });
          }
          cur = c;
          start = t;
        }
      }
      // boustrophedon
      if (li % 2)
        segs
          .reverse()
          .forEach((sg) => (sg.p = [sg.p[2], sg.p[3], sg.p[0], sg.p[1]]));
      out.push(...segs);
    }
    return out;
  };

  const order = (paths: Path[], l: number, w: number, connect: number) => {
    const left = paths.slice();
    let lastF: Feat | -1 = -1;
    while (left.length) {
      let bi = 0;
      let bd = Infinity;
      let rev = false;
      for (let i = 0; i < left.length; i++) {
        const p = left[i].p;
        const d0 = (p[0] - cx) ** 2 + (p[1] - cy) ** 2;
        if (d0 < bd) {
          bd = d0;
          bi = i;
          rev = false;
        }
        if (!left[i].closed && !left[i].fixed) {
          const e = p.length - 2;
          const d1 = (p[e] - cx) ** 2 + (p[e + 1] - cy) ** 2;
          if (d1 < bd) {
            bd = d1;
            bi = i;
            rev = true;
          }
        }
      }
      const path = left.splice(bi, 1)[0];
      let p = path.p;
      if (rev) {
        const r: number[] = [];
        for (let i = p.length - 2; i >= 0; i -= 2) r.push(p[i], p[i + 1]);
        p = r;
      }
      const dist = Math.sqrt(bd);
      if (dist > 1e-3) {
        if (!path.closed && path.f === lastF && dist < connect)
          push(cx, cy, p[0], p[1], l, path.f, w);
        else
          push(cx, cy, p[0], p[1], l, F.TRAVEL, 0, dist > P.retractMin ? 1 : 0);
      }
      for (let i = 2; i < p.length; i += 2)
        push(p[i - 2], p[i - 1], p[i], p[i + 1], l, path.f, w);
      cx = p[p.length - 2];
      cy = p[p.length - 1];
      lastF = path.f;
    }
  };

  const inf = shape.infill;
  const gk = Math.PI / ((P.w / inf.density) * 1.1);

  for (let l = 0; l < L; l++) {
    layerStart.push(mx0.length);
    const g = grids[l];
    const w = l === 0 ? P.w0 : P.w;
    const z = zc(l);
    const eps = 0.035;

    // ---- walls
    const walls: Path[][] = [];
    for (let k = 0; k < P.walls; k++) {
      const loops = C.run(g, -(w / 2 + k * w))
        .filter((pl) => pl.closed && polyLen(pl.p) > 1.2)
        .map((pl) => ({
          p: seamLoop(pl.p, eps),
          f: (k === 0 ? F.OUTER : F.INNER) as Feat,
          closed: true,
        }));
      walls.push(loops);
    }
    if (l === 0) {
      const sk = C.run(g, P.skirtGap)
        .filter((pl) => pl.closed && polyLen(pl.p) > 4)
        .map((pl) => ({
          p: seamLoop(pl.p, 0.08),
          f: F.SKIRT as Feat,
          closed: true,
        }));
      order(sk, 0, w, 0);
    }
    for (let k = P.walls - 1; k >= 0; k--) order(walls[k], l, w, 0);

    // ---- classify the infill region
    const inLvl = -(P.walls * w) + 0.15 * w;
    let anySparse = false;
    for (let k = 0; k < N; k++) {
      if (g[k] >= inLvl) {
        cls[k] = 0;
        continue;
      }
      let c = 1;
      if (l < P.bottom) c = 2;
      else if (grids[l - 1][k] > 0) c = 4;
      else {
        for (let j = 1; j <= P.top; j++) {
          if (l + j >= L || grids[l + j][k] > 0) {
            c = 3;
            break;
          }
        }
        if (c === 1) {
          for (let j = 2; j <= P.bottom; j++) {
            if (grids[l - j][k] > 0) {
              c = 2;
              break;
            }
          }
        }
      }
      cls[k] = c;
      if (c === 1) anySparse = true;
    }

    // ---- sparse infill
    if (anySparse) {
      if (inf.kind === 'gyroid') {
        const sz = Math.sin(gk * z);
        const cz = Math.cos(gk * z);
        for (let j = 0; j < ny; j++) {
          const y = (gy0 + j * res) * gk;
          const sy = Math.sin(y);
          const cyy = Math.cos(y);
          for (let i = 0; i < nx; i++) {
            const x = (gx0 + i * res) * gk;
            gyr[j * nx + i] = Math.sin(x) * cyy + sy * cz + sz * Math.cos(x);
          }
        }
        const ok = (k: number) =>
          cls[k] === 1 &&
          cls[k + 1] === 1 &&
          cls[k + nx] === 1 &&
          cls[k + nx + 1] === 1;
        const lines = C.run(gyr, 0, ok)
          .map((pl) => ({
            p: rdp(pl.p, 0.05),
            f: F.SPARSE as Feat,
            closed: false,
          }))
          .filter((pl) => polyLen(pl.p) > 0.8);
        order(lines, l, w, w * 3);
      } else {
        const sp = P.w / inf.density;
        order(
          scan(
            l,
            l % 2 ? -45 : 45,
            sp,
            (c) => (c === 1 ? F.SPARSE : -1),
            (l * 0.37) % 1
          ),
          l,
          w,
          sp * 1.6
        );
      }
    }

    // ---- solid skin, bridges, top
    const ang = l % 2 ? -45 : 45;
    const solid = scan(l, ang, w, (c) => (c === 2 ? F.SOLID : -1));
    order(solid, l, w, w * 2.2);
    if (l > 0) {
      const ba = shape.bridgeAngle ? shape.bridgeAngle(z) : 0;
      const br = scan(l, ba, w, (c) => (c === 4 ? F.BRIDGE : -1));
      order(br, l, w, w * 2.2);
    }
    const top = scan(l, ang, w, (c) => (c === 3 ? F.TOP : -1));
    order(top, l, w, w * 2.2);

    if (performance.now() - tick > 10) {
      await yieldFrame();
      tick = performance.now();
    }
  }
  layerStart.push(mx0.length);

  // ---- pack
  const n = mx0.length;
  const tp: Toolpath = {
    n,
    nExt: 0,
    layers: L,
    x0: Float32Array.from(mx0),
    y0: Float32Array.from(my0),
    x1: Float32Array.from(mx1),
    y1: Float32Array.from(my1),
    z: Float32Array.from(mz),
    w: Float32Array.from(mw),
    h: Float32Array.from(mh),
    v: Float32Array.from(mv),
    f: Uint8Array.from(mf),
    lay: Uint16Array.from(ml),
    retract: Uint8Array.from(mr),
    t: new Float64Array(n),
    ext: new Int32Array(n),
    layerStart: Int32Array.from(layerStart),
    layerZ: Float32Array.from(tops),
    time: 0,
    filament: 0,
    grams: 0,
  };
  const filA = Math.PI * (P.filD / 2) ** 2;
  let t = 0;
  let e = 0;
  let vol = 0;
  let ne = 0;
  for (let i = 0; i < n; i++) {
    const len = Math.hypot(tp.x1[i] - tp.x0[i], tp.y1[i] - tp.y0[i]);
    tp.ext[i] = ne;
    if (tp.f[i] === F.TRAVEL) {
      t += len / tp.v[i] + (tp.retract[i] ? (2 * P.retract) / P.retractV : 0);
    } else {
      // Slic3r's bead cross-section: a rectangle with semicircular sides
      const hh = tp.h[i];
      const area = (tp.w[i] - hh) * hh + Math.PI * (hh / 2) ** 2;
      vol += area * len;
      e += (area * len) / filA;
      t += len / tp.v[i];
      ne++;
    }
    tp.t[i] = t;
  }
  tp.nExt = ne;
  tp.time = t;
  tp.filament = e;
  tp.grams = vol * 1.24e-3;
  return tp;
}

/** move index printing at time t (s) and the fraction through it */
export function locate(tp: Toolpath, t: number): [number, number] {
  if (t <= 0) return [0, 0];
  if (t >= tp.time) return [tp.n - 1, 1];
  let lo = 0;
  let hi = tp.n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (tp.t[mid] < t) lo = mid + 1;
    else hi = mid;
  }
  const t0 = lo ? tp.t[lo - 1] : 0;
  const dt = tp.t[lo] - t0;
  return [lo, dt > 0 ? (t - t0) / dt : 1];
}

export const fmtTime = (s: number) => {
  const m = Math.round(s / 60);
  return m >= 60
    ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
    : `${m} min`;
};
