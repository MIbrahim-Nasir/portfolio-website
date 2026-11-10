'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import styles from './axioms.module.css';

// The page's companion: the pen nib that draws the figures. It wanders the
// left margin on wide screens and the running head on narrow ones (so it
// never sits on content), turns to look at the cursor, gets shy if you get
// too close, drips a little ink, and says one line when tapped.

const LINES = [
  'Hello. I’m the nib. I draw the figures.',
  'Psst. Fig. III hides an eighth axiom.',
  'Drag K until it lands. No overshoot.',
  'Or type the numeral. Quietly.',
];
const SOLVED = [
  'There it is. The eighth.',
  'Eight axioms. You’ve read them all.',
  'Email’s at the bottom.',
];
const IDLE = 'Still here. Still drawing.';

const FRAME = 1120; // content width; margin mode needs room either side
const HEAD = 52;

type Drop = { id: number; x: number; y: number };

export default function Nib({
  bounds,
  solved,
}: {
  bounds: RefObject<HTMLElement | null>;
  solved: boolean;
}) {
  const btn = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState<string | null>(null);
  const [mode, setMode] = useState<'margin' | 'header'>('header');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [joy, setJoy] = useState(0);
  const said = useRef(0);
  const hide = useRef(0);
  const solvedRef = useRef(solved);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const say = (s: string, ms = 3800) => {
    setLine(s);
    window.clearTimeout(hide.current);
    hide.current = window.setTimeout(() => setLine(null), ms);
  };

  useEffect(() => {
    if (solved && !solvedRef.current) {
      setJoy((j) => j + 1);
      say(SOLVED[0], 4600);
    }
    solvedRef.current = solved;
  }, [solved]);

  useEffect(() => {
    const el = btn.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let t = Math.random() * 10;
    let last = 0;
    let x = -100,
      y = -100,
      ang = 0;
    let ptr: { x: number; y: number } | null = null;
    let lastScroll = window.scrollY;
    let vel = 0;
    let idle = 0;
    let idleSaid = false;
    let dropT = 0;
    let dropId = 0;
    let m: 'margin' | 'header' = 'header';

    const pickMode = () => {
      m = (window.innerWidth - FRAME) / 2 >= 104 ? 'margin' : 'header';
      setMode(m);
    };
    pickMode();

    const target = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (m === 'margin') {
        const mw = (vw - FRAME) / 2;
        let tx = mw * 0.5 + Math.sin(t * 0.37) * Math.min(22, mw * 0.18);
        let ty = vh * (0.5 + 0.2 * Math.sin(t * 0.11)) - vel * 0.06;
        let ta = Math.sin(t * 0.6) * 6 + vel * 0.04;
        if (ptr) {
          const dx = ptr.x - x;
          const dy = ptr.y - y;
          const d = Math.hypot(dx, dy);
          if (d < 220) {
            ta = ((Math.atan2(dy, dx) - Math.PI / 2) * 180) / Math.PI;
            if (d < 56) {
              // shy: hop away
              tx = x - (dx / (d || 1)) * 40;
              ty = y - (dy / (d || 1)) * 40;
            } else {
              tx += dx * 0.18;
              ty += dy * 0.18;
            }
          }
        }
        return {
          x: Math.max(22, Math.min(mw - 22, tx)),
          y: Math.max(HEAD + 40, Math.min(vh - 40, ty)),
          a: Math.max(-55, Math.min(55, ta)),
        };
      }
      const r = bounds.current?.getBoundingClientRect();
      const x0 = r ? r.left + 22 : vw * 0.35;
      const x1 = r ? r.right - 22 : vw * 0.6;
      const mid = (x0 + x1) / 2;
      const half = Math.max(0, (x1 - x0) / 2);
      return {
        x: mid + half * Math.sin(t * 0.21),
        y: HEAD / 2,
        a: Math.cos(t * 0.21) * -14 + Math.max(-30, Math.min(30, vel * 0.05)),
      };
    };

    const place = () => {
      el.style.transform = `translate3d(${x - 22}px, ${y - 22}px, 0) rotate(${ang}deg)`;
      const b = bubble.current;
      if (b && modeRef.current === 'margin') {
        const mw = (window.innerWidth - FRAME) / 2;
        b.style.maxWidth = `${Math.max(96, mw - 16)}px`;
        b.style.transform = `translate3d(8px, ${y + 30}px, 0)`;
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      t += dt;
      const sy = window.scrollY;
      const v = (sy - lastScroll) / dt;
      lastScroll = sy;
      vel += (v - vel) * Math.min(1, dt * 4);
      if (Math.abs(v) > 30) idle = 0;
      idle += dt;
      if (idle > 28 && !idleSaid) {
        idleSaid = true;
        say(IDLE);
      }
      const g = target();
      if (x < -50) {
        x = g.x;
        y = g.y;
      }
      const k = 1 - Math.exp(-dt * (m === 'margin' ? 2.6 : 1.6));
      const px0 = x,
        py0 = y;
      x += (g.x - x) * k;
      y += (g.y - y) * k;
      ang += (g.a - ang) * Math.min(1, dt * 5);
      place();
      // a drop of ink now and then, while moving in the margin
      if (m === 'margin') {
        dropT += Math.hypot(x - px0, y - py0);
        if (dropT > 260) {
          dropT = 0;
          const id = ++dropId;
          const d = { id, x, y: y + 24 + window.scrollY };
          setDrops((ds) => [...ds.slice(-5), d]);
          window.setTimeout(
            () => setDrops((ds) => ds.filter((q) => q.id !== id)),
            3600
          );
        }
      }
    };

    const still = () => {
      const g = target();
      x = g.x;
      y = m === 'margin' ? window.innerHeight * 0.62 : g.y;
      ang = 0;
      place();
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (mq.matches) {
        still();
        return;
      }
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      ptr = { x: e.clientX, y: e.clientY };
      idle = 0;
    };
    const onLeave = () => (ptr = null);
    const onResize = () => {
      pickMode();
      if (mq.matches) still();
    };
    const onScrollStill = () => mq.matches && still();

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScrollStill, { passive: true });
    mq.addEventListener('change', start);
    start();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScrollStill);
      mq.removeEventListener('change', start);
      window.clearTimeout(hide.current);
    };
  }, [bounds]);

  const onClick = () => {
    const pool = solvedRef.current ? SOLVED.slice(1) : LINES;
    say(pool[said.current % pool.length]);
    said.current++;
    setJoy((j) => j + 1);
  };

  return (
    <>
      {drops.map((d) => (
        <span
          key={d.id}
          className={styles.inkDrop}
          style={{ left: d.x - 2, top: d.y }}
          aria-hidden
        />
      ))}
      <button
        ref={btn}
        type="button"
        className={`${styles.nib} ${mode === 'header' ? styles.nibHead : ''}`}
        onClick={onClick}
        aria-label="The nib, this page’s pen. Tap for a hint."
      >
        <svg
          key={joy}
          className={joy ? styles.nibJoy : undefined}
          viewBox="0 0 28 50"
          width="28"
          height="50"
          aria-hidden
        >
          <rect
            x="3.5"
            y="0.5"
            width="21"
            height="5"
            rx="1.2"
            className={styles.nibCollar}
          />
          <path
            d="M4.5 6.5 H23.5 V12 C23.5 20 19.5 28 14 44 C8.5 28 4.5 20 4.5 12 Z"
            className={styles.nibBody}
          />
          <circle cx="14" cy="22" r="2.3" className={styles.nibHole} />
          <path d="M14 24.5 V43" className={styles.nibSlit} />
          <g className={styles.nibEyes}>
            <circle cx="10" cy="14" r="1.6" />
            <circle cx="18" cy="14" r="1.6" />
          </g>
          <circle cx="14" cy="47" r="2" className={styles.nibInk} />
        </svg>
      </button>
      <div
        ref={bubble}
        role="status"
        aria-live="polite"
        className={`${styles.nibSay} ${mode === 'header' ? styles.nibSayHead : ''} ${line ? styles.nibSayOn : ''}`}
      >
        {line}
      </div>
    </>
  );
}
