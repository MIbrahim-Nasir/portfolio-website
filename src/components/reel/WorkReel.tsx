'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from '@/data/site';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function WorkReel() {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const desktop = useIsDesktop();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!wrap.current || !track.current || reduced || !desktop) return;

    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap.current,
          start: 'top top',
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);

    return () => ctx.revert();
  }, [desktop, reduced]);

  return (
    <section id="reel" ref={wrap} className="bg-ink relative overflow-hidden">
      <div
        ref={track}
        className={`flex ${desktop && !reduced ? 'h-[100dvh]' : 'flex-col'}`}
      >
        {site.work.map((shot) => (
          <a
            key={shot.id}
            href={shot.href}
            target={shot.href.startsWith('http') ? '_blank' : undefined}
            rel={shot.href.startsWith('http') ? 'noreferrer' : undefined}
            data-cursor="hot"
            className={`group relative shrink-0 overflow-hidden ${
              desktop && !reduced
                ? 'h-[100dvh] w-screen'
                : 'min-h-[88dvh] w-full'
            }`}
          >
            <Image
              src={shot.image}
              alt=""
              fill
              className="object-cover transition duration-700 group-hover:scale-[1.04]"
              sizes="100vw"
            />
            <div className="from-ink via-ink/35 to-ink/20 absolute inset-0 bg-gradient-to-t" />
            <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-16">
              <div className="flex items-start justify-between gap-6">
                <p className="text-ember font-mono text-[11px] tracking-[0.32em] uppercase">
                  {shot.slate} / {shot.serial}
                </p>
                <p className="text-ivory/50 font-mono text-[11px] tracking-[0.24em] uppercase">
                  {shot.year}
                </p>
              </div>
              <div className="max-w-xl">
                <p className="text-ivory/45 font-mono text-[11px] tracking-[0.22em] uppercase">
                  {shot.studio}
                </p>
                <h3 className="font-display text-ivory mt-3 text-[clamp(2.6rem,7vw,5.4rem)] leading-[0.9] font-extrabold tracking-[-0.04em]">
                  {shot.title}
                </h3>
                <p className="text-ivory/70 mt-5 max-w-[42ch] text-base leading-relaxed">
                  {shot.summary}
                </p>
                <p className="text-brass mt-4 text-sm">{shot.outcome}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {shot.stack.map((t) => (
                    <span
                      key={t}
                      className="border-ivory/15 text-ivory/55 border px-2 py-1 font-mono text-[10px] tracking-[0.16em] uppercase"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
