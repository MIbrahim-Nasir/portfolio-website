'use client';

import { useEffect, useRef } from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export default function Cursor() {
  const desktop = useIsDesktop();
  const reduced = usePrefersReducedMotion();
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!desktop || reduced) return;
    document.documentElement.classList.add('studio-cursor');
    const onMove = (e: PointerEvent) => {
      if (dot.current) {
        dot.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.documentElement.classList.remove('studio-cursor');
      window.removeEventListener('pointermove', onMove);
    };
  }, [desktop, reduced]);

  if (!desktop || reduced) return null;

  return (
    <div
      ref={dot}
      className="bg-gold pointer-events-none fixed top-0 left-0 z-[80] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-difference"
    />
  );
}
