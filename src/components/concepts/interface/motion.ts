'use client';

import { useEffect, useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
}

export { gsap, ScrollTrigger };

export const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Desktop: the figure is sticky beside the cards. Below this the machine runs as one column. */
export const DESK = '(min-width: 900px)';
export const REDUCE = '(prefers-reduced-motion: reduce)';

export type Pt = readonly [number, number];

/** A polyline route, plus the fraction of its length at each vertex (for timing events). */
export function polyline(pts: readonly Pt[]) {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    acc.push(acc[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const total = acc[acc.length - 1] || 1;
  return {
    pts,
    d: 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L'),
    points: pts.map(([x, y]) => `${x},${y}`).join(' '),
    /** fraction of the route's length at vertex i */
    at: (i: number) => acc[Math.max(0, Math.min(acc.length - 1, i))] / total,
  };
}

export type Q = (sel: string) => Element[];
export type Build = (tl: gsap.core.Timeline, q: Q, svg: SVGSVGElement) => void;

/**
 * Scroll-scrubs a figure's timeline (normalised to 0..1).
 * Desktop: driven by the sticky group's travel. Mobile: by the figure crossing the 60% line,
 * the same line that fills every wire on the page, so the signal front stays continuous.
 * Reduced motion: the finished state, no scrubbing.
 */
export function useScrub(ref: RefObject<SVGSVGElement | null>, build: Build) {
  useIsoLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const fig =
      svg.closest<HTMLElement>('[data-fig]') ?? (svg as unknown as HTMLElement);
    const group = svg.closest<HTMLElement>('[data-group]') ?? fig;
    const q = gsap.utils.selector(svg) as Q;
    const mm = gsap.matchMedia();
    mm.add({ all: 'all', desk: DESK, reduce: REDUCE }, (ctx) => {
      const { desk, reduce } = ctx.conditions as {
        desk: boolean;
        reduce: boolean;
      };
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      const leadTop = fig.querySelectorAll('[data-lead="top"]');
      const leadBottom = fig.querySelectorAll('[data-lead="bottom"]');
      tl.fromTo(leadTop, { '--p': 0 }, { '--p': 1, duration: 0.03 }, 0);
      tl.fromTo(leadBottom, { '--p': 0 }, { '--p': 1, duration: 0.03 }, 0.97);
      build(tl, q, svg);
      if (tl.duration() < 1) tl.set({}, {}, 1);
      if (reduce) {
        tl.progress(1);
        return;
      }
      ScrollTrigger.create({
        animation: tl,
        trigger: desk ? group : fig,
        start: desk ? 'top top' : 'top 60%',
        end: desk ? 'bottom bottom' : 'bottom 60%',
        scrub: 0.35,
      });
    });
    return () => mm.revert();
    // build is static per figure
  }, []);
}

/** Draws a lit route and walks the signal dot along it between `start` and `start + dur`. */
export function runRoute(
  tl: gsap.core.Timeline,
  svg: SVGSVGElement,
  name = 'main',
  start = 0,
  dur = 1
) {
  const path = svg.querySelector<SVGPathElement>(`[data-route="${name}"]`);
  const dot = svg.querySelector<SVGGElement>(`[data-dot="${name}"]`);
  if (!path) return;
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len} ${len}`;
  const o = { p: 0 };
  const apply = () => {
    path.style.strokeDashoffset = String(len * (1 - o.p));
    if (dot) {
      const pt = path.getPointAtLength(o.p * len);
      dot.setAttribute(
        'transform',
        `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`
      );
      dot.style.opacity = o.p > 0.002 && o.p < 0.998 ? '1' : '0';
    }
  };
  apply();
  tl.to(o, { p: 1, duration: dur, ease: 'none', onUpdate: apply }, start);
}

/** Brightens elements from their resting (faint) state as the signal reaches them. */
export function lightUp(
  tl: gsap.core.Timeline,
  els: gsap.TweenTarget,
  at: number,
  from = 0.3,
  dur = 0.04
) {
  tl.fromTo(els, { opacity: from }, { opacity: 1, duration: dur }, at);
}

/** Strokes something on with DrawSVG. */
export function drawOn(
  tl: gsap.core.Timeline,
  els: gsap.TweenTarget,
  at: number,
  dur = 0.08
) {
  tl.fromTo(els, { drawSVG: '0%' }, { drawSVG: '100%', duration: dur }, at);
}

/** Linear interpolation helpers for the mechanisms. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
export const seg = (t: number, a: number, b: number) =>
  clamp01((t - a) / (b - a));
export const ease = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
