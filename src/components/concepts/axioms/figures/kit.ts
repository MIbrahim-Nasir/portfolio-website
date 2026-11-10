// Shared drawing kit for the figures. Canvas 2D, CSS-pixel coordinates.
// Every fact on the page is drawn as an annotation on a figure, so the kit
// carries a small set of drafting conventions: keys, leaders, tags, stamps.

export type Ink = {
  paper: string;
  ink: string;
  muted: string;
  faint: string;
  rule: string;
  accent: string;
  accentSoft: string;
  mono: string;
  serif: string;
};

export type Pt = { x: number; y: number };

export type Scene = {
  /** called whenever the drawing surface changes size (CSS px) */
  resize(w: number, h: number): void;
  /** advance the simulation by dt seconds */
  step(dt: number): void;
  /** paint the current state */
  draw(ctx: CanvasRenderingContext2D, ink: Ink): void;
  /** reduced motion: jump to a representative, finished state */
  settle(): void;
  /** optional pointer in CSS px relative to the canvas; null when it leaves */
  pointer?(p: Pt | null): void;
};

export type SceneFactory = () => Scene;

export const PALETTE = {
  paper: '#f6f1e6',
  ink: '#18150f',
  muted: '#6b6457',
  faint: 'rgba(24,21,15,0.08)',
  rule: 'rgba(24,21,15,0.24)',
  accent: '#c23a1d',
  accentSoft: 'rgba(194,58,29,0.10)',
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number) {
  let u = 0;
  while (u === 0) u = rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** crisp hairline: snap to half pixels */
export const px = (v: number) => Math.round(v) + 0.5;

export function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function ring(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

export function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size = 5
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x - size * Math.cos(angle - 0.42),
    y - size * Math.sin(angle - 0.42)
  );
  ctx.lineTo(
    x - size * Math.cos(angle + 0.42),
    y - size * Math.sin(angle + 0.42)
  );
  ctx.closePath();
  ctx.fill();
}

export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size = 5
) {
  line(ctx, x1, y1, x2, y2);
  arrowHead(ctx, x2, y2, Math.atan2(y2 - y1, x2 - x1), size);
}

export type Face = 'mono' | 'serif' | 'italic';

export type TextOpts = {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  base?: CanvasTextBaseline;
  font?: Face;
  track?: number;
  alpha?: number;
};

type Spaced = CanvasRenderingContext2D & { letterSpacing?: string };

export function setFont(
  ctx: CanvasRenderingContext2D,
  ink: Ink,
  size: number,
  f: Face = 'mono'
) {
  const fam = f === 'mono' ? ink.mono : ink.serif;
  ctx.font = `${f === 'italic' ? 'italic ' : ''}${size}px ${fam}`;
}

export function measure(
  ctx: CanvasRenderingContext2D,
  ink: Ink,
  s: string,
  size: number,
  f: Face = 'mono',
  track = 0
) {
  setFont(ctx, ink, size, f);
  return ctx.measureText(s).width + track * s.length;
}

export function text(
  ctx: CanvasRenderingContext2D,
  ink: Ink,
  s: string,
  x: number,
  y: number,
  o: TextOpts = {}
) {
  const size = o.size ?? 11;
  setFont(ctx, ink, size, o.font ?? 'mono');
  ctx.fillStyle = o.color ?? ink.muted;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.base ?? 'alphabetic';
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  const c = ctx as Spaced;
  if (o.track && 'letterSpacing' in ctx) {
    c.letterSpacing = `${o.track}px`;
    ctx.fillText(s, x, y);
    c.letterSpacing = '0px';
  } else {
    ctx.fillText(s, x, y);
  }
  if (o.alpha !== undefined) ctx.globalAlpha = 1;
}

/** Uppercase Latin letters only, so σ, ζ and μ stay lowercase. */
export const upper = (s: string) => s.replace(/[a-z]/g, (c) => c.toUpperCase());

/** A drafting key: small uppercase mono with tracking. */
export function key(
  ctx: CanvasRenderingContext2D,
  ink: Ink,
  s: string,
  x: number,
  y: number,
  o: TextOpts = {}
) {
  text(ctx, ink, upper(s), x, y, { size: 10.5, track: 1.1, ...o });
}

/** Greedy word wrap. */
export function wrap(
  ctx: CanvasRenderingContext2D,
  ink: Ink,
  s: string,
  maxW: number,
  size: number,
  f: Face = 'mono'
) {
  setFont(ctx, ink, size, f);
  const words = s.split(' ');
  const out: string[] = [];
  let cur = '';
  for (const wd of words) {
    const next = cur ? `${cur} ${wd}` : wd;
    if (ctx.measureText(next).width > maxW && cur) {
      out.push(cur);
      cur = wd;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * Leader + shoulder + text, as on a drawing. Anchor (ax, ay) gets a small dot;
 * the label sits at the shoulder (lx, ly). `lines[0]` is a key (uppercase),
 * the rest are values. Returns the label's bounding box.
 */
export function callout(
  ctx: CanvasRenderingContext2D,
  ink: Ink,
  ax: number,
  ay: number,
  lx: number,
  ly: number,
  lines: string[],
  o: {
    color?: string;
    side?: 'left' | 'right';
    ks?: number;
    vs?: number;
    vf?: Face;
    dot?: boolean;
    shoulder?: number;
  } = {}
) {
  const color = o.color ?? ink.ink;
  const side = o.side ?? (lx >= ax ? 'right' : 'left');
  const sh = o.shoulder ?? 10;
  const ks = o.ks ?? 10.5;
  const vs = o.vs ?? 12.5;
  const dir = side === 'right' ? 1 : -1;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(lx, ly);
  ctx.lineTo(lx + dir * sh, ly);
  ctx.stroke();
  if (o.dot !== false) dot(ctx, ax, ay, 1.8);
  const tx = lx + dir * (sh + 5);
  const align: CanvasTextAlign = side === 'right' ? 'left' : 'right';
  let y = ly + ks * 0.36;
  let wmax = 0;
  lines.forEach((s, i) => {
    if (i === 0) {
      key(ctx, ink, s, tx, y, { color, align, size: ks });
      wmax = Math.max(wmax, measure(ctx, ink, upper(s), ks, 'mono', 1.1));
      y += vs + 4;
    } else {
      text(ctx, ink, s, tx, y, {
        color: i === 1 ? ink.ink : ink.muted,
        align,
        size: vs,
        font: o.vf ?? 'mono',
      });
      wmax = Math.max(wmax, measure(ctx, ink, s, vs, o.vf ?? 'mono'));
      y += vs + 3;
    }
  });
  return {
    x: side === 'right' ? tx : tx - wmax,
    y: ly - ks,
    w: wmax,
    h: y - ly,
  };
}

/** A boxed tag (paper fill, hairline). Returns its box. */
export function tag(
  ctx: CanvasRenderingContext2D,
  ink: Ink,
  s: string,
  x: number,
  y: number,
  o: {
    size?: number;
    color?: string;
    align?: 'left' | 'right' | 'center';
    fill?: string;
    pad?: number;
    upper?: boolean;
    track?: number;
  } = {}
) {
  const size = o.size ?? 10.5;
  const pad = o.pad ?? 6;
  const label = o.upper === false ? s : upper(s);
  const track = o.track ?? (o.upper === false ? 0 : 1.1);
  const tw = measure(ctx, ink, label, size, 'mono', track);
  const bw = tw + pad * 2;
  const bh = size + pad * 1.5;
  const bx =
    o.align === 'right' ? x - bw : o.align === 'center' ? x - bw / 2 : x;
  const by = y - bh / 2;
  const color = o.color ?? ink.ink;
  ctx.fillStyle = o.fill ?? ink.paper;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(px(bx), px(by), Math.round(bw), Math.round(bh));
  text(ctx, ink, label, bx + pad, y + size * 0.36, { size, color, track });
  return { x: bx, y: by, w: bw, h: bh };
}

/** A rotated rubber stamp: double rule box, accent ink, slight angle. */
export function stamp(
  ctx: CanvasRenderingContext2D,
  ink: Ink,
  lines: string[],
  x: number,
  y: number,
  o: {
    size?: number;
    angle?: number;
    color?: string;
    align?: 'left' | 'right' | 'center';
  } = {}
) {
  const size = o.size ?? 11;
  const color = o.color ?? ink.accent;
  const widths = lines.map((s) =>
    measure(ctx, ink, upper(s), size, 'mono', 1.6)
  );
  const tw = Math.max(...widths);
  const bw = tw + 18;
  const bh = lines.length * (size + 5) + 12;
  ctx.save();
  const cx =
    o.align === 'right' ? x - bw / 2 : o.align === 'left' ? x + bw / 2 : x;
  ctx.translate(cx, y);
  ctx.rotate(o.angle ?? -0.06);
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
  ctx.lineWidth = 0.7;
  ctx.strokeRect(-bw / 2 + 3, -bh / 2 + 3, bw - 6, bh - 6);
  lines.forEach((s, i) => {
    text(ctx, ink, upper(s), 0, -bh / 2 + 6 + (i + 1) * (size + 5) - 3, {
      size,
      color,
      align: 'center',
      track: 1.6,
    });
  });
  ctx.restore();
  return { w: bw, h: bh };
}

/** Diagonal hatching inside the current path/clip. Caller sets clip. */
export function hatch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gap = 6
) {
  ctx.beginPath();
  for (let k = -h; k < w + h; k += gap) {
    ctx.moveTo(k, 0);
    ctx.lineTo(k - h, h);
  }
  ctx.stroke();
}

/** A bracket ⎣ ⎦ along x from a to b at y, opening up (dir -1) or down (dir 1). */
export function bracket(
  ctx: CanvasRenderingContext2D,
  a: number,
  b: number,
  y: number,
  dir = 1,
  tick = 4
) {
  ctx.beginPath();
  ctx.moveTo(a, y - dir * tick);
  ctx.lineTo(a, y);
  ctx.lineTo(b, y);
  ctx.lineTo(b, y - dir * tick);
  ctx.stroke();
}

// ——— convex polygon utilities (for the feasible-set figure) ———

/** half-plane n·p <= c */
export type Half = { nx: number; ny: number; c: number };

export function clipPoly(poly: Pt[], hp: Half): Pt[] {
  const out: Pt[] = [];
  const f = (p: Pt) => hp.nx * p.x + hp.ny * p.y - hp.c;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = f(a);
    const fb = f(b);
    if (fa <= 0) out.push(a);
    if (fa <= 0 !== fb <= 0) {
      const t = fa / (fa - fb);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

export function polyPath(ctx: CanvasRenderingContext2D, poly: Pt[]) {
  ctx.beginPath();
  poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
}

/** Polyline path with arc-length lookup (for packets travelling on wires). */
export type Path = { pts: Pt[]; len: number; seg: number[] };

export function mkPath(pts: Pt[]): Path {
  const seg: number[] = [0];
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(len);
  }
  return { pts, len, seg };
}

export function at(p: Path, s: number): Pt {
  for (let i = 1; i < p.pts.length; i++) {
    if (s <= p.seg[i]) {
      const f = (s - p.seg[i - 1]) / (p.seg[i] - p.seg[i - 1] || 1);
      return {
        x: p.pts[i - 1].x + (p.pts[i].x - p.pts[i - 1].x) * f,
        y: p.pts[i - 1].y + (p.pts[i].y - p.pts[i - 1].y) * f,
      };
    }
  }
  return p.pts[p.pts.length - 1];
}

/** Standard title block drawn at the top-left of a figure. Returns its height. */
export function titleBlock(
  ctx: CanvasRenderingContext2D,
  ink: Ink,
  x: number,
  y: number,
  o: { k: string; sub?: string; line?: string; narrow: boolean; maxW: number }
) {
  const ks = o.narrow ? 10 : 10.5;
  let yy = y + ks;
  key(ctx, ink, o.k, x, yy, { color: ink.accent, size: ks });
  if (o.sub) {
    for (const s of wrap(ctx, ink, o.sub, o.maxW, o.narrow ? 11 : 11.5)) {
      yy += o.narrow ? 15 : 16;
      text(ctx, ink, s, x, yy, {
        size: o.narrow ? 11 : 11.5,
        color: ink.muted,
      });
    }
  }
  if (o.line) {
    const ds = o.narrow ? 19 : 24;
    for (const s of wrap(ctx, ink, o.line, o.maxW, ds, 'italic')) {
      yy += ds * 1.15;
      text(ctx, ink, s, x, yy, { size: ds, font: 'italic', color: ink.ink });
    }
  }
  return yy - y;
}

/** Big serif figure where '+' is set in the mono (the Didone plus is a hairline). */
export function bigNum(
  ctx: CanvasRenderingContext2D,
  ink: Ink,
  s: string,
  x: number,
  y: number,
  o: { size: number; color: string; align?: 'left' | 'right' }
) {
  const parts = s.split(/(\+)/).filter(Boolean);
  const widths = parts.map((p) =>
    p === '+'
      ? measure(ctx, ink, '+', o.size * 0.62) + 2
      : measure(ctx, ink, p, o.size, 'serif')
  );
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = o.align === 'right' ? x - total : x;
  parts.forEach((p, i) => {
    if (p === '+')
      text(ctx, ink, '+', cx + 1, y - o.size * 0.08, {
        size: o.size * 0.62,
        color: o.color,
      });
    else
      text(ctx, ink, p, cx, y, { size: o.size, font: 'serif', color: o.color });
    cx += widths[i];
  });
}
