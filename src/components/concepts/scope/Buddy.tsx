'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { BUDDY } from './channels';
import styles from './scope.module.css';

/** Ask the probe tip to say something. */
export function say(text: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('scope:say', { detail: text }));
}

type Pos = { x: number; y: number };

const TARGETS = 'button, [role="slider"], a, [data-clip]';

/**
 * TIP: a small scope probe with a face. On a mouse it clips its hook onto
 * whatever you point at; on touch it stays in its slot on the bezel lip.
 */
export default function Buddy({
  rootRef,
  reduced,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  reduced: boolean;
}) {
  const meRef = useRef<HTMLDivElement>(null);
  const pupils = useRef<SVGGElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [clipped, setClipped] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  const [flip, setFlip] = useState(false);
  const lineTimer = useRef(0);
  const homeTimer = useRef(0);
  const atHome = useRef(true);
  const lastContact = useRef(0);
  const posRef = useRef<Pos | null>(null);

  const place = useCallback((p: Pos) => {
    posRef.current = p;
    setPos(p);
    setFlip(p.x < 240);
  }, []);

  const goHome = useCallback(() => {
    const root = rootRef.current;
    const home = root?.querySelector<HTMLElement>('[data-buddy-home]');
    if (!root || !home) return;
    const r = root.getBoundingClientRect();
    const h = home.getBoundingClientRect();
    atHome.current = true;
    setClipped(false);
    place({ x: h.left + h.width / 2 - r.left, y: h.bottom - r.top - 2 });
  }, [place, rootRef]);

  const speak = useCallback((text: string) => {
    setLine(text);
    window.clearTimeout(lineTimer.current);
    lineTimer.current = window.setTimeout(() => setLine(null), 3600);
  }, []);

  // home position, kept fresh
  useEffect(() => {
    goHome();
    const onResize = () => {
      if (atHome.current) goHome();
    };
    const ro = new ResizeObserver(onResize);
    if (rootRef.current) ro.observe(rootRef.current);
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [goHome, rootRef]);

  // lines from the rest of the bench
  useEffect(() => {
    const onSay = (e: Event) => speak((e as CustomEvent<string>).detail);
    window.addEventListener('scope:say', onSay);
    const greet = window.setTimeout(() => speak(BUDDY.greet), 1800);
    return () => {
      window.removeEventListener('scope:say', onSay);
      window.clearTimeout(greet);
      window.clearTimeout(lineTimer.current);
    };
  }, [speak]);

  // idle hint, once
  useEffect(() => {
    let idle = 0;
    let done = false;
    const arm = () => {
      window.clearTimeout(idle);
      if (done) return;
      idle = window.setTimeout(() => {
        done = true;
        speak(BUDDY.hint);
      }, 22000);
    };
    arm();
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, [speak]);

  // clip onto hovered controls (mouse / pen only)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

    const onOver = (e: PointerEvent) => {
      if (!fine.matches || e.pointerType === 'touch') return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(TARGETS);
      if (!el || !root.contains(el) || meRef.current?.contains(el)) return;
      window.clearTimeout(homeTimer.current);
      const r = root.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      atHome.current = false;
      setClipped(true);
      place({
        x:
          b.left +
          Math.min(b.width - 10, Math.max(10, b.width * 0.72)) -
          r.left,
        y: b.top - r.top + 5,
      });
      if (
        el.closest('[data-contact]') &&
        performance.now() - lastContact.current > 12000
      ) {
        lastContact.current = performance.now();
        speak(BUDDY.contact);
      }
    };
    const onOut = (e: PointerEvent) => {
      const to = e.relatedTarget as Element | null;
      if (to && to.closest(TARGETS) && root.contains(to)) return;
      window.clearTimeout(homeTimer.current);
      homeTimer.current = window.setTimeout(goHome, 1400);
    };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const me = meRef.current;
        const g = pupils.current;
        if (!me || !g) return;
        const b = me.getBoundingClientRect();
        const dx = e.clientX - (b.left + b.width / 2);
        const dy = e.clientY - (b.top + b.height * 0.35);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 160);
        g.setAttribute(
          'transform',
          `translate(${((dx / d) * 1.3 * k).toFixed(2)} ${((dy / d) * 1.1 * k).toFixed(2)})`
        );
      });
    };
    root.addEventListener('pointerover', onOver);
    root.addEventListener('pointerout', onOut);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      root.removeEventListener('pointerover', onOver);
      root.removeEventListener('pointerout', onOut);
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      window.clearTimeout(homeTimer.current);
    };
  }, [goHome, place, rootRef, speak]);

  if (!pos) return null;

  return (
    <div
      ref={meRef}
      className={styles.buddy}
      data-clipped={clipped || undefined}
      data-reduced={reduced || undefined}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      {line ? (
        <p
          className={styles.bubble}
          data-flip={flip || undefined}
          role="status"
        >
          {line}
        </p>
      ) : (
        <p className={styles.srOnly} role="status" />
      )}
      <button
        type="button"
        className={styles.buddyBody}
        aria-label="Probe tip, the bench assistant. Tap for a hint."
        onClick={() => speak(BUDDY.hint)}
      >
        <svg viewBox="0 0 34 62" width="30" height="55" aria-hidden="true">
          <path className={styles.buddyCable} d="M17 13 C17 6 24 5 27 1" />
          <rect
            x="7.5"
            y="11"
            width="19"
            height="31"
            rx="8.5"
            className={styles.buddyShell}
          />
          <path d="M10 33 H24 M10 36 H24" className={styles.buddyGrip} />
          <g className={styles.buddyEyes}>
            <circle cx="13.4" cy="21.5" r="3.4" fill="#fbfaf6" />
            <circle cx="20.6" cy="21.5" r="3.4" fill="#fbfaf6" />
            <g ref={pupils}>
              <circle cx="13.6" cy="21.8" r="1.6" fill="#1e1d1b" />
              <circle cx="20.8" cy="21.8" r="1.6" fill="#1e1d1b" />
            </g>
          </g>
          <path
            d="M14.6 27.4 Q17 29.4 19.4 27.4"
            className={styles.buddyMouth}
          />
          <rect
            x="7.5"
            y="39"
            width="19"
            height="4.5"
            rx="1.5"
            className={styles.buddyBand}
          />
          <path
            d="M10.5 43.5 H23.5 L19.4 51.5 H14.6 Z"
            className={styles.buddyNose}
          />
          <path
            d="M17 51.5 V56 Q17 60 20.4 60 Q23.6 60 23.6 56.6"
            className={styles.buddyHook}
          />
        </svg>
      </button>
    </div>
  );
}
