import type { CSSProperties, ReactNode } from 'react';
import type { Domain } from './domains';
import { cx } from './svg';
import s from './interface.module.css';

export const vars = (v: Record<string, string>) => v as CSSProperties;

/** A colour band, as on a resistor body. */
export function Swatch({ d }: { d: Domain }) {
  return (
    <i className={s.swatch} style={vars({ '--c': d.color })} aria-hidden />
  );
}

/** One domain: a title card (number, tagline, one line), then its figures, then the interface to the next. */
export function DomainSection({
  d,
  title,
  line,
  children,
  band,
}: {
  d: Domain;
  title: ReactNode;
  line?: ReactNode;
  children: ReactNode;
  band?: ReactNode;
}) {
  return (
    <section
      id={d.id}
      data-domain={d.id}
      className={s.domain}
      style={vars({ '--c': d.color })}
      aria-labelledby={`${d.id}-h`}
    >
      <header className={s.head} data-head>
        <div className={s.headText}>
          <p className={s.kicker}>
            <Swatch d={d} />
            <span className={s.kickerNum}>
              {d.n} · {d.name}
            </span>
            <span className={s.conv}>{d.convention}</span>
          </p>
          <h2 id={`${d.id}-h`} className={s.h2}>
            {/* the ghost holds the widest state's layout, so the width animation never reflows the page */}
            <span className={s.h2Ghost} aria-hidden>
              {title}
            </span>
            <span className={s.h2Live} data-kin>
              {title}
            </span>
          </h2>
          {line && <p className={s.lead}>{line}</p>}
        </div>
        <span data-wire data-ride className={s.wire} />
      </header>
      {children}
      {band}
    </section>
  );
}

/**
 * A figure and its title card. The figure carries the facts; the title is the scene's one line.
 * Desktop: both pinned while the scroll drives the figure. Mobile: title, then the figure, on the rail.
 */
export function Group({
  n,
  title,
  fig,
  ratio = 0.75,
}: {
  n: string;
  title: ReactNode;
  fig: ReactNode;
  ratio?: number;
}) {
  return (
    <div className={s.group} data-group style={vars({ '--ar': String(ratio) })}>
      <div className={s.stage}>
        <div className={s.figTitle} data-title>
          <span data-wire data-ride className={cx(s.wire, s.railOnly)} />
          <p className={s.figN}>{n}</p>
          <h3 className={s.h3}>{title}</h3>
        </div>
        <figure className={s.fig} data-fig>
          <span className={s.figLead} data-lead="top" />
          <span className={cx(s.elbow, s.elbowIn)} data-lead="top" />
          <div className={s.svgBox}>{fig}</div>
          <span className={s.figLead} data-lead="bottom" />
          <span className={cx(s.elbow, s.elbowOut)} data-lead="bottom" />
        </figure>
      </div>
    </div>
  );
}

/**
 * The boundary between two domains. The line fades from one colour to the next, the connector glyph
 * runs its little animation, and Bit (the signal) says one thing about what just happened to it.
 */
export function Band({
  from,
  to,
  title,
  unit,
  say,
  glyph,
}: {
  from: Domain;
  to: Domain;
  title: string;
  unit: string;
  say?: string;
  glyph: ReactNode;
}) {
  return (
    <div
      className={s.band}
      data-band
      data-to={to.id}
      data-from={from.id}
      style={vars({ '--c1': from.color, '--c2': to.color })}
    >
      <span data-wire data-ride className={cx(s.wire, s.wireGrad)} />
      <div className={s.glyph} aria-hidden>
        <span className={s.ring} />
        <span className={s.ring2} />
        {glyph}
      </div>
      <div className={s.bandText}>
        <p className={s.bandKicker}>
          <Swatch d={from} />
          <Swatch d={to} />
          interface {from.n} → {to.n}
        </p>
        <p className={s.bandTitle}>{title}</p>
        <p className={s.bandUnit}>{unit}</p>
        {say && (
          <p className={s.say}>
            <span className={s.sayWho}>Bit</span> {say}
          </p>
        )}
      </div>
    </div>
  );
}
