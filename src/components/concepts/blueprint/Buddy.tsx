'use client';

import { useEffect, useRef, useState } from 'react';
import s from './blueprint.module.css';

/* Divi, a pair of drafting dividers with a pencil leg.
   Desktop: trails the cursor on its needle; point at a balloon and it walks
   over and scribes a ring round it. Touch / reduced motion: it sits docked in
   the title bar and talks when tapped. */

const L = 44; // leg length, px
const HX = 22; // hinge position inside the svg
const HY = 10;

export const TAP_LINES = [
  'Dividers, technically. I measure things.',
  'Every sheet has a CHK box. Initial all seven.',
  'Item 6 is twelve standoffs, not twelve robots.',
  'Tap a balloon. I’ll hold the note.',
];

function Compass({
  legA,
  legB,
  blink,
}: {
  legA: number;
  legB: number;
  blink: boolean;
}) {
  // legA: needle leg angle from vertical (deg, negative = left); legB: pencil leg
  const tip = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    return [HX + Math.sin(r) * L, HY + Math.cos(r) * L];
  };
  const [ax, ay] = tip(legA);
  const [bx, by] = tip(legB);
  const mid = (deg: number, k: number) => {
    const r = (deg * Math.PI) / 180;
    return [HX + Math.sin(r) * L * k, HY + Math.cos(r) * L * k];
  };
  const [pax, pay] = mid(legB, 0.72);
  return (
    <svg className={s.buddySvg} viewBox="0 0 44 60" aria-hidden="true">
      {/* handle + hinge, with a face */}
      <path className={s.buddyInk} d={`M${HX} ${HY - 9} V${HY - 3}`} />
      <circle className={s.buddyHead} cx={HX} cy={HY} r={6.5} />
      <g className={blink ? s.buddyBlink : undefined}>
        <circle className={s.buddyEye} cx={HX - 2.4} cy={HY - 0.6} r={1.05} />
        <circle className={s.buddyEye} cx={HX + 2.4} cy={HY - 0.6} r={1.05} />
      </g>
      {/* needle leg */}
      <path className={s.buddyInk} d={`M${HX} ${HY + 5} L${ax} ${ay}`} />
      <path
        className={s.buddyNeedle}
        d={`M${mid(legA, 0.86).join(' ')} L${ax} ${ay}`}
      />
      {/* pencil leg with lead */}
      <path className={s.buddyInk} d={`M${HX} ${HY + 5} L${pax} ${pay}`} />
      <path className={s.buddyPencil} d={`M${pax} ${pay} L${bx} ${by}`} />
    </svg>
  );
}

export default function Buddy({
  line,
  docked,
  onTap,
}: {
  line: string | null;
  docked: boolean;
  onTap: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGSVGElement>(null);
  const [legs, setLegs] = useState({ a: -14, b: 14 });
  const [blink, setBlink] = useState(false);

  // blink now and then
  useEffect(() => {
    let t = 0;
    const loop = () => {
      t = window.setTimeout(
        () => {
          setBlink(true);
          window.setTimeout(() => setBlink(false), 160);
          loop();
        },
        2600 + Math.random() * 3200
      );
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);

  // follow the cursor (desktop, motion OK)
  useEffect(() => {
    if (docked) return;
    const node = el.current;
    if (!node) return;
    let x = window.innerWidth - 120;
    let y = window.innerHeight - 140;
    let tx = x;
    let ty = y;
    let vx = 0;
    let raf = 0;
    let ringing: {
      cx: number;
      cy: number;
      R: number;
      t0: number | null;
    } | null = null;
    let lastLegs = '';
    const apply = (a: number, b: number) => {
      const key = `${a.toFixed(1)}|${b.toFixed(1)}`;
      if (key !== lastLegs) {
        lastLegs = key;
        setLegs({ a, b });
      }
    };
    const showRing = (cx: number, cy: number, R: number) => {
      const r = ring.current;
      if (!r) return;
      r.classList.remove(s.ringOn);
      r.style.transform = `translate3d(${cx - R - 4}px, ${cy - R - 4}px, 0)`;
      r.style.width = r.style.height = `${R * 2 + 8}px`;
      void r.getBoundingClientRect();
      r.classList.add(s.ringOn);
    };
    const clearRing = () => {
      ringing = null;
      ring.current?.classList.remove(s.ringOn);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const px = x;
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      vx = vx * 0.8 + (x - px) * 0.2;
      const dist = Math.hypot(tx - x, ty - y);
      let lean = Math.max(-26, Math.min(26, vx * 2.2));
      if (ringing && dist < 2.5) {
        // scribe: the pencil leg sweeps once round the needle
        if (ringing.t0 === null) {
          ringing.t0 = now;
          showRing(ringing.cx, ringing.cy, ringing.R);
        }
        const k = Math.min(1, (now - ringing.t0) / 900);
        const off = ringing.R * Math.cos(k * Math.PI * 2);
        const deg =
          (Math.asin(Math.max(-1, Math.min(1, off / L))) * 180) / Math.PI;
        apply(0, deg);
        lean = 0;
      } else {
        const spread = 12 + Math.min(14, Math.abs(vx) * 1.4);
        apply(-spread, spread);
      }
      node.style.transform = `translate3d(${x - HX}px, ${y - HY - L}px, 0) rotate(${lean}deg)`;
    };
    raf = requestAnimationFrame(frame);

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const b = (e.target as Element | null)?.closest?.('[data-balloon]');
      if (b) {
        const c = b.querySelector('[data-ring]') as SVGCircleElement | null;
        const r = (c ?? b).getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const R = Math.min(70, r.width / 2 + 7);
        if (
          !ringing ||
          Math.abs(ringing.cx - cx) > 1 ||
          Math.abs(ringing.cy - cy) > 1
        ) {
          clearRing();
          ringing = { cx, cy, R, t0: null };
        }
        tx = cx;
        ty = cy;
      } else {
        if (ringing) clearRing();
        tx = e.clientX + 26;
        ty = e.clientY + 38;
      }
    };
    const scroll = () => ringing && clearRing();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', scroll);
    };
  }, [docked]);

  if (docked) {
    return (
      <button
        type="button"
        className={s.buddyDock}
        onClick={onTap}
        aria-label="Divi the dividers. Tap for a tip."
      >
        <Compass legA={-14} legB={14} blink={blink} />
        {line && (
          <span className={s.speech} role="status">
            {line}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <svg
        ref={ring}
        className={s.ring}
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="46" pathLength={1} />
      </svg>
      <div ref={el} className={s.buddy} aria-hidden="true">
        <Compass legA={legs.a} legB={legs.b} blink={blink} />
        {line && <span className={s.speech}>{line}</span>}
      </div>
      {line && (
        <span className={s.srOnly} role="status">
          {line}
        </span>
      )}
    </>
  );
}
