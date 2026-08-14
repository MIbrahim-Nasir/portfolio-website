'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from '@/data/site';
import DustField from './DustField';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Opening() {
  const root = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.op-still',
        { scale: 1.12 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
      gsap.fromTo(
        '.op-title',
        { y: 0, opacity: 1 },
        {
          y: -80,
          opacity: 0.15,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      id="open"
      ref={root}
      className="relative isolate min-h-[100dvh] overflow-hidden"
    >
      <div className="op-still absolute inset-0 -z-10">
        <Image
          src="/images/reel-workshop.jpg"
          alt=""
          fill
          priority
          className="object-cover object-[center_40%]"
          sizes="100vw"
        />
        <div className="from-ink/55 via-ink/35 to-ink absolute inset-0 bg-gradient-to-b" />
        <div className="from-ink/70 to-ink/40 absolute inset-0 bg-gradient-to-r via-transparent" />
      </div>
      <DustField />

      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-6 pt-28 pb-24 md:px-16 md:pb-28">
        <p className="text-ember font-mono text-[11px] tracking-[0.34em] uppercase">
          {site.title}
        </p>
        <h2 className="op-title font-display text-ivory mt-4 max-w-[14ch] text-[clamp(3.4rem,11vw,8.2rem)] leading-[0.88] font-extrabold tracking-[-0.045em]">
          {site.given}
          <br />
          <span className="text-ivory/80">{site.family}</span>
        </h2>
        <p className="text-ivory/75 mt-8 max-w-[28ch] text-lg leading-snug md:text-xl">
          {site.opening.line}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <a
            href="#reel"
            data-cursor="hot"
            className="group text-ivory inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] uppercase"
          >
            <span className="border-ivory/35 relative h-10 w-10 overflow-hidden rounded-full border">
              <span className="border-t-ember absolute inset-0 animate-[spin_8s_linear_infinite] rounded-full border border-transparent" />
            </span>
            Into the work
          </a>
          <a
            href={site.resumeUrl}
            className="text-ivory/50 hover:text-ember font-mono text-[11px] tracking-[0.28em] uppercase transition"
          >
            Paper
          </a>
        </div>
      </div>
    </section>
  );
}
