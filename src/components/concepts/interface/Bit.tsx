'use client';

// Bit: the signal, with eyes. It rides the front of the line (the 60% mark), takes the colour of whatever domain it
// is in, hops at each interface, and hides inside the figures (where the figure's own dot, also Bit, carries it).
// Easter egg: press ` or type "sudo" (or tap Bit five times) to see the raw bytes of the signal where it is.
import { useEffect, useRef, useState, type RefObject } from 'react';
import { D, type DomainId } from './domains';
import { PAYLOAD, dump } from './debug';
import s from './interface.module.css';

const FORM: Record<DomainId, string> = {
  identity: 'idle',
  optics: 'light',
  ai: 'tokens',
  software: 'objects',
  firmware: 'bits',
  electronics: 'volts',
  mechanics: 'torque',
  people: 'people',
  contact: 'you',
};

export default function Bit({
  root,
  at,
}: {
  root: RefObject<HTMLDivElement | null>;
  at: DomainId;
}) {
  const [riding, setRiding] = useState(false);
  const [dbg, setDbg] = useState(false);
  const [zap, setZap] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const me = useRef<HTMLButtonElement>(null);
  const eyes = useRef<SVGGElement>(null);
  const taps = useRef<number[]>([]);
  const hinted = useRef(false);

  // ride: visible while a plain stretch of line (not a figure) is under the 60% mark
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const on = new Set<Element>();
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) =>
          e.isIntersecting ? on.add(e.target) : on.delete(e.target)
        );
        setRiding(on.size > 0);
      },
      { rootMargin: '-60% 0px -40% 0px' }
    );
    el.querySelectorAll('[data-ride]').forEach((w) => io.observe(w));
    return () => io.disconnect();
  }, [root]);

  // hop at every interface
  useEffect(() => {
    const f = () => setZap((z) => z + 1);
    window.addEventListener('bit:zap', f);
    return () => window.removeEventListener('bit:zap', f);
  }, []);

  // the egg: ` toggles, "sudo" turns it on, Escape turns it off
  useEffect(() => {
    let buf = '';
    const f = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
      )
        return;
      if (e.key === '`') {
        setDbg((v) => !v);
        return;
      }
      if (e.key === 'Escape') {
        setDbg(false);
        return;
      }
      if (e.key.length === 1) {
        buf = (buf + e.key.toLowerCase()).slice(-4);
        if (buf === 'sudo') setDbg(true);
      }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  useEffect(() => {
    root.current?.classList.toggle(s.dbg, dbg);
  }, [dbg, root]);

  // eyes follow the pointer (fine pointers only)
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches)
      return;
    let raf = 0;
    const f = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const b = me.current?.getBoundingClientRect();
        if (!b || !eyes.current) return;
        const dx = e.clientX - (b.left + b.width / 2);
        const dy = e.clientY - (b.top + b.height / 2);
        const l = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, l / 200) * 1.6;
        eyes.current.style.transform = `translate(${((dx / l) * k).toFixed(2)}px, ${((dy / l) * k).toFixed(2)}px)`;
      });
    };
    window.addEventListener('pointermove', f, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', f);
    };
  }, []);

  // one idle hint per visit, desktop only, and only while Bit is out on the line
  useEffect(() => {
    if (!riding || hinted.current || dbg) return;
    if (!window.matchMedia('(hover: hover) and (min-width: 900px)').matches)
      return;
    let t = window.setTimeout(fire, 9000);
    function fire() {
      hinted.current = true;
      setHint('psst. press ` to see what I’m made of.');
      window.setTimeout(() => setHint(null), 4200);
    }
    const reset = () => {
      window.clearTimeout(t);
      t = window.setTimeout(fire, 9000);
    };
    window.addEventListener('scroll', reset, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('scroll', reset);
    };
  }, [riding, dbg]);

  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 2000), now];
    setZap((z) => z + 1);
    if (taps.current.length >= 5) {
      taps.current = [];
      setDbg((v) => !v);
    }
  };

  const p = PAYLOAD[at];
  const d = D[at];

  return (
    <>
      <button
        ref={me}
        type="button"
        className={`${s.bit} ${riding ? s.bitOn : ''}`}
        onClick={tap}
        aria-label="Bit, the signal. Tap five times for debug mode."
        tabIndex={riding ? 0 : -1}
      >
        <span className={s.bitTail} aria-hidden />
        <svg viewBox="-16 -16 32 32" className={s.bitSvg} aria-hidden key={zap}>
          <circle r={14} className={s.bitHalo} />
          <circle r={8} className={s.bitCore} />
          <g ref={eyes} className={s.bitEyes}>
            <rect x={-4.2} y={-3.6} width={2.4} height={3.6} rx={1.2} />
            <rect x={1.8} y={-3.6} width={2.4} height={3.6} rx={1.2} />
          </g>
        </svg>
        <span className={s.bitForm} aria-hidden>
          Bit · {FORM[at]}
        </span>
        {hint && (
          <span className={s.bitSay} role="status">
            {hint}
          </span>
        )}
      </button>

      {dbg && (
        <aside
          className={s.dbgPanel}
          aria-label="Debug mode: the raw bytes of the signal"
          style={{ ['--c' as string]: d.color }}
        >
          <div className={s.dbgHead}>
            <span>
              root@bit:~# xxd /dev/signal <b>{d.n}</b>
            </span>
            <button
              type="button"
              onClick={() => setDbg(false)}
              aria-label="Close debug mode"
            >
              ×
            </button>
          </div>
          <p className={s.dbgSrc}>
            {d.name.toLowerCase()} · {p.src}
          </p>
          <pre className={s.dbgDump}>{dump(p).join('\n')}</pre>
          <p className={s.dbgNote}>{p.note}</p>
        </aside>
      )}
    </>
  );
}
