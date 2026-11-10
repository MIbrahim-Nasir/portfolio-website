'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { profile } from '@/data/profile';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { N, buddy, chapters, rings, travel } from './data';
import { atom, now } from './store';
import Buddy from './Buddy';
import styles from './atom.module.css';

const Scene = dynamic(() => import('./Scene'), { ssr: false });

const SEC = 1.4; // scroll length of a chapter, in viewport heights

function useNarrow(query = '(max-width: 759px)') {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [query]);
  return narrow;
}

export default function AtomApp({ fontClassName }: { fontClassName: string }) {
  const reduced = usePrefersReducedMotion();
  const narrow = useNarrow();
  const [mounted, setMounted] = useState(false);
  const [ch, setCh] = useState(0);
  const [settled, setSettled] = useState(true);
  const [egg, setEgg] = useState(0);
  const progress = useRef<HTMLSpanElement>(null);
  const clicks = useRef({ n: 0, at: 0 });

  useEffect(() => {
    atom.reduced = reduced;
    atom.narrow = narrow;
  }, [reduced, narrow]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // scroll -> chapter position
  useEffect(() => {
    const html = document.documentElement;
    const prevSnap = html.style.scrollSnapType;
    html.style.scrollSnapType = 'y proximity';
    const read = () => {
      const sec = window.innerHeight * SEC;
      atom.p = Math.min(N - 1, Math.max(0, window.scrollY / sec));
      const tr = travel(atom.p);
      atom.chapter = tr.active;
      setCh(tr.active);
      setSettled(tr.settled);
      if (progress.current)
        progress.current.style.setProperty('--p', String(atom.p / (N - 1)));
    };
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      html.style.scrollSnapType = prevSnap;
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  const go = useCallback(
    (i: number) => {
      const j = Math.min(N - 1, Math.max(0, i));
      window.scrollTo({
        top: j * window.innerHeight * SEC,
        behavior: reduced ? 'auto' : 'smooth',
      });
    },
    [reduced]
  );

  const blowUp = useCallback(() => {
    atom.eggAt = now();
    atom.clicks = 0;
    clicks.current.n = 0;
    setEgg((e) => e + 1);
    window.setTimeout(() => atom.say?.(buddy.egg, 4200), reduced ? 0 : 900);
  }, [reduced]);

  // keyboard: chapters on up/down, orbit on left/right, digits jump, "ib" is the egg
  useEffect(() => {
    let buf = '';
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      )
        return;
      const cur = travel(atom.p).active;
      const k = e.key;
      if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) {
        e.preventDefault();
        go(cur + 1);
      } else if (
        k === 'ArrowUp' ||
        k === 'PageUp' ||
        (k === ' ' && e.shiftKey)
      ) {
        e.preventDefault();
        go(cur - 1);
      } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
        atom.yaw = Math.max(
          -80,
          Math.min(80, atom.yaw + (k === 'ArrowLeft' ? -18 : 18))
        );
        atom.releasedAt = now();
      } else if (k === 'Home') {
        e.preventDefault();
        go(0);
      } else if (k === 'End') {
        e.preventDefault();
        go(N - 1);
      } else if (/^[0-7]$/.test(k)) {
        go(Number(k));
      }
      if (k.length === 1) {
        buf = (buf + k.toLowerCase()).slice(-2);
        if (buf === 'ib') {
          buf = '';
          blowUp();
        }
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go, blowUp]);

  // pointer: parallax for mice, drag to orbit for everyone (touch: horizontal drags only)
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = atom.pointer;
      p.x = e.clientX;
      p.y = e.clientY;
      if (e.pointerType === 'mouse') {
        p.nx = (e.clientX / window.innerWidth) * 2 - 1;
        p.ny = (e.clientY / window.innerHeight) * 2 - 1;
        p.moved = now();
      }
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    on: boolean;
    touch: boolean;
  } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('a,button')) return;
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      on: false,
      touch: e.pointerType !== 'mouse',
    };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.hypot(dx, dy) < 6) return;
      if (d.touch && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // vertical: let the page scroll
        return;
      }
      d.on = true;
      atom.dragging = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    atom.yaw = Math.max(-90, Math.min(90, atom.yaw - dx * 0.28));
    if (!d.touch)
      atom.pitch = Math.max(-35, Math.min(35, atom.pitch + dy * 0.18));
    d.x = e.clientX;
    d.y = e.clientY;
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.on) {
      atom.dragging = false;
      atom.releasedAt = now();
    }
  };

  // seven clicks on the core
  const poke = () => {
    const T = now();
    const n = T - clicks.current.at > 2.5 ? 1 : clicks.current.n + 1;
    clicks.current = { n, at: T };
    atom.clicks = n;
    atom.clickAt = T;
    if (n >= 7) blowUp();
    else if (n === 3) atom.say?.('keep going.', 1800);
  };

  const chap = chapters[ch];
  const activeRing = chap.ring;
  const showStations = settled && !!chap.stations;

  return (
    <div
      className={`${styles.root} ${fontClassName}`}
      data-ch={chap.id}
      data-reduced={reduced}
      data-panel={chap.id === 'ai' || chap.id === 'contact'}
    >
      <a
        href="#contact"
        className={styles.skip}
        onClick={(e) => (e.preventDefault(), go(N - 1))}
      >
        Skip to contact
      </a>

      <div
        className={styles.stage}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-hidden
      >
        {mounted && <Scene narrow={narrow} />}
      </div>

      {/* everything below rides the atom: positions are written by the scene each frame */}
      <div className={styles.layer} aria-hidden>
        {rings.map((r, i) => (
          <span
            key={r.id}
            className={styles.tag}
            data-on={activeRing === i}
            data-hero={activeRing < 0}
            data-vis="0"
            ref={(n) => {
              atom.tags[i] = n;
            }}
          >
            <span className={styles.tagName}>{r.name}</span>
            <span className={styles.tagSpec}>
              R{r.r.toFixed(2)} · i{r.incl > 0 ? '+' : '−'}
              {Math.abs(r.incl)}°
            </span>
          </span>
        ))}

        {chapters.map((c) =>
          (c.stations ?? []).map((s, j) => (
            <div
              key={`${c.id}:${s.k}`}
              className={styles.station}
              data-on={showStations && c.id === chap.id}
              data-vis="0"
              data-side="r"
              style={{ '--i': j } as CSSProperties}
              ref={(n) => {
                atom.stations[`${c.id}:${s.k}`] = n;
              }}
            >
              <span className={styles.sDot} />
              <span className={styles.sNum}>
                {String(j + 1).padStart(2, '0')}
              </span>
              <span className={styles.sBody}>
                <span className={styles.sK}>{s.k}</span>
                {s.v && <span className={styles.sV}>{s.v}</span>}
              </span>
            </div>
          ))
        )}
      </div>

      {/* readouts that sit on the core */}
      <div
        className={styles.core}
        data-ch={chap.id}
        ref={(n) => {
          atom.coreEl = n;
        }}
      >
        <div
          className={styles.panel}
          data-on={settled && chap.id === 'ai'}
          data-k="ai"
        >
          <span className={styles.kicker}>
            <b>01</b> AI systems · in production
          </span>
          <h2 className={styles.pTitle}>{chapters[1].title}</h2>
          <p className={styles.pMeta}>{chapters[1].meta}</p>
          <p className={styles.pLine}>{chapters[1].line}</p>
          <ul className={styles.pTags}>
            {chapters[1].stations!.map((s) => (
              <li key={s.k}>{s.k}</li>
            ))}
          </ul>
          <dl className={styles.stats}>
            {chapters[1].stats!.map((s, j) => (
              <div key={s.u} style={{ '--i': j } as CSSProperties}>
                <dt>{s.n}</dt>
                <dd>{s.u}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className={styles.panel}
          data-on={settled && chap.id === 'contact'}
          data-k="contact"
          inert={!(settled && chap.id === 'contact')}
        >
          <span className={styles.kicker}>
            <b>07</b> open channel
          </span>
          <p className={styles.pLine}>
            Open to AI engineering roles. Remote or UAE.
          </p>
          <a className={styles.email} href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <ul className={styles.links}>
            <li>
              <a href={`tel:${profile.phone.replace(/\s/g, '')}`}>
                {profile.phone}
              </a>
            </li>
            <li>
              <a href={profile.linkedin} target="_blank" rel="noopener">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={profile.github} target="_blank" rel="noopener">
                GitHub
              </a>
            </li>
            <li>
              <a href={profile.resumeUrl} target="_blank" rel="noopener">
                Résumé
              </a>
            </li>
          </ul>
        </div>
      </div>

      <button
        type="button"
        className={styles.coreBtn}
        aria-label="The core. Click it."
        onClick={poke}
        data-egg={egg}
        ref={(n) => {
          atom.coreBtn = n;
        }}
      />

      {/* identity */}
      <div className={styles.hero} data-on={ch === 0}>
        <span className={styles.kicker}>
          <b>00</b> ident
        </span>
        <h1 className={styles.name}>
          <span>Mohammed</span> <span>Ibrahim Nasir</span>
        </h1>
        <p className={styles.role}>
          AI Engineer <i>/</i> agents · RAG · LLM evals <i>/</i> Dubai
        </p>
      </div>

      {/* phones: the active chapter's stations as a numbered readout */}
      <ol
        className={styles.sheet}
        data-on={showStations && chap.id !== 'ai'}
        aria-hidden
      >
        {(chap.stations ?? []).map((s, j) => (
          <li key={`${chap.id}:${s.k}`} style={{ '--i': j } as CSSProperties}>
            <span className={styles.sNum}>
              {String(j + 1).padStart(2, '0')}
            </span>
            <span className={styles.sK}>{s.k}</span>
            {s.v && <span className={styles.sV}>{s.v}</span>}
          </li>
        ))}
      </ol>

      {/* HUD */}
      <header className={styles.bar}>
        <button
          type="button"
          className={styles.brand}
          onClick={() => go(0)}
          aria-label="Back to the top"
        >
          <span className={styles.brandMark} aria-hidden />
          <span>M. Ibrahim Nasir</span>
        </button>
        <nav className={styles.barNav} aria-label="Page">
          <Link href="/concepts">All cuts</Link>
          <a href={profile.resumeUrl} target="_blank" rel="noopener">
            Résumé
          </a>
        </nav>
      </header>

      <nav className={styles.index} aria-label="Chapters">
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === ch ? 'step' : undefined}
                className={styles.idx}
              >
                <span className={styles.idxN}>{c.n}</span>
                <span className={styles.idxName}>{c.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.mobileNav}>
        <span className={styles.mnLabel}>
          <b>{chap.n}</b>
          <i>/0{N - 1}</i> {chap.name}
        </span>
        <span className={styles.mnBtns}>
          <button
            type="button"
            onClick={() => go(ch - 1)}
            disabled={ch === 0}
            aria-label="Previous chapter"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => go(ch + 1)}
            disabled={ch === N - 1}
            aria-label="Next chapter"
          >
            ↓
          </button>
        </span>
      </div>

      <div className={styles.rail} aria-hidden>
        <span className={styles.railTrack} ref={progress}>
          {chapters.map((c, i) => (
            <span
              key={c.id}
              className={styles.railTick}
              style={{ '--t': i / (N - 1) } as CSSProperties}
              data-on={i === ch}
            >
              {c.n}
            </span>
          ))}
          <span className={styles.railMark}>
            <Buddy />
          </span>
        </span>
      </div>

      <footer className={styles.foot} aria-hidden>
        <span className={styles.footCam}>
          <i>CAM</i>
          <span
            ref={(n) => {
              atom.hud = n;
            }}
          />
        </span>
        <span className={styles.footMove} key={chap.id}>
          <i>MOVE</i> {chap.move}
        </span>
        <span className={styles.footGeo}>25.2048°N 55.2708°E · DXB</span>
        <span className={styles.footHint}>
          {narrow ? 'swipe ↕ · drag ↔' : 'scroll · drag · ← → ↑ ↓'}
        </span>
      </footer>

      <div className={styles.frame} aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* the scroll track, and the full text for screen readers */}
      <main className={styles.track}>
        {chapters.map((c, i) => (
          <section
            key={c.id}
            id={c.id}
            className={styles.sec}
            data-last={i === N - 1}
          >
            <div className={styles.sr}>
              <h2>
                {i === 0
                  ? `${profile.name}, ${profile.role}, ${profile.location}`
                  : c.name}
              </h2>
              {c.title && <p>{`${c.title}. ${c.meta}. ${c.line}`}</p>}
              {c.stats && (
                <ul>
                  {c.stats.map((s) => (
                    <li key={s.u}>{`${s.n} ${s.u}`}</li>
                  ))}
                </ul>
              )}
              {c.stations && (
                <ul>
                  {c.stations.map((s) => (
                    <li key={s.k}>{s.v ? `${s.k}: ${s.v}` : s.k}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
