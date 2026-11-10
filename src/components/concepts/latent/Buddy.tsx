'use client';

import { useEffect, useRef } from 'react';
import styles from './latent.module.css';

export type Mood =
  | 'idle'
  | 'typing'
  | 'think'
  | 'happy'
  | 'wink'
  | 'hot'
  | 'flat';

// k: the retrieval agent. A text caret with eyes. It blinks like a cursor.
export default function Buddy({
  mood,
  onPoke,
}: {
  mood: Mood;
  onPoke: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const L = Math.hypot(dx, dy) || 1;
      const m = Math.min(1, L / 240);
      el.style.setProperty('--ex', `${((dx / L) * m * 2.2).toFixed(2)}px`);
      el.style.setProperty('--ey', `${((dy / L) * m * 2.2).toFixed(2)}px`);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const happy = mood === 'happy';
  const wink = mood === 'wink';
  const flat = mood === 'flat';

  return (
    <button
      ref={ref}
      type="button"
      className={styles.buddy}
      data-mood={mood}
      onClick={onPoke}
      aria-label="k, the retrieval agent. Poke it."
      title="k · retrieval agent"
    >
      <svg viewBox="0 0 28 36" width="28" height="36" aria-hidden>
        <g className={styles.buddyBody}>
          <rect
            x="3"
            y="2"
            width="22"
            height="30"
            rx="6"
            className={styles.buddyShell}
          />
          <g className={styles.buddyEyes}>
            {/* left eye */}
            {happy || wink ? (
              <path
                d="M8.4 15.5 Q10.6 12.6 12.8 15.5"
                className={styles.buddyArc}
              />
            ) : flat ? (
              <path d="M8.6 14.6 H12.6" className={styles.buddyArc} />
            ) : (
              <rect
                x="8.9"
                y="11.2"
                width="3.4"
                height="6"
                rx="1.7"
                className={styles.buddyEye}
              />
            )}
            {/* right eye */}
            {happy ? (
              <path
                d="M15.2 15.5 Q17.4 12.6 19.6 15.5"
                className={styles.buddyArc}
              />
            ) : flat ? (
              <path d="M15.4 14.6 H19.4" className={styles.buddyArc} />
            ) : (
              <rect
                x="15.7"
                y="11.2"
                width="3.4"
                height="6"
                rx="1.7"
                className={styles.buddyEye}
              />
            )}
          </g>
          {mood === 'think' && (
            <g className={styles.buddyDots}>
              <circle cx="9" cy="24.5" r="1.2" />
              <circle cx="14" cy="24.5" r="1.2" />
              <circle cx="19" cy="24.5" r="1.2" />
            </g>
          )}
          {mood === 'hot' && (
            <path
              d="M22.5 6.5 q1.6 2.4 0 3.6 q-1.6 -1.2 0 -3.6z"
              className={styles.buddySweat}
            />
          )}
        </g>
        <rect
          x="6"
          y="34"
          width="16"
          height="1.6"
          rx="0.8"
          className={styles.buddyBase}
        />
      </svg>
    </button>
  );
}
