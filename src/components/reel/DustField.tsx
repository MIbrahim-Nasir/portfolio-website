'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

type Speck = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
};

export default function DustField() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = canvas.current;
    if (!el || reduced) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const mouse = { x: 0.5, y: 0.5 };
    let specks: Speck[] = [];

    const resize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      specks = Array.from({ length: 70 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -Math.random() * 0.18 - 0.04,
        a: Math.random() * 0.35 + 0.08,
      }));
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = e.clientY / window.innerHeight;
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const pullX = (mouse.x - 0.5) * 18;
      const pullY = (mouse.y - 0.5) * 10;
      for (const s of specks) {
        s.x += s.vx + pullX * 0.002;
        s.y += s.vy + pullY * 0.002;
        if (s.y < -4) s.y = h + 4;
        if (s.x < -4) s.x = w + 4;
        if (s.x > w + 4) s.x = -4;
        ctx.beginPath();
        ctx.fillStyle = `rgba(242, 230, 200, ${s.a})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvas}
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
      aria-hidden
    />
  );
}
