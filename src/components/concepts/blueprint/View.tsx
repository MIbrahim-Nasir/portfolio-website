'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { pathOf, type Pt } from './primitives';
import s from './blueprint.module.css';

/* A view on a sheet: one drawing plus its balloon notes.
   Balloons live inside the SVG; the note they open is HTML, anchored to the
   balloon by its position in the viewBox, so it scales with the drawing and
   rides along when the sheet is panned on a phone. */

export type Note = {
  id: string;
  at: Pt;
  k: string;
  v: ReactNode;
  link?: { href: string; label: string };
};

type Ctx = {
  active: string | null;
  pinned: boolean;
  show: (id: string | null) => void;
  pin: (id: string) => void;
};

const ViewCtx = createContext<Ctx>({
  active: null,
  pinned: false,
  show: () => {},
  pin: () => {},
});
export const useView = () => useContext(ViewCtx);

/** Balloon with an optional leader to the feature it names. Opens its note. */
export function Tag({
  id,
  n,
  at,
  from,
  r = 17,
  label,
}: {
  id: string;
  n: number | string;
  at: Pt;
  from?: Pt;
  r?: number;
  label?: string;
}) {
  const { active, show, pin } = useView();
  const on = active === id;
  let lead: string | null = null;
  if (from) {
    const dx = at[0] - from[0];
    const dy = at[1] - from[1];
    const len = Math.hypot(dx, dy) || 1;
    lead = pathOf([from, [at[0] - (dx / len) * r, at[1] - (dy / len) * r]]);
  }
  return (
    <g
      className={`${s.tag} ${on ? s.tagOn : ''}`}
      tabIndex={0}
      role="button"
      aria-label={label ? `Item ${n}: ${label}` : `Item ${n}`}
      aria-expanded={on}
      data-balloon=""
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(id)}
      onFocus={() => show(id)}
      onClick={(e) => {
        e.stopPropagation();
        pin(id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pin(id);
        }
      }}
    >
      {lead && <path className={s.lnThin} d={lead} />}
      {from && (
        <circle
          data-fade=""
          className={s.fillInk}
          cx={from[0]}
          cy={from[1]}
          r={2.6}
        />
      )}
      <circle className={s.tagHit} cx={at[0]} cy={at[1]} r={Math.max(r, 22)} />
      <circle data-ring="" className={s.ln} cx={at[0]} cy={at[1]} r={r} />
      <text
        className={s.txB}
        x={at[0]}
        y={at[1] + 1}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {n}
      </text>
    </g>
  );
}

export function View({
  W,
  H,
  notes = [],
  title,
  sub,
  letter,
  className = '',
  pan,
  panStart = 0,
  children,
}: {
  W: number;
  H: number;
  notes?: Note[];
  title: string;
  sub?: string;
  letter?: string;
  className?: string;
  /** min drawing width on phones; the view pans sideways below it */
  pan?: number;
  /** where a panned view starts, 0 = left edge, 1 = right edge */
  panStart?: number;
  children: ReactNode;
}) {
  const [st, setSt] = useState<{ id: string | null; pinned: boolean }>({
    id: null,
    pinned: false,
  });
  const box = useRef<HTMLDivElement>(null);
  const hide = useRef<number>(0);
  const uid = useId();
  const active = st.id;
  const pinned = st.pinned;

  const show = useCallback((id: string | null) => {
    window.clearTimeout(hide.current);
    if (id === null) {
      hide.current = window.setTimeout(
        () => setSt((c) => (c.pinned ? c : { id: null, pinned: false })),
        160
      );
    } else setSt((c) => (c.pinned ? c : { id, pinned: false }));
  }, []);
  const pin = useCallback((id: string) => {
    window.clearTimeout(hide.current);
    setSt((c) =>
      c.id === id && c.pinned
        ? { id: null, pinned: false }
        : { id, pinned: true }
    );
  }, []);

  // close on outside tap / Escape
  useEffect(() => {
    if (!active) return;
    const close = () => setSt({ id: null, pinned: false });
    const out = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) close();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('pointerdown', out);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', out);
      window.removeEventListener('keydown', esc);
    };
  }, [active]);

  const panRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const p = panRef.current;
    if (!p || !panStart) return;
    const place = () => {
      if (p.scrollWidth > p.clientWidth)
        p.scrollLeft = (p.scrollWidth - p.clientWidth) * panStart;
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [panStart]);

  const ctx = useMemo(
    () => ({ active, pinned, show, pin }),
    [active, pinned, show, pin]
  );
  const note = notes.find((n) => n.id === active);

  return (
    <ViewCtx.Provider value={ctx}>
      <figure className={`${s.view} ${className}`}>
        <div
          ref={panRef}
          className={pan ? s.pan : undefined}
          data-pan={pan ? '' : undefined}
        >
          <div
            ref={box}
            className={s.viewBox}
            style={
              pan
                ? ({ '--pan-min': `${pan}px` } as React.CSSProperties)
                : undefined
            }
            onPointerLeave={(e) => e.pointerType === 'mouse' && show(null)}
          >
            {children}
            {note && (
              <div
                id={`${uid}-note`}
                role="note"
                className={`${s.note} ${note.at[0] / W > 0.56 ? s.noteL : ''} ${note.at[1] / H > 0.58 ? s.noteU : ''}`}
                style={
                  {
                    '--x': `${(note.at[0] / W) * 100}%`,
                    '--y': `${(note.at[1] / H) * 100}%`,
                  } as React.CSSProperties
                }
                onPointerEnter={() => window.clearTimeout(hide.current)}
              >
                <span className={s.noteK}>{note.k}</span>
                <span className={s.noteV}>{note.v}</span>
                {note.link && (
                  <a
                    className={s.noteA}
                    href={note.link.href}
                    target="_blank"
                    rel="noopener"
                  >
                    {note.link.label}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <figcaption className={s.viewCap}>
          {letter && <span className={s.viewLetter}>{letter}</span>}
          <span className={s.viewTitle}>{title}</span>
          {sub && <span className={s.viewSub}>{sub}</span>}
          {pan && (
            <span className={s.panHint} aria-hidden="true">
              Drag to pan ⟷
            </span>
          )}
        </figcaption>
      </figure>
    </ViewCtx.Provider>
  );
}
