'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Leader, pathOf, Cross, type Pt } from './primitives';
import { gsap, MOTION_OK, ScrollTrigger } from './draft';
import { Schedule, Sheet, Stamp } from './Sheet';
import { Tag, View, type Note } from './View';
import s from './blueprint.module.css';

/* Sheet 05 · Core XY plan view. Point at the frame (or tap, or use the arrow
   keys) and the carriage drives there; both belts re-route and the motor
   readout follows  a = x + y,  b = x − y. */

const X0 = 96;
const X1 = 544;
const YB = 96;
const YF = 470;
const TRAVEL = { minX: X0 + 52, maxX: X1 - 52, minY: YB + 56, maxY: YF - 40 };
const HOME = { x: TRAVEL.minX, y: TRAVEL.minY };
const CENTRE = {
  x: (TRAVEL.minX + TRAVEL.maxX) / 2,
  y: (TRAVEL.minY + TRAVEL.maxY) / 2,
};
const VW = 640;
const VH = 640;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function Motor({
  x,
  y,
  label,
  anchor,
}: {
  x: number;
  y: number;
  label: string;
  anchor: 'start' | 'end';
}) {
  const h = 26;
  return (
    <g>
      <rect className={s.ln} x={x - h} y={y - h} width={h * 2} height={h * 2} />
      {[-1, 1].map((i) =>
        [-1, 1].map((j) => (
          <circle
            key={`${i}${j}`}
            className={s.lnThin}
            cx={x + i * 18}
            cy={y + j * 18}
            r={2.6}
          />
        ))
      )}
      <circle className={s.ln} cx={x} cy={y} r={11} />
      <circle className={s.lnThin} cx={x} cy={y} r={3} />
      <text
        className={s.txL}
        x={anchor === 'start' ? x + h + 12 : x - h - 12}
        y={y + 8}
        textAnchor={anchor}
      >
        {label}
      </text>
    </g>
  );
}

const NOTES: Note[] = [
  {
    id: 'ma',
    at: [34, 34],
    k: 'Item 1 · stepper A',
    v: 'Fixed to the frame. A and B the same way: X.',
  },
  {
    id: 'mb',
    at: [606, 34],
    k: 'Item 2 · stepper B',
    v: 'Fixed too. A against B: Y. Neither motor rides the gantry.',
  },
  {
    id: 'ctrl',
    at: [612, 549],
    k: 'Item 3 · controller',
    v: 'Arduino + ESP32 driving steppers on timing belts.',
  },
  {
    id: 'use',
    at: [612, 446],
    k: 'Item 4 · duty',
    v: 'Retail / warehouse item retrieval. IIT Hack4SDG, state level: special mention.',
  },
  {
    id: 'ref',
    at: [30, 604],
    k: 'Ref 1',
    v: 'Published research paper on the Core XY mechanism, national conference.',
  },
];

function Gantry() {
  const [pos, setPos] = useState(CENTRE);
  const svgRef = useRef<SVGSVGElement>(null);
  const raf = useRef(0);
  const next = useRef(CENTRE);
  const touched = useRef(false);
  const tween = useRef<gsap.core.Tween | null>(null);

  const commit = useCallback((p: { x: number; y: number }) => {
    next.current = {
      x: clamp(p.x, TRAVEL.minX, TRAVEL.maxX),
      y: clamp(p.y, TRAVEL.minY, TRAVEL.maxY),
    };
    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        setPos(next.current);
      });
    }
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // homing run, the first time the sheet is seen
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const st = { ...HOME };
      ScrollTrigger.create({
        trigger: svg,
        start: 'top 65%',
        once: true,
        onEnter: () => {
          if (touched.current) return;
          setPos(HOME);
          gsap.to(st, {
            x: CENTRE.x,
            y: CENTRE.y,
            duration: 1.6,
            ease: 'power3.inOut',
            onUpdate: () => {
              if (!touched.current) setPos({ x: st.x, y: st.y });
            },
          });
        },
      });
    });
    return () => mm.revert();
  }, []);

  const toLocal = (e: React.PointerEvent<SVGSVGElement>) => {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== 'mouse') return;
    if ((e.target as Element).closest('[data-balloon]')) return;
    const p = toLocal(e);
    if (!p) return;
    touched.current = true;
    tween.current?.kill();
    commit(p);
  };

  // touch: tap a spot and the carriage drives there
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse') return;
    if ((e.target as Element).closest('[data-balloon]')) return;
    const p = toLocal(e);
    if (!p) return;
    touched.current = true;
    const st = { ...pos };
    const to = {
      x: clamp(p.x, TRAVEL.minX, TRAVEL.maxX),
      y: clamp(p.y, TRAVEL.minY, TRAVEL.maxY),
    };
    tween.current?.kill();
    tween.current = gsap.to(st, {
      ...to,
      duration: 0.7,
      ease: 'power2.inOut',
      onUpdate: () => setPos({ x: st.x, y: st.y }),
    });
  };

  const onKey = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.target !== e.currentTarget) return;
    const step = e.shiftKey ? 40 : 10;
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    touched.current = true;
    commit({ x: pos.x + m[0], y: pos.y + m[1] });
  };

  const { x: cx, y: gy } = pos;
  const xmm = cx - TRAVEL.minX;
  const ymm = gy - TRAVEL.minY;
  const a = xmm + ymm;
  const b = xmm - ymm;
  const o = 6;
  const beltA: Pt[] = [
    [cx - 30, gy - 5],
    [X0 - o, gy - 5],
    [X0 - o, YB - o],
    [X1 + o, YB - o],
    [X1 + o, gy - 5],
    [cx + 30, gy - 5],
  ];
  const beltB: Pt[] = [
    [cx - 30, gy + 5],
    [X0 + o, gy + 5],
    [X0 + o, YB + o],
    [X1 - o, YB + o],
    [X1 - o, gy + 5],
    [cx + 30, gy + 5],
  ];

  return (
    <>
      <svg
        ref={svgRef}
        data-drawing=""
        className={s.gantrySvg}
        viewBox={`0 0 ${VW} ${VH}`}
        role="img"
        aria-labelledby="bp-gantry-t"
        tabIndex={0}
        onPointerMove={onMove}
        onPointerDown={onDown}
        onKeyDown={onKey}
      >
        <title id="bp-gantry-t">
          {`Plan view of a Core XY gantry with two fixed stepper motors and two timing belts. Point at it, tap it, or focus it and use the arrow keys to drive the carriage. Carriage at X ${Math.round(xmm)}, Y ${Math.round(ymm)}; motor A ${Math.round(a)}, motor B ${Math.round(b)}.`}
        </title>

        <rect
          className={s.lnHeavy}
          x={X0 - 36}
          y={YB - 36}
          width={X1 - X0 + 72}
          height={YF - YB + 72}
        />
        <rect
          className={s.lnThin}
          x={X0 - 24}
          y={YB - 24}
          width={X1 - X0 + 48}
          height={YF - YB + 48}
        />
        {[
          [X0 - 24, YB - 24, 1, 1],
          [X1 + 24, YB - 24, -1, 1],
          [X0 - 24, YF + 24, 1, -1],
          [X1 + 24, YF + 24, -1, -1],
        ].map(([x, y, sx, sy], i) => (
          <path
            key={i}
            className={s.lnThin}
            d={`M${x} ${y + sy * 26} L${x + sx * 26} ${y}`}
          />
        ))}

        <rect
          className={s.ln}
          x={X0 - 7}
          y={YB + 30}
          width={14}
          height={YF - YB - 30}
        />
        <rect
          className={s.ln}
          x={X1 - 7}
          y={YB + 30}
          width={14}
          height={YF - YB - 30}
        />
        <g data-fade="">
          <path
            className={s.lnCenter}
            d={`M${X0} ${YB - 50} V${YF + 50} M${X1} ${YB - 50} V${YF + 50}`}
          />
        </g>

        <Motor x={X0} y={YB} label="A" anchor="start" />
        <Motor x={X1} y={YB} label="B" anchor="end" />

        <g data-fade="">
          <rect
            className={s.lnHidden}
            x={TRAVEL.minX}
            y={TRAVEL.minY}
            width={TRAVEL.maxX - TRAVEL.minX}
            height={TRAVEL.maxY - TRAVEL.minY}
          />
        </g>
        <Cross x={HOME.x} y={HOME.y} r={6} />
        <text className={s.txS} x={HOME.x + 10} y={HOME.y + 24}>
          HOME 0,0
        </text>

        <g data-fade="">
          <path className={s.lnChalk} d={pathOf(beltA)} />
          <path className={s.lnHidden} d={pathOf(beltB)} />
          <rect
            className={s.lnHeavy}
            x={X0 - 20}
            y={gy - 14}
            width={X1 - X0 + 40}
            height={28}
          />
          <rect
            className={s.ln}
            x={X0 - 24}
            y={gy - 22}
            width={44}
            height={44}
          />
          <rect
            className={s.ln}
            x={X1 - 20}
            y={gy - 22}
            width={44}
            height={44}
          />
          <circle className={s.ln} cx={X0} cy={gy} r={8} />
          <circle className={s.ln} cx={X1} cy={gy} r={8} />
          <rect
            className={s.lnHeavy}
            x={cx - 30}
            y={gy - 30}
            width={60}
            height={60}
          />
          <circle className={s.ln} cx={cx} cy={gy} r={13} />
          <path
            className={s.lnThin}
            d={`M${cx - 22} ${gy} H${cx + 22} M${cx} ${gy - 22} V${gy + 22}`}
          />
          <text className={s.txV} x={cx + 38} y={gy - 36}>
            {Math.round(xmm)}, {Math.round(ymm)}
          </text>
          <Leader
            pts={[
              [X1 - 120, gy - 5],
              [X1 - 120, YB + 44],
              [X1 - 150, YB + 44],
            ]}
            anchor="end"
            className={s.txS}
          >
            BELT A · UPPER
          </Leader>
          <Leader
            pts={[
              [X0 + 140, gy + 5],
              [X0 + 140, YF - 8],
              [X0 + 170, YF - 8],
            ]}
            className={s.txS}
          >
            BELT B · LOWER
          </Leader>
        </g>

        {/* controller, equation, reference */}
        <rect className={s.ln} x={414} y={522} width={176} height={54} />
        <text className={s.txL} x={502} y={546} textAnchor="middle">
          Ctrl
        </text>
        <text className={s.txS} x={502} y={566} textAnchor="middle">
          ARDUINO · ESP32
        </text>
        <path
          className={s.lnHidden}
          d={`M${X1} ${YB + 26} V${YB + 6} M502 522 V${YF + 36}`}
        />
        <text className={s.txV} x={60} y={558}>
          a = x + y
        </text>
        <text className={s.txV} x={240} y={558}>
          b = x − y
        </text>
        <text className={s.txS} x={60} y={604}>
          REF 1 · PUBLISHED RESEARCH ON THIS MECHANISM
        </text>
        <text className={s.txS} x={60} y={626}>
          NATIONAL CONFERENCE
        </text>

        <Tag
          id="ma"
          n={1}
          at={[34, 34]}
          from={[X0 - 26, YB - 26]}
          label="Stepper A"
        />
        <Tag
          id="mb"
          n={2}
          at={[606, 34]}
          from={[X1 + 26, YB - 26]}
          label="Stepper B"
        />
        <Tag
          id="ctrl"
          n={3}
          at={[612, 549]}
          from={[590, 549]}
          label="Controller"
        />
        <Tag
          id="use"
          n={4}
          at={[612, 446]}
          from={[TRAVEL.maxX, TRAVEL.maxY]}
          label="Duty"
        />
        <Tag id="ref" n="R" at={[30, 604]} label="Reference" />
      </svg>
      <div className={s.dro} aria-hidden="true">
        <div>
          <b>X</b>
          {Math.round(xmm).toString().padStart(3, '0')}
        </div>
        <div>
          <b>Y</b>
          {Math.round(ymm).toString().padStart(3, '0')}
        </div>
        <div>
          <b>A = x+y</b>
          {Math.round(a)}
        </div>
        <div>
          <b>B = x−y</b>
          {Math.round(b)}
        </div>
      </div>
    </>
  );
}

/* tiny glyphs for the bench schedule */
const GLYPH: Record<string, React.ReactNode> = {
  arm: <path d="M4 26 H16 M10 26 V20 L18 10 L26 14 M26 14 l2 -4 M26 14 l3 2" />,
  car: (
    <>
      <rect x="7" y="6" width="16" height="20" rx="2" />
      <path d="M3 7 h4 v6 h-4z M23 7 h4 v6 h-4z M3 19 h4 v6 h-4z M23 19 h4 v6 h-4z M3 9 l4 2 M23 11 l4 -2 M3 23 l4 -2 M23 21 l4 2" />
    </>
  ),
  hand: (
    <path d="M9 28 V14 M9 14 V6 M13 14 V4 M17 14 V5 M21 15 V8 M9 14 H21 V22 C21 26 17 28 13 28 H9 M21 18 l5 -4" />
  ),
  xy: (
    <>
      <rect x="4" y="4" width="24" height="24" />
      <path d="M4 16 H28 M16 13 v6 M13 16 h6" />
    </>
  ),
  rover: (
    <path d="M6 14 H26 V20 H6 Z M16 14 V8 h5 M8 24 a2.5 2.5 0 1 0 0.1 0 M16 24 a2.5 2.5 0 1 0 0.1 0 M24 24 a2.5 2.5 0 1 0 0.1 0" />
  ),
  nozzle: (
    <path d="M10 4 H22 V14 H10 Z M12 14 L16 22 L20 14 M16 22 V24 M6 28 H26" />
  ),
};

function G({ k }: { k: keyof typeof GLYPH }) {
  return (
    <svg className={s.glyph} viewBox="0 0 32 32" aria-hidden="true">
      {GLYPH[k]}
    </svg>
  );
}

export default function S05Gantry() {
  return (
    <Sheet
      n={5}
      kicker="Detail 4 · Core XY retrieval machine · plan view"
      title="Some of my code has motors."
      line="Two fixed motors drive one carriage through two belts."
      fields={[
        { k: 'Project', v: 'Core XY item-retrieval machine', wide: true },
        { k: 'Duty', v: 'Retail / warehouse retrieval', wide: true },
        { k: 'Drive', v: 'Steppers · timing belts' },
        { k: 'Ctrl', v: 'Arduino · ESP32' },
        { k: 'Result', v: 'IIT Hack4SDG · special mention' },
        { k: 'Ref', v: 'Paper · national conference' },
      ]}
    >
      <div className={`${s.span7} ${s.stampHost}`}>
        <Stamp rot={-6} className={s.stampGantry}>
          <b>Special mention</b>
          <span>IIT Hack4SDG · state level</span>
        </Stamp>
        <View
          W={VW}
          H={VH}
          notes={NOTES}
          letter="A"
          title="Plan · belt routing"
          sub="Point, tap or use arrow keys"
          pan={520}
        >
          <Gantry />
        </View>
      </div>
      <div className={s.span5}>
        <Schedule
          title="Bench schedule"
          className={s.bench}
          cols={['Mk', '', 'Item', 'Spec']}
          rows={[
            [
              'B1',
              <G key="g" k="arm" />,
              '4-DOF arm',
              '3D printed · servos · inverse kinematics',
            ],
            [
              'B2',
              <G key="g" k="car" />,
              'Mecanum car',
              'Steppers · Arduino · CNC shield · Bluetooth',
            ],
            ['B3', <G key="g" k="hand" />, 'Bionic arm', 'EMG-controlled'],
            ['B4', <G key="g" k="xy" />, 'Core XY machine', 'This sheet'],
            [
              'B5',
              <G key="g" k="nozzle" />,
              '3D printers',
              '~1 yr · repair · model · slice · tune',
            ],
          ]}
        />
      </div>
    </Sheet>
  );
}
