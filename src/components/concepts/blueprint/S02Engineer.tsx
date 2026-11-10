'use client';

import {
  Arrowhead,
  iso,
  isoBox,
  isoCylinder,
  pathOf,
  type Pt,
  type V3,
} from './primitives';
import { Schedule, Sheet } from './Sheet';
import { Tag, View, useView, type Note } from './View';
import s from './blueprint.module.css';

/* Sheet 02 · the engineer as an exploded assembly.
   Base plate (first principles) under four plates: mechanics, electronics,
   code, AI. Robotics is the standoffs. The degree is dimensioned honestly:
   it spans one plate; "engineer" spans the stack. Geometry illustrative. */

const O: Pt = [0, 0];
const W = 170;
const D = 110;
const T = 10;
const BASE_T = 16;
const GAP = 52;
const INSET = 14;
const R_SO = 5;

type Layer = {
  id: string;
  n: number;
  name: string[];
  spec: string;
  z0: number;
  t: number;
  min: V3;
  size: V3;
};
const plate = (i: number) => {
  const z0 = BASE_T + GAP * i;
  return { z0, t: T, min: [0, 0, z0] as V3, size: [W, D, T] as V3 };
};

const LAYERS: Layer[] = [
  {
    id: 'base',
    n: 1,
    name: ['First', 'principles'],
    spec: 'LEARN THE CORE',
    z0: 0,
    t: BASE_T,
    min: [-16, -16, 0],
    size: [W + 32, D + 32, BASE_T],
  },
  {
    id: 'mech',
    n: 2,
    name: ['Mechanics'],
    spec: 'SOLIDWORKS · 3D PRINT',
    ...plate(1),
  },
  {
    id: 'elec',
    n: 3,
    name: ['Electronics'],
    spec: 'ARDUINO · ESP32 · JETSON',
    ...plate(2),
  },
  {
    id: 'code',
    n: 4,
    name: ['Code'],
    spec: 'PYTHON · FASTAPI · C#',
    ...plate(3),
  },
  {
    id: 'ai',
    n: 5,
    name: ['AI'],
    spec: 'LANGGRAPH · RAG · EVALS',
    ...plate(4),
  },
];

const CORNERS: [number, number][] = [
  [W - INSET, D - INSET],
  [W - INSET, INSET],
  [INSET, D - INSET],
];

function standoffs(from: Layer, to: Layer) {
  const z = from.z0 + from.t;
  const len = to.z0 - z;
  return CORNERS.map(([x, y]) => {
    const g = isoCylinder([x, y, z], 'z', len, R_SO, O);
    return [g.back, ...g.sides, g.front];
  });
}

const RX = 204; // balloon column
const anchorOf = (l: Layer): Pt =>
  iso([l.min[0] + l.size[0], l.min[1] + l.size[1] * 0.5, l.z0 + l.t * 0.5], O);
const ROBO_FROM = iso([W - INSET + R_SO, INSET, LAYERS[4].z0 - 13], O); // just under the AI plate, clear of its leader
const ROBO_AT: Pt = [RX, -186];

const TOP_Z = LAYERS[4].z0 + T;
const LEFT_BASE = iso([-16, D + 16, 0], O); // lowest point of the left silhouette
const LEFT_TOP = iso([0, D, TOP_Z], O);
const CODE = LAYERS[3];
const CODE_LO = iso([0, D, CODE.z0], O);
const CODE_HI = iso([0, D, CODE.z0 + T], O);
const AXIS = pathOf([
  iso([W / 2, D / 2, -14], O),
  iso([W / 2, D / 2, TOP_Z + 44], O),
]);

const VB = { x: -226, y: -252, w: 660, h: 432 };

const NOTES: Note[] = [
  {
    id: 'base',
    at: anchorOf(LAYERS[0]).map((v, i) => (i ? v : RX)) as Pt,
    k: 'Item 1 · first principles',
    v: 'Learn a field from its core concepts, then build on it. System design, OOD, DSA, deep-learning concepts.',
  },
  {
    id: 'mech',
    at: [RX, anchorOf(LAYERS[1])[1]],
    k: 'Item 2 · mechanics',
    v: 'SolidWorks, Onshape. About a year of 3D printing: repairing printers, modelling, slicing, tuning.',
  },
  {
    id: 'elec',
    at: [RX, anchorOf(LAYERS[2])[1]],
    k: 'Item 3 · electronics',
    v: 'Soldering, basic PCB design, Arduino, ESP32, Jetson Nano, I2C / SPI.',
  },
  {
    id: 'code',
    at: [RX, anchorOf(LAYERS[3])[1]],
    k: 'Item 4 · code',
    v: 'Python + FastAPI, REST API design, C# / ASP.NET Core. The plate my degree covers.',
  },
  {
    id: 'ai',
    at: [RX, anchorOf(LAYERS[4])[1]],
    k: 'Item 5 · AI',
    v: 'LangGraph, RAG, agentic workflows, LLM evaluation. Full time since Aug 2025.',
  },
  {
    id: 'robo',
    at: ROBO_AT,
    k: 'Item 6 · robotics standoffs × 12',
    v: '4-DOF arm, mecanum car, EMG bionic arm, Core XY machine.',
  },
].map((n) => ({ ...n, at: [n.at[0] - VB.x, n.at[1] - VB.y] as Pt }));

function Assembly() {
  const { active } = useView();
  const cls = (id: string) =>
    `${s.part} ${active === null ? '' : active === id ? s.partOn : s.partOff}`;
  // ext line + dimension on the left, drawn by hand: vertical, arrows in or out
  const vdim = (
    x: number,
    y1: number,
    y2: number,
    fx1: number,
    fx2: number,
    outside = false
  ) => {
    const a: Pt = [x, y1];
    const b: Pt = [x, y2];
    const out = 16;
    return (
      <g>
        <path
          className={s.lnDim}
          d={`M${fx1 - 4} ${y1} H${x - 6} M${fx2 - 4} ${y2} H${x - 6}`}
        />
        {outside ? (
          <>
            <path className={s.lnDim} d={`M${x} ${y1 + out} V${y2 - out}`} />
            <Arrowhead at={a} from={[x, y1 + out]} size={9} />
            <Arrowhead at={b} from={[x, y2 - out]} size={9} />
          </>
        ) : (
          <>
            <path className={s.lnDim} d={pathOf([a, b])} />
            <Arrowhead at={a} from={b} size={9} />
            <Arrowhead at={b} from={a} size={9} />
          </>
        )}
      </g>
    );
  };
  const midE = (LEFT_BASE[1] + LEFT_TOP[1]) / 2;
  const midC = (CODE_LO[1] + CODE_HI[1]) / 2;
  return (
    <svg
      data-drawing=""
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      role="img"
      aria-labelledby="bp-eng-t"
    >
      <title id="bp-eng-t">
        Exploded assembly of the engineer. A base plate, first principles,
        carries four plates: mechanics, electronics, code and AI, tied together
        by robotics standoffs. A dimension marked B.E. CSE spans only the code
        plate; a dimension marked engineer spans the whole stack.
      </title>
      <g data-fade="">
        <path className={s.lnCenter} d={AXIS} />
      </g>
      {LAYERS.map((l, i) => (
        <g key={l.id}>
          <g className={cls(l.id)}>
            {isoBox(l.min, l.size, O).map((d, k) => (
              <path key={k} className={`${s.ln} ${s.lnFace}`} d={d} />
            ))}
          </g>
          {i < LAYERS.length - 1 && (
            <g className={cls('robo')}>
              {standoffs(l, LAYERS[i + 1]).map((paths, k) =>
                paths.map((d, j) => (
                  <path
                    key={`${k}-${j}`}
                    className={`${s.ln} ${s.lnFace}`}
                    d={d}
                  />
                ))
              )}
            </g>
          )}
        </g>
      ))}

      {/* the honest dimensions */}
      {vdim(-182, LEFT_BASE[1], LEFT_TOP[1], LEFT_BASE[0], LEFT_TOP[0])}
      <text
        className={s.txV}
        x={-190}
        y={midE}
        textAnchor="middle"
        transform={`rotate(-90 -190 ${midE})`}
      >
        ENGINEER
      </text>
      {vdim(-138, CODE_LO[1], CODE_HI[1], CODE_LO[0], CODE_HI[0], true)}
      <text
        className={s.txVs}
        x={-146}
        y={midC}
        textAnchor="middle"
        transform={`rotate(-90 -146 ${midC})`}
      >
        B.E. CSE
      </text>

      {LAYERS.map((l) => {
        const a = anchorOf(l);
        const at: Pt = [RX, a[1]];
        return (
          <g key={`t${l.id}`}>
            <Tag id={l.id} n={l.n} at={at} from={a} label={l.name.join(' ')} />
            {l.name.map((w, i) => (
              <text key={w} className={s.txL} x={RX + 28} y={a[1] + 9 + i * 26}>
                {w}
              </text>
            ))}
            <text
              className={`${s.txS} ${s.wideOnly}`}
              x={RX + 28}
              y={a[1] + 30 + (l.name.length - 1) * 26}
            >
              {l.spec}
            </text>
          </g>
        );
      })}
      <Tag id="robo" n={6} at={ROBO_AT} from={ROBO_FROM} label="Robotics" />
      <text className={s.txL} x={RX + 28} y={ROBO_AT[1] + 9}>
        Robotics · 12
      </text>
      <text
        className={`${s.txS} ${s.wideOnly}`}
        x={RX + 28}
        y={ROBO_AT[1] + 30}
      >
        STANDOFFS · TIE THE STACK
      </text>
      <text className={s.txS} x={VB.x + 12} y={VB.y + VB.h - 12}>
        EXPLOSION AXIS · CHAIN LINE
      </text>
    </svg>
  );
}

export default function S02Engineer() {
  return (
    <Sheet
      n={2}
      kicker="Detail 1 · the engineer · exploded assembly"
      title="Exploded for clarity."
      line="The degree covers one plate. The rest I learned by building."
      fields={[
        { k: 'Subject', v: 'M. I. Nasir · engineer', wide: true },
        {
          k: 'Disciplines',
          v: 'Mechanics · electronics · code · AI',
          wide: true,
        },
        { k: 'Method', v: 'Core concepts → build' },
        { k: 'Thinks in', v: '3D' },
      ]}
    >
      <View
        W={VB.w}
        H={VB.h}
        notes={NOTES}
        letter="A"
        title="Exploded iso"
        sub="Items 1–6 · tap a balloon"
        className={s.span7}
        pan={440}
        panStart={0.7}
      >
        <Assembly />
      </View>
      <div className={s.span5}>
        <Schedule
          title="Bill of materials · toolkit"
          className={s.bom}
          cols={['Item', 'Part', 'Qty', 'Spec']}
          rows={[
            [
              '1',
              'First principles',
              '1',
              'System design · OOD · DSA · deep-learning concepts',
            ],
            [
              '2',
              'Mechanics',
              '1',
              'SolidWorks · Onshape · 3D printing, ~1 yr',
            ],
            [
              '3',
              'Electronics',
              '1',
              'Soldering · basic PCB · Arduino · ESP32 · Jetson Nano · I2C / SPI',
            ],
            [
              '4',
              'Code',
              '1',
              'Python · FastAPI · REST API design · C# · ASP.NET Core',
            ],
            [
              '5',
              'AI',
              '1',
              'LangGraph · LangChain · RAG · agentic workflows · prompt & context engineering · LLM evaluation · LangSmith · Langfuse · Claude, Gemini, OpenAI APIs · image models · embeddings',
            ],
            [
              '6',
              'Robotics',
              '12',
              '4-DOF arm · mecanum car · EMG bionic arm · Core XY',
            ],
            [
              '7',
              'Data stores',
              '—',
              'PostgreSQL / pgvector · ChromaDB · SQL Server · Supabase · not shown',
            ],
            [
              '8',
              'Site services',
              '—',
              'Railway · Docker · VPS · Cloudflare R2 · Git · not shown',
            ],
            [
              '9',
              'Hand tools',
              '—',
              'Cursor · Claude Code · Copilot · not shown',
            ],
          ]}
        />
      </div>
    </Sheet>
  );
}
