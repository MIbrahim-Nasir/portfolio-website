import { toolkit } from '@/data/profile';
import {
  ARM_AMP,
  ARM_LANES,
  ARM_X0,
  ARM_X1,
  BUS_AMP,
  DESIGNS_WIN,
  DESIGNS_Y,
  DUTY_AFTER,
  DUTY_BEFORE,
  DUTY_Y,
  FFT_FLOOR,
  GRAPH_NODES,
  GRAPH_SPANS,
  GRAPH_X1,
  HARMONICS,
  ID_SUM_Y,
  ID_X0,
  ID_X1,
  REF,
  SAIF_EDGE,
  UART_AT,
  UART_BYTE,
  UART_WORD,
  XY_BOX,
  armMap,
  busLaneY,
  busMap,
  busX0,
  fftX,
  graphLaneY,
  graphMap,
  graphX0,
  idLaneY,
  refHx,
  saifLvl,
  type ModeId,
  type Span,
} from './channels';
import { drawVectorText, textStrokes, vectorTextWidth } from './vectorFont';

export type Ink = {
  trace: (a: number) => string;
  grid: (a: number) => string;
  cur: (a: number) => string;
};

// Packed beam canvas: R = trace, G = graticule, B = cursors (amber in the shader).
export const PACKED_INK: Ink = {
  trace: (a) => `rgba(255,0,0,${a})`,
  grid: (a) => `rgba(0,255,0,${a})`,
  cur: (a) => `rgba(0,0,255,${a})`,
};

export const PLAIN_INK: Ink = {
  trace: (a) => `rgba(140,255,180,${a})`,
  grid: (a) => `rgba(80,120,100,${a})`,
  cur: (a) => `rgba(255,170,70,${a})`,
};

export type Rect = { x: number; y: number; w: number; h: number };

export type FrameInfo = {
  w: number;
  h: number;
  dpr: number;
  /** graticule area inside the canvas, device px */
  area: Rect;
  t: number; // signal time, frozen on STOP
  mode: ModeId;
  prog: number; // sweep-in after a channel change, 0..1
  lock: number; // trigger lock, 0..1
  count: number; // count-up for numerals, 0..1
  boot: number; // power-on warm-up, 0..1
  timeIdx: number;
  voltsIdx: number;
  cursor: number; // 0..100
  cursorVisible: boolean;
  bin: number;
  run: boolean;
  ink: Ink;
  /** active softkey: cursors and solo lane */
  cx?: Span;
  cy?: Span;
  solo?: number;
  key: number;
  /** X-Y mode */
  xy: boolean;
  fx: number;
  fy: number;
  lockDist: number;
  morph: number; // 0..1 once locked
  dim: number; // 1 = normal; lower while a menu covers the screen
};

type Pt = [number, number];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x: number) => 1 - (1 - x) * (1 - x) * (1 - x);
const easeIO = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Division-space plotting helper. x: 0..10 div, y: -4..4 div (up). */
class Plot {
  readonly gx0: number;
  readonly gy0: number;
  readonly gw: number;
  readonly gh: number;
  readonly div: number;
  readonly u: number; // css px per division
  readonly lw: number;
  readonly compact: boolean;

  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly f: FrameInfo
  ) {
    const A = f.area;
    this.div = Math.min(A.w / 10, A.h / 8);
    this.gw = this.div * 10;
    this.gh = this.div * 8;
    this.gx0 = A.x + (A.w - this.gw) / 2;
    this.gy0 = A.y + (A.h - this.gh) / 2;
    this.u = this.div / f.dpr;
    this.compact = this.u < 50;
    this.lw = Math.max(1.2, Math.min(1.9, this.u * 0.026)) * f.dpr;
  }

  X(d: number) {
    return this.gx0 + d * this.div;
  }
  Y(d: number) {
    return this.gy0 + this.gh / 2 - d * this.div;
  }

  /** Polyline with beam physics: fast (steep) segments draw dimmer. */
  wave(pts: Pt[], a: number, width = 1, cur = false) {
    const ctx = this.ctx;
    const buckets: Path2D[] = [new Path2D(), new Path2D(), new Path2D()];
    for (let i = 1; i < pts.length; i++) {
      const x1 = this.X(pts[i - 1][0]);
      const y1 = this.Y(pts[i - 1][1]);
      const x2 = this.X(pts[i][0]);
      const y2 = this.Y(pts[i][1]);
      const dx = Math.abs(x2 - x1);
      const L = Math.hypot(x2 - x1, y2 - y1);
      const r = L > 0 ? dx / L : 1;
      const b = r > 0.7 ? 0 : r > 0.3 ? 1 : 2;
      buckets[b].moveTo(x1, y1);
      buckets[b].lineTo(x2, y2);
    }
    ctx.lineWidth = this.lw * width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const lv = [1, 0.66, 0.4];
    const ink = cur ? this.f.ink.cur : this.f.ink.trace;
    buckets.forEach((p, i) => {
      ctx.strokeStyle = ink(a * lv[i] * this.f.dim);
      ctx.stroke(p);
    });
  }

  dashed(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    a: number,
    dash = 0.06,
    cur = false
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.setLineDash([dash * this.div, dash * this.div * 1.4]);
    ctx.lineWidth = this.lw * 0.8;
    ctx.strokeStyle = (cur ? this.f.ink.cur : this.f.ink.trace)(a * this.f.dim);
    ctx.beginPath();
    ctx.moveTo(this.X(x1), this.Y(y1));
    ctx.lineTo(this.X(x2), this.Y(y2));
    ctx.stroke();
    ctx.restore();
  }

  /** Beam-drawn text. (x, y) top-left in divisions, h = cap height in divisions. */
  vtext(
    s: string,
    x: number,
    y: number,
    h: number,
    a = 0.95,
    align: 'left' | 'center' = 'left',
    cur = false
  ) {
    const ctx = this.ctx;
    const hp = h * this.div;
    const wpx = vectorTextWidth(s, hp);
    const px = align === 'center' ? this.X(x) - wpx / 2 : this.X(x);
    ctx.lineWidth = this.lw * 1.15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = (cur ? this.f.ink.cur : this.f.ink.trace)(a * this.f.dim);
    drawVectorText(ctx, s, px, this.Y(y), hp);
  }

  dot(x: number, y: number, r: number, a: number, cur = false) {
    const ctx = this.ctx;
    ctx.fillStyle = (cur ? this.f.ink.cur : this.f.ink.trace)(a * this.f.dim);
    ctx.beginPath();
    ctx.arc(this.X(x), this.Y(y), r * this.f.dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  arrowDown(x: number, y: number, s: number, a: number, cur = true) {
    this.wave(
      [
        [x - s, y + s * 1.4],
        [x, y],
        [x + s, y + s * 1.4],
      ],
      a,
      1,
      cur
    );
  }

  clipGraticule(pad = 0.08) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(
      this.gx0 - pad * this.div,
      this.gy0 - pad * this.div,
      this.gw + pad * 2 * this.div,
      this.gh + pad * 2 * this.div
    );
    ctx.clip();
  }
}

/** Square-ish digital lane from active spans in tau (0..1). */
function digital(
  spans: Span[],
  x0: number,
  x1: number,
  lo: number,
  hi: number,
  map: (tau: number) => number
): Pt[] {
  const pts: Pt[] = [[x0, lo]];
  const os = (hi - lo) * 0.12;
  for (const [a, b] of spans) {
    const xa = map(a);
    const xb = map(b);
    pts.push(
      [xa, lo],
      [xa, hi + os],
      [xa + 0.04, hi],
      [xb, hi],
      [xb, lo - os * 0.6],
      [xb + 0.04, lo]
    );
  }
  pts.push([x1, lo]);
  return pts;
}

// ── graticule ───────────────────────────────────────────────────────────────
function graticule(p: Plot) {
  const { ctx, f } = p;
  ctx.lineWidth = Math.max(1, f.dpr * 0.9);
  ctx.strokeStyle = f.ink.grid(0.55);
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const x = Math.round(p.X(i)) + 0.5;
    ctx.moveTo(x, p.Y(4));
    ctx.lineTo(x, p.Y(-4));
  }
  for (let j = -4; j <= 4; j++) {
    const y = Math.round(p.Y(j)) + 0.5;
    ctx.moveTo(p.X(0), y);
    ctx.lineTo(p.X(10), y);
  }
  ctx.stroke();

  ctx.strokeStyle = f.ink.grid(0.8);
  ctx.beginPath();
  const t = 0.09 * p.div;
  for (let i = 0; i <= 50; i++) {
    const x = p.X(i * 0.2);
    ctx.moveTo(x, p.Y(0) - t);
    ctx.lineTo(x, p.Y(0) + t);
  }
  for (let j = 0; j <= 40; j++) {
    const y = p.Y(-4 + j * 0.2);
    ctx.moveTo(p.X(5) - t, y);
    ctx.lineTo(p.X(5) + t, y);
  }
  ctx.stroke();
  ctx.lineWidth = Math.max(1, f.dpr * 1.2);
  ctx.strokeStyle = f.ink.grid(0.75);
  ctx.strokeRect(p.X(0), p.Y(4), p.gw, p.gh);
}

// ── CH1 · identity: Fourier synthesis ───────────────────────────────────────
const CUBE: [number, number, number][] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];
const CUBE_EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

function identity(p: Plot) {
  const { f } = p;
  const gy = Math.pow(1.1, f.voltsIdx - 3);
  const fr = Math.pow(1.22, f.timeIdx - 4);
  const t = f.t;
  const N = HARMONICS.length;
  const built = Math.max(1, Math.min(N, Math.ceil(f.count * N - 1e-6)));
  const w = (Math.PI * 2 * 2) / 9.6;
  const ph = (x: number) => w * (x - 0.2) - t * 0.9 * fr;

  const amp = clamp(0.2 * gy, 0.13, 0.26);
  HARMONICS.forEach((h, i) => {
    const yc = idLaneY(i);
    const on = i < built;
    const a =
      f.solo === undefined
        ? on
          ? 0.85
          : 0.22
        : i === f.solo
          ? 1
          : on
            ? 0.32
            : 0.18;
    const pts: Pt[] = [];
    for (let x = ID_X0; x <= ID_X1; x += 0.01)
      pts.push([x, yc + amp * Math.sin(h.n * ph(x))]);
    p.wave(pts, a, i === f.solo ? 1.15 : 0.85);
  });

  // Σ lane
  const ys = ID_SUM_Y;
  const A = clamp(0.95 * gy, 0.75, 1.1) / (Math.PI / 4);
  const sum: Pt[] = [];
  for (let x = 0.2; x <= 9.8; x += 0.008) {
    let v = 0;
    for (let k = 0; k < built; k++)
      v += Math.sin(HARMONICS[k].n * ph(x)) / HARMONICS[k].n;
    sum.push([x, ys + v * A * 0.75]);
  }
  p.dashed(0.2, ys, 9.8, ys, 0.18, 0.04);
  p.wave(sum, 0.95);

  // X-Y-Z: a cube turned in three dimensions
  p.dashed(6.4, 3.95, 6.4, 0.45, 0.22, 0.04);
  const cx = 8.1;
  const cy = 2.05;
  const r = 0.8;
  const ay = t * 0.55 * fr;
  const ax = 0.55 + 0.12 * Math.sin(t * 0.31);
  const proj = ([x, y, z]: [number, number, number]): Pt => {
    const x1 = x * Math.cos(ay) + z * Math.sin(ay);
    const z1 = -x * Math.sin(ay) + z * Math.cos(ay);
    const y1 = y * Math.cos(ax) - z1 * Math.sin(ax);
    const z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
    const k = 3.6 / (3.6 + z2);
    return [cx + x1 * r * k, cy + y1 * r * k];
  };
  const P = CUBE.map(proj);
  for (const [a, b] of CUBE_EDGES) p.wave([P[a], P[b]], 0.8, 0.85);

  // the beam writes the job title
  const n = Math.round(f.count * 11);
  p.vtext('AI ENGINEER'.slice(0, n), 0.3, -2.62, 0.7, 0.98);
}

// ── CH2 · SAIF ──────────────────────────────────────────────────────────────
function saifStep(p: Plot) {
  const { f } = p;
  const fr = Math.pow(1.25, f.timeIdx - 4);
  const gy = Math.pow(1.15, f.voltsIdx - 3);
  const lvl = saifLvl;
  const t = f.t;

  // generation time: one step down, with ringing
  const pts: Pt[] = [];
  for (let x = 0.2; x <= 9.8; x += 0.02) {
    let m: number;
    if (x < SAIF_EDGE) {
      m =
        20.7 +
        gy *
          (0.32 * Math.sin(x * 7.1 + t * 2.1 * fr) +
            0.14 * Math.sin(x * 23 - t * 3.3 * fr));
    } else {
      const s = x - SAIF_EDGE;
      m =
        6 +
        0.75 * gy * Math.sin(x * 2.3 - t * 0.9 * fr) +
        14.7 * Math.exp(-s * 3.1) * Math.cos(s * 8.5);
    }
    pts.push([x, lvl(m)]);
  }
  p.dashed(0.2, lvl(20), 9.8, lvl(20), 0.3);
  p.dashed(SAIF_EDGE, lvl(7), 9.8, lvl(7), 0.24);
  p.dashed(SAIF_EDGE, lvl(5), 9.8, lvl(5), 0.24);
  p.wave(pts, 0.92);

  // Δ arrow + the number, in cursor amber
  const ax = 7.35;
  const top = lvl(20);
  const bot = lvl(6.2);
  const hot = f.key === 0 ? 1 : 0.6;
  p.wave(
    [
      [ax, top],
      [ax, bot],
    ],
    0.8 * hot,
    1,
    true
  );
  p.wave(
    [
      [ax - 0.12, bot + 0.17],
      [ax, bot],
      [ax + 0.12, bot + 0.17],
    ],
    0.9 * hot,
    1,
    true
  );
  p.vtext('~70%', 7.6, 3.08, 0.55, 0.95 * hot, 'left', true);

  // designer time per session: the pulse got 35% shorter
  const lo = DUTY_Y - 0.28;
  const hi = DUTY_Y + 0.28;
  const [b0, b1] = DUTY_BEFORE;
  const [a0, a1] = DUTY_AFTER;
  p.wave(
    [
      [0.2, lo],
      [b0, lo],
      [b0, hi],
      [b1, hi],
      [b1, lo],
      [a0, lo],
      [a0, hi],
      [a1, hi],
      [a1, lo],
      [9.8, lo],
    ],
    f.key === 2 ? 1 : 0.85
  );
  p.dashed(a1, hi, a0 + (b1 - b0), hi, 0.32, 0.04);
  p.dashed(a0 + (b1 - b0), hi, a0 + (b1 - b0), lo, 0.32, 0.04);

  // client designs: an event counter, 57 pulses inside a four-week window
  const base = DESIGNS_Y;
  const peak = base + 0.6;
  const [w0, w1] = DESIGNS_WIN;
  const total = 57;
  const shown = Math.round(total * f.count);
  p.wave(
    [
      [0.2, base],
      [9.8, base],
    ],
    0.55
  );
  const spikes = new Path2D();
  for (let i = 0; i < shown; i++) {
    const x =
      w0 + ((w1 - w0) * (i + 0.5 + 0.7 * (hash(i * 3.7) - 0.5))) / total;
    const hgt = peak - base;
    spikes.moveTo(p.X(x), p.Y(base));
    spikes.lineTo(p.X(x), p.Y(base + hgt * (0.82 + 0.18 * hash(i))));
  }
  p.ctx.lineWidth = p.lw * 0.9;
  p.ctx.strokeStyle = f.ink.trace((f.key === 1 ? 1 : 0.8) * f.dim);
  p.ctx.stroke(spikes);
  p.wave(
    [
      [w0, -2.85],
      [w0, -2.95],
      [w1, -2.95],
      [w1, -2.85],
    ],
    0.45
  );
  p.vtext(String(shown), 8.65, -1.92, 0.62, 0.96);
}

// ── CH3 · agent graph as a logic analyzer ───────────────────────────────────
function agentGraph(p: Plot) {
  const { f } = p;
  const gy = Math.pow(1.12, f.voltsIdx - 3);
  const X0 = graphX0(p.compact);
  const map = graphMap(p.compact);
  const speed = 0.16 * Math.pow(1.2, f.timeIdx - 4);
  const play = (f.t * speed) % 1.18;
  const amp = clamp(0.3 * gy, 0.18, 0.4);

  GRAPH_NODES.forEach((n, i) => {
    const spans = GRAPH_SPANS[n.id] ?? [];
    const yc = graphLaneY(i);
    const active = spans.some(([a, b]) => play >= a && play <= b);
    const base = f.solo === undefined ? 0.62 : i === f.solo ? 0.95 : 0.4;
    p.wave(
      digital(spans, X0, GRAPH_X1, yc - amp, yc + amp, map),
      active ? 1 : base
    );
  });

  const ye = graphLaneY(5);
  const yr = graphLaneY(3);
  p.dashed(map(0.56) + 0.05, ye + amp, map(0.58), yr - amp, 0.6, 0.05, true);

  // trigger point: the failed evaluation
  const tx = map(0.48);
  p.wave(
    [
      [tx - 0.1, 3.98],
      [tx, 3.82],
      [tx + 0.1, 3.98],
      [tx - 0.1, 3.98],
    ],
    0.9,
    1,
    true
  );

  if (play <= 1) {
    const x = map(play);
    p.dashed(x, 3.9, x, -3.9, 0.3, 0.04);
  }
}

// ── CH4 · AI robotics: the closed loop + a Core XY gantry ────────────────────
function uartBits(
  word: string,
  x0: number,
  x1: number,
  lo: number,
  hi: number
): Pt[] {
  const pts: Pt[] = [[x0, hi]];
  const bitW = UART_BYTE / 10;
  let level = 1;
  const at = (tau: number, v: number) => {
    if (v === level) return;
    const x = armMap(tau);
    pts.push([x, level ? hi : lo], [x, v ? hi : lo]);
    level = v;
  };
  word.split('').forEach((ch, i) => {
    const code = ch.charCodeAt(0);
    const s = UART_AT + i * UART_BYTE;
    at(s, 0); // start bit
    for (let b = 0; b < 8; b++) at(s + bitW * (1 + b), (code >> b) & 1); // LSB first
    at(s + bitW * 9, 1); // stop bit
  });
  pts.push([x1, level ? hi : lo]);
  return pts;
}

const BINS: Pt[] = (() => {
  const out: Pt[] = [];
  const xs = [7.25, 8.175, 9.1];
  const ys = [2.3, 1.1, -0.1, -1.3];
  for (const y of ys) for (const x of xs) out.push([x, y]);
  return out;
})();
const TRIPS = [4, 0, 10, 7, 2, 9];
const TRAY: Pt = [8.175, -1.95];

function arm(p: Plot) {
  const { f } = p;
  const L = ARM_LANES;
  const a = ARM_AMP;
  const speed = 0.2 * Math.pow(1.2, f.timeIdx - 4);
  const play = (f.t * speed) % 1.12;
  const loopHot = f.key === 0 ? 1 : 0.75;

  // CAM: frame sync
  p.wave(
    digital(
      [
        [0.02, 0.05],
        [0.9, 0.93],
      ],
      ARM_X0,
      ARM_X1,
      L.cam - a,
      L.cam + a,
      armMap
    ),
    0.85 * loopHot + 0.1
  );

  // GEMINI: decision window, drawn as a bus "eye"
  {
    const y = L.gem;
    const xa = armMap(0.07);
    const xb = armMap(0.36);
    const e = 0.1;
    p.wave(
      [
        [ARM_X0, y],
        [xa, y],
        [xa + e, y + a],
        [xb - e, y + a],
        [xb, y],
        [ARM_X1, y],
      ],
      0.85
    );
    p.wave(
      [
        [xa, y],
        [xa + e, y - a],
        [xb - e, y - a],
        [xb, y],
      ],
      0.85
    );
  }

  // UART: "GRAB", 8N1, LSB first, with decode brackets
  p.wave(uartBits(UART_WORD, ARM_X0, ARM_X1, L.uart - a, L.uart + a), 0.88);
  for (let i = 0; i < UART_WORD.length; i++) {
    const xa = armMap(UART_AT + i * UART_BYTE) + 0.015;
    const xb = armMap(UART_AT + (i + 1) * UART_BYTE) - 0.015;
    const y = L.uart + a + 0.14;
    p.wave(
      [
        [xa, y - 0.06],
        [xa, y],
        [xb, y],
        [xb, y - 0.06],
      ],
      0.45
    );
  }

  // SERVO: PWM; the pulse widens once the command lands
  {
    const pts: Pt[] = [[ARM_X0, L.servo - a]];
    for (let s = 0.0; s < 1; s += 0.1) {
      const wdt = s >= 0.74 ? 0.034 : 0.014;
      const xa = armMap(s + 0.01);
      const xb = armMap(s + 0.01 + wdt);
      pts.push(
        [xa, L.servo - a],
        [xa, L.servo + a],
        [xb, L.servo + a],
        [xb, L.servo - a]
      );
    }
    pts.push([ARM_X1, L.servo - a]);
    p.wave(pts, 0.85);
  }

  // the loop closes: servo back to the next camera frame
  {
    const y0 = L.servo - a - 0.25;
    const xr = 6.28;
    const yt = L.cam + a + 0.32;
    const xc = armMap(0.915);
    const pts: Pt[] = [
      [armMap(0.8), y0],
      [xr, y0],
      [xr, yt],
      [xc, yt],
      [xc, L.cam + a + 0.06],
    ];
    for (let i = 1; i < pts.length; i++)
      p.dashed(
        pts[i - 1][0],
        pts[i - 1][1],
        pts[i][0],
        pts[i][1],
        0.7 * loopHot,
        0.05,
        true
      );
    p.arrowDown(xc, L.cam + a + 0.06, 0.09, 0.9 * loopHot);
  }

  if (play <= 1) {
    const x = armMap(play);
    p.dashed(x, 3.9, x, L.servo - a - 0.1, 0.28, 0.04);
  }

  p.vtext('3RD', 0.3, -1.45, 0.8, f.key === 1 ? 1 : 0.92);

  // X-Y: Core XY gantry
  p.dashed(6.5, 3.95, 6.5, -3.95, 0.22, 0.04);
  const B = XY_BOX;
  const hot = f.key === 2 ? 1 : 0.7;
  p.wave(
    [
      [B.x0, B.y0],
      [B.x1, B.y0],
      [B.x1, B.y1],
      [B.x0, B.y1],
      [B.x0, B.y0],
    ],
    0.5 * hot,
    0.8
  );
  for (const [bx, by] of BINS) {
    const s = 0.27;
    p.wave(
      [
        [bx - s, by + s * 0.8],
        [bx - s, by - s * 0.8],
        [bx + s, by - s * 0.8],
        [bx + s, by + s * 0.8],
      ],
      0.42 * hot,
      0.7
    );
  }
  p.wave(
    [
      [TRAY[0] - 0.45, TRAY[1] + 0.12],
      [TRAY[0] - 0.45, TRAY[1] - 0.12],
      [TRAY[0] + 0.45, TRAY[1] - 0.12],
      [TRAY[0] + 0.45, TRAY[1] + 0.12],
    ],
    0.55 * hot,
    0.8
  );

  // head position: tray → bin → tray, straight-line Core XY moves
  const leg = 1.4;
  const T = f.t * 0.7 * Math.pow(1.15, f.timeIdx - 4);
  const trip = Math.floor(T / (leg * 2)) % TRIPS.length;
  const u = (T % (leg * 2)) / leg;
  const bin = BINS[TRIPS[trip]];
  const k = u < 1 ? easeIO(clamp(u / 0.8)) : 1 - easeIO(clamp((u - 1) / 0.8));
  const hx = TRAY[0] + (bin[0] - TRAY[0]) * k;
  const hy = TRAY[1] + (bin[1] - TRAY[1]) * k;
  p.dashed(TRAY[0], TRAY[1], bin[0], bin[1], 0.3 * hot, 0.04);
  p.wave(
    [
      [B.x0, hy],
      [B.x1, hy],
    ],
    0.35 * hot,
    0.8
  );
  p.wave(
    [
      [hx, hy - 0.16],
      [hx, hy + 0.16],
    ],
    0.6 * hot
  );
  p.dot(hx, hy, 2.6, 1);
}

// ── BUS · DeltaX request/response timing ────────────────────────────────────
function bus(p: Plot) {
  const { f } = p;
  const X0 = busX0(p.compact);
  const X1 = 9.85;
  const map = busMap(p.compact);
  const amp = BUS_AMP;
  const hotPath = f.key === 0 ? 1 : 0.85;

  const spans: Span[][] = [
    [
      [0.03, 0.09],
      [0.88, 0.95],
    ],
    [[0.1, 0.86]],
    [[0.17, 0.79]],
    [[0.24, 0.72]],
  ];

  for (let i = 0; i < 5; i++) {
    const yc = busLaneY(i);
    if (i < 4) {
      p.wave(digital(spans[i], X0, X1, yc - amp, yc + amp, map), hotPath);
    } else {
      const a = map(0.31);
      const b = map(0.65);
      const e = 0.12;
      p.wave(
        [
          [X0, yc],
          [a, yc],
          [a + e, yc + amp],
          [b - e, yc + amp],
          [b, yc],
          [X1, yc],
        ],
        0.85
      );
      p.wave(
        [
          [a, yc],
          [a + e, yc - amp],
          [b - e, yc - amp],
          [b, yc],
        ],
        0.85
      );
    }
  }

  const rises = [0.09, 0.1, 0.17, 0.24, 0.31];
  const falls = [0.65, 0.72, 0.79, 0.86, 0.88];
  const path: Pt[] = [];
  for (let i = 0; i < 4; i++) {
    const A: Pt = [map(rises[i]), busLaneY(i) - amp];
    const B: Pt = [map(rises[i + 1]), busLaneY(i + 1) + amp];
    p.dashed(A[0], A[1], B[0], B[1], 0.4, 0.04);
    path.push(A, B);
  }
  for (let i = 4; i > 0; i--) {
    const A: Pt = [map(falls[4 - i]), busLaneY(i) + amp];
    const B: Pt = [map(falls[5 - i]), busLaneY(i - 1) - amp];
    p.dashed(A[0], A[1], B[0], B[1], 0.4, 0.04);
    path.push(A, B);
  }
  const speed = 0.22 * Math.pow(1.2, f.timeIdx - 4);
  const k = ((f.t * speed) % 1) * (path.length - 1);
  const i0 = Math.floor(k);
  const fr = k - i0;
  const A = path[i0];
  const B = path[Math.min(path.length - 1, i0 + 1)];
  p.dot(A[0] + (B[0] - A[0]) * fr, A[1] + (B[1] - A[1]) * fr, 2.6, 1);

  p.dashed(0.2, -1.5, 9.8, -1.5, 0.22, 0.04);
  p.vtext(`${Math.round(20 * f.count)}+`, 0.35, -1.85, 1.1, 0.96);
}

// ── REF · origin ────────────────────────────────────────────────────────────
function smooth01(x: number) {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
}

function ref(p: Plot) {
  const { f } = p;
  const { yD, yH, up, down, D0, D1, yc, a } = REF;
  const lon = (x: number) => {
    const u = smooth01((x - up) / 0.6);
    const d = smooth01((x - down) / 0.6);
    return yD + (yH - yD) * (u - d);
  };
  const pts: Pt[] = [];
  for (let x = 0.3; x <= 9.7; x += 0.02)
    pts.push([x, lon(x) + 0.03 * Math.sin(x * 31 + f.t * 2)]);
  p.wave(pts, 0.9);
  const jx = 0.3 + ((f.t * 0.09) % 1) * 9.4;
  p.dot(jx, lon(jx), 2.4, 1);

  // one day at TSIG; the falling edge jitters between 9 and 10 PM
  p.dashed(0.2, -0.45, 9.8, -0.45, 0.22, 0.04);
  const off = 21 + hash(Math.floor(f.t * 2.5)) * 1;
  const hot = f.key === 0 ? 1 : 0.85;
  p.wave(
    [
      [D0, yc - a],
      [refHx(16), yc - a],
      [refHx(16), yc + a],
      [refHx(off), yc + a],
      [refHx(off), yc - a],
      [D1, yc - a],
    ],
    0.92 * hot
  );
  for (let h = 0; h <= 24; h += 2) {
    const x = refHx(h);
    p.wave(
      [
        [x, yc - a - 0.15],
        [x, yc - a - (h % 6 === 0 ? 0.32 : 0.22)],
      ],
      0.4
    );
  }
  const dayT = (f.t * 0.12) % 1;
  const h = dayT * 24;
  p.dot(D0 + dayT * (D1 - D0), h >= 16 && h <= off ? yc + a : yc - a, 2.2, 1);

  p.vtext(`${Math.round(30 * f.count)}`, 7.25, -0.9, 1.25, 0.96);
}

// ── MATH · FFT of the toolkit ───────────────────────────────────────────────
export const fftPeak = (i: number) => 2.4 + 0.55 * hash(i);

function fft(p: Plot) {
  const { f } = p;
  const N = toolkit.length;
  const floor = FFT_FLOOR;
  const wid = 0.055 * Math.pow(1.1, 4 - f.timeIdx);
  const gy = Math.pow(1.15, f.voltsIdx - 3);
  const tq = Math.floor(f.t * 18);

  const pts: Pt[] = [];
  for (let x = 0.15; x <= 9.85; x += 0.012) {
    const k = Math.floor(x * 80);
    let y =
      floor + gy * (0.1 * hash(k * 7.3 + tq * 1.7) + 0.05 * hash(k * 3.1));
    const iNear = Math.round(((x - 0.5) * (N - 1)) / 9);
    for (let i = Math.max(0, iNear - 1); i <= Math.min(N - 1, iNear + 1); i++) {
      const d = x - fftX(i);
      const flick = 1 + 0.035 * Math.sin(f.t * 6.3 + i * 2.7);
      const g = Math.exp(-(d * d) / (wid * wid));
      const side =
        0.07 * Math.exp(-(d * d) / 0.05) * Math.abs(Math.cos(d * 38));
      y += fftPeak(i) * flick * (g + side);
    }
    pts.push([x, y]);
  }
  p.wave(pts, 0.88);

  const b = clamp(f.bin, 0, N - 1);
  const bx = fftX(b);
  const by =
    floor + fftPeak(b) * (1 + 0.035 * Math.sin(f.t * 6.3 + b * 2.7)) + 0.12;
  p.dashed(bx, floor, bx, 2.7, 0.55, 0.04, true);
  const m = 0.13;
  p.wave(
    [
      [bx, by],
      [bx - m, by + m * 1.3],
      [bx, by + m * 2.6],
      [bx + m, by + m * 1.3],
      [bx, by],
    ],
    1,
    1,
    true
  );
}

// ── X-Y mode (the easter egg) ───────────────────────────────────────────────
const SAMPLES = 900;

type Sample = { x: number; y: number; down: boolean };

/** His initials as one continuous beam path, resampled by arc length. */
const INITIALS: Sample[] = (() => {
  const h = 3.1;
  const w = vectorTextWidth('MIN', h);
  const x0 = 5 - w / 2;
  const top = 1.75;
  const strokes = textStrokes('MIN', x0, 0, h).map((s) =>
    s.map(([x, y]) => [x, top - y] as Pt)
  );
  // flatten with pen-up connectors
  const segs: { a: Pt; b: Pt; down: boolean; len: number }[] = [];
  let last: Pt | null = null;
  for (const s of strokes) {
    if (last)
      segs.push({
        a: last,
        b: s[0],
        down: false,
        len: Math.hypot(s[0][0] - last[0], s[0][1] - last[1]),
      });
    for (let i = 1; i < s.length; i++) {
      segs.push({
        a: s[i - 1],
        b: s[i],
        down: true,
        len: Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]),
      });
    }
    last = s[s.length - 1];
  }
  const total = segs.reduce((acc, s) => acc + s.len, 0);
  const out: Sample[] = [];
  let si = 0;
  let acc = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const d = (i / (SAMPLES - 1)) * total;
    while (si < segs.length - 1 && acc + segs[si].len < d) {
      acc += segs[si].len;
      si++;
    }
    const s = segs[si];
    const k = s.len > 0 ? clamp((d - acc) / s.len) : 0;
    out.push({
      x: s.a[0] + (s.b[0] - s.a[0]) * k,
      y: s.a[1] + (s.b[1] - s.a[1]) * k,
      down: s.down,
    });
  }
  return out;
})();

function xyMode(p: Plot) {
  const { f } = p;
  const rx = 3.7;
  const ry = 3.2;
  // the closer the knobs are to the lock, the slower the figure drifts
  const drift = f.t * 0.9 * Math.min(1, f.lockDist / 4);
  const m = easeIO(clamp(f.morph));
  const ctx = p.ctx;
  const bright = new Path2D();
  const faint = new Path2D();
  let prev: Pt | null = null;
  for (let i = 0; i < SAMPLES; i++) {
    const s = (i / (SAMPLES - 1)) * Math.PI * 2;
    const lx = 5 + rx * Math.sin(f.fx * s + drift + Math.PI / 4);
    const ly = ry * Math.sin(f.fy * s);
    const I = INITIALS[i];
    const x = lx + (I.x - lx) * m;
    const y = ly + (I.y - ly) * m;
    const pt: Pt = [p.X(x), p.Y(y)];
    if (prev) {
      const target = m > 0 && !I.down ? faint : bright;
      target.moveTo(prev[0], prev[1]);
      target.lineTo(pt[0], pt[1]);
    }
    prev = pt;
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = p.lw * (1 + 0.25 * m);
  ctx.strokeStyle = f.ink.trace(0.9 * f.dim);
  ctx.stroke(bright);
  ctx.lineWidth = p.lw * 0.8;
  ctx.strokeStyle = f.ink.trace((0.9 * (1 - m) + 0.08) * f.dim);
  ctx.stroke(faint);
  if (m >= 1)
    p.vtext('MOHAMMED IBRAHIM NASIR', 5, -2.35, 0.32, 0.9, 'center', true);
}

const DRAW: Record<ModeId, (p: Plot) => void> = {
  id: identity,
  saif: saifStep,
  graph: agentGraph,
  arm,
  bus,
  ref,
  fft,
};

// ── frame ───────────────────────────────────────────────────────────────────
export function drawFrame(ctx: CanvasRenderingContext2D, f: FrameInfo) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, f.w, f.h);
  ctx.globalCompositeOperation = 'lighter';

  const p = new Plot(ctx, f);
  graticule(p);

  // warm-up: dot, then line
  if (f.boot < 1) {
    const b = f.boot;
    if (b < 0.4) p.dot(5, 0, 1.5 + b * 6, clamp(b * 4));
    else {
      const w = ease(clamp((b - 0.4) / 0.6)) * 5;
      p.wave(
        [
          [5 - w, 0],
          [5 + w, 0],
        ],
        1,
        1.2
      );
    }
    ctx.restore();
    return;
  }

  ctx.save();
  p.clipGraticule();
  if (f.prog < 1) {
    ctx.beginPath();
    ctx.rect(0, 0, p.gx0 + p.gw * f.prog, f.h);
    ctx.clip();
  }
  if (f.lock < 1) {
    const j =
      (1 - f.lock) *
      (Math.sin(f.t * 97) * 0.5 + Math.sin(f.t * 41) * 0.5) *
      0.35 *
      p.div;
    ctx.translate(j, 0);
  }
  if (f.xy) xyMode(p);
  else DRAW[f.mode](p);
  ctx.restore();

  if (f.prog < 1) {
    const x = p.gx0 + p.gw * f.prog;
    ctx.fillStyle = f.ink.trace(0.9);
    ctx.fillRect(x - f.dpr, p.gy0, 2 * f.dpr, p.gh);
  }

  if (!f.xy) {
    // active softkey cursors, amber
    if (f.cx) {
      for (const x of f.cx) p.dashed(x, 4, x, -4, 0.75, 0.05, true);
    }
    if (f.cy) for (const y of f.cy) p.dashed(0, y, 10, y, 0.7, 0.05, true);
    // free cursor from the CURSOR knob
    if (f.cursorVisible && f.mode !== 'fft') {
      const cx = (f.cursor / 100) * 10;
      p.dashed(cx, 4, cx, -4, 0.55, 0.03, true);
    }
  }

  ctx.restore();
}
