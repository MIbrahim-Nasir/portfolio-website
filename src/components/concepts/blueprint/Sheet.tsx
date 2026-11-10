'use client';

import type { ReactNode } from 'react';
import { useEgg } from './egg';
import { SHEETS, TOTAL, nn } from './sheets';
import s from './blueprint.module.css';

export type Field = { k: string; v: ReactNode; wide?: boolean };

export function Stamp({
  children,
  tone = 'red',
  round = false,
  rot = -7,
  className = '',
  live = true,
}: {
  children: ReactNode;
  tone?: 'red' | 'chalk';
  round?: boolean;
  rot?: number;
  className?: string;
  live?: boolean;
}) {
  return (
    <span
      className={`${s.stamp} ${tone === 'chalk' ? s.stampChalk : ''} ${round ? s.stampRound : ''} ${className}`}
      style={{ rotate: `${rot}deg` }}
      data-stamp={live ? '' : undefined}
    >
      {children}
    </span>
  );
}

function Zones() {
  return (
    <div className={s.zones} aria-hidden="true">
      <div className={s.zoneTop}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((z) => (
          <span key={z}>{z}</span>
        ))}
      </div>
      <div className={s.zoneLeft}>
        {['A', 'B', 'C', 'D'].map((z) => (
          <span key={z}>{z}</span>
        ))}
      </div>
    </div>
  );
}

/** The CHK box. Initial it and the sheet counts toward the checker's print. */
export function CheckBox({ n }: { n: number }) {
  const { checked, check } = useEgg();
  const done = checked.has(n);
  return (
    <button
      type="button"
      className={`${s.chk} ${done ? s.chkDone : ''}`}
      onClick={() => check(n)}
      aria-pressed={done}
      aria-label={done ? `Sheet ${nn(n)} checked` : `Check sheet ${nn(n)}`}
    >
      <span className={s.tbK}>Chk</span>
      {done ? (
        <span className={s.chkMark}>
          <svg viewBox="0 0 30 22" aria-hidden="true">
            <path d="M3 12 L11 19 L27 3" />
          </svg>
          you
        </span>
      ) : (
        <span className={s.chkEmpty}>initial here</span>
      )}
    </button>
  );
}

export function Sheet({
  n,
  kicker,
  title,
  stretch = 66,
  line,
  fields,
  rev = 'C',
  scale = 'NTS',
  children,
  head,
}: {
  n: number;
  kicker: string;
  title: ReactNode;
  stretch?: number;
  line?: ReactNode;
  fields: Field[];
  rev?: string;
  scale?: string;
  children: ReactNode;
  head?: ReactNode;
}) {
  const meta = SHEETS[n - 1];
  const hid = `${meta.id}-t`;
  return (
    <section
      id={meta.id}
      data-sheet={n}
      className={s.sheet}
      aria-labelledby={hid}
    >
      <div className={s.coat} aria-hidden="true" />
      <div className={s.sheetIn}>
        <Zones />
        {head ?? (
          <header className={s.head}>
            <svg className={s.bubble} viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="29" />
              <path d="M4 32 H60" />
              <text
                x="32"
                y="22"
                textAnchor="middle"
                dominantBaseline="central"
                className={s.bubbleN}
              >
                {n - 1 || '—'}
              </text>
              <text
                x="32"
                y="44"
                textAnchor="middle"
                dominantBaseline="central"
                className={s.bubbleS}
              >
                {nn(n)}
              </text>
            </svg>
            <div className={s.headText}>
              <p className={s.kicker}>{kicker}</p>
              <h2
                id={hid}
                className={s.title}
                data-stretch={stretch}
                style={{ fontVariationSettings: `'wdth' ${stretch}` }}
              >
                {title}
              </h2>
              {line && <p className={s.line}>{line}</p>}
            </div>
          </header>
        )}
        <div className={s.views}>{children}</div>
        <footer className={s.strip} aria-label={`Title block, sheet ${nn(n)}`}>
          {fields.map((f) => (
            <div key={f.k} className={`${s.cell} ${f.wide ? s.cellWide : ''}`}>
              <span className={s.tbK}>{f.k}</span>
              <span className={s.tbV}>{f.v}</span>
            </div>
          ))}
          <div className={`${s.cell} ${s.cellMeta}`}>
            <span className={s.tbK}>Dwg no.</span>
            <span className={s.tbM}>MIN-{nn(n)}</span>
          </div>
          <div className={`${s.cell} ${s.cellMeta}`}>
            <span className={s.tbK}>Scale</span>
            <span className={s.tbM}>{scale}</span>
          </div>
          <div className={`${s.cell} ${s.cellMeta}`}>
            <span className={s.tbK}>Rev</span>
            <span className={s.tbM}>{rev}</span>
          </div>
          <div className={`${s.cell} ${s.cellMeta}`}>
            <span className={s.tbK}>Sheet</span>
            <span className={s.tbM}>
              {nn(n)}/{nn(TOTAL)}
            </span>
          </div>
          <div className={`${s.cell} ${s.cellChk}`}>
            <CheckBox n={n} />
          </div>
        </footer>
      </div>
    </section>
  );
}

/** Boxed schedule (BOM, notes, revisions): a table drawn on the sheet. */
export function Schedule({
  title,
  cols,
  rows,
  className = '',
}: {
  title: string;
  cols: string[];
  rows: ReactNode[][];
  className?: string;
}) {
  return (
    <div className={`${s.sched} ${className}`}>
      <table>
        <caption>{title}</caption>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Notes({
  title = 'General notes',
  items,
}: {
  title?: string;
  items: ReactNode[];
}) {
  return (
    <div className={s.sched}>
      <div className={s.notes}>
        <p className={s.notesT}>{title}</p>
        <ol>
          {items.map((it, i) => (
            <li key={i}>
              <span className={s.noteNo}>{i + 1}.</span>
              <span>{it}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
