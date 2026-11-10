'use client';

import { useId, useRef } from 'react';
import {
  drawOn,
  lightUp,
  polyline,
  runRoute,
  seg,
  useScrub,
  type Pt,
} from '../motion';
import { Dot, HatchDef, Route, cx } from '../svg';
import { Stamp, Tag, popIn } from '../notes';
import s from '../interface.module.css';

// Top view, drawn at 1 unit = 1 mm. Two fixed motors, two belts.
// Kinematics (corexy.com convention): dX = (dA + dB)/2, dY = (dA - dB)/2, so A = X + Y, B = X - Y.
// A 45 degree move therefore turns only one motor.
const ORIGIN = { x: 56, y: 60 }; // machine zero, inside the frame
const MA = { x: 78, y: 82 };
const MB = { x: 402, y: 82 };
const PULLEY_R = 40 / (2 * Math.PI); // GT2, 20 teeth: 40 mm per rev, pitch radius ~6.37 mm

const PATH: Pt[] = [
  [145, 167], // bin (0,0)
  [355, 167], // pure X: both motors turn
  [265, 257], // 45 deg: only B turns
  [355, 347], // 45 deg: only A turns. Target bin (3,2)
];
const TRAIL = polyline(PATH);
const T0 = 0.16;
const T1 = 0.84;

const R = polyline([
  [240, 0],
  [240, 22],
  [78, 22],
  [78, 61],
]);
const OUT = polyline([
  [355, 365],
  [355, 436],
  [240, 436],
  [240, 640],
]);

/** carriage position at fraction f of the trail, by length */
function at(f: number): Pt {
  const n = PATH.length - 1;
  for (let i = 1; i <= n; i++) {
    const a = TRAIL.at(i - 1);
    const b = TRAIL.at(i);
    if (f <= b || i === n) {
      const u = b === a ? 0 : Math.max(0, Math.min(1, (f - a) / (b - a)));
      return [
        PATH[i - 1][0] + (PATH[i][0] - PATH[i - 1][0]) * u,
        PATH[i - 1][1] + (PATH[i][1] - PATH[i - 1][1]) * u,
      ];
    }
  }
  return PATH[n];
}

const beltA = (X: number, Y: number) =>
  `${X - 24},${Y - 4} 70,${Y - 4} 70,74 410,74 410,${Y - 4} ${X + 24},${Y - 4}`;
const beltB = (X: number, Y: number) =>
  `${X - 24},${Y + 4} 76,${Y + 4} 76,80 404,80 404,${Y + 4} ${X + 24},${Y + 4}`;
const mm = (n: number, w = 5) =>
  `${n < 0 ? '−' : n > 0 ? '+' : ' '}${Math.abs(n).toFixed(1).padStart(w, '0')}`;
const machine = (X: number, Y: number) => {
  const x = X - ORIGIN.x;
  const y = Y - ORIGIN.y;
  return { x, y, a: x + y, b: x - y };
};

export default function CoreXYFig() {
  const ref = useRef<SVGSVGElement>(null);
  const hatch = `h${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [X0, Y0] = PATH[0];
  const m0 = machine(X0, Y0);

  useScrub(ref, (tl, q, svg) => {
    const $ = <T extends Element>(k: string) =>
      svg.querySelector<T>(`[data-k="${k}"]`)!;
    const bA = $<SVGPolylineElement>('beltA');
    const bB = $<SVGPolylineElement>('beltB');
    const gantry = $<SVGGElement>('gantry');
    const car = $<SVGGElement>('car');
    const tA = $<SVGGElement>('tickA');
    const tB = $<SVGGElement>('tickB');
    const mA = $<SVGGElement>('mA');
    const mB = $<SVGGElement>('mB');
    const rx = $<SVGTextElement>('rxy');
    const rab = $<SVGTextElement>('rab');
    let last = { a: m0.a, b: m0.b };

    const apply = (t: number) => {
      const [X, Y] = at(seg(t, T0, T1));
      const m = machine(X, Y);
      bA.setAttribute('points', beltA(X, Y));
      bB.setAttribute('points', beltB(X, Y));
      gantry.setAttribute('transform', `translate(0 ${(Y - Y0).toFixed(2)})`);
      car.setAttribute(
        'transform',
        `translate(${(X - X0).toFixed(2)} ${(Y - Y0).toFixed(2)})`
      );
      const angA = (((m.a - m0.a) / PULLEY_R) * 180) / Math.PI;
      const angB = (((m.b - m0.b) / PULLEY_R) * 180) / Math.PI;
      tA.setAttribute(
        'transform',
        `rotate(${angA.toFixed(1)} ${MA.x} ${MA.y})`
      );
      tB.setAttribute(
        'transform',
        `rotate(${angB.toFixed(1)} ${MB.x} ${MB.y})`
      );
      const da = Math.abs(m.a - last.a);
      const db = Math.abs(m.b - last.b);
      if (t > 0.12) {
        mA.style.opacity = da > 0.01 ? '1' : '0.5';
        mB.style.opacity = db > 0.01 ? '1' : '0.5';
      }
      if (t >= T1) mA.style.opacity = mB.style.opacity = '1';
      last = { a: m.a, b: m.b };
      rx.textContent = `X ${mm(m.x)}  Y ${mm(m.y)} mm`;
      rab.textContent = `A ${mm(m.a)}  B ${mm(m.b)} mm`;
    };

    runRoute(tl, svg, 'main', 0, 0.12);
    lightUp(tl, [mA, mB], 0.11, 0.4);
    drawOn(tl, q('[data-k="trail"]'), T0, T1 - T0);
    const o = { t: 0 };
    apply(0);
    tl.to(
      o,
      { t: 1, duration: 1, ease: 'none', onUpdate: () => apply(o.t) },
      0
    );
    tl.fromTo(
      q('[data-k="target"]'),
      { opacity: 0 },
      { opacity: 1, duration: 0.03 },
      T1
    );
    runRoute(tl, svg, 'out', 0.88, 0.12);
    popIn(tl, q('[data-k="cxy"]'), 0.04);
    popIn(tl, q('[data-k="paper"]'), T1 + 0.02);
  });

  const bins: Pt[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++) bins.push([110 + 70 * c + 6, 130 + 90 * r]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 640"
      className={s.svg}
      role="img"
      aria-labelledby="fig-cxy-t"
    >
      <title id="fig-cxy-t">
        Top view of a Core XY gantry at 1 to 1: two fixed motors A and B, two
        timing belts, the carriage moving to a bin. A move along X turns both
        motors; each 45 degree move turns only one. Delta X equals half of delta
        A plus delta B; delta Y equals half of delta A minus delta B.
      </title>
      <defs>
        <HatchDef id={hatch} gap={5} />
      </defs>

      {/* frame: extrusions, corners in section */}
      <rect x={36} y={40} width={408} height={380} className={s.ln} />
      <rect
        x={56}
        y={60}
        width={368}
        height={340}
        className={cx(s.ln, s.faintLn)}
      />
      {[
        [36, 40],
        [424, 40],
        [36, 400],
        [424, 400],
      ].map(([x, y]) => (
        <rect
          key={`${x}${y}`}
          x={x}
          y={y}
          width={20}
          height={20}
          fill={`url(#${hatch})`}
          className={s.section}
        />
      ))}

      {/* bins */}
      {bins.map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={58}
          height={74}
          rx={2}
          className={cx(s.ln, s.dash, s.faintLn)}
        />
      ))}
      <rect
        x={110 + 70 * 3 + 6}
        y={130 + 90 * 2}
        width={58}
        height={74}
        rx={2}
        className={cx(s.ln, s.sigStroke, s.thick)}
        data-k="target"
        style={{ opacity: 0 }}
      />
      <text x={116} y={124} className={s.tSub}>
        bins
      </text>

      <polyline points={TRAIL.points} className={cx(s.ln, s.dash, s.faintLn)} />
      <polyline points={TRAIL.points} className={s.trace} data-k="trail" />

      {/* gantry beam with its end idlers */}
      <g data-k="gantry">
        <rect
          x={60}
          y={Y0 - 12}
          width={360}
          height={24}
          className={cx(s.box, s.faintBox)}
        />
        <line x1={60} y1={Y0} x2={420} y2={Y0} className={s.ctr} />
        <circle cx={73} cy={Y0} r={5} className={s.box} />
        <circle cx={407} cy={Y0} r={5} className={s.box} />
      </g>

      <polyline points={beltA(X0, Y0)} className={s.beltA} data-k="beltA" />
      <polyline points={beltB(X0, Y0)} className={s.beltB} data-k="beltB" />

      {/* motors: 42 mm square faces, pulley on the shaft, a tick to show rotation */}
      {(
        [
          ['mA', 'tickA', MA, 'A'],
          ['mB', 'tickB', MB, 'B'],
        ] as const
      ).map(([k, tk, m, l]) => (
        <g key={k} data-k={k} style={{ opacity: 0.5 }}>
          <rect
            x={m.x - 21}
            y={m.y - 21}
            width={42}
            height={42}
            rx={4}
            className={cx(s.box, s.sigStroke)}
          />
          <circle cx={m.x} cy={m.y} r={PULLEY_R} className={s.box} />
          <g data-k={tk}>
            <line
              x1={m.x}
              y1={m.y}
              x2={m.x}
              y2={m.y - PULLEY_R - 3}
              className={cx(s.ln, s.sigStroke)}
            />
          </g>
          <text x={m.x} y={m.y + 40} textAnchor="middle" className={s.tLab}>
            motor {l}
          </text>
        </g>
      ))}

      <g data-k="car">
        <rect
          x={X0 - 24}
          y={Y0 - 16}
          width={48}
          height={32}
          rx={3}
          className={cx(s.box, s.sigStroke)}
        />
        <circle cx={X0} cy={Y0} r={6} className={s.box} />
        <line
          x1={X0 - 10}
          y1={Y0}
          x2={X0 + 10}
          y2={Y0}
          className={cx(s.ln, s.thin)}
        />
        <line
          x1={X0}
          y1={Y0 - 10}
          x2={X0}
          y2={Y0 + 10}
          className={cx(s.ln, s.thin)}
        />
      </g>

      <Route d={R.d} />
      <Route d={OUT.d} name="out" />

      {/* kinematics and live readout */}
      <text x={20} y={462} className={s.tEq}>
        ΔX = ½(ΔA + ΔB)
      </text>
      <text x={20} y={488} className={s.tEq}>
        ΔY = ½(ΔA − ΔB)
      </text>
      <text x={20} y={514} className={s.tSub}>
        45° move: one motor turns
      </text>
      <text x={262} y={462} className={cx(s.tLab, s.tSig)} data-k="rxy">
        X {mm(m0.x)} Y {mm(m0.y)} mm
      </text>
      <text x={262} y={488} className={cx(s.tLab, s.tSig)} data-k="rab">
        A {mm(m0.a)} B {mm(m0.b)} mm
      </text>
      <text x={262} y={514} className={s.tSub}>
        80 steps/mm (GT2, 20T, 1/16)
      </text>
      <line x1={262} y1={546} x2={312} y2={546} className={cx(s.ln, s.thick)} />
      <line x1={262} y1={540} x2={262} y2={552} className={s.ln} />
      <line x1={312} y1={540} x2={312} y2={552} className={s.ln} />
      <text x={320} y={551} className={s.tSub}>
        50 mm
      </text>

      <Tag
        k="cxy"
        x={18}
        y={604}
        lines={[
          'item-retrieval machine',
          'Hack4SDG · special mention',
          'Arduino + ESP32 · belts',
        ]}
      />
      <Stamp
        k="paper"
        x={366}
        y={604}
        lines={['PUBLISHED', 'national conference']}
        rotate={-5}
      />

      <Dot />
      <Dot name="out" />
    </svg>
  );
}
