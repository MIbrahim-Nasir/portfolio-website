'use client';

import { useEffect, useState } from 'react';
import { site } from '@/data/site';

const scenes = [
  { id: 'open', n: '00' },
  { id: 'cuts', n: '01' },
  { id: 'reel', n: '02' },
  { id: 'layers', n: '03' },
  { id: 'record', n: '04' },
  { id: 'signal', n: '05' },
];

export default function FrameMarks() {
  const [clock, setClock] = useState('--:--');
  const [scene, setScene] = useState('00');

  useEffect(() => {
    const tick = () => {
      const t = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
      });
      setClock(t);
    };
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const nodes = scenes
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target.id) return;
        const hit = scenes.find((s) => s.id === visible.target.id);
        if (hit) setScene(hit.n);
      },
      { threshold: [0.35, 0.55] }
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 hidden md:block">
      <span className="border-ivory/35 absolute top-5 left-5 h-5 w-5 border-t border-l" />
      <span className="border-ivory/35 absolute top-5 right-5 h-5 w-5 border-t border-r" />
      <span className="border-ivory/35 absolute bottom-5 left-5 h-5 w-5 border-b border-l" />
      <span className="border-ivory/35 absolute right-5 bottom-5 h-5 w-5 border-r border-b" />

      <p className="text-ivory/45 absolute top-7 left-8 font-mono text-[10px] tracking-[0.28em] uppercase">
        {site.coords}
      </p>
      <p className="text-ivory/45 absolute top-7 right-8 font-mono text-[10px] tracking-[0.28em] uppercase">
        DXB {clock}
      </p>
      <p className="text-ivory/45 absolute bottom-7 left-8 font-mono text-[10px] tracking-[0.28em] uppercase">
        Scene {scene}
      </p>
      <p className="text-ivory/45 absolute right-8 bottom-7 font-mono text-[10px] tracking-[0.28em] uppercase">
        Advance
      </p>
    </div>
  );
}
