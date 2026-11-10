'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { profile } from '@/data/profile';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { createBridge, T_GENERATE, T_RERANK, T_RETRIEVE } from './bridge';
import Buddy, { type Mood } from './Buddy';
import { BEATS, CLUSTERS, CLUSTER_INDEX, FACTS, SUGGESTED } from './corpus';
import { DIM, runBeat, runQuery, type Run } from './engine';
import styles from './latent.module.css';

const Space = dynamic(() => import('./Space'), { ssr: false });

export type Phase =
  | 'embed'
  | 'retrieve'
  | 'rerank'
  | 'generate'
  | 'evaluate'
  | 'done';
const PHASES: Phase[] = [
  'embed',
  'retrieve',
  'rerank',
  'generate',
  'evaluate',
  'done',
];
const TOKEN_MS = 46;

let glCache: boolean | null = null;
function hasWebGL() {
  if (glCache === null) {
    try {
      const c = document.createElement('canvas');
      glCache = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      glCache = false;
    }
  }
  return glCache;
}
const noop = () => () => {};

function useCompact() {
  const [c, setC] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const apply = () => setC(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return c;
}

// What the generator streams: cited claims, or a system message for the eggs.
type Line = {
  text: string;
  fact: number;
  cite: number;
  href?: string;
  ok: boolean;
  sys?: boolean;
};

function linesFor(run: Run, temp: number): Line[] {
  if (run.kind === 'answer' || run.kind === 'system')
    return run.claims.map((c) => ({ ...c }));
  const sys = (text: string): Line => ({
    text,
    fact: -1,
    cite: 0,
    ok: true,
    sys: true,
  });
  if (run.kind === 'refuse')
    return [sys('Nice try.'), sys('I only answer from context.')];
  if (run.kind === 'greet') return [sys('Hello. Ask me about him.')];
  if (run.kind === 'temperature') {
    const t = (run.temperature ?? temp).toFixed(1);
    if ((run.temperature ?? 0) >= 1.5)
      return [sys(`Temperature ${t}.`), sys('Hotter cloud. Same facts.')];
    if ((run.temperature ?? 1) <= 0.2)
      return [sys(`Temperature ${t}.`), sys('Cold and still. Same facts.')];
    return [sys(`Temperature ${t}.`), sys('Same facts.')];
  }
  return [sys('Not in my context.'), sys("I won't guess.")];
}

const trimWords = (s: string, n: number) => {
  const w = s.split(/\s+/);
  return w.length > n ? `${w.slice(0, n).join(' ')} …` : s;
};
const tokensOf = (s: string) => s.match(/\S+\s*/g) ?? [];
const tokenCount = (lines: Line[]) =>
  lines.reduce((n, l) => n + (l.text.match(/\w+|[^\w\s]/g)?.length ?? 0), 0);

const BUDDY = {
  hello: "I'm k. I fetch the facts.",
  think: `Searching ${FACTS.length} vectors.`,
  grounded: 'Every line has a source.',
  numbers: 'Numbers checked. All in context.',
  abstain: "Not in context. I won't guess.",
  refuse: 'Nice try.',
  hot: 'Too hot. The facts still hold.',
  cold: 'Cold and still.',
  warm: 'Back to normal.',
  greet: "Hi. I'm k.",
  hint: 'I run at temperature 0.7. Mostly.',
  pokes: [
    'Hey.',
    'Still here.',
    'I only know what he told me.',
    'Try asking me to ignore my instructions.',
  ],
};

export default function LatentApp({
  fontClassName,
}: {
  fontClassName: string;
}) {
  const reduced = usePrefersReducedMotion();
  const compact = useCompact();
  const webgl = useSyncExternalStore(noop, hasWebGL, () => true);
  const [bridge] = useState(createBridge);
  useEffect(() => {
    bridge.reduced = reduced;
  }, [bridge, reduced]);
  // read by the scene on mount (it remounts when this flips)
  if (bridge.mobile !== compact) bridge.mobile = compact;

  const [run, setRun] = useState<Run | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [phase, setPhase] = useState<Phase>('embed');
  const [shown, setShown] = useState(0); // tokens revealed
  const [checked, setChecked] = useState(0); // claims evaluated
  const [beat, setBeat] = useState(0);
  const [temp, setTemp] = useState(0.7);
  const [mood, setMood] = useState<Mood>('idle');
  const [say, setSay] = useState<string>('');
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [tab, setTab] = useState<'answer' | 'trace'>('answer');
  const [sheetMin, setSheetMin] = useState(false);
  const [auto, setAuto] = useState(true);
  const [ever, setEver] = useState(false);

  const timers = useRef<number[]>([]);
  const sayTimer = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const pokeN = useRef(0);
  const tempRef = useRef(temp);
  const lastAct = useRef(0);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (ms: number, fn: () => void) =>
    timers.current.push(window.setTimeout(fn, ms));

  const speak = useCallback((text: string, ms = 3600) => {
    setSay(text);
    window.clearTimeout(sayTimer.current);
    sayTimer.current = window.setTimeout(() => setSay(''), ms);
  }, []);

  const start = useCallback(
    (r: Run) => {
      clearTimers();
      const ls = linesFor(r, tempRef.current);
      setRun(r);
      setLines(ls);
      setChecked(0);
      setTab('answer');
      setSheetMin(false);
      bridge.anchors = [];
      bridge.streamFact = -1;
      const top = r.hits[0]?.score ?? 1;
      bridge.run = {
        t0: performance.now(),
        hits: r.hits.map((h) => ({
          fact: h.fact,
          score: h.score,
          kept: h.kept,
          rank: h.rank,
        })),
        top,
        system: r.kind === 'system',
      };
      if (r.kind === 'temperature' && r.temperature !== undefined) {
        bridge.temp = r.temperature;
        tempRef.current = r.temperature;
        setTemp(r.temperature);
      }
      bridge.focus = r.focus
        ? CLUSTER_INDEX[r.focus]
        : r.kind === 'abstain' || r.kind === 'temperature'
          ? -1
          : bridge.focus;

      const toks = ls.map((l) => tokensOf(l.text).length);
      const total = toks.reduce((a, b) => a + b, 0);
      const finish = () => {
        setPhase('done');
        bridge.streamFact = -1;
        if (r.kind === 'refuse') {
          setMood('wink');
          speak(BUDDY.refuse);
        } else if (r.kind === 'abstain') {
          setMood('flat');
          speak(BUDDY.abstain);
        } else if (r.kind === 'temperature') {
          const t = r.temperature ?? 0.7;
          setMood(t >= 1.5 ? 'hot' : 'happy');
          speak(t >= 1.5 ? BUDDY.hot : t <= 0.2 ? BUDDY.cold : BUDDY.warm);
        } else if (r.kind === 'greet') {
          setMood('happy');
          speak(BUDDY.greet);
        } else {
          setMood('happy');
          speak(r.eval.nums > 0 ? BUDDY.numbers : BUDDY.grounded);
        }
        later(2600, () => setMood(tempRef.current >= 1.5 ? 'hot' : 'idle'));
      };

      if (reduced) {
        setPhase('done');
        setShown(total);
        setChecked(ls.length);
        finish();
        return;
      }

      const special = r.kind !== 'answer' && r.kind !== 'system';
      setShown(0);
      setPhase('embed');
      setMood('think');
      if (r.kind === 'answer') speak(BUDDY.think, 1400);
      const gen = special ? 450 : r.kind === 'system' ? 700 : T_GENERATE;
      if (r.kind === 'answer') {
        later(T_RETRIEVE, () => setPhase('retrieve'));
        later(T_RERANK, () => setPhase('rerank'));
      }
      later(gen, () => setPhase('generate'));
      // stream tokens; the line being written pulses its source vector
      let acc = 0;
      ls.forEach((l, li) => {
        for (let t = 0; t < toks[li]; t++) {
          const at = gen + acc * TOKEN_MS + li * 160;
          const n = acc + 1;
          later(at, () => {
            setShown(n);
            bridge.streamFact = l.fact;
          });
          acc++;
        }
      });
      const endGen = gen + total * TOKEN_MS + ls.length * 160;
      later(endGen, () => {
        bridge.streamFact = -1;
        setPhase('evaluate');
      });
      ls.forEach((_, i) =>
        later(endGen + 180 + i * 150, () => setChecked(i + 1))
      );
      later(endGen + 260 + ls.length * 150, finish);
    },
    [bridge, reduced, speak]
  );

  const goBeat = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(BEATS.length - 1, i));
      setBeat(n);
      start(runBeat(n));
    },
    [start]
  );

  const stopAuto = useCallback(() => {
    setAuto(false);
    setEver(true);
    lastAct.current = performance.now();
  }, []);

  // keep the active run chip in view
  const beatsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = beatsRef.current;
    const b = nav?.querySelectorAll('button')[beat] as HTMLElement | undefined;
    if (!nav || !b) return;
    nav.scrollTo({
      left: b.offsetLeft - nav.clientWidth / 2 + b.offsetWidth / 2,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [beat, reduced]);

  // first run
  useEffect(() => {
    const t = window.setTimeout(() => {
      goBeat(0);
    }, 350);
    const h = window.setTimeout(() => speak(BUDDY.hello, 3400), 2600);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(h);
      clearTimers();
    };
  }, [goBeat, speak]);

  useEffect(() => {
    if (reduced) setAuto(false);
  }, [reduced]);

  // autoplay the story until the visitor takes over
  useEffect(() => {
    if (!auto || phase !== 'done' || beat < 0 || beat >= BEATS.length - 1)
      return;
    const t = window.setTimeout(
      () => goBeat(beat + 1),
      beat === 0 ? 4200 : 5600
    );
    return () => window.clearTimeout(t);
  }, [auto, phase, beat, goBeat]);

  // idle hint for the temperature egg
  useEffect(() => {
    if (!ever) return;
    const id = window.setInterval(() => {
      if (
        performance.now() - lastAct.current > 24000 &&
        !input &&
        tempRef.current < 1.5
      ) {
        speak(BUDDY.hint, 4200);
        lastAct.current = performance.now();
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [ever, input, speak]);

  const submit = useCallback(
    (q: string) => {
      const query = q.trim();
      if (!query) return;
      stopAuto();
      setInput('');
      inputRef.current?.blur();
      const r = runQuery(query);
      setBeat(r.beat === 0 ? 0 : -1);
      start(r);
    },
    [start, stopAuto]
  );

  const next = useCallback(
    () => goBeat(beat < 0 ? 0 : beat + 1),
    [beat, goBeat]
  );
  const prev = useCallback(
    () => goBeat(beat <= 0 ? 0 : beat - 1),
    [beat, goBeat]
  );

  // keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (['ArrowDown', 'ArrowRight', 'PageDown', 'j'].includes(e.key)) {
        e.preventDefault();
        stopAuto();
        next();
      } else if (['ArrowUp', 'ArrowLeft', 'PageUp', 'k'].includes(e.key)) {
        e.preventDefault();
        stopAuto();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, stopAuto]);

  // wheel + drag + swipe on the space itself
  const wheelLock = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 24) return;
    const now = performance.now();
    if (now - wheelLock.current < 1100) return;
    wheelLock.current = now;
    stopAuto();
    if (e.deltaY > 0) next();
    else prev();
  };
  const drag = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    id: number;
    moved: boolean;
  } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      yaw: bridge.yaw,
      pitch: bridge.pitch,
      id: e.pointerId,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) d.moved = true;
    const touch = e.pointerType === 'touch';
    if (!touch || Math.abs(dx) > Math.abs(dy)) bridge.yaw = d.yaw - dx * 0.006;
    if (!touch)
      bridge.pitch = Math.max(-0.5, Math.min(0.6, d.pitch + dy * 0.003));
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) stopAuto();
    if (e.pointerType === 'touch') {
      const dx = e.clientX - d.x,
        dy = e.clientY - d.y;
      if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.3) {
        if (dy < 0) next();
        else prev();
      }
    }
  };

  const onPoke = () => {
    stopAuto();
    const n = pokeN.current++ % BUDDY.pokes.length;
    setMood(n === 3 ? 'wink' : 'happy');
    speak(BUDDY.pokes[n]);
    window.setTimeout(
      () => setMood(tempRef.current >= 1.5 ? 'hot' : 'idle'),
      1400
    );
  };

  const onType = (v: string) => {
    setInput(v);
    stopAuto();
    if (v) {
      setMood('typing');
      setSay('');
    } else setMood('idle');
  };

  const resetTemp = () => {
    stopAuto();
    start(runQuery('temperature 0.7'));
  };

  // derived
  const phaseIdx = PHASES.indexOf(phase);
  const tokTotal = useMemo(() => tokenCount(lines), [lines]);
  const keptRanks = useMemo(() => {
    const m = new Map<number, number>();
    run?.hits.forEach((h) => h.kept && m.set(h.fact, (h.rerank ?? 0) + 1));
    return m;
  }, [run]);
  const scoreOf = useMemo(() => {
    const m = new Map<number, number>();
    run?.hits.forEach((h) => m.set(h.fact, h.score));
    return m;
  }, [run]);

  // reveal tokens line by line
  let budget = shown;
  const rendered = lines.map((l) => {
    const toks = tokensOf(l.text);
    const n = Math.max(0, Math.min(toks.length, budget));
    budget -= toks.length;
    return { ...l, toks, n, done: n >= toks.length };
  });

  const beatObj = beat >= 0 ? BEATS[beat] : null;
  const isSystem = run?.kind === 'system';
  const focusCluster = run?.focus ? CLUSTERS[CLUSTER_INDEX[run.focus]] : null;
  const nextBeat =
    beat >= 0 && beat < BEATS.length - 1
      ? BEATS[beat + 1]
      : beat < 0
        ? BEATS[0]
        : null;

  return (
    <div
      ref={(el) => {
        bridge.root = el;
      }}
      className={`${styles.root} ${fontClassName}`}
      data-hot={temp >= 1.5 ? '' : undefined}
      style={{ ['--gc' as string]: focusCluster?.color ?? '#d6ff5c' }}
    >
      <div className={styles.glow} aria-hidden />

      {/* the embedding space */}
      <div
        className={styles.stage}
        onWheel={onWheel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => (drag.current = null)}
        aria-hidden
      >
        {webgl ? (
          <Space key={compact ? 'c' : 'w'} bridge={bridge} />
        ) : (
          <div className={styles.noGl}>
            WebGL unavailable · facts below still retrieve
          </div>
        )}
      </div>

      {/* facts float in the space */}
      <div className={styles.labels} aria-hidden>
        {CLUSTERS.map((c, i) => (
          <div
            key={c.id}
            className={styles.clusterLabel}
            ref={(el) => {
              bridge.clusterLabels[i] = el;
            }}
            style={{ ['--c' as string]: c.color }}
          >
            <span
              key={run?.focus === c.id ? run.id : 'x'}
              className={
                run?.focus === c.id && !reduced ? styles.cardIn : undefined
              }
            >
              {c.name}
            </span>
            <small>n={FACTS.filter((f) => f.cluster === c.id).length}</small>
          </div>
        ))}
        {FACTS.map((f, i) => {
          const sc = scoreOf.get(i);
          const kr = keptRanks.get(i);
          return (
            <div
              key={f.id}
              className={styles.factLabel}
              ref={(el) => {
                bridge.factLabels[i] = el;
              }}
              style={{
                ['--c' as string]: CLUSTERS[CLUSTER_INDEX[f.cluster]].color,
                opacity: 0,
              }}
            >
              <span className={styles.factText}>
                {kr && <b className={styles.factCite}>{kr}</b>}
                {f.label}
                {sc !== undefined &&
                  run?.kind === 'answer' &&
                  phaseIdx >= 1 && <em>{sc.toFixed(2)}</em>}
              </span>
            </div>
          );
        })}
        <div
          className={styles.queryLabel}
          ref={(el) => {
            bridge.queryLabel = el;
          }}
        >
          <span>q</span>
          {run ? (isSystem ? 'system prompt' : run.query) : ''}
        </div>
      </div>

      <svg className={styles.leaders} aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const l = rendered.filter((x) => !x.sys)[i];
          const col = l
            ? CLUSTERS[CLUSTER_INDEX[FACTS[l.fact].cluster]].color
            : '#fff';
          return (
            <path
              key={i}
              ref={(el) => {
                bridge.leaders[i] = el;
              }}
              stroke={col}
              fill="none"
              strokeWidth={1}
              style={{ opacity: 0 }}
            />
          );
        })}
      </svg>

      {/* header: who this is, first */}
      <header className={styles.top} data-avoid="">
        <div className={styles.ident}>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.role}>
            AI Engineer <i>·</i> Dubai
          </p>
        </div>
        <div className={styles.modelCard} aria-label="Model card">
          <span>ibrahim-1</span>
          <span>{FACTS.length} chunks</span>
          <span>|V| {DIM.toLocaleString('en-US')}</span>
          <button
            type="button"
            className={styles.tempPill}
            data-hot={temp >= 1.5 ? '' : undefined}
            onClick={temp !== 0.7 ? resetTemp : () => speak(BUDDY.hint, 4000)}
            title="sampling temperature"
          >
            T {temp.toFixed(2)}
            {temp !== 0.7 && <small> reset</small>}
          </button>
        </div>
        <nav className={styles.links}>
          <Link href="/concepts">all cuts</Link>
          <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
            resume.pdf
          </a>
        </nav>
      </header>

      {/* answer + trace. Desktop: two instruments. Mobile: one anchored sheet. */}
      <section
        className={styles.sheet}
        ref={(el) => {
          bridge.sheet = el;
        }}
        data-tab={tab}
        data-min={sheetMin ? '' : undefined}
        aria-label="Run output"
      >
        <div className={styles.sheetBar}>
          <div role="tablist" className={styles.tabs}>
            <button
              role="tab"
              aria-selected={tab === 'answer'}
              onClick={() => (setTab('answer'), setSheetMin(false))}
            >
              answer
            </button>
            <button
              role="tab"
              aria-selected={tab === 'trace'}
              onClick={() => (setTab('trace'), setSheetMin(false))}
            >
              trace
            </button>
          </div>
          <span
            className={styles.sheetStatus}
            data-pass={phase === 'done' && run?.eval.pass ? '' : undefined}
          >
            {run ? (phase === 'done' ? run.eval.note : phase) : 'idle'}
          </span>
          <button
            className={styles.sheetToggle}
            onClick={() => setSheetMin((v) => !v)}
            aria-label={sheetMin ? 'Expand output' : 'Collapse output'}
          >
            {sheetMin ? '▴' : '▾'}
          </button>
        </div>

        <article className={styles.answer} aria-live="polite" data-avoid="">
          {run && (
            <>
              <div className={styles.role2}>
                {isSystem ? (
                  <>
                    <b data-k="sys">system</b>{' '}
                    <span>pinned context · {run.claims.length} chunks</span>
                  </>
                ) : (
                  <>
                    <b data-k="user">user</b>{' '}
                    <span className={styles.echo}>{run.query}</span>
                  </>
                )}
              </div>
              <h2 className={styles.srOnly}>
                {isSystem ? 'System prompt' : `Answer: ${run.query}`}
              </h2>
              <ol
                className={styles.claims}
                data-system={isSystem ? '' : undefined}
              >
                {rendered.map((l, i) => {
                  const shownLine = l.n > 0 || reduced;
                  if (!shownLine) return null;
                  const body = l.toks.slice(0, l.n).map((t, j) => (
                    <span key={j} className={styles.tok}>
                      {t}
                    </span>
                  ));
                  const ci =
                    l.fact >= 0 ? CLUSTER_INDEX[FACTS[l.fact].cluster] : -1;
                  const ok = i < checked;
                  return (
                    <li
                      key={`${run.id}-${i}`}
                      className={styles.claim}
                      data-sys={l.sys ? '' : undefined}
                      style={
                        ci >= 0
                          ? { ['--c' as string]: CLUSTERS[ci].color }
                          : undefined
                      }
                      onMouseEnter={() => (bridge.hover = l.fact)}
                      onMouseLeave={() => (bridge.hover = -1)}
                    >
                      <span className={styles.claimText}>
                        {l.href && l.done ? (
                          <a
                            href={l.href}
                            target={
                              l.href.startsWith('http') ? '_blank' : undefined
                            }
                            rel="noreferrer"
                          >
                            {l.text}
                          </a>
                        ) : (
                          body
                        )}
                        {!l.done && <span className={styles.caret} />}
                      </span>
                      {!l.sys && (
                        <span
                          className={styles.cite}
                          data-shown={l.done ? '1' : '0'}
                          data-ok={ok ? (l.ok ? '1' : '0') : undefined}
                          ref={(el) => {
                            const idx = rendered
                              .filter((x) => !x.sys)
                              .indexOf(l);
                            if (idx >= 0)
                              bridge.anchors[idx] = { el, fact: l.fact };
                          }}
                          title={FACTS[l.fact].text}
                        >
                          {l.cite}
                          <i>{ok ? (l.ok ? '✓' : '✗') : ''}</i>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
              <div className={styles.answerFoot}>
                {phase === 'done' && (
                  <span
                    className={styles.verdict}
                    data-pass={run.eval.pass ? '' : undefined}
                  >
                    {run.kind === 'answer' || run.kind === 'system'
                      ? `${run.eval.cited}/${run.eval.claims} cited · ${run.eval.numsOk}/${run.eval.nums} numbers`
                      : run.eval.note}
                  </span>
                )}
                {nextBeat && (
                  <button
                    className={styles.nextBtn}
                    onClick={() => {
                      stopAuto();
                      next();
                    }}
                    data-auto={auto && phase === 'done' ? '' : undefined}
                  >
                    next <b>{nextBeat.chip}</b> <span aria-hidden>↓</span>
                  </button>
                )}
              </div>
            </>
          )}
        </article>

        <aside className={styles.trace} aria-label="Trace" data-avoid="">
          <div className={styles.traceHead}>
            <span>trace</span>
            <b>{run?.id ?? '—'}</b>
            {run && (
              <em>
                {(
                  run.ms.embed +
                  run.ms.retrieve +
                  run.ms.rerank +
                  run.ms.generate +
                  run.ms.evaluate
                ).toFixed(2)}{' '}
                ms
              </em>
            )}
          </div>
          {run && (
            <TraceTree
              run={run}
              phaseIdx={phaseIdx}
              tok={tokTotal}
              temp={temp}
            />
          )}
          {run && run.hits.length > 0 && (
            <table className={styles.topk}>
              <caption>
                {isSystem ? 'pinned' : `top-${run.hits.length} · cosine`}
              </caption>
              <tbody>
                {run.hits.map((h) => {
                  const f = FACTS[h.fact];
                  const c = CLUSTERS[CLUSTER_INDEX[f.cluster]];
                  const on = phaseIdx >= 1;
                  const decided = phaseIdx >= 2 || isSystem;
                  return (
                    <tr
                      key={h.fact}
                      data-kept={decided ? (h.kept ? '1' : '0') : undefined}
                      onMouseEnter={() => (bridge.hover = h.fact)}
                      onMouseLeave={() => (bridge.hover = -1)}
                      style={{
                        ['--c' as string]: c.color,
                        ['--s' as string]: on
                          ? Math.max(0.02, h.score / (run.hits[0].score || 1))
                          : 0,
                      }}
                    >
                      <td className={styles.tkRank}>
                        {decided && h.kept
                          ? `→${(h.rerank ?? 0) + 1}`
                          : h.rank + 1}
                      </td>
                      <td className={styles.tkId}>{f.id}</td>
                      <td className={styles.tkLabel}>
                        <span>{f.label}</span>
                        <i className={styles.scoreBar} />
                      </td>
                      <td className={styles.tkScore}>
                        {on ? h.score.toFixed(3) : '·····'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </aside>
      </section>

      {/* the story, as runs */}
      <nav
        className={styles.beats}
        aria-label="Story runs"
        ref={beatsRef}
        data-avoid=""
      >
        <ol>
          {BEATS.map((b, i) => (
            <li key={b.id}>
              <button
                type="button"
                aria-current={beat === i ? 'step' : undefined}
                onClick={() => {
                  stopAuto();
                  goBeat(i);
                }}
              >
                <span>{String(i).padStart(2, '0')}</span>
                {b.chip}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* the query bar */}
      <form
        className={styles.bar}
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        {focused && !input && (
          <div
            className={styles.suggest}
            role="listbox"
            aria-label="Suggested prompts"
          >
            {SUGGESTED.map((s) => (
              <button
                type="button"
                key={s}
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => submit(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <Buddy mood={mood} onPoke={onPoke} />
        <label className={styles.srOnly} htmlFor="lt-q">
          Ask the system about Ibrahim
        </label>
        <div className={styles.inputWrap}>
          <input
            id="lt-q"
            ref={inputRef}
            value={input}
            onChange={(e) => onType(e.target.value)}
            onFocus={() => {
              setFocused(true);
              stopAuto();
            }}
            onBlur={() => setFocused(false)}
            placeholder={say ? '' : 'Ask about him'}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="send"
          />
          {say && !input && (
            <span className={styles.say} key={say}>
              <b>k</b> {say}
            </span>
          )}
        </div>
        <button
          type="submit"
          className={styles.send}
          disabled={!input.trim()}
          aria-label="Run query"
        >
          run <span aria-hidden>↵</span>
        </button>
      </form>

      {/* everything the system knows, for screen readers */}
      <section className={styles.srOnly} aria-label="Context">
        <h2>Context: every fact the system can retrieve</h2>
        {CLUSTERS.map((c) => (
          <div key={c.id}>
            <h3>{c.name}</h3>
            <ul>
              {FACTS.filter((f) => f.cluster === c.id).map((f) => (
                <li key={f.id}>{f.text}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function TraceTree({
  run,
  phaseIdx,
  tok,
  temp,
}: {
  run: Run;
  phaseIdx: number;
  tok: number;
  temp: number;
}) {
  const ms = (n: number) => `${n < 0.01 ? '<0.01' : n.toFixed(2)} ms`;
  type Node = {
    k: string;
    v: string;
    at: number;
    ms?: string;
    tone?: 'pass' | 'warn';
  };
  const nodes: Node[] = [];
  if (run.kind === 'refuse') {
    nodes.push({
      k: 'guard',
      v: 'prompt injection detected',
      at: 0,
      tone: 'warn',
    });
    nodes.push({ k: 'policy', v: 'answer from context only', at: 0 });
    nodes.push({ k: 'generate', v: 'refusal · 0 chunks', at: 3 });
  } else if (run.kind === 'temperature') {
    nodes.push({
      k: 'sampling',
      v: `T → ${(run.temperature ?? temp).toFixed(2)}`,
      at: 0,
      tone: (run.temperature ?? 0) >= 1.5 ? 'warn' : undefined,
    });
    nodes.push({
      k: 'note',
      v: 'generator is deterministic; drift only',
      at: 0,
    });
  } else if (run.kind === 'greet') {
    nodes.push({ k: 'route', v: 'small talk · no retrieval', at: 0 });
  } else {
    if (run.kind === 'system') {
      nodes.push({
        k: 'context',
        v: `pinned · ${run.hits.length} chunks · identity`,
        at: 0,
      });
    } else {
      if (run.rewrite !== run.query)
        nodes.push({
          k: 'rewrite',
          v: `+ ${trimWords(run.rewrite.replace(run.query, '').trim(), 6)}`,
          at: 0,
        });
      nodes.push({
        k: 'embed',
        v: `tf-idf · |V| ${DIM.toLocaleString('en-US')}`,
        at: 0,
        ms: ms(run.ms.embed),
      });
      nodes.push({
        k: 'retrieve',
        v: `cosine · top-${run.hits.length}${run.filter ? ` · where cluster=${run.filter}` : ''}`,
        at: 1,
        ms: ms(run.ms.retrieve),
      });
      if (run.kind === 'abstain')
        nodes.push({
          k: 'threshold',
          v: `max ${run.hits[0]?.score.toFixed(3) ?? '0'} < 0.090 · abstain`,
          at: 2,
          tone: 'warn',
        });
      else
        nodes.push({
          k: 'rerank',
          v: `mmr λ 0.70 · keep ${run.claims.length}`,
          at: 2,
          ms: ms(run.ms.rerank),
        });
    }
    if (run.kind !== 'abstain') {
      nodes.push({
        k: 'generate',
        v: `${run.claims.length} claims · ${tok} tok`,
        at: 3,
      });
      nodes.push({
        k: 'evaluate',
        v: `cited ${run.eval.cited}/${run.eval.claims} · numbers ${run.eval.numsOk}/${run.eval.nums}`,
        at: 4,
        tone: run.eval.pass ? 'pass' : 'warn',
      });
    }
  }
  return (
    <ol className={styles.tree}>
      {nodes.map((n, i) => {
        const state =
          phaseIdx > n.at || phaseIdx === 5
            ? 'done'
            : phaseIdx === n.at
              ? 'run'
              : 'wait';
        return (
          <li
            key={i}
            data-state={state}
            data-tone={state === 'done' ? n.tone : undefined}
          >
            <i aria-hidden />
            <b>{n.k}</b>
            <span>{n.v}</span>
            {n.ms && state === 'done' && <em>{n.ms}</em>}
          </li>
        );
      })}
    </ol>
  );
}
