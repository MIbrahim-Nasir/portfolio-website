'use client';

import dynamic from 'next/dynamic';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Database,
  FileText,
  Gauge,
  GithubLogo,
  Graph,
  Lightning,
  LinkedinLogo,
  List,
  Minus,
  Plus,
  Robot,
  ShieldCheck,
  TreeStructure,
  WhatsappLogo,
  X,
  type Icon,
} from '@phosphor-icons/react';
import { profile } from '@/data/profile';
import {
  arm,
  benefits,
  caseStudy,
  cta,
  faq,
  faqTitle,
  final,
  flow,
  hero,
  how,
  machines,
  more,
  problem,
  reversal,
  rules,
  steps,
  tagline,
} from './content';
import type { SlotKind } from './three/Stage';
import s from './hire.module.css';

// three.js only runs in the browser; the DOM boxes render on the server and the canvas draws into them
const Stage = dynamic(() => import('./three/Stage').then((m) => m.Stage), {
  ssr: false,
});
const Slot = dynamic(() => import('./three/Stage').then((m) => m.Slot), {
  ssr: false,
});

const ICONS: Record<string, Icon> = {
  shield: ShieldCheck,
  gauge: Gauge,
  database: Database,
  graph: Graph,
  lightning: Lightning,
  robot: Robot,
  tree: TreeStructure,
  check: Check,
};

const NAV = [
  { id: 'work', label: 'Work' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'faq', label: 'FAQ' },
];

// bento layout on desktop: span and slot height per benefit (spec §3.2)
const BENTO = [
  { span: 'span-8', slot: 'slot-280' },
  { span: 'span-4', slot: 'slot-280' },
  { span: 'span-6', slot: 'slot-300' },
  { span: 'span-6', slot: 'slot-300' },
  { span: 'span-12', slot: 'slot-280', row: true },
];

const JOINTS = [
  ['θ1', '0°'],
  ['θ2', '69°'],
  ['θ3', '−92°'],
  ['θ4', '−23°'],
];

const cx = (...c: (string | false | undefined)[]) =>
  c.filter(Boolean).join(' ');

function PrimaryCta({
  size = 'md',
  id,
  className,
}: {
  size?: 'md' | 'sm';
  id?: string;
  className?: string;
}) {
  return (
    <a
      id={id}
      href={cta.href}
      data-grab
      data-aim="email button"
      className={cx(
        s.btn,
        s.primary,
        size === 'md' ? s['btn-md'] : cx(s['btn-small'], s['btn-sm']),
        className
      )}
    >
      {cta.label}
      <ArrowRight
        size={size === 'md' ? 20 : 16}
        className={s.nudge}
        aria-hidden
      />
    </a>
  );
}

function Lines({ lines }: { lines: readonly string[] }) {
  return lines.map((line, i) => (
    <span key={i} className="block">
      {line}
    </span>
  ));
}

/** A paper-2 well in a card that the WebGL canvas draws into, 16px in from its edges. */
function Well({
  kind,
  className,
  children,
}: {
  kind: SlotKind;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cx(s.slot, className)}>
      <span className={s['slot-skeleton']} aria-hidden />
      <div className={s['slot-art']}>
        <Slot kind={kind} />
      </div>
      {children}
    </div>
  );
}

export default function HireApp({ fontClassName }: { fontClassName: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);

  // scroll reveals: rise 32px and fade in once, IntersectionObserver only
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).dataset.in = 'true';
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );
    el.querySelectorAll(`.${s.reveal}`).forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  // tagline: each word lights up as it crosses a line 60% down the viewport
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>(`.${s.word}`);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      words.forEach((w) => (w.dataset.on = 'true'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).dataset.on = 'true';
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -40% 0px', threshold: 1 }
    );
    words.forEach((w) => io.observe(w));
    return () => io.disconnect();
  }, []);

  // current section in the nav
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    NAV.forEach((n) => {
      const sec = document.getElementById(n.id);
      if (sec) io.observe(sec);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = menu || rulesOpen ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [menu, rulesOpen]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target;
      if (
        t instanceof Element &&
        t.closest('input, textarea, [contenteditable="true"]')
      )
        return;
      if (e.key === 'Escape') {
        setMenu(false);
        setRulesOpen(false);
      }
      if (e.key === '?') setRulesOpen((v) => !v);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2400);
  }, []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      say('Email copied to your clipboard.');
    } catch {
      say(`Copy failed. The address is ${profile.email}.`);
    }
  };

  const pick = () => window.dispatchEvent(new Event('hire:pick'));

  // "and machines that move": on phones "and" ends the second line instead
  const [and, ...rest] = hero.title[2].split(' ');
  let wordIndex = 0;

  return (
    <div
      ref={root}
      className={cx(s.page, fontClassName)}
      data-3d={ready ? 'ready' : 'loading'}
    >
      <Stage onReady={() => setReady(true)} />

      <a
        href="#main"
        className={cx(s.skip, s.btn, s.primary, s['btn-small'], s['btn-sm'])}
      >
        Skip to content
      </a>

      {/* ───────── floating nav ───────── */}
      <nav className={s.nav} aria-label="Primary">
        <a href="#top" className={s.mark} onClick={() => setMenu(false)}>
          <span className={s['mark-dot']} aria-hidden />
          <span className="flex flex-col">
            <span className={s.t4}>{profile.short}</span>
            <span className={cx(s.c5, s.tertiary)}>{hero.eyebrow}</span>
          </span>
        </a>
        <div className={s.links}>
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={cx(s['nav-link'], s.t4)}
              aria-current={active === n.id ? 'true' : undefined}
            >
              {n.label}
            </a>
          ))}
        </div>
        <PrimaryCta size="sm" className={s['nav-cta']} />
        <button
          type="button"
          className={s.toggle}
          aria-expanded={menu}
          aria-controls="menu"
          aria-label={menu ? 'Close menu' : 'Open menu'}
          onClick={() => setMenu((v) => !v)}
        >
          {menu ? <X size={20} aria-hidden /> : <List size={20} aria-hidden />}
        </button>
      </nav>

      <div id="menu" className={s.panel} data-open={menu} aria-hidden={!menu}>
        {[...NAV, { id: 'contact', label: 'Contact' }].map((n, i) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            tabIndex={menu ? 0 : -1}
            className={cx(s['panel-link'], s.h3)}
            style={{
              transitionDelay: menu ? `${Math.min(i * 60, 400)}ms` : '0ms',
            }}
            onClick={() => setMenu(false)}
          >
            {n.label}
          </a>
        ))}
        <div
          className={cx(s['panel-link'], 'mt-6')}
          style={{
            transitionDelay: menu
              ? `${Math.min(NAV.length * 60 + 60, 400)}ms`
              : '0ms',
          }}
        >
          <PrimaryCta />
        </div>
      </div>

      <main id="main">
        {/* ───────── hero: copy on the left, his arm on the bench reaching for the button ───────── */}
        <header id="top" className={s.hero}>
          <div className={s['hero-copy']}>
            <h1 data-aim="headline" className={cx(s['title-hero'], s.gradient)}>
              <span className="block">{hero.title[0]}</span>
              {hero.title[1]}
              <br className={s['br-wide']} /> {and}
              <br className={s['br-narrow']} /> {rest.join(' ')}
            </h1>
            <p className={cx(s.t2, s.secondary)}>{hero.sub}</p>
            <div className={s['hero-actions']}>
              <PrimaryCta id="hero-cta" />
              <p className={cx(s.proof, s.b6, s.tertiary)}>
                <span className={cx(s.h5, s.info)}>{hero.proof.value}</span>
                {hero.proof.text}
              </p>
            </div>
          </div>

          <div className={s['hero-band']}>
            <div className={cx(s.art, s['hero-art'])}>
              <Slot
                kind="arm"
                aimId="hero-cta"
                hud={{
                  angles: 'hud-angles',
                  target: 'hud-target',
                  log: 'hud-log',
                }}
              />
            </div>
            <div className={cx(s.fade, s['hero-fade'])} aria-hidden />
            <button
              type="button"
              className={s['bench-hit']}
              aria-label={`${arm.caption}. ${arm.hint}.`}
              onClick={pick}
            />
          </div>

          <div className={s['hud-wrap']} aria-hidden>
            <div className={s.hud}>
              <p className={cx(s['hud-row'], s.c4, s.secondary)}>
                <span className={s.live} />
                {arm.caption}
              </p>
              <div id="hud-angles" className={s.joints}>
                {JOINTS.map(([j, v]) => (
                  <span key={j} className={s.joint}>
                    <span className={cx(s.c6, s.tertiary)}>{j}</span>
                    <span data-joint className={s.b7}>
                      {v}
                    </span>
                  </span>
                ))}
              </div>
              <div className={s.divider} />
              <p className={cx(s['hud-row'], s.c6)}>
                <span className={s.tertiary}>aim</span>
                <span id="hud-target" className={s.info}>
                  idle scan
                </span>
              </p>
              <p className={cx(s.c6, s.secondary)}>
                › <span id="hud-log">{arm.hint.toLowerCase()}</span>
              </p>
            </div>
          </div>
        </header>

        {/* ───────── the work ───────── */}
        <section
          id="work"
          className={s.sec}
          style={{ paddingTop: 64 }}
          aria-labelledby="problem"
        >
          <div className={cx(s.wrap, s.stack)}>
            <div className={cx(s.head, s.reveal)}>
              <h2 id="problem" className={s['title-section']}>
                <Lines lines={problem.title} />
              </h2>
              <p className={cx(s.t2, s.secondary)}>{problem.body}</p>
            </div>
            <ul className={s.bento}>
              {benefits.map((b, i) => {
                const I = ICONS[b.icon];
                const L = BENTO[i];
                return (
                  <li
                    key={b.title}
                    data-rv
                    className={cx(
                      s.card,
                      s.cell,
                      s.reveal,
                      s[L.span],
                      L.row && s['cell-row']
                    )}
                    style={{ transitionDelay: `${(i % 2) * 60}ms` }}
                  >
                    <Well kind={b.scene} className={s[L.slot]}>
                      {b.scene === 'bars' && (
                        <>
                          <span
                            className={cx(s['bar-label'], s.c6)}
                            style={{ left: 24, top: 16 }}
                          >
                            {flow.before}
                          </span>
                          <span
                            className={cx(s['bar-label'], s.c6)}
                            style={{ right: 24, bottom: 16 }}
                          >
                            {flow.after}
                          </span>
                        </>
                      )}
                    </Well>
                    <div className={s['cell-body']}>
                      <div className="flex flex-col gap-2">
                        <h3 className={cx(s.h6, s['cell-title'])}>
                          <I size={20} className={s['icon-info']} aria-hidden />
                          {b.title}
                        </h3>
                        <p className={cx(s.b3, s.secondary)}>{b.body}</p>
                      </div>
                      {i === 0 && (
                        <ol
                          className={s.flow}
                          aria-label="How a request moves through SAIF"
                        >
                          {flow.steps.map((step, k) => (
                            <li key={step} className="flex items-center gap-2">
                              <span className={cx(s.chip, s.c4)}>{step}</span>
                              {k < flow.steps.length - 1 && (
                                <ArrowRight
                                  size={12}
                                  className={s['icon-subtle']}
                                  aria-hidden
                                />
                              )}
                            </li>
                          ))}
                        </ol>
                      )}
                      <p className={cx(s.chip, s.c4, s['proof-chip'])}>
                        <Check size={12} aria-hidden />
                        {b.proof}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ───────── tagline band: the bench up close, words light up one by one ───────── */}
        <section className={s.band} aria-label="Tagline">
          <p className={cx(s['band-text'], s['title-tagline'])}>
            {tagline.map((line, li) => (
              <span key={li} className="block">
                {line.split(' ').map((w, wi) => {
                  const n = wordIndex++;
                  return (
                    <span key={wi}>
                      <span
                        className={s.word}
                        style={{ transitionDelay: `${(n % 6) * 90}ms` }}
                      >
                        {w}
                      </span>{' '}
                    </span>
                  );
                })}
              </span>
            ))}
          </p>
          <div className={s['band-strip']} aria-hidden>
            <div className={cx(s.art, s['band-art'])}>
              <Slot kind="bench" />
            </div>
            <div className={cx(s.fade, s['band-wash'])} />
          </div>
          <div className={cx(s.glow, s['glow-1'])} aria-hidden />
          <div className={cx(s.glow, s['glow-2'])} aria-hidden />
        </section>

        {/* ───────── hardware ───────── */}
        <section
          id="hardware"
          className={cx(s.sec, s['paper-2'])}
          aria-labelledby="hw-title"
        >
          <div className={cx(s.wrap, s.stack)}>
            <div className={cx(s.head, s.reveal)}>
              <h2 id="hw-title" className={s['title-section']}>
                <Lines lines={machines.title} />
              </h2>
              <p className={cx(s.t2, s.secondary)}>{machines.body}</p>
            </div>
            <ul className={s.bento}>
              {machines.items.map((m, i) => (
                <li
                  key={m.title}
                  data-rv
                  className={cx(s.card, s.cell, s.reveal, s['span-6'])}
                  style={{ transitionDelay: `${(i % 2) * 60}ms` }}
                >
                  <Well
                    kind={m.scene}
                    className={cx(s['slot-220'], s['slot-320'])}
                  />
                  <div className={s['cell-body']} style={{ gap: 8 }}>
                    <h3 className={s.h6}>{m.title}</h3>
                    <p className={cx(s.b3, s.secondary)}>{m.line}</p>
                    <p className={cx(s.c5, s.tertiary)}>{m.proof}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───────── how I work ───────── */}
        <section id="how" className={s.sec} aria-labelledby="how-title">
          <div className={cx(s.wrap, s.stack)}>
            <h2 id="how-title" className={cx(s['title-section'], s.reveal)}>
              <Lines lines={how.title} />
            </h2>
            <ol className={s.steps}>
              {steps.map((st, i) => (
                <li
                  key={st.n}
                  className={cx(s.step, s.reveal)}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span className={s['ink-rule']} aria-hidden />
                  <span className={cx(s['title-section'], s.info, 'mt-3')}>
                    {st.n}
                  </span>
                  <h3 className={s.h5}>{st.title}</h3>
                  <p className={cx(s.b3, s.secondary)}>{st.body}</p>
                  <p className={cx(s.b6, s.tertiary)}>{st.proof}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── case study ───────── */}
        <section
          className={s.sec}
          style={{ paddingTop: 0 }}
          aria-labelledby="case-title"
        >
          <div className={cx(s.wrap, s.stack)}>
            <h2 id="case-title" className={cx(s['title-section'], s.reveal)}>
              {caseStudy.title}
            </h2>
            <article className={cx(s.card, s.case, s.reveal)}>
              <figure className={s.photo}>
                {!loaded && <span className={s.skeleton} aria-hidden />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/reel-villa.jpg"
                  alt="A SAIF output: a rooftop terrace render with a timber pergola and lit planters at sunset."
                  data-loaded={loaded}
                  onLoad={() => setLoaded(true)}
                  ref={(img) => {
                    if (img?.complete && img.naturalWidth) setLoaded(true);
                  }}
                />
              </figure>
              <div className={s['case-copy']}>
                <p className={cx(s.c4, s.tertiary)}>{caseStudy.where}</p>
                <p className={s.t1}>{caseStudy.line}</p>
                <dl className={s.stats}>
                  {caseStudy.stats.map((st) => (
                    <div key={st.label} className={s.stat}>
                      <span className={s.divider} aria-hidden />
                      <dt className="sr-only">{st.label}</dt>
                      <dd className={cx(s['title-section'], s['stat-value'])}>
                        {st.value}
                      </dd>
                      <dd className={cx(s.b6, s.tertiary)}>{st.label}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>

            <ul className={s.more}>
              {more.map((m, i) => {
                const I = ICONS[m.icon];
                return (
                  <li
                    key={m.title}
                    className={s.reveal}
                    style={{ transitionDelay: `${(i % 2) * 60}ms` }}
                  >
                    <span className={s.divider} aria-hidden />
                    <div className="flex gap-4">
                      <I size={24} className={s['icon-info']} aria-hidden />
                      <div className="flex flex-col gap-2">
                        <h3 className={s.t2}>{m.title}</h3>
                        <p className={cx(s.b6, s.secondary)}>{m.body}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* risk reversal: judge the work before the call */}
            <div className={cx(s.card, s.risk, s.reveal)}>
              <div className="flex flex-col gap-2">
                <h3 className={s.h5}>{reversal.title}</h3>
                <p className={cx(s.b3, s.secondary)}>{reversal.body}</p>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <a
                  href={profile.saifWhatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className={cx(
                    s.btn,
                    s['btn-small'],
                    s['secondary-btn'],
                    s['btn-sm']
                  )}
                >
                  <WhatsappLogo size={16} aria-hidden />
                  Try SAIF on WhatsApp
                </a>
                <a
                  href={profile.resumeUrl}
                  className={cx(
                    s.btn,
                    s['btn-small'],
                    s['secondary-btn'],
                    s['btn-sm']
                  )}
                >
                  <FileText size={16} aria-hidden />
                  Résumé PDF
                </a>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer"
                  className={cx(
                    s.btn,
                    s['btn-small'],
                    s['secondary-btn'],
                    s['btn-sm']
                  )}
                >
                  <GithubLogo size={16} aria-hidden />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── FAQ ───────── */}
        <section
          id="faq"
          className={s.sec}
          style={{ paddingTop: 0 }}
          aria-labelledby="faq-title"
        >
          <div className={cx(s.wrap, s['faq-grid'])}>
            <h2 id="faq-title" className={cx(s.h3, s.reveal)}>
              <Lines lines={faqTitle} />
            </h2>
            <div className={cx(s.card, s.faq, s.reveal)}>
              {faq.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary className={s.t2}>
                    {f.q}
                    <Plus size={20} className={s.plus} aria-hidden />
                    <Minus size={20} className={s.minus} aria-hidden />
                  </summary>
                  <p className={cx(s.answer, s.b3, s.secondary)}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── final CTA: the arm again, aiming at the button ───────── */}
        <section
          id="contact"
          className={s.final}
          aria-labelledby="contact-title"
        >
          <div className={s['final-strip']} aria-hidden>
            <div className={cx(s.art, s['final-art'])}>
              <Slot
                kind="arm-small"
                aimId="final-cta"
                hud={{ target: 'final-aim' }}
              />
            </div>
            <div className={cx(s.fade, s['final-fade'])} />
          </div>
          <div className={cx(s.card, s['final-card'])}>
            <h2 id="contact-title" className={s['title-section']}>
              <Lines lines={final.title} />
            </h2>
            <p className={cx(s['final-body'], s.secondary)}>{final.body}</p>
            <div className={s['final-actions']}>
              <PrimaryCta id="final-cta" />
              <button
                type="button"
                onClick={copyEmail}
                className={cx(
                  s.btn,
                  s['btn-small'],
                  s['tertiary-btn'],
                  s['btn-sm']
                )}
              >
                <Copy size={16} aria-hidden />
                {profile.email}
              </button>
            </div>
          </div>
          <p className={cx(s.chip, s['aim-chip'], s.c6)} aria-hidden>
            <span className={s.live} />
            aim <span id="final-aim">email button</span>
          </p>
        </section>
      </main>

      <footer className={s.wrap} style={{ paddingBottom: 48 }}>
        <div className={s.divider} />
        <div className={s.foot}>
          <p className={cx(s.c5, s.tertiary)}>
            © 2026 {profile.name} · {profile.location}
          </p>
          <ul className="flex flex-wrap gap-2">
            <li>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className={cx(
                  s.btn,
                  s['btn-small'],
                  s['tertiary-btn'],
                  s['btn-sm']
                )}
              >
                <LinkedinLogo size={16} aria-hidden />
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className={cx(
                  s.btn,
                  s['btn-small'],
                  s['tertiary-btn'],
                  s['btn-sm']
                )}
              >
                <GithubLogo size={16} aria-hidden />
                GitHub
              </a>
            </li>
            <li>
              <a
                href="/concepts"
                className={cx(
                  s.btn,
                  s['btn-small'],
                  s['tertiary-btn'],
                  s['btn-sm']
                )}
              >
                All cuts
                <ArrowUpRight size={16} aria-hidden />
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                className={cx(
                  s.btn,
                  s['btn-small'],
                  s['tertiary-btn'],
                  s['btn-sm']
                )}
              >
                <span className={cx(s.kbd, s.c4)}>?</span>
                The rules
              </button>
            </li>
          </ul>
        </div>
        <p id="privacy" className={cx(s.c5, s.tertiary, 'mt-6')}>
          Privacy: no cookies and no forms on this page. Anonymous page views
          are counted with Vercel Analytics.
        </p>
      </footer>

      {/* easter egg: press ? to see the rule set this page was built to */}
      <div
        className={s.overlay}
        data-open={rulesOpen}
        aria-hidden={!rulesOpen}
        onClick={(e) => e.target === e.currentTarget && setRulesOpen(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-title"
          className={cx(s.card, s.sheet)}
        >
          <p className={cx(s.c4, s.tertiary)}>
            elayadesign · landing page design
          </p>
          <h2 id="rules-title" className={cx(s.h5, 'mt-3')}>
            This page was built to a rule set
          </h2>
          <ul className="mt-6 grid gap-3">
            {rules.map((r) => (
              <li
                key={r}
                className={cx(s.b6, s.secondary, 'flex items-start gap-3')}
              >
                <Check
                  size={16}
                  className={cx(s['icon-info'], 'mt-0.5')}
                  aria-hidden
                />
                {r}
              </li>
            ))}
          </ul>
          <button
            type="button"
            tabIndex={rulesOpen ? 0 : -1}
            onClick={() => setRulesOpen(false)}
            className={cx(
              s.btn,
              s['btn-small'],
              s['secondary-btn'],
              s['btn-sm'],
              'mt-8'
            )}
          >
            Close
          </button>
        </div>
      </div>

      <p role="status" className={cx(s.toast, s.b6)} data-show={!!toast}>
        {toast}
      </p>
    </div>
  );
}
