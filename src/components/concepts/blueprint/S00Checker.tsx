'use client';

import { useEffect, useState } from 'react';
import { profile } from '@/data/profile';
import { Stamp } from './Sheet';
import s from './blueprint.module.css';

/* Sheet 00 · the checker's print. Only issued once every CHK box is initialled.
   Pencil on bare paper: the drawing before it went into the light. */

export default function S00Checker() {
  const [date, setDate] = useState('');
  useEffect(() => {
    const d = new Date();
    setDate(
      `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    );
  }, []);
  return (
    <section
      id="sheet-00"
      className={s.sheet00}
      aria-labelledby="sheet-00-t"
      tabIndex={-1}
    >
      <div className={s.sheet00In}>
        <p className={s.kicker00}>Sheet 00 · checker’s print · not for issue</p>
        <h2 id="sheet-00-t" className={s.title00}>
          Checked.
        </h2>
        <p className={s.line00}>You read every sheet. Most people skim.</p>
        <svg className={s.sketch} viewBox="0 0 300 220" aria-hidden="true">
          {/* the compass, sketched, waving its pencil leg */}
          <path d="M150 20 V34" />
          <circle cx="150" cy="44" r="13" />
          <circle cx="145" cy="42" r="1.6" className={s.sketchFill} />
          <circle cx="155" cy="42" r="1.6" className={s.sketchFill} />
          <path d="M145 49 q5 4 10 0" />
          <path d="M146 56 L118 196" />
          <path d="M154 56 L214 120" className={s.sketchWave} />
          <path d="M214 120 L232 140" className={s.sketchWave} />
          <path d="M60 200 C110 206 190 206 250 200" />
          <path d="M40 60 q20 -18 40 0 M224 40 l14 -6 M230 56 l16 0" />
        </svg>
        <div className={s.rev00}>
          <span>Rev D</span>
          <span>pending</span>
          <span>your company here</span>
        </div>
        <Stamp rot={-9} className={s.stamp00} live={false}>
          <b>Checked by: you</b>
          <span>{date || 'today'}</span>
        </Stamp>
        <a className={s.cta00} href={`mailto:${profile.email}?subject=Rev%20D`}>
          Email me about Rev D →
        </a>
      </div>
    </section>
  );
}
