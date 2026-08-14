'use client';

import { useEffect, useRef } from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export default function Cursor() {
  const desktop = useIsDesktop();
  const reduced = usePrefersReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!desktop || reduced) return;
    document.documentElement.classList.add('reel-cursor');

    let x = 0;
    let y = 0;
    let rx = 0;
    let ry = 0;
    let hover = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      hover = Boolean(t?.closest('a, button, [data-cursor="hot"]'));
    };

    const tick = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${hover ? 1.7 : 1})`;
        ring.current.style.opacity = hover ? '0.95' : '0.55';
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove('reel-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      cancelAnimationFrame(raf);
    };
  }, [desktop, reduced]);

  if (!desktop || reduced) return null;

  return (
    <>
      <div
        ref={dot}
        className="bg-ember pointer-events-none fixed top-0 left-0 z-[80] h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-difference"
      />
      <div
        ref={ring}
        className="border-ivory/70 pointer-events-none fixed top-0 left-0 z-[80] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border mix-blend-difference"
      />
    </>
  );
}
