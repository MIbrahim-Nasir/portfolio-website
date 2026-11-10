'use client';

import { useEffect, useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { Draggable } from 'gsap/Draggable';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(
    ScrollTrigger,
    DrawSVGPlugin,
    ScrambleTextPlugin,
    Draggable
  );
}

export { gsap, ScrollTrigger, Draggable };

export const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const MOTION_OK = '(prefers-reduced-motion: no-preference)';

const STROKES = 'path, line, polyline, polygon, rect, circle, ellipse';

/** Splits an SVG into things that draw on (strokes) and things that fade in (fills, text). */
function partsOf(svg: SVGSVGElement) {
  const strokes = Array.from(
    svg.querySelectorAll<SVGGeometryElement>(STROKES)
  ).filter((el) => !el.closest('defs, [data-fade], [data-static]'));
  const fades = Array.from(
    svg.querySelectorAll<SVGElement>('[data-fade], text')
  ).filter(
    (el) =>
      !el.closest('defs, [data-static]') &&
      !el.parentElement?.closest('[data-fade]')
  );
  return { strokes, fades };
}

/**
 * Drafting motion for a subtree:
 *  - svg[data-drawing]         strokes draw on, scrubbed by scroll
 *  - svg[data-drawing="load"]  strokes draw on once, on load
 *  - [data-ink]                HTML lettering is "written" left to right
 *  - [data-scramble]           figures settle from noise
 * Nothing is hidden until JS runs, and nothing moves under reduced motion.
 */
export function useDraft(ref: RefObject<HTMLElement | null>) {
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const svgs = Array.from(
        root.querySelectorAll<SVGSVGElement>('svg[data-drawing]')
      ).filter((el) => el.getClientRects().length > 0);
      svgs.forEach((svg) => {
        const { strokes, fades } = partsOf(svg);
        const onLoad = svg.dataset.drawing === 'load';
        const tl = gsap.timeline(
          onLoad
            ? { delay: 0.25 }
            : {
                scrollTrigger: {
                  trigger: svg,
                  start: 'top 88%',
                  end: 'bottom 62%',
                  scrub: 0.7,
                },
              }
        );
        tl.from(
          strokes,
          {
            drawSVG: '0%',
            duration: onLoad ? 1.1 : 1,
            ease: onLoad ? 'power2.inOut' : 'none',
            stagger: { amount: onLoad ? 1.4 : 2.2 },
          },
          0
        );
        if (fades.length) {
          tl.from(
            fades,
            {
              opacity: 0,
              duration: 0.5,
              stagger: { amount: onLoad ? 0.9 : 1.4 },
            },
            onLoad ? 0.7 : 1.1
          );
        }
      });

      const inks = Array.from(root.querySelectorAll<HTMLElement>('[data-ink]'));
      gsap.set(inks, { clipPath: 'inset(-10% 100% -10% 0)' });
      ScrollTrigger.batch(inks, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            clipPath: 'inset(-10% 0% -10% 0)',
            duration: 0.9,
            ease: 'power2.out',
            stagger: 0.08,
          }),
      });

      // drawing titles: lettered condensed, then stretched out to their set width
      root.querySelectorAll<HTMLElement>('[data-stretch]').forEach((el) => {
        const to = el.dataset.stretch || '68';
        gsap.fromTo(
          el,
          {
            fontVariationSettings: `'wdth' 50`,
            opacity: 0.2,
            clipPath: 'inset(-20% 100% -20% 0)',
          },
          {
            fontVariationSettings: `'wdth' ${to}`,
            opacity: 1,
            clipPath: 'inset(-20% 0% -20% 0)',
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            clearProps: 'clipPath',
          }
        );
      });

      // rubber stamps land once
      root.querySelectorAll<HTMLElement>('[data-stamp]').forEach((el) => {
        gsap.from(el, {
          scale: 1.9,
          opacity: 0,
          rotation: '-=14',
          duration: 0.45,
          ease: 'back.out(2.2)',
          scrollTrigger: { trigger: el, start: 'top 82%', once: true },
        });
      });

      root.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el) => {
        const text = el.textContent ?? '';
        gsap.to(el, {
          scrambleText: {
            text,
            chars: '0123456789',
            revealDelay: 0.3,
            speed: 0.5,
          },
          duration: 1.3,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        });
      });
    });
    return () => mm.revert();
  }, [ref]);
}
