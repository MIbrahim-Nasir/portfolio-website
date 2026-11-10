'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { profile, scenes } from '@/data/profile';
import { film } from './store';

const FILM_SECONDS = 214; // the "runtime" the scroll maps onto
const FPS = 24;

function timecode(p: number) {
  const total = Math.floor(p * FILM_SECONDS * FPS);
  const f = total % FPS;
  const s = Math.floor(total / FPS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
}

type Line = { id: number; text: string };

function TraceConsole({ scene }: { scene: number }) {
  const [lines, setLines] = useState<Line[]>([]);
  const id = useRef(0);
  useEffect(() => {
    const trace = scenes[scene].trace;
    const timers = trace.map((text, i) =>
      setTimeout(
        () => {
          setLines((l) => [...l, { id: id.current++, text }].slice(-7));
        },
        180 + i * 260
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [scene]);

  return (
    <div
      className="mono pointer-events-none fixed right-[var(--gutter)] bottom-[84px] z-30 hidden w-[340px] rounded-[4px] border border-[var(--line)] bg-[#0a0807]/70 px-4 py-3 text-[11px] leading-[1.7] backdrop-blur-md lg:block"
      aria-hidden
    >
      <div className="text-dune mb-2 flex items-center gap-2">
        <span className="bg-mint h-1.5 w-1.5 rounded-full shadow-[0_0_8px_#7fe6cf]" />
        <span className="tracking-[0.18em] uppercase">
          trace · {scenes[scene].code}
        </span>
      </div>
      <ul>
        {lines.map((l, i) => {
          const [head, ...rest] = l.text.split(/\s{2,}/);
          return (
            <li
              key={l.id}
              className="flex gap-3 transition-opacity duration-500"
              style={{ opacity: 0.25 + (0.75 * (i + 1)) / lines.length }}
            >
              <span className="text-mint/90 w-[68px] shrink-0">{head}</span>
              <span className="text-sand/80 truncate">{rest.join(' ')}</span>
            </li>
          );
        })}
        <li className="caret text-sand/40"> </li>
      </ul>
    </div>
  );
}

export default function Hud({
  scene,
  booted,
  sound,
  onSound,
  onJump,
  onResume,
}: {
  scene: number;
  booted: boolean;
  sound: boolean;
  onSound: () => void;
  onJump: (i: number) => void;
  onResume: () => void;
}) {
  const tc = useRef<HTMLSpanElement>(null);
  const frame = useRef<HTMLSpanElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const total = scenes.reduce((a, s) => a + s.vh, 0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = film.progress;
      if (tc.current) tc.current.textContent = timecode(p);
      if (frame.current)
        frame.current.textContent = String(
          Math.floor(p * FILM_SECONDS * FPS)
        ).padStart(6, '0');
      if (head.current) head.current.style.transform = `scaleX(${p})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!booted || !root.current) return;
    gsap.fromTo(
      root.current.querySelectorAll('[data-hud]'),
      {
        opacity: 0,
        y: (i: number, el: HTMLElement) => (el.dataset.hud === 'b' ? 16 : -16),
      },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.06,
        delay: 0.9,
      }
    );
  }, [booted]);

  const current = scenes[scene];

  return (
    <div ref={root}>
      {/* top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-start justify-between px-[var(--gutter)] pt-5 md:pt-7">
        <button
          data-hud="t"
          onClick={() => onJump(0)}
          className="group flex items-center gap-3 text-left opacity-0"
          data-cursor="top"
          aria-label="Back to the start"
        >
          <span className="wordmark group-hover:bg-ember group-hover:text-night grid h-9 w-9 place-items-center rounded-full border border-[var(--line-strong)] text-[11px] transition-colors">
            IN
          </span>
          <span className="mono text-dune hidden text-[11px] leading-tight tracking-[0.14em] uppercase sm:block">
            Mohammed Ibrahim Nasir
            <br />
            <span className="text-sand">{profile.role}</span> ·{' '}
            {profile.location}
          </span>
        </button>

        <div
          data-hud="t"
          className="mono hidden items-center gap-3 text-[11px] tracking-[0.18em] uppercase opacity-0 md:flex"
        >
          <span className="text-dune">{current.code}</span>
          <span className="h-px w-8 bg-[var(--line-strong)]" />
          <span key={current.id} className="text-sand">
            {current.title}
          </span>
        </div>

        <div
          data-hud="t"
          className="flex items-center gap-2 opacity-0 md:gap-3"
        >
          <span className="mono text-sand hidden items-center gap-2 pr-2 text-[11px] tabular-nums lg:flex">
            <span className="rec-dot" />
            REC <span ref={tc}>00:00:00:00</span>
          </span>
          <button
            onClick={onSound}
            className="btn !px-3 !py-2"
            aria-pressed={sound}
            aria-label={sound ? 'Turn sound off' : 'Turn sound on'}
            data-cursor={sound ? 'mute' : 'sound'}
          >
            <span className="mono hidden text-[11px] tracking-[0.08em] uppercase xl:inline">
              Sound
            </span>
            <span className="flex h-3 items-end gap-[2px]" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-[2px] bg-current transition-all"
                  style={{
                    height: sound ? `${[60, 100, 40, 80][i]}%` : '20%',
                    animation: sound
                      ? `rec ${0.6 + i * 0.17}s ease-in-out infinite`
                      : 'none',
                  }}
                />
              ))}
            </span>
          </button>
          <button onClick={onResume} className="btn !py-2" data-cursor="read">
            Résumé
          </button>
        </div>
      </header>

      <div
        className={`transition-opacity duration-500 ${scene === scenes.length - 1 ? 'opacity-0' : 'opacity-100'}`}
      >
        <TraceConsole scene={scene} />
      </div>

      {/* scrubber */}
      <footer className="fixed inset-x-0 bottom-0 z-30 px-[var(--gutter)] pb-5 md:pb-6">
        <div
          data-hud="b"
          className="mono text-dune mb-2 hidden justify-between text-[10px] tracking-[0.18em] uppercase opacity-0 md:flex"
        >
          <span>
            frame{' '}
            <span ref={frame} className="text-sand tabular-nums">
              000000
            </span>
          </span>
          <span className="hidden lg:inline">
            scroll · ← → to cut · click to disturb · R résumé
          </span>
          <span>32,768 pts · 24 fps</span>
        </div>
        <div data-hud="b" className="relative opacity-0">
          <div className="flex h-7 w-full overflow-hidden rounded-[3px] border border-[var(--line)] bg-black/30 backdrop-blur-sm">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                onClick={() => onJump(i)}
                className={`scrub-seg mono group flex items-center gap-2 px-2 text-left text-[10px] tracking-[0.14em] uppercase transition-colors ${
                  i === scene ? 'text-night' : 'text-dune hover:text-sand'
                }`}
                style={{ width: `${(s.vh / total) * 100}%` }}
                data-cursor="cut"
                aria-label={`Go to ${s.title}`}
              >
                <span
                  className={`bg-sand absolute inset-0 -z-0 transition-opacity duration-500 ${i === scene ? 'opacity-100' : 'opacity-0'}`}
                />
                <span className="relative hidden sm:inline">
                  {s.code.replace('SC.', '')}
                </span>
                <span className="relative hidden truncate md:inline">
                  {s.title}
                </span>
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 -bottom-[5px] h-[2px]">
            <div
              ref={head}
              className="bg-ember h-full origin-left shadow-[0_0_12px_#ff6b2c]"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
