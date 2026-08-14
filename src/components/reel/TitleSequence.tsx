'use client';

import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { site } from '@/data/site';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export default function TitleSequence({ onDone }: { onDone: () => void }) {
  const reduced = usePrefersReducedMotion();
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (reduced) {
      onDone();
      setGone(true);
      return;
    }

    const seen = sessionStorage.getItem('reel-seen');
    if (seen) {
      onDone();
      setGone(true);
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
    });

    tl.fromTo(
      '.ts-coords',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.7 }
    )
      .fromTo(
        '.ts-rule',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.9, ease: 'power2.inOut' },
        '-=0.2'
      )
      .fromTo(
        '.ts-name',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 1.0 },
        '-=0.25'
      )
      .fromTo(
        '.ts-credit',
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        '-=0.2'
      )
      .fromTo(
        '.ts-enter',
        { opacity: 0 },
        { opacity: 0.8, duration: 0.5 },
        '+=0.15'
      );

    const auto = window.setTimeout(() => leave(), 5200);
    return () => {
      tl.kill();
      window.clearTimeout(auto);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const leave = () => {
    if (gone) return;
    sessionStorage.setItem('reel-seen', '1');
    gsap.to('.ts-root', {
      opacity: 0,
      duration: 0.7,
      ease: 'power2.inOut',
      onComplete: () => {
        setGone(true);
        onDone();
      },
    });
  };

  if (gone) return null;

  return (
    <button
      type="button"
      onClick={leave}
      className="ts-root bg-ink text-ivory fixed inset-0 z-[90] flex cursor-none flex-col items-center justify-center"
      aria-label="Enter"
    >
      <p className="ts-coords text-ivory/55 font-mono text-[11px] tracking-[0.42em] uppercase">
        {site.coords}
      </p>
      <span className="ts-rule bg-ember mt-8 h-px w-24 origin-center" />
      <h1 className="ts-name font-display mt-8 text-[clamp(3.2rem,12vw,8.5rem)] leading-none font-extrabold tracking-[-0.04em]">
        {site.family}
      </h1>
      <p className="ts-credit text-ivory/50 mt-6 font-mono text-[11px] tracking-[0.32em] uppercase">
        {site.opening.credit}
      </p>
      <p className="ts-enter text-ember mt-16 font-mono text-[10px] tracking-[0.36em] uppercase">
        Hold still. Then move.
      </p>
    </button>
  );
}
