'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Lenis from 'lenis';
import { profile } from '@/data/profile';
import { gsap, ScrollTrigger, useDraft } from './draft';
import { EggCtx, STORE_KEY } from './egg';
import Buddy, { TAP_LINES } from './Buddy';
import S01Title from './S01Title';
import S02Engineer from './S02Engineer';
import S03Saif from './S03Saif';
import S04Arm from './S04Arm';
import S05Gantry from './S05Gantry';
import S06DeltaX from './S06DeltaX';
import S07Route from './S07Route';
import S00Checker from './S00Checker';
import { SHEETS, TOTAL, nn } from './sheets';
import s from './blueprint.module.css';

/* Lines Divi says when you arrive on a sheet (once each). */
const SHEET_LINES: Record<number, string> = {
  3: 'Generation used to take 20+ minutes. Now 5 to 7.',
  5: 'Point at the frame. It drives.',
  7: 'Contact details are in the title block.',
};

export default function Blueprint() {
  const root = useRef<HTMLDivElement>(null);
  const lenis = useRef<Lenis | null>(null);
  const [sheet, setSheet] = useState(1);
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const [line, setLine] = useState<string | null>(null);
  const [docked, setDocked] = useState(true);
  const lineTimer = useRef(0);
  const tapIdx = useRef(0);
  const said = useRef(new Set<number>());
  const justUnlocked = useRef(false);

  useDraft(root);

  const say = useCallback((l: string) => {
    window.clearTimeout(lineTimer.current);
    setLine(l);
    lineTimer.current = window.setTimeout(() => setLine(null), 4600);
  }, []);

  // restore the checker's progress
  useEffect(() => {
    document.body.classList.remove('locked');
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw)
        setChecked(
          new Set(
            (JSON.parse(raw) as number[]).filter((n) => n >= 1 && n <= TOTAL)
          )
        );
    } catch {
      /* storage blocked: start fresh */
    }
    const mq = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
    );
    const apply = () => setDocked(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const unlocked = checked.size >= TOTAL;

  const check = useCallback(
    (n: number) => {
      const had = checked.has(n);
      const next = new Set(checked);
      if (had) next.delete(n);
      else next.add(n);
      setChecked(next);
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      if (had) return;
      const left = TOTAL - next.size;
      if (left === 0) {
        justUnlocked.current = true;
        say('Set checked. Sheet 00 just printed.');
      } else say(`Checked. ${left} to go.`);
    },
    [checked, say]
  );

  // the reward: scroll to the checker's print once it exists
  useEffect(() => {
    if (!unlocked || !justUnlocked.current) return;
    justUnlocked.current = false;
    const t = window.setTimeout(() => {
      ScrollTrigger.refresh();
      const el = document.getElementById('sheet-00');
      if (!el) return;
      if (lenis.current)
        lenis.current.scrollTo(el, { offset: -20, duration: 1.6 });
      else el.scrollIntoView({ behavior: 'auto', block: 'start' });
      el.focus({ preventScroll: true });
    }, 450);
    return () => window.clearTimeout(t);
  }, [unlocked]);

  // smooth scroll, tied to ScrollTrigger; off under reduced motion
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const l = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, anchors: true });
    lenis.current = l;
    l.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    let alive = true;
    document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
    return () => {
      alive = false;
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      l.destroy();
      lenis.current = null;
    };
  }, []);

  // which sheet is under the reader: the one crossing the middle of the viewport
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      for (const n of el.querySelectorAll<HTMLElement>('[data-sheet]')) {
        const r = n.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          setSheet(Number(n.dataset.sheet));
          return;
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Divi speaks on some sheets, and drops a hint if you idle on the title sheet
  useEffect(() => {
    const l = SHEET_LINES[sheet];
    if (l && !said.current.has(sheet)) {
      said.current.add(sheet);
      const t = window.setTimeout(() => say(l), 900);
      return () => window.clearTimeout(t);
    }
  }, [sheet, say]);
  useEffect(() => {
    let t = window.setTimeout(
      () => say('Seven sheets. Scroll down, I measured them all.'),
      9000
    );
    let hinted = false;
    const reset = () => {
      window.clearTimeout(t);
      if (hinted) return;
      t = window.setTimeout(() => {
        hinted = true;
        say('Psst. Every sheet has a CHK box.');
      }, 14000);
    };
    window.addEventListener('pointermove', reset, { passive: true });
    window.addEventListener('scroll', reset, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('pointermove', reset);
      window.removeEventListener('scroll', reset);
    };
  }, [say]);

  const onTap = useCallback(() => {
    say(TAP_LINES[tapIdx.current % TAP_LINES.length]);
    tapIdx.current += 1;
  }, [say]);

  const egg = useMemo(
    () => ({ checked, check, unlocked, say }),
    [checked, check, unlocked, say]
  );
  const cur = SHEETS[sheet - 1] ?? SHEETS[0];

  return (
    <EggCtx.Provider value={egg}>
      <div ref={root} className={s.root}>
        {/* brushed sensitizer edge for each print */}
        <svg
          width="0"
          height="0"
          style={{ position: 'absolute' }}
          aria-hidden="true"
          focusable="false"
        >
          <filter id="bp-brush" x="-3%" y="-3%" width="106%" height="106%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.045"
              numOctaves="2"
              seed="11"
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale="18"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="bp-brush-sm" x="-3%" y="-3%" width="106%" height="106%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04 0.1"
              numOctaves="2"
              seed="11"
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale="9"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        <a href={`#${SHEETS[1].id}`} className={s.skip}>
          Skip to the drawings
        </a>
        <main className={s.main}>
          <S01Title />
          <S02Engineer />
          <S03Saif />
          <S04Arm />
          <S05Gantry />
          <S06DeltaX />
          <S07Route />
          {unlocked && <S00Checker />}
          <p className={s.colophon}>
            End of set · {profile.location} ·{' '}
            <Link href="/concepts">all cuts</Link> ·{' '}
            <a href={profile.resumeUrl} target="_blank" rel="noopener">
              résumé
            </a>
          </p>
        </main>

        <aside className={s.bar} aria-label="Current sheet">
          <div className={s.barBuddy}>
            {docked && <Buddy line={line} docked onTap={onTap} />}
          </div>
          <a className={`${s.barCell} ${s.barSheet}`} href={`#${cur.id}`}>
            <span className={s.tbK}>
              Sheet {nn(sheet)}/{nn(TOTAL)}
            </span>
            <span className={s.barV}>{cur.short}</span>
          </a>
          <div
            className={`${s.barCell} ${s.barChk} ${unlocked ? s.barChkDone : ''}`}
            title="Initial every CHK box"
          >
            <span className={s.tbK}>Chk</span>
            <span className={s.barM}>
              {checked.size}/{TOTAL}
            </span>
          </div>
          <a
            className={s.barCell}
            href={profile.resumeUrl}
            target="_blank"
            rel="noopener"
          >
            <span className={s.tbK}>Print</span>
            <span className={s.barM}>PDF</span>
          </a>
          <Link className={`${s.barCell} ${s.barCuts}`} href="/concepts">
            <span className={s.tbK}>Set</span>
            <span className={s.barM}>Cuts</span>
          </Link>
        </aside>
        {!docked && <Buddy line={line} docked={false} onTap={onTap} />}
      </div>
    </EggCtx.Provider>
  );
}
