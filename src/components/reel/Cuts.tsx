'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from '@/data/site';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Cuts() {
  const wrap = useRef<HTMLElement>(null);
  const desktop = useIsDesktop();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!wrap.current || reduced || !desktop) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.cut-card');
      gsap.set(cards, { autoAlpha: 0, y: 30 });
      gsap.set(cards[0], { autoAlpha: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap.current,
          start: 'top top',
          end: `+=${cards.length * 90}%`,
          pin: true,
          scrub: 0.8,
        },
      });

      cards.forEach((card, i) => {
        if (i === 0) return;
        tl.to(cards[i - 1], { autoAlpha: 0, y: -24, duration: 0.5 }, i);
        tl.fromTo(
          card,
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.5 },
          i
        );
      });
    }, wrap);

    return () => ctx.revert();
  }, [desktop, reduced]);

  return (
    <section id="cuts" ref={wrap} className="bg-ink relative">
      <div className="relative min-h-[100dvh] overflow-hidden">
        {site.cuts.map((cut, i) => (
          <article
            key={cut.slate}
            className={`cut-card ${desktop && !reduced ? 'absolute inset-0' : 'border-ivory/10 relative border-b'} flex min-h-[100dvh] items-center px-6 py-24 md:px-20`}
          >
            <div className="mx-auto w-full max-w-5xl">
              <p className="text-ember font-mono text-[11px] tracking-[0.36em] uppercase">
                {cut.slate}
              </p>
              <p className="font-display text-ivory mt-8 flex items-end gap-3 text-[clamp(4.5rem,16vw,11rem)] leading-none font-extrabold tracking-[-0.05em]">
                {cut.value}
                <span className="text-ivory/40 mb-3 font-mono text-base font-normal tracking-[0.2em]">
                  {cut.unit}
                </span>
              </p>
              <p className="text-ivory/75 mt-8 max-w-[34ch] text-xl leading-snug">
                {cut.line}
              </p>
              <p className="text-ivory/35 mt-6 font-mono text-[11px] tracking-[0.24em] uppercase">
                {cut.place}
              </p>
              <p className="text-ivory/25 mt-16 font-mono text-[10px]">
                {String(i + 1).padStart(2, '0')} /{' '}
                {String(site.cuts.length).padStart(2, '0')}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
