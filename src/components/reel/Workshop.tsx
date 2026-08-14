'use client';

import { useState } from 'react';
import { site } from '@/data/site';

export default function Workshop() {
  const [hot, setHot] = useState<number | null>(null);

  return (
    <section id="layers" className="bg-ink relative px-6 py-28 md:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-ember font-mono text-[11px] tracking-[0.32em] uppercase">
          Three layers
        </p>
        <h2 className="font-display text-ivory mt-4 max-w-[12ch] text-[clamp(2.6rem,7vw,5rem)] leading-[0.9] font-extrabold tracking-[-0.04em]">
          How I actually work
        </h2>

        <ol className="divide-ivory/10 border-ivory/10 mt-16 divide-y border-y">
          {site.layers.map((layer, i) => {
            const on = hot === i;
            const dim = hot !== null && !on;
            return (
              <li
                key={layer.name}
                onMouseEnter={() => setHot(i)}
                onMouseLeave={() => setHot(null)}
                data-cursor="hot"
                className={`grid gap-4 py-10 transition duration-500 md:grid-cols-[80px_200px_1fr] md:items-center ${
                  dim ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <span className="text-ember font-mono text-sm">
                  {layer.index}
                </span>
                <h3 className="font-display text-ivory text-3xl font-bold tracking-tight md:text-4xl">
                  {layer.name}
                </h3>
                <p className="text-ivory/65 max-w-[48ch] text-base leading-relaxed">
                  {layer.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
