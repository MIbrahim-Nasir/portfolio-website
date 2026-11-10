'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { scenes } from '@/data/profile';
import { emit, film, shapeAt, type Keyframe } from './store';
import Preloader from './Preloader';
import Hud from './Hud';
import Panels from './Panels';
import Cursor from './Cursor';
import Labels from './Labels';
import ResumeSheet from './ResumeSheet';
import { ambient } from './sound';

const Scene = dynamic(() => import('./Scene'), { ssr: false });

// shape keyframes inside each scene, as [fraction of the scene's scroll, shape index]
const PLAN: Record<string, [number, number][]> = {
  open: [
    [0, 0],
    [0.4, 0],
  ],
  origin: [
    [0.12, 1],
    [0.82, 1],
  ],
  matter: [
    [0.12, 2],
    [0.8, 2],
  ],
  stack: [
    [0.14, 3],
    [0.8, 3],
  ],
  saif: [
    [0.08, 4],
    [0.34, 4],
    [0.58, 5],
    [0.86, 5],
  ],
  graph: [
    [0.12, 6],
    [0.8, 6],
  ],
  contact: [[0.36, 7]],
};

// shape index → scene index (SAIF owns two shapes: the photo and its render)
const SHAPE_SCENE = [0, 1, 2, 3, 4, 4, 5, 6];
const SAIF_RENDER = 4.5;

export default function Experience() {
  const [mounted, setMounted] = useState(false);
  const [booted, setBooted] = useState(false);
  const [scene, setScene] = useState(0);
  const [sub, setSub] = useState(0);
  const [resume, setResume] = useState(false);
  const [sound, setSound] = useState(false);
  const [egg, setEgg] = useState(false);
  const typed = useRef('');
  const lenis = useRef<Lenis | null>(null);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const jumps = useRef<number[]>([]);
  const sceneRef = useRef(0);
  const subRef = useRef(0);

  const update = useCallback((y: number) => {
    film.scroll = y;
    film.progress = Math.min(1, y / Math.max(1, film.maxScroll));
    film.shape = shapeAt(y, film.keyframes);
    const s = SHAPE_SCENE[Math.min(7, Math.round(film.shape))];
    const b = film.shape >= SAIF_RENDER ? 1 : 0;
    if (s !== sceneRef.current) {
      sceneRef.current = s;
      film.scene = s;
      setScene(s);
      ambient.blip(s);
      emit();
    }
    if (b !== subRef.current) {
      subRef.current = b;
      setSub(b);
    }
  }, []);

  const measure = useCallback(() => {
    const k: Keyframe[] = [];
    const j: number[] = [];
    scenes.forEach((sc, i) => {
      const el = sections.current[i];
      if (!el) return;
      const top = el.offsetTop;
      const h = el.offsetHeight;
      const plan = PLAN[sc.id];
      plan.forEach(([f, shape]) => k.push({ y: top + f * h, shape }));
      j.push(Math.round(top + plan[0][0] * h + (i === 0 ? 0 : 2)));
    });
    film.keyframes = k;
    film.maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    jumps.current = j;
    update(window.scrollY);
  }, [update]);

  // environment
  useEffect(() => {
    film.mobile = window.matchMedia('(max-width: 767px)').matches;
    film.reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.body.classList.add('locked');
    if (process.env.NODE_ENV !== 'production')
      Object.assign(window, { __film: film });
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [mounted, measure]);

  // scroll engine, after the preloader
  useEffect(() => {
    if (!booted) return;
    document.body.classList.remove('locked');
    if (film.reduced) {
      film.intro = 1;
      const onScroll = () => update(window.scrollY);
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }
    gsap.to(film, { intro: 1, duration: 3.4, ease: 'power3.out', delay: 0.1 });
    const l = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.4,
    });
    lenis.current = l;
    if (process.env.NODE_ENV !== 'production')
      Object.assign(window, { __lenis: l });
    l.on('scroll', (e: Lenis) => {
      film.velocity = e.velocity;
      update(e.scroll);
    });
    const raf = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      l.destroy();
      lenis.current = null;
    };
  }, [booted, update]);

  const jump = useCallback((i: number) => {
    const y = jumps.current[Math.max(0, Math.min(scenes.length - 1, i))] ?? 0;
    if (lenis.current)
      lenis.current.scrollTo(y, {
        duration: 1.8,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      });
    else window.scrollTo({ top: y });
  }, []);

  // pointer + keys
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') film.pointer = true;
      film.mx = (e.clientX / window.innerWidth) * 2 - 1;
      film.my = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a,button,[role=dialog]')) return;
      film.shock = 1;
      ambient.thump();
    };
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // easter egg: type the name and the particles answer
      if (e.key.length === 1) {
        typed.current = (typed.current + e.key.toLowerCase()).slice(-7);
        if (typed.current === 'ibrahim') {
          typed.current = '';
          [0, 260, 520].forEach((t) => setTimeout(() => (film.shock = 1), t));
          ambient.thump();
          setEgg(true);
          setTimeout(() => setEgg(false), 3200);
        }
      }
      if (e.key === 'Escape') setResume(false);
      if (e.key === 'r' || e.key === 'R') setResume((v) => !v);
      if (resume) return;
      if (e.key === ']' || e.key === 'ArrowRight') jump(sceneRef.current + 1);
      if (e.key === '[' || e.key === 'ArrowLeft') jump(sceneRef.current - 1);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('keydown', key);
    };
  }, [jump, resume]);

  useEffect(() => {
    if (resume) lenis.current?.stop();
    else lenis.current?.start();
  }, [resume]);

  const toggleSound = useCallback(() => {
    setSound((s) => {
      if (s) ambient.stop();
      else ambient.start();
      return !s;
    });
  }, []);

  return (
    <>
      {mounted && <Scene />}
      <Labels />
      <div className="grain" aria-hidden />
      <Panels
        scene={scene}
        sub={sub}
        booted={booted}
        onJump={jump}
        onResume={() => setResume(true)}
      />
      <Hud
        scene={scene}
        booted={booted}
        sound={sound}
        onSound={toggleSound}
        onJump={jump}
        onResume={() => setResume(true)}
      />
      <Cursor />
      <p
        role="status"
        className={`mono text-sand pointer-events-none fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--line-strong)] bg-black/60 px-4 py-2 text-[11px] tracking-[0.16em] uppercase backdrop-blur transition-opacity duration-500 ${
          egg ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="text-ember">bench ›</span> name recognised. particles
        released.
      </p>
      <ResumeSheet open={resume} onClose={() => setResume(false)} />
      {!booted && <Preloader onDone={() => setBooted(true)} />}

      {/* the scroll track: empty sections that give each scene its length */}
      <main aria-hidden className="pointer-events-none relative z-0">
        {scenes.map((s, i) => (
          <section
            key={s.id}
            ref={(el) => {
              sections.current[i] = el;
            }}
            data-scene={s.id}
            style={{ height: `${s.vh}svh` }}
          />
        ))}
      </main>
    </>
  );
}
