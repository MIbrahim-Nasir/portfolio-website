'use client';

import { useEffect, useRef } from 'react';
import {
  foundations,
  graph,
  origin,
  profile,
  saif,
  sideProjects,
  toolkit,
} from '@/data/profile';

// The fast path for anyone who wants the facts without the film.
export default function ResumeSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      closeBtn.current?.focus();
      body.current?.scrollTo(0, 0);
    }
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[70] transition-[visibility] duration-700 ${open ? 'visible' : 'invisible'}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Résumé"
        className={`absolute top-0 right-0 flex h-full w-full max-w-[640px] flex-col border-l border-[var(--line)] bg-[#100c0a] transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <span className="kicker">Résumé · plain text</span>
          <div className="flex gap-2">
            <a
              className="btn solid !py-2"
              href={profile.resumeUrl}
              download="MIbrahim_Nasir_AI_Resume.pdf"
              data-cursor="save"
            >
              PDF ↓
            </a>
            <button
              ref={closeBtn}
              className="btn !py-2"
              onClick={onClose}
              data-cursor="close"
            >
              Close
            </button>
          </div>
        </div>

        <div
          ref={body}
          data-lenis-prevent
          className="text-sand/85 flex-1 overflow-y-auto px-6 py-8 text-[14px] leading-relaxed"
        >
          <h2 className="display text-sand text-[44px]">{profile.name}</h2>
          <p className="mono text-dune mt-2 text-[12px]">
            {profile.role} · {profile.tagline} · {profile.location}
          </p>
          <p className="mono text-dune mt-1 text-[12px]">
            <a className="hover:text-ember" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>{' '}
            ·{' '}
            <a
              className="hover:text-ember"
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>{' '}
            ·{' '}
            <a
              className="hover:text-ember"
              href={profile.github}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </p>

          <p className="mt-6">
            AI Developer who has shipped a production multi-agent AI product in
            live commercial use. Engineer first: started in C#/.NET backends,
            now Python and agentic AI. Strong in system design, RAG, LLM
            reliability and data pipelines, and I own deployment end to end.
          </p>

          <Section title="Experience">
            <Role
              title="AI Developer · R&D"
              org="Ducon Industries, Dubai"
              when="Aug 2025 – present"
            >
              <li>
                Built and launched{' '}
                <b className="text-sand font-medium">{saif.name}</b>, live on
                WhatsApp: a client sends a photo of their space and receives a
                rendered outdoor design with a Bill of Quantities.
              </li>
              {saif.stats.map((s) => (
                <li key={s.label}>
                  {s.prefix}
                  {s.value}
                  {s.suffix} {s.label}.
                </li>
              ))}
              <li>{graph.lead}</li>
              {graph.points.map((p) => (
                <li key={p}>{p}.</li>
              ))}
              <li>Automation scripts saved 100+ manual hours.</li>
            </Role>
            <Role
              title={foundations.role}
              org="DeltaX, Hyderabad"
              when="Jan – Jul 2025"
            >
              <li>{foundations.body}</li>
              <li>
                20+ REST endpoints in a layered Controller–Service–Repository
                design.
              </li>
            </Role>
            <Role
              title="Vice Chair & Technical Lead"
              org="TSIG Engineering Club, MJCET"
              when="2022 – 2025"
            >
              <li>
                Led a 30-member club, delivering 10+ concurrent projects across
                AI, web and robotics.
              </li>
              <li>Raised project completion rates by 25%.</li>
            </Role>
          </Section>

          <Section title="Projects">
            {sideProjects.map((p) => (
              <div key={p.name} className="mb-3">
                <div className="text-sand font-medium">{p.name}</div>
                <div>{p.body}</div>
              </div>
            ))}
          </Section>

          <Section title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {toolkit.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Education & achievements">
            <ul className="list-disc space-y-1 pl-5">
              <li>{origin.stops[1].v}</li>
              <li>
                Winner and special mention at multiple hackathons
                (HackRevolution, IIT Hack4SDG state-level).
              </li>
              <li>
                3rd place, national hackathon, for a Gemini-vision robotic arm.
              </li>
              <li>
                Published researcher (national conference) on the Core XY
                mechanism.
              </li>
              <li>ISRO Rover Competition, top 50 teams all-India.</li>
            </ul>
          </Section>
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <h3 className="kicker !text-ember mb-4 border-b border-[var(--line)] pb-2">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Role({
  title,
  org,
  when,
  children,
}: {
  title: string;
  org: string;
  when: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sand font-medium">{title}</span>
        <span className="mono text-dune text-[11px]">{when}</span>
      </div>
      <div className="text-dune mb-2 text-[13px]">{org}</div>
      <ul className="list-disc space-y-1 pl-5">{children}</ul>
    </div>
  );
}
