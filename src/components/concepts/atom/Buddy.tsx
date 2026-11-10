'use client';

// Bit: a data packet that rides the progress rail. Its eyes follow the cursor (or the core),
// it drops a hint when things go quiet, and it reports when the core comes apart.

import { useEffect, useRef, useState } from 'react';
import { buddy } from './data';
import { atom, now, onFrame } from './store';
import styles from './atom.module.css';

export default function Buddy() {
  const el = useRef<HTMLButtonElement>(null);
  const eyes = useRef<HTMLSpanElement>(null);
  const [line, setLine] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const said = useRef({ at: 0, idx: 0, tap: 0 });

  useEffect(() => {
    atom.say = (l, ms = 3600) => {
      setLine(l);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setLine(null), ms);
    };
    return () => {
      atom.say = null;
      window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    let blinkAt = now() + 3;
    return onFrame((t) => {
      const b = el.current;
      const e = eyes.current;
      if (!b || !e) return;
      const r = b.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const T = now();
      const live = T - atom.pointer.moved < 4;
      const lx = live ? atom.pointer.x : atom.core.x;
      const ly = live ? atom.pointer.y : atom.core.y;
      const a = Math.atan2(ly - y, lx - x);
      const blink = T > blinkAt && T < blinkAt + 0.12;
      if (T > blinkAt + 0.12) blinkAt = T + 2.5 + Math.random() * 4;
      e.style.transform = `translate(${(Math.cos(a) * 1.6).toFixed(2)}px, ${(Math.sin(a) * 1.6).toFixed(2)}px) scaleY(${blink ? 0.15 : 1})`;
      // fission makes it shiver
      const egg = T - atom.eggAt;
      b.style.setProperty(
        '--jx',
        !atom.reduced && egg < 1.2
          ? `${((Math.random() - 0.5) * 3).toFixed(1)}px`
          : '0px'
      );
      // idle hint
      const idle = Math.min(T - Math.max(atom.pointer.moved, atom.booted), 99);
      if (idle > 9 && T - said.current.at > 18 && t > 6) {
        said.current.at = T;
        const lines = atom.narrow
          ? ['swipe up', 'drag sideways to orbit', 'tap the core seven times']
          : buddy.idle;
        atom.say?.(lines[said.current.idx++ % lines.length]);
      }
    });
  }, []);

  return (
    <button
      ref={el}
      type="button"
      className={styles.bit}
      aria-label="Bit, the packet. Say hi."
      onClick={() =>
        atom.say?.(buddy.tap[said.current.tap++ % buddy.tap.length])
      }
    >
      <span className={styles.bitBody} aria-hidden>
        <span ref={eyes} className={styles.bitEyes}>
          <i />
          <i />
        </span>
      </span>
      {line && (
        <span className={styles.bubble} role="status">
          <i>&gt;</i> {line}
        </span>
      )}
    </button>
  );
}
