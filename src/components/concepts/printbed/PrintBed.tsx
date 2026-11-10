'use client';

import dynamic from 'next/dynamic';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { PerspectiveCamera } from 'three';
import { profile } from '@/data/profile';
import { BENCHY_TAG, CHAPTERS, CONFIG, type Tag } from './content';
import { gcodeWindow, START_GCODE, type GLine } from './gcode';
import { FIL_NAME, job, type ViewMode } from './job';
import { BONUS } from './shapes';
import { bus, C } from './bus';
import { FEAT, fmtTime, PROFILE } from './slicer';
import s from './printbed.module.css';

const Printer3D = dynamic(() => import('./Printer3D'), { ssr: false });

const N = CHAPTERS.length;
const POOL = 6;
const ROWS = 4;

const STATUS: Record<string, string> = {
  heating: 'Heating',
  printing: 'Printing',
  switch: 'Travel',
  m600: 'M600',
  waiting: 'Paused',
  slicing: 'Slicing',
  done: 'Done',
};

const hms = (sec: number) => {
  const t = Math.max(0, Math.round(sec));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
const pad2 = (i: number) => String(i).padStart(2, '0');

/* camera -> screen, without pulling three into this chunk */
function projector(cam: PerspectiveCamera, W: number, H: number) {
  const e = cam.matrixWorldInverse.elements;
  const p = cam.projectionMatrix.elements;
  return (x: number, y: number, z: number) => {
    const vx = e[0] * x + e[4] * y + e[8] * z + e[12];
    const vy = e[1] * x + e[5] * y + e[9] * z + e[13];
    const vz = e[2] * x + e[6] * y + e[10] * z + e[14];
    const cx = p[0] * vx + p[4] * vy + p[8] * vz + p[12];
    const cy = p[1] * vx + p[5] * vy + p[9] * vz + p[13];
    const cw = p[3] * vx + p[7] * vy + p[11] * vz + p[15];
    return { x: ((cx / cw + 1) / 2) * W, y: ((1 - cy / cw) / 2) * H };
  };
}

function SliceLine({ i }: { i: number }) {
  const [, setV] = useState(0);
  useEffect(() => job.onSliced(() => setV((v) => v + 1)), []);
  const o = job.objs[i];
  const tp = o.tp;
  const sh = o.shape;
  return (
    <p className={s.slice}>
      <span
        className={s.sliceN}
        data-red={CHAPTERS[i].color === 'red' ? '' : undefined}
      >
        {pad2(i)}
      </span>
      <span className={s.sliceFile}>{CHAPTERS[i].file}</span>
      {tp && sh ? (
        <span className={s.sliceStats}>
          {tp.layers} layers · {PROFILE.lh} mm · {sh.infill.kind}{' '}
          {Math.round(sh.infill.density * 100)}% · {fmtTime(tp.time)} ·{' '}
          {tp.grams.toFixed(1)} g
        </span>
      ) : (
        <span className={s.sliceStats}>slicing…</span>
      )}
    </p>
  );
}

function TagList({
  i,
  tags,
  refs,
}: {
  i: number;
  tags: Tag[];
  refs: (HTMLLIElement | null)[][];
}) {
  return (
    <ul className={s.tags} aria-label="Printed on the part" data-tags={i}>
      {tags.map((t, j) => (
        <li
          key={j}
          className={s.tag}
          ref={(el) => {
            refs[i][j] = el;
          }}
        >
          <b>{t.k}</b>
          {t.v ? <span>{t.v}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function PrintBed({ fontClass }: { fontClass: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActiveS] = useState(0);
  const [mode, setModeS] = useState<ViewMode>('printed');
  const [term, setTerm] = useState(false);
  const [echo, setEcho] = useState('ok');
  const [scrubbing, setScrubbing] = useState(false);
  const activeRef = useRef(0);

  const tagRefs = useRef<(HTMLLIElement | null)[][]>([
    ...CHAPTERS.map(() => []),
    [],
  ]).current;
  const R = {
    cards: useRef<(HTMLElement | null)[]>([]),
    titles: useRef<(HTMLElement | null)[]>([]),
    bar: useRef<HTMLElement>(null),
    plate: useRef<HTMLElement>(null),
    ticker: useRef<HTMLDivElement>(null),
    svg: useRef<SVGSVGElement>(null),
    bubble: useRef<HTMLDivElement>(null),
    bubbleT: useRef<HTMLSpanElement>(null),
    glow: useRef<HTMLDivElement>(null),
    status: useRef<HTMLSpanElement>(null),
    lcd: useRef<HTMLSpanElement>(null),
    layer: useRef<HTMLElement>(null),
    z: useRef<HTMLElement>(null),
    noz: useRef<HTMLElement>(null),
    nozBar: useRef<HTMLElement>(null),
    bed: useRef<HTMLElement>(null),
    bedBar: useRef<HTMLElement>(null),
    speed: useRef<HTMLElement>(null),
    time: useRef<HTMLElement>(null),
    story: useRef<HTMLParagraphElement>(null),
    gcode: useRef<HTMLOListElement>(null),
    bars: useRef<(HTMLElement | null)[]>([]),
    thumb: useRef<HTMLSpanElement>(null),
    fill: useRef<HTMLSpanElement>(null),
    track: useRef<HTMLDivElement>(null),
    sliderLabel: useRef<HTMLSpanElement>(null),
    slider: useRef<HTMLDivElement>(null),
    termIn: useRef<HTMLInputElement>(null),
  };

  /* ------------------------------------------------------ commands + buddy */
  const pokes = useRef(0);
  const run = (raw: string) => {
    const c = raw.trim().toUpperCase();
    if (!c) return;
    job.activity();
    const busy = () => {
      setEcho('echo: busy, try again in a moment');
      job.say(
        job.reduced
          ? 'Motion is reduced. I’ll stay put.'
          : 'Busy. One thing at a time.'
      );
    };
    if (c === 'G28') {
      if (job.g28()) {
        setEcho('ok · homing X Y Z');
        job.say('Homing. Don’t mind me.');
      } else busy();
    } else if (c === 'M600') {
      if (job.m600()) setEcho('ok · filament change');
      else busy();
    } else if (c.startsWith('M117')) {
      const msg = raw.trim().slice(4).trim();
      job.setLcd(msg);
      setEcho(msg ? 'ok · message on the display' : 'ok · display cleared');
    } else if (c === 'M115') {
      setEcho('FIRMWARE_NAME: Ibrahim 1.0 · G28 · M600 · M117');
    } else if (c === 'BENCHY' || c === 'M1') {
      setEcho('ok · queued 3dbenchy_mini.stl');
      void job.benchy();
    } else {
      setEcho(`echo: Unknown command: "${c.slice(0, 18)}"`);
    }
  };
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    bus.poke = () => {
      job.activity();
      const n = ++pokes.current;
      const lines = [
        '215 degrees. Careful.',
        'Still hot.',
        'Three more and I’ll make you something.',
        'Two more.',
        'One more.',
      ];
      if (n >= 6) {
        void job.benchy();
        pokes.current = 0;
      } else job.say(lines[n - 1]);
    };
    bus.hover = (on) => {
      if (root.current) root.current.dataset.hover = on ? '1' : '';
    };
    let hideT = 0;
    const offSay = job.onSay((t) => {
      const b = R.bubble.current;
      if (!b || !R.bubbleT.current) return;
      R.bubbleT.current.textContent = t;
      b.dataset.on = '1';
      job.invalidate();
      window.clearTimeout(hideT);
      hideT = window.setTimeout(() => {
        b.dataset.on = '';
      }, 3400);
    });
    // type G28 / M600 / BENCHY anywhere
    let buf = '';
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      )
        return;
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
      buf = (buf + e.key.toUpperCase()).slice(-8);
      for (const cmd of ['G28', 'M600', 'BENCHY']) {
        if (buf.endsWith(cmd)) {
          buf = '';
          runRef.current(cmd);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      bus.poke = null;
      bus.hover = null;
      offSay();
      window.clearTimeout(hideT);
      window.removeEventListener('keydown', onKey);
    };
    // refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------ layout */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mqR = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqM = window.matchMedia('(max-width: 900px)');
    job.mobile = mqM.matches;
    job.setReduced(mqR.matches);
    const onR = () => job.setReduced(mqR.matches);
    mqR.addEventListener('change', onR);

    const fam =
      getComputedStyle(el).getPropertyValue('--pb-display').trim() ||
      'sans-serif';
    let cancelled = false;
    const go = () => {
      if (!cancelled) void job.start(fam);
    };
    document.fonts.load(`800 100px ${fam}`).then(go, go);

    const de = document.documentElement;
    const prevSnap = de.style.scrollSnapType;
    de.style.scrollSnapType = 'y proximity';

    // overlay geometry, measured on layout changes, used every frame
    const ov = {
      attach: { x: 0, y: 0 },
      tagH: [] as number[],
      tagW: [] as number[],
      shown: -2,
      px: -1,
      py: -1,
    };

    const measure = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const mob = mqM.matches;
      job.mobile = mob;
      const a = activeRef.current;
      const card = R.cards.current[a];
      const bar = R.bar.current?.getBoundingClientRect();
      const plate = R.plate.current?.getBoundingClientRect();
      const tick = R.ticker.current?.getBoundingClientRect();
      if (!card || !bar || !plate || !tick) return;
      const cr = card.getBoundingClientRect();
      let l: number, r: number, t: number, b: number;
      if (!mob) {
        l = cr.right + 24;
        r = W - Math.min(320, W * 0.24);
        t = bar.bottom + 16;
        b = Math.min(plate.top, tick.top) - 16;
      } else {
        l = 44;
        r = W * 0.6;
        t = plate.bottom + 10;
        b = cr.top - 14;
      }
      job.frame = {
        cx: (l + r) / 2,
        cy: (t + b) / 2,
        r: Math.max(56, (Math.min(r - l, b - t) / 2) * (mob ? 0.92 : 0.8)),
        ok: true,
      };
      const ti = R.titles.current[a]?.getBoundingClientRect();
      ov.attach = mob
        ? { x: cr.left + 34, y: cr.top }
        : { x: cr.right + 6, y: (ti ? ti.top : cr.top) + 22 };
      const f = job.focus;
      const els = tagRefs[f] ?? [];
      ov.tagH = els.map((x) => x?.offsetHeight ?? 0);
      ov.tagW = els.map((x) => x?.offsetWidth ?? 0);
      job.invalidate();
    };
    let mRaf = 0;
    const remeasure = () => {
      cancelAnimationFrame(mRaf);
      mRaf = requestAnimationFrame(measure);
    };

    // pin callouts to the parts, every rendered frame
    bus.project = (cam, W, H) => {
      const P = projector(cam, W, H);
      const svg = R.svg.current;
      if (!svg) return;
      const f = job.focus;
      const o = job.objs[f];
      const sh = o.shape;
      const mob = job.mobile;

      const show = !!sh && !job.wide;
      const want = show ? f : -1;
      if (ov.shown !== want) {
        tagRefs.forEach((row, i) =>
          row.forEach((x) => x && (x.dataset.show = i === want ? '1' : ''))
        );
        ov.shown = want;
        const els = tagRefs[f] ?? [];
        ov.tagH = els.map((x) => x?.offsetHeight ?? 0);
        ov.tagW = els.map((x) => x?.offsetWidth ?? 0);
      }
      const paths = svg.querySelectorAll<SVGPathElement>('path[data-k]');
      const dots = svg.querySelectorAll<SVGCircleElement>('circle[data-k]');
      const cardPath = svg.querySelector<SVGPathElement>('path[data-card]');
      const cardDot = svg.querySelector<SVGCircleElement>('circle[data-card]');
      const hide = (k: number) => {
        paths[k]?.setAttribute('d', '');
        dots[k]?.setAttribute('r', '0');
      };

      const world = (x: number, y: number, z: number) =>
        P(sh!.ox + x - C, z - job.head.z, C - (sh!.oy + y));
      const tags = f === BONUS ? [BENCHY_TAG] : CHAPTERS[f].tags;

      if (show) {
        // part outline on screen
        let maxX = -Infinity;
        for (const cx of [0, sh.w])
          for (const cy of [0, sh.d])
            for (const cz of [0, sh.h])
              maxX = Math.max(maxX, world(cx, cy, cz).x);
        const z = job.printedZ(f);
        const top =
          (R.bar.current?.getBoundingClientRect().bottom ?? 60) +
          (mob ? 52 : 14);
        const bottom = mob
          ? (R.cards.current[activeRef.current]?.getBoundingClientRect().top ??
              H) - 10
          : Math.min(
              R.plate.current?.getBoundingClientRect().top ?? H,
              R.ticker.current?.getBoundingClientRect().top ?? H
            ) - 10;
        const maxW = Math.max(...ov.tagW, 60);
        const colX = mob
          ? Math.min(maxX + 12, W - 8 - maxW)
          : Math.min(maxX + 44, W - 72 - maxW);
        const items = tags.map((t, j) => {
          const a = world(t.at[0], t.at[1], t.at[2]);
          return { j, a, h: ov.tagH[j] || 34, on: z >= t.at[2] - 0.02, y: 0 };
        });
        const order = items.slice().sort((p, q) => p.a.y - q.a.y);
        const gap = mob ? 5 : 9;
        let prev = top;
        for (const it of order) {
          it.y = Math.max(it.a.y - Math.min(it.h / 2, 13), prev);
          prev = it.y + it.h + gap;
        }
        if (prev - gap > bottom) {
          // slide the stack up as a block, as far as the top allows
          const shift = Math.min(
            prev - gap - bottom,
            order[0] ? order[0].y - top : 0
          );
          for (const it of order) it.y -= shift;
        }
        for (const it of items) {
          const el = tagRefs[f]?.[it.j];
          if (el) {
            el.style.transform = `translate3d(${colX.toFixed(1)}px, ${it.y.toFixed(1)}px, 0)`;
            el.dataset.on = it.on ? '1' : '';
          }
          const ly = it.y + Math.min(it.h / 2, 11);
          const p = paths[it.j];
          if (p) {
            p.setAttribute(
              'd',
              `M${it.a.x.toFixed(1)} ${it.a.y.toFixed(1)}L${(colX - 14).toFixed(1)} ${ly.toFixed(1)}H${(colX - 4).toFixed(1)}`
            );
            p.dataset.on = it.on ? '1' : '';
          }
          const d = dots[it.j];
          if (d) {
            d.setAttribute('cx', it.a.x.toFixed(1));
            d.setAttribute('cy', it.a.y.toFixed(1));
            d.setAttribute('r', mob ? '3' : '3.5');
            d.dataset.on = it.on ? '1' : '';
          }
        }
        for (let k = tags.length; k < POOL; k++) hide(k);
      } else for (let k = 0; k < POOL; k++) hide(k);

      // the card's own leader, to the part it describes
      if (cardPath && cardDot) {
        const a = activeRef.current;
        const ash = job.objs[a].shape;
        if (ash && f === a) {
          const an = CHAPTERS[a].anchor;
          const A = P(
            ash.ox + an[0] - C,
            an[2] - job.head.z,
            C - (ash.oy + an[1])
          );
          const { x, y } = ov.attach;
          cardPath.setAttribute(
            'd',
            mob
              ? `M${x} ${y}V${(y - 12).toFixed(1)}L${A.x.toFixed(1)} ${A.y.toFixed(1)}`
              : `M${x} ${y}H${x + 22}L${A.x.toFixed(1)} ${A.y.toFixed(1)}`
          );
          cardDot.setAttribute('cx', A.x.toFixed(1));
          cardDot.setAttribute('cy', A.y.toFixed(1));
          cardDot.setAttribute('r', '4.5');
        } else {
          cardPath.setAttribute('d', '');
          cardDot.setAttribute('r', '0');
        }
      }

      // the buddy: where the hot end is on screen
      const hp = P(job.head.x - C, 14, C - job.head.y);
      const tip = P(job.head.x - C, 0, C - job.head.y);
      const b = R.bubble.current;
      if (b)
        b.style.transform = `translate3d(${Math.max(90, Math.min(W - 90, hp.x)).toFixed(1)}px, ${Math.max(112, hp.y - 30).toFixed(1)}px, 0)`;
      const g = R.glow.current;
      if (g) {
        g.style.transform = `translate3d(${tip.x.toFixed(1)}px, ${tip.y.toFixed(1)}px, 0)`;
        g.style.opacity = String(
          Math.max(0, (job.nozzle - 40) / (job.nozzleTarget - 40)) *
            (job.mode === 'printed' ? 0.5 : 0)
        );
      }
      if (ov.px >= 0) {
        job.buddy.look.x = Math.max(-1, Math.min(1, (ov.px - hp.x) / 220));
        job.buddy.look.y = Math.max(-1, Math.min(1, -(ov.py - hp.y) / 220));
      }
    };

    const onMove = (e: globalThis.PointerEvent) => {
      ov.px = e.clientX;
      ov.py = e.clientY;
      job.activity();
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    // which part is in view
    let raf = 0;
    // dev only: ?pbpart=3 pins a part without scrolling (for headless screenshots)
    let pin = -1;
    if (process.env.NODE_ENV !== 'production') {
      pin = Number(new URLSearchParams(location.search).get('pbpart') ?? -1);
      (window as unknown as { __pb: typeof job }).__pb = job;
    }
    const read = () => {
      raf = 0;
      const vh = window.innerHeight;
      const a =
        pin >= 0
          ? pin
          : Math.max(
              0,
              Math.min(N - 1, Math.floor(window.scrollY / vh + 0.42))
            );
      job.activity();
      if (a !== activeRef.current) {
        activeRef.current = a;
        setActiveS(a);
        job.setActive(a);
        setScrubbing(false);
        remeasure();
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __pbGo: (i: number) => void }).__pbGo = (i) => {
        pin = i;
        read();
      };
    }
    read();
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', remeasure);
    const ro = new ResizeObserver(remeasure);
    R.cards.current.forEach((c) => c && ro.observe(c));
    document.fonts.ready.then(remeasure, () => {});
    const offSliced = job.onSliced(remeasure);
    el.dataset.js = '';

    return () => {
      cancelled = true;
      job.stop();
      bus.project = null;
      de.style.scrollSnapType = prevSnap;
      mqR.removeEventListener('change', onR);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      offSliced();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(mRaf);
    };
    // refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------------- live HUD */
  useEffect(() => {
    let lastKey = '';
    let lastStory = '';
    let lcdUntil = 0;
    let lastLcd = '';
    const set = (el: HTMLElement | null, t: string) => {
      if (el && el.textContent !== t) el.textContent = t;
    };
    return job.subscribe(() => {
      const now = performance.now() / 1000;
      const ph = job.phase;
      const cur = job.current;
      const tp = cur?.tp ?? null;
      const st = R.status.current;
      set(
        st,
        job.scriptKind === 'g28'
          ? 'G28'
          : job.scriptKind === 'm600'
            ? 'M600'
            : (STATUS[ph] ?? ph)
      );
      if (st) st.dataset.state = job.scriptKind ?? ph;

      if (job.lcd !== lastLcd) {
        lastLcd = job.lcd;
        lcdUntil = now + 8;
      }
      const a = job.active;
      const f = job.focus;
      const file = f === BONUS ? '3dbenchy_mini.stl' : CHAPTERS[a].file;
      set(
        R.lcd.current,
        job.lcd && now < lcdUntil
          ? job.lcd
          : `${pad2(f)} ${file} · ${FIL_NAME[job.filament]}`
      );

      const settled = Math.abs(job.nozzle - job.nozzleTarget) < 1.5;
      const wob = settled
        ? Math.sin(now * 2.1) * 0.3 + Math.sin(now * 5.3) * 0.15
        : 0;
      set(R.noz.current, `${(job.nozzle + wob).toFixed(1)}°`);
      set(R.bed.current, `${job.bed.toFixed(1)}°`);
      if (R.nozBar.current)
        R.nozBar.current.style.transform = `scaleX(${Math.min(1, job.nozzle / job.nozzleTarget).toFixed(3)})`;
      if (R.bedBar.current)
        R.bedBar.current.style.transform = `scaleX(${Math.min(1, job.bed / job.bedTarget).toFixed(3)})`;
      set(R.speed.current, job.speed > 0 ? `×${Math.round(job.speed)}` : '×0');
      set(R.time.current, hms(job.elapsed));

      const printing = ph === 'printing' && tp && !job.script;
      if (printing) {
        set(R.layer.current, `${tp.lay[job.move] + 1}/${tp.layers}`);
        set(R.z.current, tp.layerZ[tp.lay[job.move]].toFixed(2));
      } else {
        set(R.layer.current, '–');
        set(R.z.current, '–');
      }

      // plate list progress
      for (let i = 0; i < N; i++) {
        const o = job.objs[i];
        const p = o.tp ? o.t / o.tp.time : 0;
        const b = R.bars.current[i];
        if (b) {
          const v = p.toFixed(3);
          if (b.dataset.p !== v) {
            b.dataset.p = v;
            b.style.transform = `scaleX(${v})`;
          }
        }
      }

      // story: G-code comments as the ticker
      const story =
        f === BONUS
          ? ['; 3DBenchy · the torture test everyone prints']
          : CHAPTERS[a].story;
      const o = job.objs[f];
      let k = 0;
      if (o.tp && o.done) k = Math.floor(now / 4.2) % story.length;
      else if (o.tp && o.t > 0)
        k = Math.min(
          story.length - 1,
          Math.floor((o.t / o.tp.time) * story.length)
        );
      const line = ph === 'heating' && a === 0 ? START_GCODE[1].t : story[k];
      const sp = R.story.current;
      if (sp && line !== lastStory) {
        lastStory = line;
        sp.textContent = line;
        sp.dataset.flip = sp.dataset.flip === 'a' ? 'b' : 'a';
      }

      // raw G-code, desktop only
      const ol = R.gcode.current;
      const key = `${ph}:${job.live}:${job.printing}:${printing ? job.move : ''}:${job.scriptKind}`;
      if (ol && ol.offsetParent && key !== lastKey) {
        lastKey = key;
        let lines: GLine[];
        const lstory =
          job.live >= 0 && job.live < N ? CHAPTERS[job.live].story : [];
        if (job.scriptKind === 'g28')
          lines = [
            { t: 'G28 ; home all axes', k: 'g', cur: true },
            { t: 'G28 X0 Y0 ; endstops', k: 't' },
            { t: 'G28 Z0 ; probe', k: 'g' },
          ];
        else if (job.scriptKind === 'm600' || ph === 'm600')
          lines = [
            { t: 'G1 Z+20 F720 ; lift', k: 'g' },
            { t: 'G1 X12 Y12 F9000 ; park', k: 't' },
            { t: 'M600 ; filament change', k: 'm', cur: true },
            { t: `;   load ${FIL_NAME[job.filament]}, purge`, k: 'c' },
          ];
        else if (printing)
          lines = gcodeWindow(
            tp,
            job.move,
            ROWS,
            job.live === 0 ? START_GCODE : [],
            lstory
          );
        else if (ph === 'heating' || (ph === 'slicing' && job.printing === 0))
          lines = START_GCODE.slice(2, 2 + ROWS);
        else if (ph === 'switch' && tp)
          lines = [
            { t: `;MESH:${cur!.meta.file}`, k: 'c' },
            { t: 'G1 E-.8 F2100', k: 'g' },
            { t: 'G1 Z+8 F720 ; clear the last part', k: 'g' },
            {
              t: `G1 X${tp.x1[0].toFixed(3)} Y${tp.y1[0].toFixed(3)} F10800`,
              k: 't',
              cur: true,
            },
          ];
        else if (ph === 'done')
          lines = [
            { t: 'M104 S0 ; nozzle off', k: 'm' },
            { t: 'M140 S0 ; bed off', k: 'm' },
            { t: 'M107 ; fan off', k: 'm' },
            { t: 'M84 ; motors off', k: 'm', cur: true },
          ];
        else
          lines = [
            {
              t: `; next: ${CHAPTERS[Math.min(job.printing, N - 1)].file}`,
              k: 'c',
            },
            { t: 'M0 ; waiting for the reader', k: 'm', cur: true },
          ];
        const kids = ol.children;
        const off = ROWS - lines.length;
        for (let i = 0; i < ROWS; i++) {
          const li = kids[i] as HTMLElement;
          const ln = lines[i - off];
          li.textContent = ln ? ln.t : '';
          li.dataset.k = ln ? ln.k : '';
          li.dataset.cur = ln?.cur ? '1' : '';
        }
      }

      // layer slider
      const so = job.objs[a];
      const stp = so?.tp;
      if (stp) {
        let live = 0;
        if (so.done) live = stp.layers - 1;
        else if (so.t > 0)
          live = stp.lay[Math.min(stp.n - 1, job.live === a ? job.move : 0)];
        const layer = Math.min(job.scrub ?? live, stp.layers - 1);
        const max = Math.max(1, stp.layers - 1);
        const p = layer / max;
        if (R.thumb.current)
          R.thumb.current.style.top = `${((1 - p) * 100).toFixed(2)}%`;
        if (R.fill.current)
          R.fill.current.style.transform = `scaleY(${p.toFixed(3)})`;
        const zl = CHAPTERS[a].zLabel;
        const zz = stp.layerZ[layer];
        set(R.sliderLabel.current, zl ? zl(zz) : `L${layer + 1}`);
        const sl = R.slider.current;
        if (sl) {
          sl.setAttribute('aria-valuemax', String(stp.layers));
          sl.setAttribute('aria-valuenow', String(layer + 1));
          sl.setAttribute(
            'aria-valuetext',
            `Layer ${layer + 1} of ${stp.layers}, Z ${zz.toFixed(2)} mm${zl ? `, ${zl(zz)}` : ''}`
          );
        }
      }
    });
    // refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------ layer slider */
  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const tr = R.track.current;
    const tp = job.objs[job.active]?.tp;
    if (!tr || !tp) return;
    const b = tr.getBoundingClientRect();
    const p = 1 - Math.max(0, Math.min(1, (e.clientY - b.top) / b.height));
    job.setScrub(Math.round(p * (tp.layers - 1)));
    job.activity();
    setScrubbing(true);
  };
  const onSliderKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const o = job.objs[job.active];
    const tp = o?.tp;
    if (!tp) return;
    const cur = job.scrub ?? (o.done ? tp.layers - 1 : 0);
    let n = cur;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') n = cur + 1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') n = cur - 1;
    else if (e.key === 'PageUp') n = cur + 10;
    else if (e.key === 'PageDown') n = cur - 10;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = tp.layers - 1;
    else if (e.key === 'Escape') {
      job.setScrub(null);
      setScrubbing(false);
      return;
    } else return;
    e.preventDefault();
    job.setScrub(Math.max(0, Math.min(tp.layers - 1, n)));
    setScrubbing(true);
  };

  const setMode = (m: ViewMode) => {
    setModeS(m);
    job.setMode(m);
  };
  const goTo = (i: number) => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    window.scrollTo({
      top: i * window.innerHeight,
      behavior: reduce ? 'auto' : 'smooth',
    });
  };
  const onTerm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inp = R.termIn.current;
    if (!inp) return;
    run(inp.value);
    inp.value = '';
  };

  const tel = `tel:${profile.phone.replace(/\s/g, '')}`;
  const [user, host] = profile.email.split('@');

  return (
    <div
      ref={root}
      className={`${s.root} ${fontClass}`}
      style={{ height: `${N * 100}svh` }}
      data-mode={mode}
    >
      <a className={s.skip} href="#contact">
        Skip to contact
      </a>

      <div className={s.stage}>
        <div className={s.scene}>
          <Printer3D />
        </div>
        <div className={s.glow} ref={R.glow} aria-hidden="true" />
        <div className={s.scrim} aria-hidden="true" />

        <svg className={s.leaders} ref={R.svg} aria-hidden="true">
          <path data-card="" className={s.leadCard} />
          <circle data-card="" className={s.dotCard} r="0" />
          {Array.from({ length: POOL }, (_, k) => (
            <g key={k}>
              <path data-k={k} className={s.lead} />
              <circle data-k={k} className={s.dot} r="0" />
            </g>
          ))}
        </svg>

        <header className={s.bar} ref={R.bar}>
          <span className={s.status} ref={R.status} data-state="heating">
            Heating
          </span>
          <span className={s.lcd} ref={R.lcd} aria-live="polite">
            00 nameplate.stl · PLA Bone
          </span>
          <dl className={s.read}>
            <div>
              <dt>Layer</dt>
              <dd ref={R.layer}>–</dd>
            </div>
            <div>
              <dt>Z</dt>
              <dd ref={R.z}>–</dd>
            </div>
            <div className={s.heat}>
              <dt>Nozzle</dt>
              <dd>
                <span ref={R.noz}>27.0°</span>
                <i>
                  <i ref={R.nozBar} />
                </i>
              </dd>
            </div>
            <div className={s.heat}>
              <dt>Bed</dt>
              <dd>
                <span ref={R.bed}>26.0°</span>
                <i>
                  <i ref={R.bedBar} />
                </i>
              </dd>
            </div>
            <div>
              <dt>Speed</dt>
              <dd ref={R.speed}>×0</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd ref={R.time}>0:00:00</dd>
            </div>
          </dl>
          <nav className={s.links} aria-label="Site">
            <button
              type="button"
              className={s.btnBar}
              aria-pressed={mode === 'preview'}
              onClick={() =>
                setMode(mode === 'preview' ? 'printed' : 'preview')
              }
            >
              Preview
            </button>
            <button
              type="button"
              className={s.btnBar}
              aria-expanded={term}
              aria-controls="pb-term"
              onClick={() => {
                setTerm((v) => !v);
                window.setTimeout(() => R.termIn.current?.focus(), 30);
              }}
            >
              Terminal
            </button>
            <a className={s.btnBar} href="/concepts">
              all cuts
            </a>
            <a className={s.btnBar} href={profile.resumeUrl}>
              résumé
            </a>
          </nav>
        </header>

        {mode === 'preview' && (
          <ul className={s.legend} aria-label="Toolpath colours">
            {FEAT.slice(0, 7).map((f) => (
              <li key={f.name}>
                <i style={{ background: f.color }} />
                {f.name}
              </li>
            ))}
          </ul>
        )}

        <form id="pb-term" className={s.term} hidden={!term} onSubmit={onTerm}>
          <label htmlFor="pb-term-in">Send G-code</label>
          <div className={s.termRow}>
            <span aria-hidden="true">&gt;</span>
            <input
              id="pb-term-in"
              ref={R.termIn}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="G28 · M600 · M117 hello"
              onKeyDown={(e) => e.key === 'Escape' && setTerm(false)}
            />
            <button type="submit">Send</button>
          </div>
          <output className={s.echo}>{echo}</output>
        </form>

        <nav className={s.plate} ref={R.plate} aria-label="Plate: objects">
          <ol>
            {CHAPTERS.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  aria-current={active === i ? 'step' : undefined}
                  onClick={() => goTo(i)}
                  aria-label={`${pad2(i)} ${c.nav}`}
                >
                  <span className={s.plateN}>{pad2(i)}</span>
                  <span className={s.plateName}>{c.nav}</span>
                  <span className={s.plateBar}>
                    <i
                      ref={(el) => {
                        R.bars.current[i] = el;
                      }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className={s.sliderWrap}>
          <span
            className={s.sliderLabel}
            ref={R.sliderLabel}
            aria-hidden="true"
          >
            L1
          </span>
          <div
            className={s.slider}
            ref={R.slider}
            role="slider"
            tabIndex={0}
            aria-label="Layer preview"
            aria-orientation="vertical"
            aria-valuemin={1}
            aria-valuemax={1}
            aria-valuenow={1}
            onKeyDown={onSliderKey}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              fromPointer(e);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                fromPointer(e);
            }}
          >
            <div className={s.track} ref={R.track}>
              <span className={s.fill} ref={R.fill} />
              <span className={s.thumbRail}>
                <span className={s.thumb} ref={R.thumb} />
              </span>
            </div>
          </div>
          {scrubbing && (
            <button
              type="button"
              className={s.live}
              onClick={() => {
                job.setScrub(null);
                setScrubbing(false);
              }}
            >
              Live
            </button>
          )}
        </div>

        <div className={s.ticker} ref={R.ticker}>
          <p className={s.story} ref={R.story} data-flip="a" aria-live="off">
            {CHAPTERS[0].story[0]}
          </p>
          <ol className={s.gcode} ref={R.gcode} aria-hidden="true">
            {Array.from({ length: ROWS }, (_, i) => (
              <li key={i} />
            ))}
          </ol>
        </div>

        <div
          className={s.bubble}
          ref={R.bubble}
          role="status"
          aria-live="polite"
        >
          <span ref={R.bubbleT} />
        </div>

        <ul className={`${s.tags} ${s.bonusTags}`} aria-hidden="true">
          <li
            className={s.tag}
            ref={(el) => {
              tagRefs[BONUS][0] = el;
            }}
          >
            <b>{BENCHY_TAG.k}</b>
            <span>{BENCHY_TAG.v}</span>
          </li>
        </ul>

        <main className={s.cards}>
          {CHAPTERS.map((c, i) => (
            <section
              key={c.id}
              className={s.card}
              data-on={active === i ? '1' : ''}
              data-i={i}
              aria-labelledby={`${c.id}-h`}
              ref={(el) => {
                R.cards.current[i] = el;
              }}
              onFocus={() => {
                if (activeRef.current !== i) goTo(i);
              }}
            >
              <SliceLine i={i} />
              <p className={s.kicker}>{c.kicker}</p>
              {i === 0 ? (
                <h1
                  id={`${c.id}-h`}
                  className={s.name}
                  ref={(el) => {
                    R.titles.current[i] = el;
                  }}
                >
                  <span>Mohammed</span>
                  <span className={s.nameBig}>Ibrahim</span>
                  <span>Nasir</span>
                </h1>
              ) : (
                <h2
                  id={`${c.id}-h`}
                  className={s.title}
                  ref={(el) => {
                    R.titles.current[i] = el;
                  }}
                >
                  {c.title}
                </h2>
              )}
              {c.line ? <p className={s.line}>{c.line}</p> : null}
              {c.facts ? (
                <dl className={s.facts}>
                  {c.facts.map((x) => (
                    <div key={x.k}>
                      <dt>{x.k}</dt>
                      <dd>{x.v}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {i === N - 1 ? (
                <a className={s.mail} href={`mailto:${profile.email}`}>
                  {user}@
                  <wbr />
                  {host}
                </a>
              ) : null}
              {i === 0 || i === N - 1 ? (
                <ul className={s.actions}>
                  <li>
                    <a
                      className={`${s.btn} ${s.btnSolid}`}
                      href={profile.resumeUrl}
                    >
                      Résumé · PDF
                    </a>
                  </li>
                  {i === 0 ? (
                    <li>
                      <a className={s.btn} href={`mailto:${profile.email}`}>
                        Email
                      </a>
                    </li>
                  ) : (
                    <>
                      <li>
                        <a
                          className={s.btn}
                          href={profile.linkedin}
                          target="_blank"
                          rel="noreferrer"
                        >
                          LinkedIn
                        </a>
                      </li>
                      <li>
                        <a
                          className={s.btn}
                          href={profile.github}
                          target="_blank"
                          rel="noreferrer"
                        >
                          GitHub
                        </a>
                      </li>
                      <li>
                        <a className={s.btn} href={tel}>
                          {profile.phone}
                        </a>
                      </li>
                    </>
                  )}
                </ul>
              ) : null}
              {i === N - 1 ? (
                <details className={s.config}>
                  <summary>; print settings · toolkit</summary>
                  <dl>
                    {CONFIG.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k} =</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ) : null}
              <p className={s.mat}>
                <span>stack</span> {c.material}
              </p>
              <TagList i={i} tags={c.tags} refs={tagRefs} />
            </section>
          ))}
        </main>
      </div>

      {CHAPTERS.map((c, i) => (
        <span
          key={c.id}
          id={c.id}
          className={s.snap}
          style={{ top: `${i * 100}svh` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
