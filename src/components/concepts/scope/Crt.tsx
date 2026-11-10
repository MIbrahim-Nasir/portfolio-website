'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  SETUPS,
  type Mark,
  type ModeDef,
  type ModeId,
  type SoftKey,
  type Span,
} from './channels';
import { createRenderer, type Renderer } from './renderer';
import { drawFrame, PACKED_INK, PLAIN_INK, type FrameInfo } from './traces';
import styles from './scope.module.css';

export type CrtState = {
  mode: ModeId;
  timeIdx: number;
  voltsIdx: number;
  cursor: number;
  cursorVisible: boolean;
  bin: number;
  intensity: number; // 0..100
  persist: boolean;
  grid: boolean;
  run: boolean;
  power: boolean;
  retrig: number;
  key: number;
  cx?: SoftKey['cx'];
  cy?: Span;
  solo?: number;
  xy: boolean;
  fx: number;
  fy: number;
  lockDist: number;
  menu: boolean;
};

type Geo = {
  W: number;
  H: number;
  gx: number;
  gy: number;
  div: number;
  compact: boolean;
};

// P31: green-yellow, ~530 nm
const PHOSPHOR: [number, number, number] = [0.36, 1.0, 0.56];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x: number) => 1 - (1 - x) * (1 - x) * (1 - x);

/** Where a beam point lands on the curved tube face (inverse of the shader's barrel map). */
function onGlass(
  px: number,
  py: number,
  W: number,
  H: number
): [number, number] {
  const cx = (px / W) * 2 - 1;
  const cy = (py / H) * 2 - 1;
  let vx = cx;
  let vy = cy;
  for (let i = 0; i < 4; i++) {
    vx = cx / (1 + (vy / 6.2) * (vy / 6.2));
    vy = cy / (1 + (vx / 5.4) * (vx / 5.4));
  }
  return [((vx + 1) / 2) * W, ((vy + 1) / 2) * H];
}

export type ScreenProps = {
  def: ModeDef;
  state: CrtState;
  reduced: boolean;
  status: string;
  activeKey: number;
  onKey: (i: number) => void;
  recall: number | null;
  onRecall: (i: number | null) => void;
  xyBars: number;
  onSwipe: (dir: number) => void;
};

export const SOFT_SLOTS = 5;

export default function Crt({
  def,
  state,
  reduced,
  status,
  activeKey,
  onKey,
  recall,
  onRecall,
  xyBars,
  onSwipe,
}: ScreenProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const geoRef = useRef<Geo | null>(null);
  const renderOnce = useRef<() => void>(() => {});
  const [geo, setGeo] = useState<Geo | null>(null);

  useEffect(() => {
    stateRef.current = state;
    if (reduced) renderOnce.current();
  }, [state, reduced]);

  // layout: the graticule sits inside the .plot box; marks and canvas share it
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const plot = plotRef.current;
    if (!wrap || !plot) return;
    const measure = () => {
      const r = wrap.getBoundingClientRect();
      const q = plot.getBoundingClientRect();
      if (r.width < 2 || q.width < 2) return;
      const div = Math.min(q.width / 10, q.height / 8);
      const g: Geo = {
        W: r.width,
        H: r.height,
        gx: q.left - r.left + (q.width - div * 10) / 2,
        gy: q.top - r.top + (q.height - div * 8) / 2,
        div,
        compact: div < 50,
      };
      const o = geoRef.current;
      if (
        o &&
        o.W === g.W &&
        o.H === g.H &&
        o.gx === g.gx &&
        o.gy === g.gy &&
        o.div === g.div
      )
        return;
      geoRef.current = g;
      setGeo(g);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(plot);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const renderer: Renderer | null = createRenderer(canvas, PHOSPHOR);
    const beam = renderer ? document.createElement('canvas') : canvas;
    const ctx = beam.getContext('2d');
    if (!ctx) return;
    if (!renderer) wrap.dataset.fallback = 'true';
    const ink = renderer ? PACKED_INK : PLAIN_INK;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let visible = true;
    let raf = 0;

    const start = performance.now() / 1000;
    const tm = {
      t: reduced ? 2.4 : 0,
      last: start,
      mode: stateRef.current.mode,
      xy: stateRef.current.xy,
      modeAt: start + 1.1,
      power: stateRef.current.power,
      powerAt: start,
      offAt: -10,
      retrig: stateRef.current.retrig,
      locked: false,
      lockAt: 0,
    };

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (r.width * dpr > 1800) dpr = 1800 / r.width;
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      if (w === W && h === H) return;
      W = w;
      H = h;
      if (renderer) {
        renderer.resize(W, H);
        beam.width = W;
        beam.height = H;
      } else {
        canvas.width = W;
        canvas.height = H;
      }
    };

    const paint = (now: number, dt: number) => {
      const g = geoRef.current;
      if (!W || !H || !g) return;
      const s = stateRef.current;
      if (s.mode !== tm.mode || s.retrig !== tm.retrig || s.xy !== tm.xy) {
        tm.mode = s.mode;
        tm.retrig = s.retrig;
        tm.xy = s.xy;
        tm.modeAt = now;
      }
      if (s.power !== tm.power) {
        tm.power = s.power;
        if (s.power) {
          tm.powerAt = now;
          tm.modeAt = now + 1.1;
        } else tm.offAt = now;
      }
      const locked = s.xy && s.lockDist === 0;
      if (locked !== tm.locked) {
        tm.locked = locked;
        tm.lockAt = now;
      }
      if (s.run && !reduced) tm.t += dt;

      const since = now - tm.modeAt;
      let boot = reduced ? 1 : clamp((now - tm.powerAt) / 1.1);
      let power = 1;
      if (!s.power) {
        const k = reduced ? 1 : (now - tm.offAt) / 0.5;
        if (k >= 1) power = 0;
        else boot = 1 - k;
      }
      const sx = W / g.W;

      const f: FrameInfo = {
        w: W,
        h: H,
        dpr: sx,
        area: {
          x: g.gx * sx,
          y: g.gy * sx,
          w: g.div * 10 * sx,
          h: g.div * 8 * sx,
        },
        t: tm.t,
        mode: s.mode,
        prog: reduced ? 1 : clamp(since / 0.55),
        lock: reduced ? 1 : clamp((since - 0.12) / 0.45),
        count: reduced ? 1 : ease(clamp((since - 0.2) / 1.0)),
        boot,
        timeIdx: s.timeIdx,
        voltsIdx: s.voltsIdx,
        cursor: s.cursor,
        cursorVisible: s.cursorVisible,
        bin: s.bin,
        run: s.run,
        ink,
        cx: typeof s.cx === 'function' ? s.cx(g.compact) : s.cx,
        cy: s.cy,
        solo: s.solo,
        key: s.key,
        xy: s.xy,
        fx: s.fx,
        fy: s.fy,
        lockDist: s.lockDist,
        morph: locked
          ? reduced
            ? 1
            : clamp((now - tm.lockAt - 0.4) / 1.4)
          : 0,
        dim: s.menu ? 0.3 : 1,
      };

      if (power > 0) drawFrame(ctx, f);
      else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
      }

      if (renderer) {
        const base = s.persist ? 0.955 : 0.7;
        renderer.frame(beam, {
          decay: reduced ? 0 : Math.pow(base, dt * 60),
          grid: s.grid ? 1 : 0,
          intensity: 0.45 + (s.intensity / 100) * 0.9,
          time: now - start,
          power,
        });
      } else {
        wrap.style.setProperty('--crt-int', String(0.5 + s.intensity / 100));
      }
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) {
        tm.last = performance.now() / 1000;
        return;
      }
      const now = performance.now() / 1000;
      const dt = Math.min(0.05, now - tm.last);
      tm.last = now;
      paint(now, dt);
    };

    renderOnce.current = () => paint(performance.now() / 1000, 0);

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) requestAnimationFrame(() => renderOnce.current());
    });
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(wrap);

    if (reduced) requestAnimationFrame(() => renderOnce.current());
    else raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      renderer?.dispose();
      renderOnce.current = () => {};
    };
  }, [reduced]);

  // re-render the static frame once layout settles (reduced motion)
  useEffect(() => {
    if (reduced) renderOnce.current();
  }, [geo, reduced]);

  // swipe across the tube to change channel (touch)
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);

  const compact = geo?.compact ?? true;
  const marks: Mark[] = useMemo(() => {
    if (state.xy || recall !== null) return [];
    return def
      .marks({ compact, bin: state.bin })
      .filter((m) => !(compact && m.c === false));
  }, [def, compact, state.bin, state.xy, recall]);

  const locked = state.xy && state.lockDist === 0;
  const key = def.keys[activeKey];
  const setup = recall !== null ? SETUPS[recall] : null;

  const tagline = state.xy
    ? locked
      ? 'Signature found.'
      : 'Find the lock.'
    : def.tagline;
  const support = state.xy ? undefined : def.support;
  const bars = '▮'.repeat(xyBars) + '▯'.repeat(5 - xyBars);

  return (
    <div
      ref={wrapRef}
      className={styles.crt}
      data-power={state.power || undefined}
      data-xy={state.xy || undefined}
      onPointerDown={(e) => {
        if (e.pointerType !== 'touch') return;
        swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      }}
      onPointerUp={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!s || s.id !== e.pointerId) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.abs(dx) > 60 && Math.abs(dy) < 40) onSwipe(dx < 0 ? 1 : -1);
      }}
    >
      <canvas ref={canvasRef} className={styles.crtCanvas} aria-hidden="true" />

      <div className={styles.screen}>
        <div className={styles.status}>
          <span className={styles.statusCh}>
            <b>{state.xy ? 'X-Y' : def.key}</b>{' '}
            {state.xy ? `${state.fx}:${state.fy}` : def.title}
          </span>
          <span className={styles.statusTrig} data-locked={locked || undefined}>
            {state.xy ? `LOCK ${bars}` : def.trig}
          </span>
          <span className={styles.statusRight}>{status}</span>
        </div>

        <div ref={plotRef} className={styles.plot}>
          <p className={styles.srOnly}>
            {state.xy ? 'X-Y display: a Lissajous figure.' : def.trace}
          </p>
          {recall !== null ? (
            <div
              className={styles.recall}
              role="dialog"
              aria-label="Save and recall: saved setups"
            >
              <div className={styles.recallHead}>
                <span>SAVE / RECALL · {SETUPS.length} SETUPS</span>
                <button
                  type="button"
                  className={styles.recallExit}
                  onClick={() => onRecall(null)}
                >
                  EXIT ✕
                </button>
              </div>
              <ol className={styles.recallList}>
                {SETUPS.map((s, i) => (
                  <li key={s.k}>
                    <button
                      type="button"
                      aria-pressed={i === recall}
                      onClick={() => onRecall(i)}
                    >
                      <span className={styles.recallN}>S{i + 1}</span>
                      <span className={styles.recallK}>{s.k}</span>
                      <span className={styles.recallV}>{s.v}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        <div className={styles.strip} key={`${def.id}-${state.xy}-${locked}`}>
          <h2 className={styles.tagline}>{tagline}</h2>
          {support ? <p className={styles.support}>{support}</p> : null}
        </div>

        <div className={styles.cursorBox} aria-live="polite">
          {setup ? (
            <>
              <span className={styles.cbK}>
                ▸ S{(recall ?? 0) + 1} {setup.k}
              </span>
              <span className={styles.cbD}>{setup.d}</span>
            </>
          ) : state.xy ? (
            <>
              <span className={styles.cbK}>
                ▸ X {state.fx}f · Y {state.fy}f
              </span>
              <span className={styles.cbD}>
                {locked
                  ? 'M · I · N · Mohammed Ibrahim Nasir'
                  : 'TIME/DIV sets X · VOLTS/DIV sets Y · slower drift = closer'}
              </span>
            </>
          ) : key ? (
            <>
              <span className={styles.cbK}>
                ▸ {key.k} <b>{key.v}</b>
              </span>
              <span className={styles.cbD}>{key.d}</span>
            </>
          ) : null}
        </div>

        <dl className={styles.measRow}>
          {def.meas.map((m) => (
            <div key={m.k} className={styles.measCell}>
              <dt>{m.k}</dt>
              <dd>{m.v}</dd>
            </div>
          ))}
        </dl>

        <div
          className={styles.softkeys}
          role="group"
          aria-label={`${def.key} measurements`}
        >
          <span className={styles.softHead} aria-hidden="true">
            MEASURE
          </span>
          {Array.from({ length: SOFT_SLOTS }, (_, i) => {
            const k = def.keys[i];
            if (!k)
              return (
                <span key={i} className={styles.softEmpty} aria-hidden="true" />
              );
            return (
              <button
                key={i}
                type="button"
                className={styles.soft}
                aria-pressed={i === activeKey && !state.xy}
                onClick={() => onKey(i)}
                data-clip
              >
                <span className={styles.softK}>{k.k}</span>
                <span className={styles.softV}>{k.v}</span>
              </button>
            );
          })}
        </div>
      </div>

      {geo ? (
        <ul
          className={styles.marks}
          key={`${def.id}-${state.xy}`}
          aria-label="Trace annotations"
        >
          {marks.map((m, i) => {
            const [x, y] = onGlass(
              geo.gx + m.x * geo.div,
              geo.gy + (4 - m.y) * geo.div,
              geo.W,
              geo.H
            );
            const hot = m.k !== undefined && m.k === activeKey;
            const style = {
              left: x,
              top: y,
              '--d': `${(0.25 + (m.x / 10) * 0.55).toFixed(2)}s`,
            } as CSSProperties;
            return (
              <li
                key={`${m.t}-${i}`}
                className={styles.mark}
                data-a={m.a ?? 'l'}
                data-tone={m.tone}
                data-hot={hot || undefined}
                style={style}
              >
                <span>{compact && typeof m.c === 'string' ? m.c : m.t}</span>
                {m.s && !compact ? <small>{m.s}</small> : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className={styles.crtGlass} aria-hidden="true" />
    </div>
  );
}
