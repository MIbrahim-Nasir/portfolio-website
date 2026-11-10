'use client';

import { useEffect, useRef } from 'react';
import { film } from './store';

// A crosshair that reads out where you are in the scene, and names what a click will do.
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const coords = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches)
      return;
    document.documentElement.classList.add('has-cursor');
    let x = innerWidth / 2,
      y = innerHeight / 2,
      rx = x,
      ry = y,
      scale = 1,
      target = 1,
      raf = 0;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = (e.target as HTMLElement).closest<HTMLElement>(
        'a,button,[data-cursor]'
      );
      target = t ? 2.6 : 1;
      if (label.current)
        label.current.textContent = t ? t.dataset.cursor || 'open' : '';
    };
    const down = () => (target *= 0.7);
    const up = () => (target /= 0.7);
    const tick = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      scale += (target - scale) * 0.18;
      if (dot.current)
        dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (ring.current)
        ring.current.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${scale})`;
      if (coords.current)
        coords.current.textContent = `${film.mx >= 0 ? '+' : ''}${film.mx.toFixed(3)}  ${film.my >= 0 ? '+' : ''}${film.my.toFixed(3)}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[90] hidden [@media(hover:hover)_and_(pointer:fine)]:block"
      aria-hidden
    >
      <div
        ref={ring}
        className="border-sand/45 absolute top-0 left-0 -mt-4 -ml-4 h-8 w-8 rounded-full border mix-blend-difference"
      />
      <div ref={dot} className="absolute top-0 left-0">
        <span className="bg-ember absolute -mt-[2px] -ml-[2px] block h-1 w-1 rounded-full" />
        <span
          ref={label}
          className="mono text-sand absolute top-5 left-5 text-[10px] tracking-[0.18em] uppercase"
        />
        <span
          ref={coords}
          className="mono text-dune/80 absolute top-5 left-5 mt-4 text-[9px] whitespace-pre tabular-nums"
        />
      </div>
    </div>
  );
}
