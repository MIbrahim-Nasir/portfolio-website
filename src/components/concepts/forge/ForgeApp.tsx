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
import { Board, Controls, Dialogue, Panel } from './Hud';
import type { OverlayRefs } from './Scene';
import {
  LAST,
  OC_DONE,
  OC_LINES,
  OC_MS,
  OC_WORD,
  POKES,
  STEPS,
  tagsFor,
} from './script';
import styles from './forge.module.css';

const Scene = dynamic(() => import('./Scene'), { ssr: false });

const COMPACT = '(max-width: 959px)';

function useMedia(query: string, server = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => server
  );
}

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

export default function ForgeApp({ fontClassName }: { fontClassName: string }) {
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const compact = useMedia(COMPACT);
  const webgl = useSyncExternalStore(noop, hasWebGL, () => true);

  const [step, setStep] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [overclock, setOverclock] = useState(false);
  const [shown, setShown] = useState(0);
  const [spec, setSpec] = useState(false);
  const [bubble, setBubble] = useState<{ text: string; n: number } | null>(
    null
  );

  const beats = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  const taps = useRef<number[]>([]);
  const pokeN = useRef(0);
  const bubbleTimer = useRef(0);
  const ocTimer = useRef(0);
  const idle = useRef(0);
  const hinted = useRef(false);

  const ov: OverlayRefs = {
    panel: useRef(null),
    lead: useRef(null),
    dot: useRef(null),
    cone: useRef(null),
    grad: useRef(null),
    tags: useRef([]),
    tagLines: useRef(null),
    tagDots: useRef(null),
    bubble: useRef(null),
    voice: useRef(null),
    xy: useRef(null),
    grip: useRef(null),
    dialogue: useRef(null),
    board: useRef(null),
  };

  // ---- scroll beats: one viewport of scroll per module
  const beatH = () =>
    beats.current?.firstElementChild?.clientHeight || window.innerHeight;

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollSnapType;
    html.style.scrollSnapType = 'y proximity';
    let raf = 0;
    const measure = () => {
      raf = 0;
      const s = Math.max(
        0,
        Math.min(LAST, Math.round(window.scrollY / beatH()))
      );
      setStep(s);
    };
    const on = () => {
      idle.current = 0;
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      html.style.scrollSnapType = prev;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);

  const go = useCallback(
    (i: number, focus = true) => {
      const s = Math.max(0, Math.min(LAST, i));
      focusNext.current = focus;
      window.scrollTo({
        top: s * beatH(),
        behavior: reduced ? 'auto' : 'smooth',
      });
    },
    [reduced]
  );

  // after a jump, put focus on the new panel's heading
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    const h = ov.panel.current?.querySelector<HTMLElement>('h1, h2');
    h?.focus({ preventScroll: true });
  }, [step, ov]);

  // ---- dialogue: one line at a time, like subtitles
  const lines = overclock ? OC_LINES : STEPS[step].lines;
  useEffect(() => {
    const n = lines.length;
    if (reduced) {
      setShown(n);
      return;
    }
    setShown(0);
    const ids = lines.map((_, i) =>
      window.setTimeout(() => setShown(i + 1), 420 + i * 1250)
    );
    return () => ids.forEach(clearTimeout);
  }, [lines, reduced]);
  const talking = shown > 0 && lines[shown - 1]?.who === 'rivet';

  // ---- Rivet's bubble
  const say = useCallback((text: string, ms = 2600) => {
    window.clearTimeout(bubbleTimer.current);
    setBubble((b) => ({ text, n: (b?.n ?? 0) + 1 }));
    bubbleTimer.current = window.setTimeout(() => setBubble(null), ms);
  }, []);

  // ---- the egg: overclock
  const fire = useCallback(() => {
    if (ocTimer.current) return;
    setBubble(null);
    setOverclock(true);
    ocTimer.current = window.setTimeout(() => {
      ocTimer.current = 0;
      setOverclock(false);
      say(OC_DONE, 3000);
    }, OC_MS);
  }, [say]);

  const onDrone = useCallback(() => {
    idle.current = 0;
    hinted.current = true;
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 2600), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      fire();
      return;
    }
    if (taps.current.length === 1 || taps.current.length === 3) {
      say(POKES[pokeN.current % POKES.length]);
      pokeN.current += 1;
    }
  }, [fire, say]);

  useEffect(() => {
    let buf = '';
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      idle.current = 0;
      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        buf = (buf + e.key.toLowerCase()).slice(-OC_WORD.length);
        if (buf === OC_WORD) {
          buf = '';
          fire();
        }
      }
      const s = Math.max(
        0,
        Math.min(LAST, Math.round(window.scrollY / beatH()))
      );
      if (
        e.key === 'ArrowDown' ||
        e.key === 'PageDown' ||
        (e.key === 'ArrowRight' && !e.shiftKey)
      ) {
        e.preventDefault();
        go(s + 1);
      } else if (
        e.key === 'ArrowUp' ||
        e.key === 'PageUp' ||
        e.key === 'ArrowLeft'
      ) {
        e.preventDefault();
        go(s - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        go(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        go(LAST);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [fire, go]);

  // idle for a while and never met Rivet: he drops the hint once
  useEffect(() => {
    const bump = () => (idle.current = 0);
    window.addEventListener('pointermove', bump, { passive: true });
    const id = window.setInterval(() => {
      idle.current += 1;
      if (idle.current >= 16 && !hinted.current) {
        hinted.current = true;
        say(POKES[2], 4200);
      }
    }, 1000);
    return () => {
      window.removeEventListener('pointermove', bump);
      clearInterval(id);
    };
  }, [say]);

  useEffect(
    () => () => {
      clearTimeout(bubbleTimer.current);
      clearTimeout(ocTimer.current);
    },
    []
  );

  const inputs = useMemo(
    () => ({ step, exploded, reduced, overclock, talking, compact }),
    [step, exploded, reduced, overclock, talking, compact]
  );
  const onPick = useCallback((mi: number) => go(mi + 1), [go]);
  const onInteract = useCallback(() => (idle.current = 0), []);

  const tags = tagsFor(step, exploded, compact);
  const s = STEPS[step];

  return (
    <div
      className={`${fontClassName} ${styles.root}`}
      data-oc={overclock ? '' : undefined}
      data-exploded={exploded ? '' : undefined}
    >
      <a
        className={styles.skip}
        href="#forge-contact"
        onClick={(e) => (e.preventDefault(), go(LAST))}
      >
        Skip to contact
      </a>

      <header className={styles.bar}>
        <a
          className={styles.brand}
          href="#forge-top"
          onClick={(e) => {
            e.preventDefault();
            go(0);
          }}
        >
          <span className={styles.brandMark} aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M4 20V8l8-5 8 5v12" />
              <path d="M8 20v-7h8v7M12 13v7" />
            </svg>
          </span>
          <span className={styles.brandText}>
            <b>FORGE</b>
            <span>night bench · {profile.short}</span>
          </span>
        </a>
        {step !== 0 && (
          <h1 className={styles.srOnly}>
            {profile.name}, {profile.role}
          </h1>
        )}
        <nav className={styles.barNav} aria-label="Site">
          <Link href="/concepts">all cuts</Link>
          <a href={profile.resumeUrl}>resume</a>
          <a
            href="#forge-contact"
            className={styles.barContact}
            onClick={(e) => {
              e.preventDefault();
              go(LAST);
            }}
          >
            contact
          </a>
        </nav>
      </header>

      <div className={styles.stage}>
        <div className={styles.stageBg} aria-hidden />
        {webgl ? (
          <div className={styles.canvasWrap} aria-hidden>
            <Scene
              inputs={inputs}
              overlay={ov}
              onPick={onPick}
              onDrone={onDrone}
              onInteract={onInteract}
              compact={compact}
            />
          </div>
        ) : (
          <p className={styles.noGl}>
            No WebGL here, so no hologram. Every readout still works.
          </p>
        )}

        <svg className={styles.overlay} aria-hidden>
          <defs>
            <linearGradient
              id="forge-cone"
              ref={ov.grad}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#8fdcff" stopOpacity="0.32" />
              <stop offset="0.55" stopColor="#8fdcff" stopOpacity="0.08" />
              <stop offset="1" stopColor="#8fdcff" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          <polygon
            ref={ov.cone}
            className={styles.cone}
            points="0,0"
            fill="url(#forge-cone)"
          />
          <path ref={ov.tagLines} className={styles.tagLines} d="M0 0" />
          <path ref={ov.tagDots} className={styles.tagDots} d="M0 0" />
          <polyline ref={ov.lead} className={styles.lead} points="0,0" />
          <circle
            ref={ov.dot}
            className={styles.leadDot}
            r="3.5"
            cx="-10"
            cy="-10"
          />
        </svg>

        <div
          className={styles.tags}
          key={`${step}-${exploded ? 'x' : ''}-${compact ? 'c' : ''}`}
          aria-hidden
        >
          {tags.map((t, i) => (
            <span
              key={t.label}
              ref={(el) => {
                ov.tags.current[i] = el;
              }}
              className={styles.tag}
              data-left={t.dx < 0 ? '' : undefined}
              style={{
                animationDelay: reduced ? undefined : `${0.5 + i * 0.12}s`,
              }}
            >
              {t.label}
            </span>
          ))}
        </div>

        <div
          ref={ov.voice}
          className={styles.voice}
          data-talk={talking ? '' : undefined}
          aria-hidden
        >
          <span>RIVET</span>
        </div>
        <div
          ref={ov.bubble}
          className={styles.bubble}
          data-on={bubble ? '' : undefined}
          role="status"
        >
          {bubble && <span key={bubble.n}>{bubble.text}</span>}
        </div>

        <Panel
          key={step}
          step={step}
          compact={compact}
          spec={spec}
          onSpec={() => setSpec((v) => !v)}
          go={go}
          overlay={ov}
          reduced={reduced}
        />
      </div>

      {overclock && (
        <p className={styles.ocPill} role="status">
          <span className={styles.ocDial} aria-hidden />
          OVERCLOCK <b>140%</b>
        </p>
      )}

      <Board refEl={ov.board} step={step} exploded={exploded} go={go} />

      <Dialogue
        refEl={ov.dialogue}
        code={overclock ? 'OC!' : s.code}
        lines={lines}
        shown={shown}
        compact={compact}
        oc={overclock}
      >
        <Controls
          step={step}
          exploded={exploded}
          onExplode={() => setExploded((v) => !v)}
          go={go}
        />
      </Dialogue>

      <div ref={beats} className={styles.beats} aria-hidden>
        {STEPS.map((b) => (
          <div key={b.key} className={styles.beat} />
        ))}
      </div>
    </div>
  );
}
