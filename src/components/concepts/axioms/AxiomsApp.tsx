'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { profile } from '@/data/profile';
import Figure from './Figure';
import Nib from './Nib';
import tolerance from './figures/tolerance';
import constraint from './figures/constraint';
import feedback, {
  SOLVE_TOL,
  zetaOf,
  type FeedbackScene,
} from './figures/feedback';
import convergence from './figures/convergence';
import abstraction from './figures/abstraction';
import phasor from './figures/phasor';
import loadpath from './figures/loadpath';
import type { Scene } from './figures/kit';
import { CHAPTERS, EIGHTH, FACTS, INDEX, NUMERAL_ID } from './content';
import styles from './axioms.module.css';

// ——— figure sizing: height as a function of width (CSS px) ———
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const H = {
  tolerance: (w: number) => (w < 600 ? 520 : cl(w * 0.54, 470, 610)),
  constraint: (w: number) => (w < 600 ? 590 : cl(w * 0.56, 500, 640)),
  feedback: (w: number) => (w < 640 ? 650 : cl(w * 0.54, 540, 600)),
  convergence: (w: number) => (w < 600 ? 470 : cl(w * 0.5, 460, 580)),
  abstraction: (w: number) => (w < 640 ? 780 : cl(w * 0.5, 500, 590)),
  phasor: (w: number) => (w < 960 ? 760 : 480),
  loadpath: (w: number) => (w < 640 ? 690 : cl(w * 0.56, 540, 640)),
};

// log-scale gain slider: u ∈ [0, 1000] → K ∈ [0.2, 9]
const kOf = (u: number) => 0.2 * Math.pow(45, u / 1000);
const uOf = (k: number) =>
  Math.round((1000 * Math.log(k / 0.2)) / Math.log(45));
const U0 = uOf(6);
const makeFeedback = () => feedback(kOf(U0));

/** Axiom line: words rise in one at a time; *word* is the emphasised one. */
function Axiom({
  text,
  as: Tag = 'h2',
  id,
  on,
}: {
  text: string;
  as?: 'h2' | 'p';
  id?: string;
  on?: boolean;
}) {
  const parts = text.split(' ');
  return (
    <Tag id={id} className={styles.axiom} data-on={on ? '' : undefined}>
      {parts.map((p, i) => {
        const em = p.startsWith('*');
        const word = p.replace(/\*/g, '');
        return (
          <span
            key={i}
            className={styles.w}
            style={{ '--i': i } as CSSProperties}
          >
            {em ? <em>{word}</em> : word}
            {i < parts.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </Tag>
  );
}

function ChapterHead({
  numeral,
  title,
  label,
}: {
  numeral: string;
  title: string;
  label?: string;
}) {
  return (
    <div className={styles.chHead}>
      <span className={styles.chNum} aria-hidden>
        {numeral}
      </span>
      <span className={styles.chTitle}>
        {label ?? `Axiom ${numeral} · ${title}`}
      </span>
      <span className={styles.chRule} aria-hidden />
    </div>
  );
}

function Chapter({
  index,
  kind,
  make,
  heightFor,
  ratio,
  mRatio,
  alt,
  hint,
}: {
  index: number;
  kind: string;
  make: () => Scene;
  heightFor: (w: number) => number;
  ratio: number;
  mRatio: number;
  alt: string;
  hint?: string;
}) {
  const c = CHAPTERS[index];
  return (
    <section
      id={c.id}
      className={styles.chapter}
      aria-labelledby={`h-${c.id}`}
      data-chapter={index}
    >
      <ChapterHead numeral={c.numeral} title={c.title} />
      <Axiom text={c.axiom} id={`h-${c.id}`} />
      <Figure
        numeral={c.numeral}
        kind={kind}
        make={make}
        heightFor={heightFor}
        ratio={ratio}
        mRatio={mRatio}
        alt={alt}
        facts={FACTS[c.id]}
        hint={hint}
      />
    </section>
  );
}

function FeedbackChapter({
  eighth,
  onSolve,
}: {
  eighth: boolean;
  onSolve: () => void;
}) {
  const c = CHAPTERS[2];
  const scene = useRef<FeedbackScene | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [u, setU] = useState(U0);
  const K = kOf(u);
  const z = zetaOf(K);
  const ok = Math.abs(z - 1) <= SOLVE_TOL;

  const onScene = useCallback((s: Scene | null) => {
    scene.current = s as FeedbackScene | null;
  }, []);

  const change = (nu: number) => {
    setU(nu);
    const k = kOf(nu);
    scene.current?.setGain(k, true);
    wrap.current
      ?.querySelector('[data-plate]')
      ?.dispatchEvent(new Event('axioms:repaint'));
    if (Math.abs(zetaOf(k) - 1) <= SOLVE_TOL) onSolve();
  };

  return (
    <section
      id={c.id}
      className={styles.chapter}
      aria-labelledby={`h-${c.id}`}
      data-chapter={2}
    >
      <ChapterHead numeral={c.numeral} title={c.title} />
      <Axiom text={c.axiom} id={`h-${c.id}`} />
      <div ref={wrap}>
        <Figure
          numeral={c.numeral}
          kind="closed loop · step response"
          make={makeFeedback}
          heightFor={H.feedback}
          ratio={0.56}
          mRatio={1.75}
          alt="A closed feedback loop: target into a summing junction, then Gemini, Python, Arduino and the arm, with the camera feeding back. Below, the arm's step response for the current gain, with overshoot, damping and settling time readouts."
          facts={FACTS[c.id]}
          onScene={onScene}
          controls={
            <label className={`${styles.gain} ${ok ? styles.gainOk : ''}`}>
              <span className={styles.gainKey}>gain K</span>
              <input
                type="range"
                min={0}
                max={1000}
                step={1}
                value={u}
                onChange={(e) => change(Number(e.target.value))}
                aria-valuetext={`K ${K.toFixed(2)}, damping ${z.toFixed(2)}`}
              />
              <output className={styles.gainVal}>{K.toFixed(2)}</output>
            </label>
          }
          hint={
            ok
              ? 'ζ = 1.00 · it lands.'
              : 'Drag K. Find the one that lands without overshooting.'
          }
        />
      </div>
      {eighth && <Eighth />}
    </section>
  );
}

function Eighth() {
  // three responses of the same loop: ringing, crawling, and exactly damped
  const curve = (zeta: number) => {
    const pts: string[] = [];
    const wn = 2.4;
    let y = 0,
      v = 0;
    const dt = 0.01;
    for (let i = 0; i <= 500; i++) {
      const t = i * dt;
      if (i % 5 === 0)
        pts.push(
          `${(20 + (t / 5) * 300).toFixed(1)},${(120 - y * 80).toFixed(1)}`
        );
      const a = wn * wn * (1 - y) - 2 * zeta * wn * v;
      v += a * dt;
      y += v * dt;
    }
    return pts.join(' ');
  };
  return (
    <aside id={EIGHTH.id} className={styles.eighth} aria-labelledby="h-damping">
      <p className={styles.eighthKey}>
        Axiom {EIGHTH.numeral} · {EIGHTH.title} · you found it
      </p>
      <Axiom text={EIGHTH.axiom} as="p" id="h-damping" on />
      <svg
        className={styles.eighthFig}
        viewBox="0 0 340 150"
        role="img"
        aria-label="Three step responses: one rings past the target, one crawls toward it, and the critically damped one, zeta equals one, arrives fastest without passing it."
      >
        <line x1="20" y1="40" x2="330" y2="40" className={styles.eTarget} />
        <line x1="20" y1="120" x2="330" y2="120" className={styles.eAxis} />
        <polyline points={curve(0.25)} className={styles.eGhost} />
        <polyline points={curve(2.6)} className={styles.eGhost} />
        <polyline points={curve(1)} className={styles.eIdeal} />
        <text x="96" y="20" className={styles.eLab}>
          RINGS
        </text>
        <text x="250" y="88" className={styles.eLab}>
          CRAWLS
        </text>
        <text x="200" y="33" className={`${styles.eLab} ${styles.eLabOn}`}>
          ζ = 1 · LANDS
        </text>
      </svg>
    </aside>
  );
}

function RunningHead({
  bounds,
  eighth,
}: {
  bounds: React.RefObject<HTMLSpanElement | null>;
  eighth: boolean;
}) {
  const [cur, setCur] = useState<number | null>(null);
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-chapter]')
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting)
            setCur(Number((e.target as HTMLElement).dataset.chapter));
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [eighth]);
  const c = cur !== null && cur >= 0 ? CHAPTERS[cur] : null;
  const num = cur === -1 ? '§' : cur === -2 ? '∴' : c ? c.numeral : '';
  const label =
    cur === -1 ? 'Index' : cur === -2 ? 'Contact' : c ? c.title : '';
  return (
    <header className={styles.head}>
      <a href="#top" className={styles.headLink}>
        Axioms
      </a>
      <span ref={bounds} className={styles.headSection} aria-hidden>
        {num && <span className={styles.headNum}>{num}</span>}
        <span className={styles.headTitle}>{label}</span>
      </span>
      <nav className={styles.headNav} aria-label="Site">
        <Link href="/concepts" className={styles.headLink}>
          All cuts
        </Link>
        <a href={profile.resumeUrl} className={styles.headLink}>
          Résumé
        </a>
      </nav>
    </header>
  );
}

function refs(s: string) {
  if (s === 'passim') return <em className={styles.passim}>passim</em>;
  return s.split(', ').map((n, i) => (
    <span key={n}>
      {i > 0 && ', '}
      <a href={`#${NUMERAL_ID[n]}`}>{n}</a>
    </span>
  ));
}

export default function AxiomsApp({
  fontClassName,
}: {
  fontClassName: string;
}) {
  const [eighth, setEighth] = useState(false);
  const headBounds = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);

  const reveal = useCallback((scroll: boolean) => {
    setEighth(true);
    if (scroll) {
      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      window.setTimeout(
        () =>
          document
            .getElementById(EIGHTH.id)
            ?.scrollIntoView({
              behavior: reduce ? 'auto' : 'smooth',
              block: 'center',
            }),
        80
      );
    }
  }, []);
  const onSolve = useCallback(() => reveal(false), [reveal]);

  // the other way in: type the numeral
  useEffect(() => {
    let buf = '';
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const tgt = e.target as HTMLElement | null;
      if (
        tgt &&
        tgt.tagName === 'INPUT' &&
        (tgt as HTMLInputElement).type !== 'range'
      )
        return;
      buf = (buf + e.key.toLowerCase()).slice(-4);
      if (buf === 'viii') reveal(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reveal]);

  // title cards: words rise in when their section enters
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.on = '';
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    el.querySelectorAll(`.${styles.axiom}, .${styles.reveal}`).forEach((n) =>
      io.observe(n)
    );
    return () => io.disconnect();
  }, [eighth]);

  return (
    <div ref={root} className={`${styles.root} ${fontClassName}`} id="top">
      <a href="#tolerance" className={styles.skip}>
        Skip to the first axiom
      </a>
      <RunningHead bounds={headBounds} eighth={eighth} />
      <Nib bounds={headBounds} solved={eighth} />

      <main>
        {/* ——— Title card ——— */}
        <section className={styles.title} aria-labelledby="name">
          <p className={`${styles.kicker} ${styles.reveal}`}>
            Axioms · seven principles, each from a project
          </p>
          <h1 id="name" className={`${styles.name} ${styles.reveal}`}>
            <span>Mohammed</span> <span>Ibrahim Nasir</span>
          </h1>
          <p className={`${styles.role} ${styles.reveal}`}>
            <span className={styles.roleRule} aria-hidden />
            {profile.role} · {profile.location}
            <span className={styles.roleSub}>{profile.tagline}</span>
          </p>
          <p className={`${styles.materials} ${styles.reveal}`}>
            {['Mechanics ·', 'Electronics ·', 'Code ·', 'AI'].map((m, i) => (
              <span key={m} style={{ '--i': i } as CSSProperties}>
                {m}{' '}
              </span>
            ))}
          </p>
          <p className={`${styles.support} ${styles.reveal}`}>
            Robot arms at university. AI agents at Ducon now.
          </p>

          <nav className={styles.contents} aria-label="Contents">
            <ol>
              {CHAPTERS.map((c) => (
                <li key={c.id}>
                  <a href={`#${c.id}`}>
                    <span className={styles.tocNum}>{c.numeral}</span>
                    <span className={styles.tocTitle}>{c.title}</span>
                  </a>
                </li>
              ))}
              <li className={eighth ? undefined : styles.tocGhost}>
                {eighth ? (
                  <a href={`#${EIGHTH.id}`}>
                    <span className={styles.tocNum}>{EIGHTH.numeral}</span>
                    <span className={styles.tocTitle}>{EIGHTH.title}</span>
                  </a>
                ) : (
                  <span title="Hidden in Fig. III" className={styles.tocHidden}>
                    <span className={styles.tocNum}>VIII</span>
                    <span className={styles.tocTitle}>· · ·</span>
                  </span>
                )}
              </li>
            </ol>
          </nav>
        </section>

        <Chapter
          index={0}
          kind="control chart · SAIF generations"
          make={tolerance}
          heightFor={H.tolerance}
          ratio={0.54}
          mRatio={1.52}
          alt="A control chart of SAIF generations over four weeks. Points land inside a tolerance band; a few outside are circled in red, labelled image drift or fails validation, and regenerated. A counter climbs to 57 client designs."
        />
        <Chapter
          index={1}
          kind="feasible set · catalogue RAG"
          make={constraint}
          heightFor={H.constraint}
          ratio={0.56}
          mRatio={1.72}
          alt="A design space of catalogue products. Three hatched constraints, in the catalogue, fits the space and sellable, bound a feasible region. A client's wish is linked to the nearest real product inside it."
          hint="Move or tap inside the design space to place a wish."
        />
        <FeedbackChapter eighth={eighth} onSolve={onSolve} />
        <Chapter
          index={3}
          kind="convergence · time per design"
          make={convergence}
          heightFor={H.convergence}
          ratio={0.5}
          mRatio={1.37}
          alt="Generation time per design falling in four labelled steps from 20+ minutes to 7 minutes, into a 5 to 7 minute band."
        />
        <Chapter
          index={4}
          kind="layer diagram · two stacks"
          make={abstraction}
          heightFor={H.abstraction}
          ratio={0.5}
          mRatio={2.27}
          alt="Two layer stacks. First DeltaX: endpoint, controller, service, repository, SQL Server. Then SAIF: client on WhatsApp, FastAPI, LangGraph, pgvector, deploy. A token travels down and back up each; SAIF has an outer feedback loop from its users."
        />
        <Chapter
          index={5}
          kind="phasor · one sine, three domains"
          make={phasor}
          heightFor={H.phasor}
          ratio={0.52}
          mRatio={2.2}
          alt="A turning radius traces a sine wave through three stretches labelled mechanics, electronics and code, each annotated with the projects built in that material."
        />
        <Chapter
          index={6}
          kind="load path · F / n"
          make={loadpath}
          heightFor={H.loadpath}
          ratio={0.56}
          mRatio={2.0}
          alt="A load F at the top of a body spreads along curved paths to a growing row of supports, from one to thirty; the reaction at each support shrinks to F over n."
        />

        {/* ——— Index ——— */}
        <section
          id="index"
          className={styles.chapter}
          aria-labelledby="h-index"
          data-chapter={-1}
        >
          <ChapterHead
            numeral="§"
            title="Index"
            label="Index · tools, by figure"
          />
          <h2 id="h-index" className={styles.indexTitle}>
            Index
          </h2>
          <dl className={styles.index}>
            {INDEX.map(([term, r]) => (
              <div key={term} className={styles.indexRow}>
                <dt>{term}</dt>
                <dd>{refs(r)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ——— Contact ——— */}
        <section
          id="contact"
          className={`${styles.chapter} ${styles.contact}`}
          aria-labelledby="h-contact"
          data-chapter={-2}
        >
          <ChapterHead
            numeral="∴"
            title="Correspondence"
            label="Correspondence"
          />
          <Axiom text="Get in *touch.*" id="h-contact" />
          <p className={`${styles.support} ${styles.reveal}`}>
            Email works best.
          </p>
          <p className={styles.open}>
            Open to AI engineering roles · remote or UAE
          </p>
          <a href={`mailto:${profile.email}`} className={styles.mail}>
            {profile.email}
          </a>
          <ul className={styles.links}>
            <li>
              <a href={`tel:${profile.phone.replace(/\s/g, '')}`}>
                {profile.phone}
              </a>
            </li>
            <li>
              <a href={profile.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={profile.resumeUrl}>Résumé (PDF)</a>
            </li>
            <li>
              <Link href="/concepts">All cuts</Link>
            </li>
          </ul>

          <figure className={styles.route}>
            <figcaption className={styles.routeCap}>
              Dubai → Hyderabad → Dubai
            </figcaption>
            <ol>
              <li>
                <span className={styles.routeKey}>Dubai</span>
                <span>school to 10th · CBSE 92%</span>
              </li>
              <li>
                <span className={styles.routeKey}>Hyderabad</span>
                <span>11th–12th · 94% · B.E. CSE, MJCET, 2025</span>
              </li>
              <li>
                <span className={styles.routeKey}>Dubai</span>
                <span>AI Engineer · Ducon · now</span>
              </li>
            </ol>
          </figure>

          <p className={styles.colo}>
            Set in Bodoni Moda and Fragment Mono. Every figure is drawn live in
            your browser. ∎
          </p>
        </section>
      </main>
    </div>
  );
}
