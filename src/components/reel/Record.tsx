'use client';

import { site } from '@/data/site';

export default function Record() {
  return (
    <section id="record" className="bg-ink relative px-6 py-28 md:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-ember font-mono text-[11px] tracking-[0.32em] uppercase">
          Record
        </p>
        <h2 className="font-display text-ivory mt-4 text-[clamp(2.6rem,7vw,5rem)] leading-[0.9] font-extrabold tracking-[-0.04em]">
          Where the hours went
        </h2>

        <div className="mt-16 space-y-16">
          {site.record.map((job) => (
            <article
              key={job.org}
              className="border-ivory/10 grid gap-6 border-t pt-10 md:grid-cols-[140px_1fr]"
            >
              <div>
                <p className="text-ember font-mono text-[11px] tracking-[0.28em] uppercase">
                  {job.slate}
                </p>
                <p className="text-ivory/40 mt-3 font-mono text-[11px] tracking-[0.16em] uppercase">
                  {job.dates}
                </p>
              </div>
              <div>
                <h3 className="font-display text-ivory text-3xl font-bold tracking-tight">
                  {job.role}
                </h3>
                <p className="text-brass mt-2 text-sm">
                  {job.org} · {job.place}
                </p>
                <ul className="mt-6 max-w-[60ch] space-y-3">
                  {job.points.map((p) => (
                    <li
                      key={p}
                      className="text-ivory/68 text-base leading-relaxed"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <p className="border-ivory/10 text-ivory/45 mt-16 max-w-[56ch] border-t pt-8 text-sm leading-relaxed">
          {site.education.degree}. {site.education.school}.{' '}
          {site.education.notes}.
        </p>
      </div>
    </section>
  );
}
