'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { film, subscribe } from './store';

const STEPS = [
  { node: 'plan', text: 'loading type' },
  { node: 'retrieve', text: 'reference photo · ducon' },
  { node: 'render', text: 'sampling 8 point clouds' },
  { node: 'evaluate', text: 'compiling shaders' },
];

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState(-1);
  const [pass, setPass] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const cb = useRef(onDone);
  cb.current = onDone;

  useEffect(() => {
    const t0 = performance.now();
    const shown = { v: 0 };
    let tween: gsap.core.Tween | null = null;

    const finish = () => {
      if (done.current) return;
      done.current = true;
      setPass(true);
      const tl = gsap.timeline({ delay: 0.55, onComplete: () => cb.current() });
      tl.to(root.current!.querySelectorAll('[data-pl]'), {
        opacity: 0,
        y: -14,
        duration: 0.45,
        stagger: 0.03,
        ease: 'power2.in',
      });
      tl.to(
        root.current,
        { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: 'expo.inOut' },
        '-=0.15'
      );
    };

    const sync = () => {
      const s = film.stage;
      setStage(s);
      const target = ((s + 1) / STEPS.length) * 100;
      tween?.kill();
      tween = gsap.to(shown, {
        v: target,
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: () => {
          if (pct.current)
            pct.current.textContent = String(Math.round(shown.v)).padStart(
              3,
              '0'
            );
          if (bar.current)
            bar.current.style.transform = `scaleX(${shown.v / 100})`;
        },
      });
      if (s >= 3) {
        const wait = Math.max(0, 1700 - (performance.now() - t0));
        setTimeout(finish, wait + 500);
      }
    };
    sync();
    const off = subscribe(sync);
    return () => {
      off();
      tween?.kill();
    };
  }, []);

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[80] flex flex-col justify-between bg-[#0a0807] p-[var(--gutter)] py-8"
      style={{ clipPath: 'inset(0 0 0% 0)' }}
      role="status"
      aria-label="Loading"
    >
      <div
        data-pl
        className="mono text-dune flex justify-between text-[11px] tracking-[0.18em] uppercase"
      >
        <span>render(ibrahim)</span>
        <span>langgraph · run 001</span>
      </div>

      <div className="mx-auto w-full max-w-[560px]">
        <p
          data-pl
          className="display text-sand mb-8 text-[clamp(34px,5vw,64px)]"
        >
          Rendering <em>Ibrahim</em>
        </p>
        <ol className="mono space-y-2 text-[13px]">
          {STEPS.map((s, i) => {
            const state = stage > i ? 'ok' : stage === i ? 'run' : 'wait';
            return (
              <li data-pl key={s.node} className="flex items-baseline gap-4">
                <span className="text-dune w-20">{s.node}</span>
                <span
                  className={state === 'wait' ? 'text-sand/30' : 'text-sand/85'}
                >
                  {s.text}
                </span>
                <span className="ml-auto">
                  {state === 'ok' && <span className="text-mint">ok</span>}
                  {state === 'run' && (
                    <span className="text-lantern caret">…</span>
                  )}
                  {state === 'wait' && <span className="text-sand/25">--</span>}
                </span>
              </li>
            );
          })}
          <li data-pl className="flex items-baseline gap-4 pt-3">
            <span className="text-dune w-20">gate</span>
            <span className={pass ? 'text-mint' : 'text-sand/30'}>
              {pass ? 'PASS ✓  shipping' : 'awaiting eval'}
            </span>
          </li>
        </ol>
      </div>

      <div data-pl>
        <div className="mono text-dune mb-3 flex items-end justify-between">
          <span className="text-[11px] tracking-[0.18em] uppercase">
            Mohammed Ibrahim Nasir · AI Engineer
          </span>
          <span
            ref={pct}
            className="text-sand text-[clamp(28px,4vw,48px)] leading-none tabular-nums"
          >
            000
          </span>
        </div>
        <div className="h-px w-full bg-white/10">
          <div
            ref={bar}
            className="bg-ember h-px origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </div>
  );
}
