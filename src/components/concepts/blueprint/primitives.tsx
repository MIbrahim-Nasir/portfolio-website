import type { ReactNode } from 'react';
import s from './blueprint.module.css';

/* Drafting primitives shared by every detail.
   Convention: anything with stroke draws on via DrawSVG, anything inside
   [data-fade] (arrowheads, hatching, chain lines, text) fades in after. */

export type Pt = [number, number];

const f = (n: number) => Math.round(n * 100) / 100;
export const pathOf = (pts: Pt[], close = false) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join(' ') +
  (close ? ' Z' : '');

/* ---------- arrowheads & arrows ---------- */

export function Arrowhead({
  at,
  from,
  size = 10,
}: {
  at: Pt;
  from: Pt;
  size?: number;
}) {
  const a = Math.atan2(at[1] - from[1], at[0] - from[0]);
  const w = size * 0.3;
  const bx = at[0] - Math.cos(a) * size;
  const by = at[1] - Math.sin(a) * size;
  const nx = -Math.sin(a) * w;
  const ny = Math.cos(a) * w;
  return (
    <polygon
      data-fade=""
      className={s.fillInk}
      points={`${f(at[0])},${f(at[1])} ${f(bx + nx)},${f(by + ny)} ${f(bx - nx)},${f(by - ny)}`}
    />
  );
}

export function Arrow({
  pts,
  start = false,
  end = true,
  className = s.ln,
  size,
}: {
  pts: Pt[];
  start?: boolean;
  end?: boolean;
  className?: string;
  size?: number;
}) {
  const n = pts.length;
  return (
    <g>
      <path className={className} d={pathOf(pts)} />
      {end && <Arrowhead at={pts[n - 1]} from={pts[n - 2]} size={size} />}
      {start && <Arrowhead at={pts[0]} from={pts[1]} size={size} />}
    </g>
  );
}

/* ---------- dimensions ---------- */

type DimProps = {
  a: Pt; // feature point 1
  b: Pt; // feature point 2
  offset: number; // perpendicular distance from feature to dimension line (signed)
  label: ReactNode;
  gap?: number; // extension line gap from the feature
  textSide?: 1 | -1;
  className?: string;
};

/** Aligned dimension between two points, extension lines, filled arrows, text over the line. */
export function Dim({
  a,
  b,
  offset,
  label,
  gap = 4,
  textSide = -1,
  className,
}: DimProps) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // normal pointing to the "offset" side
  const nx = -uy;
  const ny = ux;
  const sgn = Math.sign(offset) || 1;
  const pa: Pt = [a[0] + nx * offset, a[1] + ny * offset];
  const pb: Pt = [b[0] + nx * offset, b[1] + ny * offset];
  const over = 5 * sgn;
  let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (ang > 90 || ang < -90) ang += 180;
  const mx = (pa[0] + pb[0]) / 2;
  const my = (pa[1] + pb[1]) / 2;
  // text reads upright; "up" is the rotated (0,-1) vector
  const ar = (ang * Math.PI) / 180;
  const up: Pt = [Math.sin(ar), -Math.cos(ar)];
  const tOff = textSide < 0 ? 5 : -5;
  const tx = mx + up[0] * tOff;
  const ty = my + up[1] * tOff;
  return (
    <g className={className}>
      <path
        className={s.lnDim}
        d={pathOf([
          [a[0] + nx * gap * sgn, a[1] + ny * gap * sgn],
          [pa[0] + nx * over, pa[1] + ny * over],
        ])}
      />
      <path
        className={s.lnDim}
        d={pathOf([
          [b[0] + nx * gap * sgn, b[1] + ny * gap * sgn],
          [pb[0] + nx * over, pb[1] + ny * over],
        ])}
      />
      <path className={s.lnDim} d={pathOf([pa, pb])} />
      <Arrowhead at={pa} from={pb} size={9} />
      <Arrowhead at={pb} from={pa} size={9} />
      <text
        className={s.txV}
        x={f(tx)}
        y={f(ty)}
        textAnchor="middle"
        dominantBaseline={textSide < 0 ? 'auto' : 'hanging'}
        transform={`rotate(${f(ang)} ${f(tx)} ${f(ty)})`}
      >
        {label}
      </text>
    </g>
  );
}

/* ---------- leaders ---------- */

/** Leader: dot on the feature, line to a shoulder, label after the shoulder. */
export function Leader({
  pts,
  children,
  anchor = 'start',
  dot = true,
  className = s.txL,
  dy = -7,
}: {
  pts: Pt[];
  children?: ReactNode;
  anchor?: 'start' | 'end' | 'middle';
  dot?: boolean;
  className?: string;
  dy?: number;
}) {
  const last = pts[pts.length - 1];
  return (
    <g>
      <path className={s.lnThin} d={pathOf(pts)} />
      {dot && (
        <circle
          data-fade=""
          className={s.fillInk}
          cx={pts[0][0]}
          cy={pts[0][1]}
          r={2.6}
        />
      )}
      {children != null && (
        <text
          className={className}
          x={last[0]}
          y={last[1] + dy}
          textAnchor={anchor}
        >
          {children}
        </text>
      )}
    </g>
  );
}

/** Scalloped revision cloud around a rectangle (clockwise, bulges outward). */
export function revCloud(
  x: number,
  y: number,
  w: number,
  h: number,
  step = 16
) {
  const pts: Pt[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const L = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.round(L / step));
    for (let i = 0; i < n; i++)
      pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
  };
  edge(x, y, x + w, y);
  edge(x + w, y, x + w, y + h);
  edge(x + w, y + h, x, y + h);
  edge(x, y + h, x, y);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i <= pts.length; i++) {
    const p = pts[i % pts.length];
    const q = pts[i - 1];
    const r = Math.hypot(p[0] - q[0], p[1] - q[1]) * 0.62;
    d += ` A${f(r)} ${f(r)} 0 0 1 ${f(p[0])} ${f(p[1])}`;
  }
  return d;
}

export function RevTriangle({
  x,
  y,
  label,
  size = 22,
}: {
  x: number;
  y: number;
  label: string;
  size?: number;
}) {
  const h = size * 0.87;
  return (
    <g>
      <path
        className={s.lnChalk}
        d={pathOf(
          [
            [x, y - h * 0.66],
            [x + size / 2, y + h * 0.34],
            [x - size / 2, y + h * 0.34],
          ],
          true
        )}
      />
      <text
        data-fade=""
        className={s.txRev}
        x={x}
        y={y + h * 0.12}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>
    </g>
  );
}

/** Small cross mark (construction intersection / centre mark). */
export function Cross({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  return (
    <path
      className={s.lnThin}
      d={`M${x - r} ${y} H${x + r} M${x} ${y - r} V${y + r}`}
    />
  );
}

/* ---------- isometric helpers ---------- */

export type V3 = [number, number, number];
const C30 = Math.cos(Math.PI / 6);
const S30 = 0.5;

export const iso = (p: V3, o: Pt = [0, 0], k = 1): Pt => [
  o[0] + (p[0] - p[1]) * C30 * k,
  o[1] + ((p[0] + p[1]) * S30 - p[2]) * k,
];

/** Visible faces of an axis-aligned box seen from (+x,+y,+z). */
export function isoBox(min: V3, size: V3, o: Pt, k = 1) {
  const [x, y, z] = min;
  const [w, d, h] = size;
  const P = (a: number, b: number, c: number) => iso([a, b, c], o, k);
  const top = [
    P(x, y, z + h),
    P(x + w, y, z + h),
    P(x + w, y + d, z + h),
    P(x, y + d, z + h),
  ];
  const fx = [
    P(x + w, y, z),
    P(x + w, y + d, z),
    P(x + w, y + d, z + h),
    P(x + w, y, z + h),
  ];
  const fy = [
    P(x, y + d, z),
    P(x + w, y + d, z),
    P(x + w, y + d, z + h),
    P(x, y + d, z + h),
  ];
  return [pathOf(top, true), pathOf(fx, true), pathOf(fy, true)];
}

const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];

/** Cylinder silhouette: front cap (full), two tangent lines, far half of the back cap. */
export function isoCylinder(
  c: V3,
  axis: 'x' | 'y' | 'z',
  len: number,
  r: number,
  o: Pt,
  k = 1
) {
  const A: V3 = axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1];
  const U: V3 = axis === 'x' ? [0, 1, 0] : axis === 'y' ? [1, 0, 0] : [1, 0, 0];
  const W: V3 = axis === 'z' ? [0, 1, 0] : [0, 0, 1];
  const c1 = add3(c, mul3(A, len));
  // the cap nearer the viewer (1,1,1) is the front
  const front = A[0] + A[1] + A[2] > 0 ? c1 : c;
  const back = front === c1 ? c : c1;
  const ring = (ctr: V3, t: number) =>
    iso(
      add3(ctr, add3(mul3(U, r * Math.cos(t)), mul3(W, r * Math.sin(t)))),
      o,
      k
    );
  const N = 48;
  const frontPts: Pt[] = [];
  for (let i = 0; i < N; i++) frontPts.push(ring(front, (i / N) * Math.PI * 2));
  // tangent parameter: derivative parallel to projected axis
  const pc = iso([0, 0, 0], [0, 0], 1);
  const pr = (v: V3) => {
    const q = iso(v, [0, 0], 1);
    return [q[0] - pc[0], q[1] - pc[1]] as Pt;
  };
  const dA = pr(sub3(front, back));
  const pU = pr(U);
  const pW = pr(W);
  const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0];
  const t1 = Math.atan2(cross(pW, dA), cross(pU, dA));
  const t2 = t1 + Math.PI;
  // pick the back arc whose midpoint lies away from the front cap
  const mid = (t: number) => ring(back, t);
  const fC = iso(front, o, k);
  const bC = iso(back, o, k);
  const dir: Pt = [fC[0] - bC[0], fC[1] - bC[1]];
  const m1 = mid(t1 + Math.PI / 2);
  const away = (m1[0] - bC[0]) * dir[0] + (m1[1] - bC[1]) * dir[1] < 0;
  const arc: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = away ? t1 + (i / 24) * Math.PI : t1 - (i / 24) * Math.PI;
    arc.push(ring(back, t));
  }
  const sides = [
    pathOf([ring(front, t1), ring(back, t1)]),
    pathOf([ring(front, t2), ring(back, t2)]),
  ];
  return {
    front: pathOf(frontPts, true),
    back: pathOf(arc),
    sides,
    center: fC,
  };
}
