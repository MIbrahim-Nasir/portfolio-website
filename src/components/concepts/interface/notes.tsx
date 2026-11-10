'use client';

// Annotations that live on the drawings: cable tags, readouts and a bill of materials.
// They are SVG, so they scale and animate with the figure they describe.
import { useRef, useState, type ReactNode } from 'react';
import { useIsoLayoutEffect, type Pt } from './motion';
import { cx } from './svg';
import s from './interface.module.css';

const MAIN = 15.5; // main line, viewBox units
const SUB = 13.5;
const PAD_X = 9;
const PAD_Y = 7;
const HOLE = 10;

/** measure the widest text in a group once fonts are in; falls back to an estimate */
function useWidth(est: number) {
  const ref = useRef<SVGGElement>(null);
  const [w, setW] = useState(est);
  useIsoLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    const m = () => {
      let max = 0;
      g.querySelectorAll<SVGTextElement>('text[data-m]').forEach((t) => {
        max = Math.max(max, t.getComputedTextLength());
      });
      if (max > 0) setW(Math.ceil(max));
    };
    m();
    let alive = true;
    document.fonts?.ready.then(() => alive && m());
    return () => {
      alive = false;
    };
  }, []);
  return [ref, w] as const;
}

/**
 * A cable tag: a punched label tied to the thing it names by a leader.
 * lines[0] is the name, the rest are values. `pin` is the point the leader touches.
 */
export function Tag({
  x,
  y,
  lines,
  anchor = 'start',
  pin,
  k,
  hole = true,
  quiet = false,
}: {
  x: number;
  y: number;
  lines: string[];
  anchor?: 'start' | 'end' | 'middle';
  pin?: Pt;
  k?: string;
  hole?: boolean;
  quiet?: boolean;
}) {
  const est = Math.max(
    ...lines.map((l, i) => l.length * (i ? SUB : MAIN) * 0.48)
  );
  const [ref, tw] = useWidth(est);
  const left = PAD_X + (hole ? HOLE : 0);
  const w = tw + left + PAD_X;
  const h = PAD_Y * 2 + MAIN + 2 + (lines.length - 1) * (SUB + 4);
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  const y0 = y - h / 2;

  let lead: Pt | null = null;
  if (pin) {
    const [px, py] = pin;
    if (px < x0) lead = [x0, Math.max(y0 + 6, Math.min(y0 + h - 6, py))];
    else if (px > x0 + w)
      lead = [x0 + w, Math.max(y0 + 6, Math.min(y0 + h - 6, py))];
    else lead = [px, py < y0 ? y0 : y0 + h];
  }

  return (
    <g ref={ref} data-k={k} className={cx(s.tag, quiet && s.tagQuiet)}>
      {pin && lead && (
        <g className={s.tagLead}>
          <line x1={lead[0]} y1={lead[1]} x2={pin[0]} y2={pin[1]} />
          <circle cx={pin[0]} cy={pin[1]} r={2.6} />
        </g>
      )}
      <rect x={x0} y={y0} width={w} height={h} rx={3.5} className={s.tagBody} />
      {hole && (
        <circle cx={x0 + 9} cy={y0 + h / 2} r={2.4} className={s.tagHole} />
      )}
      {lines.map((l, i) => (
        <text
          key={i}
          data-m
          x={x0 + left}
          y={y0 + PAD_Y + MAIN - 2 + (i ? 2 + i * (SUB + 4) : 0)}
          className={i ? s.tagSub : s.tagMain}
        >
          {l}
        </text>
      ))}
    </g>
  );
}

/** A big measured value, as a meter would show it, with what it measures underneath. */
export function Metric({
  x,
  y,
  value,
  label,
  anchor = 'start',
  k,
  size = 34,
}: {
  x: number;
  y: number;
  value: string;
  label: string[];
  anchor?: 'start' | 'end' | 'middle';
  k?: string;
  size?: number;
}) {
  return (
    <g data-k={k} className={s.metric}>
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        className={s.metricV}
        style={{ fontSize: size }}
      >
        {value}
      </text>
      {label.map((l, i) => (
        <text
          key={i}
          x={x}
          y={y + 19 + i * 17}
          textAnchor={anchor}
          className={s.metricL}
        >
          {l}
        </text>
      ))}
    </g>
  );
}

/** Bill of materials block: the tools this domain is built from, one row per line. */
export function BomBlock({
  x,
  y,
  w,
  rows,
  title = 'BOM',
  k,
}: {
  x: number;
  y: number;
  w: number;
  rows: string[];
  title?: string;
  k?: string;
}) {
  const RH = 21;
  const h = 26 + rows.length * RH + 6;
  return (
    <g data-k={k} className={s.bomBlock}>
      <rect x={x} y={y} width={w} height={h} rx={3} className={s.bomBox} />
      <line x1={x} y1={y + 24} x2={x + w} y2={y + 24} className={s.bomRule} />
      <text x={x + 10} y={y + 17} className={s.bomTitle}>
        {title}
      </text>
      {rows.map((r, i) => (
        <text key={i} x={x + 10} y={y + 24 + 16 + i * RH} className={s.bomRow}>
          {r}
        </text>
      ))}
    </g>
  );
}

/** A stamp, as on a drawing that has been signed off. */
export function Stamp({
  x,
  y,
  lines,
  rotate = -6,
  k,
}: {
  x: number;
  y: number;
  lines: string[];
  rotate?: number;
  k?: string;
}) {
  const est = Math.max(...lines.map((l) => l.length * 13 * 0.56));
  const [ref, tw] = useWidth(est);
  const w = tw + 22;
  const h = 14 + lines.length * 17;
  return (
    <g
      ref={ref}
      data-k={k}
      className={s.stamp}
      transform={`rotate(${rotate} ${x} ${y})`}
    >
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3} />
      <rect
        x={x - w / 2 + 3}
        y={y - h / 2 + 3}
        width={w - 6}
        height={h - 6}
        rx={2}
      />
      {lines.map((l, i) => (
        <text
          key={i}
          data-m
          x={x}
          y={y - h / 2 + 20 + i * 17}
          textAnchor="middle"
        >
          {l}
        </text>
      ))}
    </g>
  );
}

/** An SVG link with a generous invisible hit area (tap targets stay at least 40 px on a phone). */
export function HitLink({
  href,
  x,
  y,
  w,
  h,
  label,
  children,
  external = false,
}: {
  href: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className={s.svgLink}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      <rect x={x} y={y} width={w} height={h} className={s.hit} />
      {children}
    </a>
  );
}

/** reveal tags as the signal reaches them */
export function popIn(
  tl: gsap.core.Timeline,
  els: gsap.TweenTarget,
  at: number,
  dur = 0.035
) {
  tl.fromTo(
    els,
    { opacity: 0 },
    { opacity: 1, duration: dur },
    Math.max(0, at)
  );
}
