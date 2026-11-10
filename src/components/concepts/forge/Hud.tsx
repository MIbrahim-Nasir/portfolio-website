'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { profile } from '@/data/profile';
import type { OverlayRefs } from './Scene';
import { LAST, STEPS, type Line, type Row } from './script';
import styles from './forge.module.css';

// ------------------------------------------------------------------ holo-panel
// Projected by the module that just seated. The rig positions it next to its anchor.

function Readout({
  r,
  overlay,
  delay,
}: {
  r: Row;
  overlay: OverlayRefs;
  delay: number;
}) {
  const style = {
    '--d': `${delay}s`,
    ...(r.g ? { '--from': r.g[0], '--to': r.g[1] } : {}),
    ...(r.span ? { '--a': r.span[0], '--b': r.span[1] } : {}),
  } as CSSProperties;
  return (
    <div className={styles.row} data-m={r.m ? '' : undefined} style={style}>
      <dt>{r.k}</dt>
      <dd>
        {r.big && <b className={styles.big}>{r.big}</b>}
        {r.live === 'xy' ? (
          <span ref={overlay.xy} className={styles.live}>
            {r.v}
          </span>
        ) : r.live === 'grip' ? (
          <span ref={overlay.grip} className={styles.live}>
            {r.v}
          </span>
        ) : (
          <span className={styles.rowV}>{r.v}</span>
        )}
        {r.n && <em className={styles.rowN}>{r.n}</em>}
        {r.g && <span className={styles.gauge} aria-hidden />}
        {r.span && (
          <span className={styles.dial} aria-hidden>
            <i />
          </span>
        )}
      </dd>
    </div>
  );
}

type PanelProps = {
  step: number;
  compact: boolean;
  spec: boolean;
  onSpec: () => void;
  go: (i: number) => void;
  overlay: OverlayRefs;
  reduced: boolean;
};

export function Panel({
  step,
  compact,
  spec,
  onSpec,
  go,
  overlay,
}: PanelProps) {
  const s = STEPS[step];
  // chips live behind the spec toggle everywhere; phones also fold the chain and minor rows
  const extra = !!(
    s.chips?.length ||
    (compact && (s.rows.some((r) => !r.m) || s.chain))
  );
  const open = !compact || spec;
  const id = `forge-${s.key}-h`;

  return (
    <section
      ref={overlay.panel}
      id={
        step === 0 ? 'forge-top' : step === LAST ? 'forge-contact' : undefined
      }
      className={styles.panel}
      data-step={s.key}
      data-open={open ? '' : undefined}
      aria-labelledby={id}
    >
      <div className={styles.panelInner}>
        <header className={styles.pHead}>
          <span className={styles.pCode}>{s.code}</span>
          <span className={styles.pName}>{s.name}</span>
          <span
            className={styles.pStatus}
            data-warn={step === 0 ? '' : undefined}
          >
            <i aria-hidden />
            {s.status}
          </span>
        </header>
        <p className={styles.pDomain}>
          {s.domain}
          {s.meta && <span> · {s.meta}</span>}
        </p>

        {step === 0 ? (
          <>
            <h1 id={id} className={styles.hName} tabIndex={-1}>
              <span>Mohammed</span> <span>Ibrahim Nasir</span>
            </h1>
            <p className={styles.hTitle}>{s.title}</p>
          </>
        ) : (
          <h2 id={id} className={styles.hTitle} tabIndex={-1}>
            {s.title}
          </h2>
        )}
        {s.support && <p className={styles.support}>{s.support}</p>}

        {s.rows.length > 0 && (
          <dl className={styles.rows}>
            {s.rows.map((r, i) => (
              <Readout
                key={r.k}
                r={r}
                overlay={overlay}
                delay={0.35 + i * 0.08}
              />
            ))}
          </dl>
        )}

        {open && s.chain && (
          <ol className={styles.chain} aria-label="Signal path">
            {s.chain.map((c, i) => (
              <li key={c} data-loop={c.includes('↺') ? '' : undefined}>
                {c}
                {i < s.chain!.length - 1 && <i aria-hidden>→</i>}
              </li>
            ))}
          </ol>
        )}

        {spec &&
          s.chips?.map((g) => (
            <div key={g.k} className={styles.chips}>
              <span className={styles.chipsK}>{g.k}</span>
              <ul>
                {g.items.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ))}

        {step === 0 && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => go(1)}
            >
              Begin assembly <span aria-hidden>↓</span>
            </button>
            <a className={styles.secondary} href={profile.resumeUrl}>
              Resume · PDF
            </a>
          </div>
        )}

        {step === 2 && (
          <a
            className={styles.inline}
            href={profile.saifWhatsapp}
            target="_blank"
            rel="noreferrer"
          >
            Try SAIF on WhatsApp ↗
          </a>
        )}

        {step === LAST && (
          <div className={styles.contact}>
            <a className={styles.mail} href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <ul className={styles.links}>
              <li>
                <a href={`tel:${profile.phone.replace(/\s/g, '')}`}>
                  {profile.phone}
                </a>
              </li>
              <li>
                <a href={profile.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn ↗
                </a>
              </li>
              <li>
                <a href={profile.github} target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
              </li>
              <li>
                <a href={profile.resumeUrl}>Resume · PDF</a>
              </li>
            </ul>
            <p className={styles.foot}>
              <span>{profile.location}</span>
              <Link href="/concepts">← all cuts</Link>
            </p>
          </div>
        )}

        {extra && (
          <button
            type="button"
            className={styles.specBtn}
            aria-expanded={spec}
            onClick={onSpec}
          >
            {spec ? 'Spec −' : 'Full spec +'}
          </button>
        )}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ status board

type BoardProps = {
  refEl: RefObject<HTMLElement | null>;
  step: number;
  exploded: boolean;
  go: (i: number) => void;
};

export function Board({ refEl, step, exploded, go }: BoardProps) {
  const seated = Math.min(6, step);
  return (
    <nav ref={refEl} className={styles.board} aria-label="Build status">
      <p className={styles.boardHead}>
        <span>BUILD STATUS</span>
        <b>{seated}/6</b>
      </p>
      <ol>
        {STEPS.map((s, i) => {
          const state =
            i === 0
              ? 'OPERATOR'
              : i === LAST
                ? step === LAST
                  ? 'COMPLETE'
                  : 'PENDING'
                : exploded
                  ? 'PULLED'
                  : step >= i
                    ? 'ONLINE'
                    : 'STAGED';
          return (
            <li key={s.key}>
              <button
                type="button"
                className={styles.boardBtn}
                aria-current={step === i ? 'step' : undefined}
                data-on={step >= i && i > 0 ? '' : undefined}
                onClick={() => go(i)}
                aria-label={`${s.code} ${s.name}, ${state.toLowerCase()}`}
              >
                <span className={styles.boardCode}>{s.code.slice(1)}</span>
                <span className={styles.boardName}>{s.name}</span>
                <span className={styles.boardState}>{state}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className={styles.boardFoot}>
        <i aria-hidden /> RIVET · tap him
      </p>
    </nav>
  );
}

// ------------------------------------------------------------------ dialogue

type DialogueProps = {
  refEl: RefObject<HTMLElement | null>;
  code: string;
  lines: Line[];
  shown: number;
  compact: boolean;
  oc: boolean;
  children: ReactNode;
};

export function Dialogue({
  refEl,
  code,
  lines,
  shown,
  compact,
  oc,
  children,
}: DialogueProps) {
  // phones keep two subtitle slots: the latest exchange
  const start = compact ? Math.max(0, Math.min(shown, lines.length) - 2) : 0;
  const slots = compact ? lines.slice(start, start + 2) : lines;
  return (
    <section
      ref={refEl}
      className={styles.dlg}
      data-oc={oc ? '' : undefined}
      aria-label="Bench dialogue"
    >
      <div className={styles.dlgShade} aria-hidden />
      <div className={styles.dlgHead}>
        <span className={styles.dlgTitle}>
          <span>BENCH LOG</span> <b>{code}</b>
        </span>
        {children}
      </div>
      <ol className={styles.dlgLines} aria-live="polite">
        {slots.map((l, j) => {
          const i = start + j;
          const on = i < shown;
          return (
            <li
              key={`${code}-${i}`}
              className={styles.dlgLine}
              data-who={l.who}
              data-on={on ? '' : undefined}
              data-now={on && i === shown - 1 ? '' : undefined}
              aria-hidden={on ? undefined : true}
            >
              <span className={styles.who}>
                {l.who === 'rivet' ? 'RIVET' : 'IBRAHIM'}
              </span>
              <span className={styles.said}>{l.text}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ------------------------------------------------------------------ controls

export function Controls({
  step,
  exploded,
  onExplode,
  go,
}: {
  step: number;
  exploded: boolean;
  onExplode: () => void;
  go: (i: number) => void;
}) {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.ctl}
        onClick={() => go(step - 1)}
        disabled={step === 0}
        aria-label="Previous module"
      >
        <svg viewBox="0 0 20 20" aria-hidden>
          <path d="M5 12.5 10 7.5l5 5" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.ctl}
        onClick={() => go(step + 1)}
        disabled={step === LAST}
        aria-label="Next module"
      >
        <svg viewBox="0 0 20 20" aria-hidden>
          <path d="M5 7.5 10 12.5l5-5" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.ctlWide}
        aria-pressed={exploded}
        onClick={onExplode}
      >
        <svg viewBox="0 0 20 20" aria-hidden>
          {exploded ? (
            <path d="M4 10h12M10 4v12" />
          ) : (
            <path d="M3 3l5 5M17 3l-5 5M3 17l5-5M17 17l-5-5" />
          )}
        </svg>
        <span>{exploded ? 'Reassemble' : 'Pull apart'}</span>
      </button>
    </div>
  );
}
