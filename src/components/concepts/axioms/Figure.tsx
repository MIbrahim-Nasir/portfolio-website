'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { PALETTE, type Ink, type Scene } from './figures/kit';
import styles from './axioms.module.css';

type Props = {
  numeral: string;
  kind: string;
  /** builds the scene once; must be stable */
  make: () => Scene;
  /** canvas height for a given width (CSS px) */
  heightFor: (w: number) => number;
  /** SSR fallback ratios (h / w), wide and phone */
  ratio: number;
  mRatio: number;
  alt: string;
  /** the same facts as the figure's annotations, for screen readers */
  facts: string[];
  controls?: ReactNode;
  hint?: string;
  onScene?: (s: Scene | null) => void;
};

export default function Figure({
  numeral,
  kind,
  make,
  heightFor,
  ratio,
  mRatio,
  alt,
  facts,
  controls,
  hint,
  onScene,
}: Props) {
  const plate = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Scene | null>(null);
  const release = useRef<number>(0);

  useEffect(() => {
    const el = plate.current;
    const c = canvas.current;
    if (!el || !c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // dev-only: ?settle previews every figure in its reduced-motion end state
    const forceSettle =
      process.env.NODE_ENV !== 'production' &&
      location.search.includes('settle');
    let reduced = mq.matches || forceSettle;
    const s = make();
    scene.current = s;
    onScene?.(s);

    const cs = getComputedStyle(el);
    const ink: Ink = {
      ...PALETTE,
      mono:
        cs.getPropertyValue('--ax-mono').trim() || 'ui-monospace, monospace',
      serif: cs.getPropertyValue('--ax-serif').trim() || 'Georgia, serif',
    };

    let W = 0,
      H = 0,
      dpr = 1,
      raf = 0,
      last = 0,
      visible = false,
      sized = false;

    const paint = () => {
      if (!W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      s.draw(ctx, ink);
    };

    const resize = () => {
      const width = el.clientWidth;
      if (width < 2) return;
      const want = Math.round(heightFor(width));
      if (Math.abs(el.clientHeight - want) > 1) el.style.height = `${want}px`;
      W = width;
      H = want;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      s.resize(W, H);
      if (!sized && reduced) s.settle();
      sized = true;
      paint();
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      s.step(dt);
      paint();
    };
    const start = () => {
      if (raf || reduced || !visible) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) start();
        else stop();
      },
      { rootMargin: '120px 0px' }
    );
    io.observe(el);

    const onMotion = () => {
      reduced = mq.matches || forceSettle;
      if (reduced) {
        stop();
        s.settle();
        paint();
      } else start();
    };
    mq.addEventListener('change', onMotion);
    document.fonts?.ready.then(paint).catch(() => {});
    // reduced motion still repaints on interaction
    const repaint = () => reduced && paint();
    el.addEventListener('axioms:repaint', repaint);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mq.removeEventListener('change', onMotion);
      el.removeEventListener('axioms:repaint', repaint);
      scene.current = null;
      onScene?.(null);
      window.clearTimeout(release.current);
    };
  }, [make, heightFor, onScene]);

  const local = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const poke = () => plate.current?.dispatchEvent(new Event('axioms:repaint'));

  const style = { '--ar': ratio, '--arm': mRatio } as CSSProperties;

  return (
    <figure className={styles.figure}>
      <div className={styles.figMeta} aria-hidden>
        <span>
          <span className={styles.figNo}>Fig. {numeral}</span>
          <span className={styles.figKind}>{kind}</span>
        </span>
        <span className={styles.live}>
          <span className={styles.liveDot} />
          drawn live
        </span>
      </div>
      <div
        ref={plate}
        data-plate=""
        className={styles.plate}
        style={style}
        onPointerMove={(e) => {
          if (e.pointerType === 'mouse' && scene.current?.pointer) {
            scene.current.pointer(local(e));
            poke();
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') scene.current?.pointer?.(null);
        }}
        onPointerUp={(e) => {
          if (e.pointerType === 'mouse' || !scene.current?.pointer) return;
          // touch: a tap places the pointer for a few seconds
          scene.current.pointer(local(e));
          poke();
          window.clearTimeout(release.current);
          release.current = window.setTimeout(
            () => scene.current?.pointer?.(null),
            4000
          );
        }}
      >
        <canvas ref={canvas} role="img" aria-label={alt} />
      </div>
      {(controls || hint) && (
        <div className={styles.figFoot}>
          {controls}
          {hint && <span className={styles.figHint}>{hint}</span>}
        </div>
      )}
      <figcaption className={styles.srOnly}>
        <ul>
          {facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
