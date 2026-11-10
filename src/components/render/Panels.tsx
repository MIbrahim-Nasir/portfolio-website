'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import {
  foundations,
  identity,
  matter,
  origin,
  profile,
  saif,
  scenes,
  toolkit,
  type Stat,
} from '@/data/profile';
import { film } from './store';

gsap.registerPlugin(SplitText);

// title-card copy: short on purpose, every line backed by profile.ts
const SAIF_LINES = [
  'A client sends a photo of their space on WhatsApp.',
  'In 5–7 minutes they get a rendered design and a bill of quantities from real products.',
];
const GRAPH_POINTS = [
  'Eval dataset · traced in LangSmith + Langfuse',
  'Images and documents → an embedded design library',
  'ChromaDB search over thousands of images',
  'Deployed end to end · Railway · VPS · Cloudflare R2',
];

function Count({ s }: { s: Stat }) {
  return (
    <span className="tabular-nums">
      {s.prefix}
      <span data-count={s.value}>{s.value}</span>
      {s.suffix}
    </span>
  );
}

function Stats({ items, cols = 2 }: { items: Stat[]; cols?: number }) {
  return (
    <dl
      className="grid gap-x-6 gap-y-5 border-t border-[var(--line)] pt-5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map((s) => (
        <div key={s.label} data-a>
          <dt className="sr-only">{s.label}</dt>
          <dd className="display text-sand text-[clamp(34px,3.6vw,56px)]">
            <Count s={s} />
          </dd>
          <dd className="text-dune mt-1 text-[12.5px] leading-snug">
            {s.label}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// A compositor-style reference plate: the source photo a scene is built from,
// shown as a thumbnail beside the line it illustrates.
function Plate({
  shots,
  active = 0,
  children,
}: {
  shots: { src: string; name: string }[];
  active?: number;
  children: React.ReactNode;
}) {
  return (
    <figure data-a className="flex items-start gap-4">
      <div className="hidden w-[112px] shrink-0 sm:block">
        <div className="plate-frame">
          {shots.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.src}
              src={s.src}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              style={{ opacity: i === active ? 1 : 0 }}
            />
          ))}
          <span className="plate-tick tl" />
          <span className="plate-tick br" />
        </div>
        <div className="mono text-dune mt-1 flex justify-between text-[9px] tracking-[0.12em] uppercase">
          <span className="text-ember">
            ref {String(active + 1).padStart(2, '0')}
          </span>
          <span>{shots[active].name}</span>
        </div>
      </div>
      <figcaption className="min-w-0 flex-1">{children}</figcaption>
    </figure>
  );
}

function Kicker({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <p data-a className="kicker mb-5 flex items-center gap-3">
      <span className="text-ember">{scenes[i].code}</span>
      <span className="h-px w-6 bg-[var(--line-strong)]" />
      {children}
    </p>
  );
}

export default function Panels({
  scene,
  sub,
  booted,
  onJump,
  onResume,
}: {
  scene: number;
  sub: number;
  booted: boolean;
  onJump: (i: number) => void;
  onResume: () => void;
}) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const shown = useRef(-1);
  const [copied, setCopied] = useState(false);

  // split every display title once fonts are in
  useEffect(() => {
    let splits: SplitText[] = [];
    document.fonts.ready.then(() => {
      splits = Array.from(
        document.querySelectorAll<HTMLElement>('[data-split]')
      ).map((el) =>
        SplitText.create(el, {
          type: 'words,chars',
          mask: 'chars',
          charsClass: 'ch',
        })
      );
    });
    return () => splits.forEach((s) => s.revert());
  }, []);

  useEffect(() => {
    if (!booted) return;
    const prev = shown.current;
    shown.current = scene;
    const out = prev >= 0 ? refs.current[prev] : null;
    const inn = refs.current[scene];
    const reduced = film.reduced;
    if (out && out !== inn) {
      gsap.killTweensOf(out.querySelectorAll('[data-a], .ch'));
      gsap.to(out.querySelectorAll('[data-a], [data-split]'), {
        opacity: 0,
        y: -18,
        duration: reduced ? 0 : 0.32,
        ease: 'power2.in',
        stagger: 0.015,
        onComplete: () => out.classList.remove('is-active'),
      });
    }
    if (!inn) return;
    inn.classList.add('is-active');
    const delay = prev < 0 ? 1.1 : 0.28;
    const tl = gsap.timeline({ delay: reduced ? 0 : delay });
    tl.set(inn.querySelectorAll('[data-split]'), { opacity: 1, y: 0 });
    tl.fromTo(
      inn.querySelectorAll('.ch'),
      { yPercent: 115, rotate: 6 },
      {
        yPercent: 0,
        rotate: 0,
        duration: reduced ? 0 : 1.1,
        ease: 'expo.out',
        stagger: 0.016,
      },
      0
    );
    tl.fromTo(
      inn.querySelectorAll('[data-a]'),
      { opacity: 0, y: 26, filter: 'blur(8px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: reduced ? 0 : 0.95,
        ease: 'power3.out',
        stagger: 0.055,
      },
      0.12
    );
    inn.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const to = Number(el.dataset.count);
      const o = { v: 0 };
      tl.to(
        o,
        {
          v: to,
          duration: reduced ? 0 : 1.6,
          ease: 'power3.out',
          onUpdate: () => {
            el.textContent = String(Math.round(o.v));
          },
        },
        0.3
      );
    });
    return () => {
      tl.kill();
    };
  }, [scene, booted]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  const panel = (i: number) => ({
    ref: (el: HTMLDivElement | null) => {
      refs.current[i] = el;
    },
    className: 'panel',
    'aria-hidden': scene !== i,
  });

  return (
    <div className="relative z-20">
      {/* SC.00 OPEN */}
      <section {...panel(0)} aria-label="Introduction">
        <div className="scrim md:hidden" />
        <div className="absolute inset-x-0 top-[26%] px-4 text-center md:top-[25%]">
          <h1 data-a className="kicker !text-sand/80">
            Mohammed Ibrahim Nasir <span className="text-ember">·</span>{' '}
            {profile.role} <span className="text-ember">·</span> Dubai
          </h1>
        </div>
        <div className="absolute inset-x-0 bottom-[110px] px-4 text-center md:top-[60%] md:bottom-auto">
          <p
            data-split
            className="display text-sand mx-auto max-w-[12ch] text-[clamp(40px,4.4vw,72px)] md:max-w-none"
          >
            Mechanics. Electronics. Code. <em>AI.</em>
          </p>
          <p
            data-a
            className="mono text-dune mx-auto mt-5 text-[12px] tracking-[0.2em] uppercase md:text-[13px]"
          >
            Robots in college. AI agents now.
          </p>
          <div
            data-a
            className="mono text-dune mt-8 flex flex-col items-center gap-2 text-[10px] tracking-[0.22em] uppercase"
          >
            <span>scroll</span>
            <span className="relative block h-10 w-px overflow-hidden bg-white/10">
              <span className="bg-ember absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_1.8s_ease-in-out_infinite]" />
            </span>
          </div>
        </div>
        <div
          data-a
          className="mono text-dune absolute bottom-[96px] left-[var(--gutter)] hidden text-[11px] leading-relaxed lg:block"
        >
          <span className="text-mint">●</span> now
          <br />
          <span className="text-sand">AI Developer</span> · Ducon Industries
          R&amp;D
        </div>
      </section>

      {/* SC.01 WHO */}
      <section {...panel(1)} aria-label="Who I am">
        <div className="scrim md:hidden" />
        <div className="col">
          <Kicker i={1}>Background</Kicker>
          <h2
            data-split
            className="display text-sand text-[clamp(44px,5.4vw,92px)]"
          >
            Dubai, Hyderabad, then <em>Dubai</em> again.
          </h2>
          <p data-a className="text-sand/85 mt-6 text-[17px] leading-snug">
            Studied computer science. Spent the evenings building robots.
          </p>
          <ul data-a className="mt-6 flex flex-wrap gap-2">
            {identity.domains.map((d) => (
              <li key={d} className="chip">
                {d}
              </li>
            ))}
          </ul>
          <ol className="mt-7 grid gap-3 border-t border-[var(--line)] pt-5 md:grid-cols-3 md:gap-5">
            {origin.stops.map((s, i) => (
              <li data-a key={i} className={i === 2 ? 'hidden md:block' : ''}>
                <div
                  className={`mono text-[11px] tracking-[0.16em] uppercase ${i === 2 ? 'text-ember' : 'text-lantern'}`}
                >
                  {String(i + 1).padStart(2, '0')} · {s.k}
                </div>
                <div className="text-dune mt-1 text-[12.5px] leading-snug">
                  {s.v}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SC.02 MATTER */}
      <section {...panel(2)} aria-label="Robotics">
        <div className="scrim md:hidden" />
        <div className="col">
          <Kicker i={2}>TSIG robotics bench · hackathons</Kicker>
          <h2
            data-split
            className="display text-sand text-[clamp(40px,4.8vw,80px)]"
          >
            Some of my code has <em>motors</em>.
          </h2>
          <div className="mt-6 hidden md:block">
            <Plate shots={[{ src: '/images/reel-arm.jpg', name: 'bench' }]}>
              <p className="display text-sand/90 text-[clamp(22px,2vw,30px)]">
                Gemini picks the move. <em>The arm makes it.</em>
              </p>
              <p className="mono text-dune mt-2 text-[11px] tracking-[0.12em] uppercase">
                camera → gemini → python → arduino
              </p>
            </Plate>
          </div>
          <dl className="mt-5 border-t border-[var(--line)]">
            {matter.wins.map((w) => (
              <div
                data-a
                key={w.k}
                className="flex items-baseline gap-5 border-b border-[var(--line)] py-2.5"
              >
                <dt className="display text-lantern w-[74px] shrink-0 text-[26px]">
                  {w.k}
                </dt>
                <dd className="text-sand/80 text-[13px] leading-snug">{w.v}</dd>
              </div>
            ))}
            <div
              data-a
              className="flex items-baseline gap-5 border-b border-[var(--line)] py-2.5"
            >
              <dt className="display text-ember w-[74px] shrink-0 text-[26px]">
                {origin.club.name}
              </dt>
              <dd className="text-sand/80 text-[13px] leading-snug">
                I joined for robotics and left as Vice Chair.
                <span className="mono text-dune mt-1 block text-[11px] tracking-[0.1em] uppercase">
                  vice chair · 30 members · 10+ projects · completion +25%
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* SC.03 STACK */}
      <section {...panel(3)} aria-label="Backend work">
        <div className="scrim md:hidden" />
        <div className="col">
          <Kicker i={3}>{foundations.where}</Kicker>
          <h2
            data-split
            className="display text-sand text-[clamp(40px,4.8vw,80px)]"
          >
            Backends first, then <em>agents</em>.
          </h2>
          <p data-a className="text-sand/85 mt-6 text-[15px] leading-relaxed">
            An IMDB-style catalogue, and BookSwap, a book marketplace with a
            history-based recommender.
          </p>
          <ol
            data-a
            className="mono mt-6 flex flex-wrap items-center gap-2 text-[11px] tracking-[0.12em] uppercase"
          >
            {foundations.layers.map((l, i) => (
              <li key={l} className="flex items-center gap-2">
                <span className="text-sand rounded-[3px] border border-[var(--line-strong)] px-2.5 py-1.5">
                  {l}
                </span>
                {i < foundations.layers.length - 1 && (
                  <span className="text-ember">→</span>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-7 flex items-end gap-6 border-t border-[var(--line)] pt-5">
            <div data-a>
              <div className="display text-sand text-[clamp(40px,4vw,64px)]">
                <Count s={foundations.stats[0]} />
              </div>
              <div className="text-dune text-[12.5px]">
                {foundations.stats[0].label}
              </div>
            </div>
            <p data-a className="text-dune pb-1 text-[12.5px] leading-snug">
              {foundations.role}. C# · ASP.NET Core · EF Core · Dapper · SQL
              Server.
            </p>
          </div>
        </div>
        <div
          data-a
          className="absolute inset-x-0 bottom-[86px] hidden overflow-hidden md:block"
          aria-hidden
        >
          <div className="marquee mono text-dune/70 text-[11px] tracking-[0.16em] uppercase">
            {[...toolkit, ...toolkit].map((t, i) => (
              <span key={i} className="flex items-center gap-6 pr-6">
                {t}
                <span className="text-ember/70">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SC.04 SAIF */}
      <section {...panel(4)} aria-label="SAIF AI Designer">
        <div className="scrim md:hidden" />
        <div className="col">
          <Kicker i={4}>{saif.where}</Kicker>
          <h2
            data-split
            className="display text-sand text-[clamp(44px,5.6vw,92px)]"
          >
            Send a photo, get a <em>design</em>.
          </h2>
          <p
            data-a
            className="mono text-dune mt-3 text-[11px] tracking-[0.16em] uppercase"
          >
            {saif.name} · live on WhatsApp
          </p>
          <div data-a className="mt-6 flex items-center gap-3">
            {[saif.before.kicker, saif.after.kicker].map((k, i) => (
              <span key={k} className="flex items-center gap-3">
                {i === 1 && (
                  <span className="relative h-px w-16 overflow-hidden bg-white/15">
                    <span
                      className="bg-ember absolute inset-0 origin-left transition-transform duration-700"
                      style={{ transform: `scaleX(${sub})` }}
                    />
                  </span>
                )}
                <span
                  className={`mono text-[11px] tracking-[0.18em] uppercase transition-colors duration-500 ${
                    sub === i ? 'text-ember' : 'text-dune'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')} {k}
                </span>
              </span>
            ))}
          </div>
          <div className="mt-4">
            <Plate
              active={sub}
              shots={[
                { src: '/images/work-ducon.jpg', name: 'input' },
                { src: '/images/reel-villa.jpg', name: 'render' },
              ]}
            >
              <div className="text-sand/90 relative min-h-[5.4em] text-[clamp(16px,1.3vw,19px)] leading-snug">
                {SAIF_LINES.map((l, i) => (
                  <p
                    key={i}
                    className="absolute inset-0 transition-all duration-700"
                    style={{
                      opacity: sub === i ? 1 : 0,
                      transform: `translateY(${sub === i ? 0 : i === 0 ? -10 : 10}px)`,
                      filter: sub === i ? 'none' : 'blur(6px)',
                    }}
                  >
                    {l}
                  </p>
                ))}
              </div>
            </Plate>
          </div>
          <div className="mt-2 hidden md:block">
            <Stats items={saif.stats} />
          </div>
          <div className="mt-2 md:hidden">
            <Stats items={saif.stats.slice(0, 2)} />
          </div>
          <div data-a className="mt-6 flex flex-wrap gap-2">
            <a
              href={profile.saifWhatsapp}
              target="_blank"
              rel="noreferrer"
              className="btn"
              data-cursor="open"
            >
              Try SAIF on WhatsApp ↗
            </a>
          </div>
        </div>
      </section>

      {/* SC.05 GRAPH */}
      <section {...panel(5)} aria-label="How SAIF works">
        <div className="scrim md:hidden" />
        <div className="col">
          <Kicker i={5}>LangGraph · FastAPI · RAG</Kicker>
          <h2
            data-split
            className="display text-sand text-[clamp(44px,5.4vw,88px)]"
          >
            The agents check their own <em>work.</em>
          </h2>
          <p data-a className="text-sand/85 mt-6 text-[17px] leading-snug">
            Generation went from 20+ minutes to 5–7.
          </p>
          <ul className="mt-6 hidden space-y-2.5 border-t border-[var(--line)] pt-5 md:block">
            {GRAPH_POINTS.map((p) => (
              <li
                data-a
                key={p}
                className="text-dune flex gap-3 text-[13.5px] leading-snug"
              >
                <span className="mono text-mint mt-[3px] text-[10px]">▸</span>
                {p}
              </li>
            ))}
          </ul>
          <div data-a className="mt-6 flex flex-wrap gap-2">
            {[
              'Gemini Flash',
              'pgvector',
              'ChromaDB',
              'LangSmith',
              'Langfuse',
              'Railway',
              'Cloudflare R2',
            ].map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SC.06 CONTACT */}
      <section {...panel(6)} aria-label="Contact">
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p data-a className="kicker mb-6">
            <span className="text-ember">{scenes[6].code}</span> · open to AI
            engineering roles · remote or UAE
          </p>
          <h2
            data-split
            className="display text-sand text-[clamp(64px,11vw,190px)]"
          >
            Get in <em>touch.</em>
          </h2>
          <button
            data-a
            onClick={copy}
            className="group mono text-sand hover:border-ember hover:text-ember mt-10 flex items-center gap-3 border-b border-[var(--line-strong)] pb-2 text-[clamp(14px,1.6vw,22px)] transition-colors"
            data-cursor={copied ? 'copied' : 'copy'}
          >
            {profile.email}
            <span className="text-dune group-hover:text-ember text-[11px] tracking-[0.16em] uppercase">
              {copied ? 'copied ✓' : 'copy'}
            </span>
          </button>
          <div data-a className="mt-8 flex flex-wrap justify-center gap-2">
            <a
              className="btn solid"
              href={`mailto:${profile.email}`}
              data-cursor="write"
            >
              Email me
            </a>
            <a
              className="btn"
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              data-cursor="open"
            >
              LinkedIn ↗
            </a>
            <a
              className="btn"
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              data-cursor="open"
            >
              GitHub ↗
            </a>
            <button className="btn" onClick={onResume} data-cursor="read">
              Résumé
            </button>
          </div>
          <div
            data-a
            className="mono text-dune mt-12 flex gap-8 text-[10px] tracking-[0.22em] uppercase"
          >
            <button
              onClick={() => onJump(0)}
              className="hover:text-sand"
              data-cursor="rewind"
            >
              ↺ replay the film
            </button>
            <a href="/concepts" className="hover:text-sand" data-cursor="open">
              alternate cuts →
            </a>
          </div>
        </div>
        <p className="mono text-dune/70 absolute inset-x-0 bottom-[78px] px-4 text-center text-[10px] tracking-[0.14em] uppercase">
          © 2026 Mohammed Ibrahim Nasir · Next.js · three.js · GLSL · GSAP ·
          psst: type my name
        </p>
      </section>
    </div>
  );
}
