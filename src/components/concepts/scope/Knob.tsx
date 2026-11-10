'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './scope.module.css';

// Round SVG coordinates so server and client print the same numbers (hydration).
const r2 = (v: number) => Math.round(v * 100) / 100;

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  /** Called once per detent the knob moves through. */
  onDetent?: () => void;
  size?: number;
  /** Total rotation in degrees. */
  sweep?: number;
  /** Printed legend per detent (detented knobs). */
  legends?: string[];
  /** Number of unlabeled ticks to print (continuous knobs). */
  ticks?: number;
  valueText?: (v: number) => string;
  cap?: 'dark' | 'orange' | 'putty';
  /** px of pointer travel per step */
  pxPerStep?: number;
  step?: number;
  className?: string;
};

export default function Knob({
  label,
  value,
  min,
  max,
  onChange,
  onDetent,
  size = 88,
  sweep = 270,
  legends,
  ticks = 11,
  valueText,
  cap = 'dark',
  pxPerStep = 14,
  step = 1,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const bumpRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ x: 0, y: 0, v: 0, last: 0, active: false });
  const wheelAcc = useRef(0);
  const live = useRef({ value, min, max, step, onChange, onDetent });

  useEffect(() => {
    live.current = { value, min, max, step, onChange, onDetent };
  });

  const range = max - min;
  const frac = range > 0 ? (value - min) / range : 0;
  const angle = -sweep / 2 + frac * sweep;

  const bump = (dir: number) => {
    const el = bumpRef.current;
    if (!el || typeof el.animate !== 'function') return;
    el.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: `rotate(${dir * 3.5}deg)` },
        { transform: 'rotate(0deg)' },
      ],
      { duration: 180, easing: 'cubic-bezier(.3,1.6,.5,1)' }
    );
  };

  const commit = (next: number, from: number) => {
    const L = live.current;
    const snapped = Math.round(next / L.step) * L.step;
    const v = Math.min(L.max, Math.max(L.min, snapped));
    if (v !== from) {
      L.onChange(v);
      L.onDetent?.();
      return v;
    }
    if (snapped > L.max) bump(1);
    else if (snapped < L.min) bump(-1);
    return from;
  };

  // Non-passive wheel so the page does not scroll while turning.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAcc.current += e.deltaY + e.deltaX;
      const threshold = 40;
      if (Math.abs(wheelAcc.current) >= threshold) {
        const dir = wheelAcc.current > 0 ? -1 : 1;
        wheelAcc.current = 0;
        const L = live.current;
        commit(L.value + dir * L.step, L.value);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus({ preventScroll: true });
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      v: value,
      last: value,
      active: true,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const delta = d.y - e.clientY + (e.clientX - d.x);
    const next = d.v + (delta / pxPerStep) * step;
    d.last = commit(next, d.last);
  };

  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current.active = false;
    setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const big = Math.max(step, Math.round(range / 10 / step) * step);
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        next = value + step;
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        next = value - step;
        break;
      case 'PageUp':
        next = value + big;
        break;
      case 'PageDown':
        next = value - big;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
    }
    if (next === null) return;
    e.preventDefault();
    commit(next, value);
  };

  // Printed scale around the knob
  const pad = legends ? Math.max(26, size * 0.32) : 14;
  const outer = size + pad * 2;
  const c = outer / 2;
  const rTick0 = size / 2 + 4;
  const rTick1 = size / 2 + 9;
  const rLabel = size / 2 + 9 + (legends ? Math.max(11, size * 0.13) : 0);
  const n = legends ? legends.length : ticks;
  const marks = Array.from({ length: n }, (_, i) => {
    const a =
      ((-sweep / 2 + (n > 1 ? (i / (n - 1)) * sweep : 0)) * Math.PI) / 180;
    const sx = Math.sin(a);
    const sy = -Math.cos(a);
    return { i, sx, sy };
  });
  const activeIdx = legends ? Math.round(frac * (n - 1)) : -1;

  const cssVars = {
    '--knob': `${size}px`,
    '--outer': `${outer}px`,
  } as CSSProperties;

  return (
    <div className={`${styles.knobWrap} ${className ?? ''}`} style={cssVars}>
      <div className={styles.knobStage} style={{ width: outer, height: outer }}>
        <svg
          className={styles.knobScale}
          width={outer}
          height={outer}
          aria-hidden="true"
        >
          {marks.map(({ i, sx, sy }) => (
            <line
              key={i}
              x1={r2(c + sx * rTick0)}
              y1={r2(c + sy * rTick0)}
              x2={r2(
                c +
                  sx * (i === 0 || i === n - 1 || legends ? rTick1 : rTick1 - 2)
              )}
              y2={r2(
                c +
                  sy * (i === 0 || i === n - 1 || legends ? rTick1 : rTick1 - 2)
              )}
              className={i === activeIdx ? styles.tickOn : styles.tick}
            />
          ))}
          {legends &&
            marks.map(({ i, sx, sy }) => (
              <text
                key={`l${i}`}
                x={r2(c + sx * rLabel)}
                y={r2(c + sy * rLabel)}
                className={
                  i === activeIdx ? styles.scaleTextOn : styles.scaleText
                }
                textAnchor="middle"
                dominantBaseline="central"
              >
                {legends[i]}
              </text>
            ))}
        </svg>
        <div
          ref={ref}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={valueText ? valueText(value) : undefined}
          aria-orientation="vertical"
          className={styles.knob}
          data-cap={cap}
          data-dragging={dragging || undefined}
          style={{ width: size, height: size }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={end}
          onPointerCancel={end}
          onKeyDown={onKeyDown}
        >
          <div className={styles.knobShadow} />
          <div ref={bumpRef} className={styles.knobBump}>
            <div
              className={styles.knobRot}
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div className={styles.knobKnurl} />
              <div className={styles.knobFace} />
              <div className={styles.knobPointer} />
            </div>
          </div>
          <div className={styles.knobSheen} />
        </div>
      </div>
      <div className={styles.knobLabel} aria-hidden="true">
        {label}
      </div>
    </div>
  );
}
