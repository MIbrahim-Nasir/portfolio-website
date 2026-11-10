import type { ReactNode, SVGProps } from 'react';
import type { Pt } from './motion';
import s from './interface.module.css';

const cx = (...c: (string | false | undefined)[]) =>
  c.filter(Boolean).join(' ');

/** The signal's path through a figure: a faint dotted guide, and the lit copy the scroll draws. */
export function Route({ d, name = 'main' }: { d: string; name?: string }) {
  return (
    <g aria-hidden>
      <path d={d} className={s.routeBase} />
      <path
        d={d}
        className={s.routeLit}
        data-route={name}
        style={{ strokeDasharray: '0 100000' }}
      />
    </g>
  );
}

/** The signal itself, which is also Bit, the page's buddy: a lit packet with eyes. Render last so it rides on top. */
export function Dot({ name = 'main' }: { name?: string }) {
  return (
    <g data-dot={name} className={s.dot} style={{ opacity: 0 }} aria-hidden>
      <circle r={13} className={s.dotHalo} />
      <circle r={6.5} className={s.dotCore} />
      <g className={s.eyes}>
        <ellipse cx={-2.3} cy={-0.8} rx={1.1} ry={1.6} />
        <ellipse cx={2.3} cy={-0.8} rx={1.1} ry={1.6} />
      </g>
    </g>
  );
}

/** Filled triangular arrowhead with its tip at `to`, pointing away from `from`. */
export function Head({
  from,
  to,
  size = 8,
  className,
}: {
  from: Pt;
  to: Pt;
  size?: number;
  className?: string;
}) {
  const a = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const w = size * 0.42;
  const bx = to[0] - Math.cos(a) * size;
  const by = to[1] - Math.sin(a) * size;
  const p = [
    [to[0], to[1]],
    [bx + Math.cos(a + Math.PI / 2) * w, by + Math.sin(a + Math.PI / 2) * w],
    [bx - Math.cos(a + Math.PI / 2) * w, by - Math.sin(a + Math.PI / 2) * w],
  ]
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  return <polygon points={p} className={cx(s.head, className)} />;
}

/** A polyline with an arrowhead on its last segment. */
export function Arrow({
  pts,
  className,
  head = 8,
  both = false,
  ...rest
}: {
  pts: Pt[];
  className?: string;
  head?: number;
  both?: boolean;
} & SVGProps<SVGGElement>) {
  const n = pts.length;
  return (
    <g className={className} {...rest}>
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        className={s.ln}
      />
      <Head from={pts[n - 2]} to={pts[n - 1]} size={head} />
      {both && <Head from={pts[1]} to={pts[0]} size={head} />}
    </g>
  );
}

/** Ground symbol (IEEE 315): lead, then three bars narrowing. */
export function Ground({
  x,
  y,
  lead = 0,
}: {
  x: number;
  y: number;
  lead?: number;
}) {
  return (
    <g className={s.ln}>
      {lead > 0 && <line x1={x} y1={y - lead} x2={x} y2={y} />}
      <line x1={x - 10} y1={y} x2={x + 10} y2={y} />
      <line x1={x - 6.5} y1={y + 4} x2={x + 6.5} y2={y + 4} />
      <line x1={x - 3} y1={y + 8} x2={x + 3} y2={y + 8} />
    </g>
  );
}

/** Junction dot: wires that touch here are connected. */
export function Junction({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={3} className={s.junction} />;
}

/** 45 degree section hatching (ISO 128 / ANSI31). */
export function HatchDef({ id, gap = 7 }: { id: string; gap?: number }) {
  return (
    <pattern
      id={id}
      width={gap}
      height={gap}
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <line x1={0} y1={0} x2={0} y2={gap} className={s.hatchLine} />
    </pattern>
  );
}

/** Graph node: a rounded box with a label and a sub-label. */
export function GNode({
  x,
  y,
  w,
  h = 50,
  label,
  sub,
  className,
  big = false,
  children,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  label: string;
  sub?: string;
  className?: string;
  big?: boolean;
  children?: ReactNode;
} & SVGProps<SVGGElement>) {
  return (
    <g className={className} {...rest}>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={big ? 10 : 7}
        className={s.box}
      />
      <text
        x={x}
        y={sub ? y - 2 : y + 5}
        textAnchor="middle"
        className={big ? s.tBig : s.tNode}
      >
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 16} textAnchor="middle" className={s.tSub}>
          {sub}
        </text>
      )}
      {children}
    </g>
  );
}

/** Dimension line with arrowheads both ends and a label (ISO 129 style, simplified). */
export function Dim({
  a,
  b,
  label,
  side = 'right',
  offset = 10,
}: {
  a: Pt;
  b: Pt;
  label: string;
  side?: 'right' | 'left' | 'above' | 'below';
  offset?: number;
}) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const tx =
    side === 'right' ? mx + offset : side === 'left' ? mx - offset : mx;
  const ty =
    side === 'above'
      ? my - offset
      : side === 'below'
        ? my + offset + 8
        : my + 5;
  const anchor =
    side === 'right' ? 'start' : side === 'left' ? 'end' : 'middle';
  return (
    <g>
      <line
        x1={a[0]}
        y1={a[1]}
        x2={b[0]}
        y2={b[1]}
        className={cx(s.ln, s.thin)}
      />
      <Head from={b} to={a} size={7} />
      <Head from={a} to={b} size={7} />
      <text x={tx} y={ty} textAnchor={anchor} className={s.tLab}>
        {label}
      </text>
    </g>
  );
}

export { cx };
