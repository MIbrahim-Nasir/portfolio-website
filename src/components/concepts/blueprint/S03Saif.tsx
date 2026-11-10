'use client';

import { useRef } from 'react';
import { profile } from '@/data/profile';
import {
  Arrow,
  Arrowhead,
  RevTriangle,
  revCloud,
  pathOf,
  type Pt,
} from './primitives';
import { gsap, MOTION_OK, useIsoLayoutEffect } from './draft';
import { Sheet, Stamp } from './Sheet';
import { Tag, View, type Note } from './View';
import s from './blueprint.module.css';

/* Sheet 03 · SAIF. The pipeline is the drawing; every number on the sheet is a
   dimension, a tally, a revision or an engineering change notice. */

type Shape = 'terminal' | 'double' | 'box' | 'diamond' | 'store' | 'doc';
type NodeBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  shape: Shape;
  label: string;
  sub: string;
  code?: string;
};
type Edge = {
  pts: Pt[];
  both?: boolean;
  label?: string;
  lx?: number;
  ly?: number;
  anchor?: 'start' | 'middle' | 'end';
  rot?: number;
};
type Hand = {
  x: number;
  y: number;
  lines: string[];
  anchor?: 'start' | 'middle' | 'end';
};
type Balloon = { id: string; n: number | string; at: Pt; from: Pt };
type Layout = {
  W: number;
  H: number;
  nodes: Record<string, NodeBox>;
  edges: Edge[];
  hands: Hand[];
  balloons: Balloon[];
  bus: {
    pts: Pt[];
    drops: [number, number, number][];
    labels: [number, number, string][];
  };
  time: {
    x0: number;
    x1: number;
    y: number;
    ghostY: number;
    liveY: number;
    revLines: string[];
    revY: number;
  };
};

const N = (
  x: number,
  y: number,
  w: number,
  h: number,
  shape: Shape,
  label: string,
  sub: string
): NodeBox => ({ x, y, w, h, shape, label, sub });

const WIDE: Layout = {
  W: 1200,
  H: 700,
  nodes: {
    input: N(40, 200, 150, 80, 'terminal', 'Photo', 'WHATSAPP'),
    planner: N(250, 200, 170, 80, 'double', 'Planner', 'AGENT'),
    render: N(500, 200, 160, 80, 'box', 'Render', 'IMAGE MODEL'),
    eval: N(740, 185, 180, 110, 'diamond', 'Evaluate', 'GATE'),
    out: N(1010, 200, 160, 80, 'terminal', 'Client', 'DESIGN + BOQ'),
    rag: N(250, 380, 170, 110, 'store', 'Catalogue', 'PGVECTOR'),
    boq: N(745, 390, 170, 90, 'doc', 'BOQ', 'QUANTITIES'),
  },
  edges: [
    {
      pts: [
        [190, 240],
        [250, 240],
      ],
    },
    {
      pts: [
        [420, 240],
        [500, 240],
      ],
    },
    {
      pts: [
        [660, 240],
        [740, 240],
      ],
    },
    {
      pts: [
        [920, 240],
        [1010, 240],
      ],
      label: 'PASS',
      lx: 965,
      ly: 228,
      anchor: 'middle',
    },
    {
      pts: [
        [830, 185],
        [830, 132],
        [580, 132],
        [580, 200],
      ],
      label: 'FAIL → REGENERATE',
      lx: 705,
      ly: 122,
      anchor: 'middle',
    },
    {
      pts: [
        [335, 280],
        [335, 380],
      ],
      both: true,
      label: 'GROUND',
      lx: 346,
      ly: 372,
    },
    {
      pts: [
        [420, 436],
        [745, 436],
      ],
    },
    {
      pts: [
        [915, 436],
        [1110, 436],
        [1110, 280],
      ],
    },
  ],
  hands: [
    {
      x: 582,
      y: 470,
      lines: ['Real catalogue,', 'sellable products only.'],
      anchor: 'middle',
    },
    {
      x: 705,
      y: 78,
      lines: ['The agents check their own work.'],
      anchor: 'middle',
    },
    {
      x: 1160,
      y: 512,
      lines: ['Was 20+ minutes.', 'Now 5 to 7.'],
      anchor: 'end',
    },
  ],
  balloons: [
    { id: 'input', n: 1, at: [70, 160], from: [90, 200] },
    { id: 'planner', n: 2, at: [290, 160], from: [310, 200] },
    { id: 'rag', n: 3, at: [200, 520], from: [262, 470] },
    { id: 'eval', n: 4, at: [960, 150], from: [878, 210] },
    { id: 'out', n: 5, at: [1150, 160], from: [1130, 200] },
    { id: 'trace', n: 6, at: [70, 352], from: [115, 322] },
    { id: 'time', n: 7, at: [130, 538], from: [172, 566] },
  ],
  bus: {
    pts: [
      [115, 322],
      [1090, 322],
    ],
    drops: [
      [115, 280, 322],
      [580, 280, 322],
      [830, 295, 322],
      [1090, 280, 322],
    ],
    labels: [
      [134, 344, 'TRACE BUS'],
      [362, 344, 'LANGSMITH · LANGFUSE'],
    ],
  },
  time: {
    x0: 40,
    x1: 1160,
    y: 652,
    ghostY: 616,
    liveY: 584,
    revLines: [
      'PARALLEL NODES · THINKING LEVEL PER NODE',
      'GEMINI FLASH · LOGIC MOVED FROM LLM TO CODE',
    ],
    revY: 540,
  },
};

const TALL: Layout = {
  W: 440,
  H: 1220,
  nodes: {
    input: N(60, 40, 180, 70, 'terminal', 'Photo', 'WHATSAPP'),
    planner: N(60, 170, 180, 76, 'double', 'Planner', 'AGENT'),
    render: N(60, 340, 180, 70, 'box', 'Render', 'IMAGE MODEL'),
    eval: N(50, 470, 200, 100, 'diamond', 'Evaluate', 'GATE'),
    out: N(60, 680, 180, 70, 'terminal', 'Client', 'DESIGN + BOQ'),
    rag: N(276, 156, 150, 104, 'store', 'Catalogue', 'PGVECTOR'),
    boq: N(276, 490, 150, 84, 'doc', 'BOQ', 'QUANTITIES'),
  },
  edges: [
    {
      pts: [
        [150, 110],
        [150, 170],
      ],
    },
    {
      pts: [
        [150, 246],
        [150, 340],
      ],
    },
    {
      pts: [
        [150, 410],
        [150, 470],
      ],
    },
    {
      pts: [
        [150, 570],
        [150, 680],
      ],
      label: 'PASS',
      lx: 162,
      ly: 630,
    },
    {
      pts: [
        [50, 520],
        [22, 520],
        [22, 375],
        [60, 375],
      ],
      label: 'REGENERATE',
      lx: 14,
      ly: 448,
      anchor: 'middle',
      rot: -90,
    },
    {
      pts: [
        [240, 208],
        [276, 208],
      ],
      both: true,
    },
    {
      pts: [
        [416, 260],
        [416, 490],
      ],
    },
    {
      pts: [
        [416, 574],
        [416, 715],
        [240, 715],
      ],
    },
  ],
  hands: [
    {
      x: 404,
      y: 296,
      lines: ['Real', 'catalogue,', 'sellable', 'products only.'],
      anchor: 'end',
    },
    { x: 266, y: 610, lines: ['The agents', 'check their', 'own work.'] },
    { x: 30, y: 864, lines: ['Was 20+ minutes.', 'Now 5 to 7.'] },
  ],
  balloons: [
    { id: 'input', n: 1, at: [280, 74], from: [240, 74] },
    { id: 'planner', n: 2, at: [24, 150], from: [60, 176] },
    { id: 'rag', n: 3, at: [390, 128], from: [372, 156] },
    { id: 'eval', n: 4, at: [24, 600], from: [86, 548] },
    { id: 'out', n: 5, at: [26, 786], from: [62, 748] },
    { id: 'trace', n: 6, at: [312, 800], from: [290, 800] },
    { id: 'time', n: 7, at: [380, 1000], from: [292, 1052] },
  ],
  bus: {
    pts: [
      [150, 750],
      [150, 800],
      [290, 800],
    ],
    drops: [],
    labels: [[30, 830, 'TRACE · LANGSMITH · LANGFUSE']],
  },
  time: {
    x0: 30,
    x1: 420,
    y: 1140,
    ghostY: 1106,
    liveY: 1070,
    revLines: [
      'PARALLEL NODES',
      'THINKING LEVEL PER NODE',
      'GEMINI FLASH',
      'LOGIC → CODE',
    ],
    revY: 930,
  },
};

const NOTE_TEXT: Record<string, Omit<Note, 'id' | 'at'>> = {
  input: {
    k: 'N1 · input',
    v: 'A client sends a photo of their space on WhatsApp.',
    link: { href: profile.saifWhatsapp, label: 'Open SAIF on WhatsApp' },
  },
  planner: {
    k: 'N2 · planner agent',
    v: 'Multi-agent LangGraph pipeline on Python / FastAPI. Plans each design against Ducon’s real catalogue.',
  },
  rag: {
    k: 'N3 · catalogue',
    v: 'Structured + semantic RAG over PostgreSQL / pgvector. Renders and BOQs only use real, sellable products.',
  },
  eval: {
    k: 'N5 · evaluate',
    v: 'Strict JSON schemas. Code and LLM validation nodes. Images run generate → evaluate → regenerate.',
  },
  out: {
    k: 'N7 · output',
    v: 'A rendered outdoor design plus a bill of quantities.',
  },
  trace: {
    k: 'Trace bus',
    v: 'Evaluation dataset. Runs traced in LangSmith and Langfuse to benchmark models before release.',
  },
  time: {
    k: 'Rev C · generation time',
    v: '20+ min → 5–7 min, about 70% faster. Parallel agent nodes, thinking level tuned per node, Gemini Flash, deterministic logic moved from LLMs into code.',
  },
};

const CODES: Record<string, string> = {
  input: 'N1',
  planner: 'N2',
  rag: 'N3',
  render: 'N4',
  eval: 'N5',
  boq: 'N6',
  out: 'N7',
};

const notesFor = (L: Layout): Note[] =>
  L.balloons.map((b) => ({ id: b.id, at: b.at, ...NOTE_TEXT[b.id] }));

function Shape({ b }: { b: NodeBox }) {
  const { x, y, w, h } = b;
  switch (b.shape) {
    case 'terminal':
      return <rect className={s.ln} x={x} y={y} width={w} height={h} rx={18} />;
    case 'double':
      return (
        <g>
          <rect className={s.lnHeavy} x={x} y={y} width={w} height={h} />
          <rect
            className={s.lnThin}
            x={x + 6}
            y={y + 6}
            width={w - 12}
            height={h - 12}
          />
        </g>
      );
    case 'diamond':
      return (
        <path
          className={s.ln}
          d={`M${x + w / 2} ${y} L${x + w} ${y + h / 2} L${x + w / 2} ${y + h} L${x} ${y + h / 2} Z`}
        />
      );
    case 'store': {
      const ry = 12;
      const rx = w / 2;
      return (
        <g>
          <ellipse className={s.ln} cx={x + rx} cy={y + ry} rx={rx} ry={ry} />
          <path
            className={s.ln}
            d={`M${x} ${y + ry} V${y + h - ry} A${rx} ${ry} 0 0 0 ${x + w} ${y + h - ry} V${y + ry}`}
          />
          <path
            className={s.lnThin}
            d={`M${x} ${y + ry + 16} A${rx} ${ry} 0 0 0 ${x + w} ${y + ry + 16}`}
          />
        </g>
      );
    }
    case 'doc':
      return (
        <path
          className={s.ln}
          d={`M${x} ${y} H${x + w} V${y + h - 10} C${x + w * 0.72} ${y + h - 28} ${x + w * 0.38} ${y + h + 10} ${x} ${y + h - 8} Z`}
        />
      );
    default:
      return <rect className={s.ln} x={x} y={y} width={w} height={h} />;
  }
}

function Pipeline({ L, id }: { L: Layout; id: string }) {
  const t = L.time;
  const max = 22;
  const k = (t.x1 - t.x0) / max;
  const X = (m: number) => t.x0 + m * k;
  const x20 = X(20);
  const x5 = X(5);
  const x7 = X(7);
  const liveMid = (t.x0 + x7) / 2;
  const cloudW = 96;
  const every = L.W > 800 ? 2 : 5;
  return (
    <svg
      data-drawing=""
      viewBox={`0 0 ${L.W} ${L.H}`}
      role="img"
      aria-labelledby={`${id}-t`}
    >
      <title id={`${id}-t`}>
        SAIF pipeline: a client photo goes to a planner agent grounded in the
        real catalogue, then render, then an evaluate gate that loops back to
        regenerate on failure, then the client gets a design and a bill of
        quantities. A time dimension shrinks from over 20 minutes to 5 to 7
        minutes.
      </title>
      <defs>
        <pattern
          id={`${id}-hatch`}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="7"
            stroke="#a9dcff"
            strokeWidth="1.2"
          />
        </pattern>
      </defs>

      {/* trace bus: hidden line under the graph */}
      <g data-fade="">
        <path className={s.lnHidden} d={pathOf(L.bus.pts)} />
        {L.bus.drops.map(([x, y0, y1]) => (
          <path key={x} className={s.lnHidden} d={`M${x} ${y0} V${y1}`} />
        ))}
      </g>
      {L.bus.labels.map(([x, y, l]) => (
        <text key={l} className={s.txS} x={x} y={y}>
          {l}
        </text>
      ))}

      {Object.entries(L.nodes).map(([key, b]) => {
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2 + (b.shape === 'store' ? 8 : 0);
        return (
          <g key={key}>
            <Shape b={b} />
            <text
              className={s.txS}
              x={b.shape === 'diamond' ? b.x + 6 : b.x + 10}
              y={b.shape === 'diamond' ? b.y + 14 : b.y - 8}
            >
              {CODES[key]}
            </text>
            <text className={s.txL} x={cx} y={cy - 2} textAnchor="middle">
              {b.label}
            </text>
            <text className={s.txS} x={cx} y={cy + 20} textAnchor="middle">
              {b.sub}
            </text>
          </g>
        );
      })}

      {L.edges.map((e, i) => (
        <g key={i}>
          <Arrow pts={e.pts} start={e.both} />
          {e.label && (
            <text
              className={s.txS}
              x={e.lx}
              y={e.ly}
              textAnchor={e.anchor ?? 'start'}
              transform={e.rot ? `rotate(${e.rot} ${e.lx} ${e.ly})` : undefined}
            >
              {e.label}
            </text>
          )}
        </g>
      ))}

      {L.hands.map((h, i) => (
        <text
          key={i}
          className={s.txP}
          x={h.x}
          y={h.y}
          textAnchor={h.anchor ?? 'start'}
        >
          {h.lines.map((ln, j) => (
            <tspan key={j} x={h.x} dy={j ? '1.15em' : 0}>
              {ln}
            </tspan>
          ))}
        </text>
      ))}

      {/* time scale, minutes */}
      <path className={s.ln} d={`M${t.x0} ${t.y} H${t.x1}`} />
      {Array.from({ length: max + 1 }, (_, m) => (
        <path
          key={m}
          className={m % every === 0 ? s.ln : s.lnThin}
          d={`M${X(m)} ${t.y} v${m % every === 0 ? 10 : 5}`}
        />
      ))}
      {Array.from(
        { length: Math.floor(max / every) + 1 },
        (_, i) => i * every
      ).map((m) => (
        <text
          key={m}
          className={s.txS}
          x={X(m)}
          y={t.y + 30}
          textAnchor="middle"
        >
          {m}
        </text>
      ))}
      <text className={s.txS} x={t.x1} y={t.y - 14} textAnchor="end">
        MIN
      </text>
      <rect
        data-fade=""
        x={x5}
        y={t.y - 10}
        width={x7 - x5}
        height={10}
        fill={`url(#${id}-hatch)`}
      />
      <path
        className={s.lnDim}
        d={`M${x5} ${t.y - 10} H${x7} M${x5} ${t.y - 10} V${t.y} M${x7} ${t.y - 10} V${t.y}`}
      />

      {/* superseded dimension stays on the drawing, as a ghost */}
      <g>
        <path className={s.lnHidden} d={`M${t.x0} ${t.ghostY} H${x20 + 16}`} />
        <path className={s.lnThin} d={`M${x20} ${t.ghostY - 8} V${t.y}`} />
        <Arrowhead at={[t.x0, t.ghostY]} from={[x20, t.ghostY]} size={9} />
        <text
          className={s.txVs}
          x={(t.x0 + x20) / 2}
          y={t.ghostY - 8}
          textAnchor="middle"
        >
          WAS 20+ MIN
        </text>
      </g>

      {/* live dimension: scroll collapses it from 20+ to 5–7 */}
      <g
        data-static=""
        data-collapse=""
        data-x0={t.x0}
        data-from={x20}
        data-to={x7}
      >
        <line
          data-line=""
          className={s.lnDim}
          x1={t.x0}
          y1={t.liveY}
          x2={x7}
          y2={t.liveY}
        />
        <path className={s.lnDim} d={`M${t.x0} ${t.liveY - 8} V${t.y}`} />
        <Arrowhead at={[t.x0, t.liveY]} from={[t.x0 + 20, t.liveY]} size={10} />
        <g data-end="">
          <path className={s.lnDim} d={`M${x7} ${t.liveY - 8} V${t.y - 10}`} />
          <Arrowhead at={[x7, t.liveY]} from={[x7 - 20, t.liveY]} size={10} />
        </g>
        <text
          data-before=""
          className={s.txV}
          x={liveMid}
          y={t.liveY - 9}
          textAnchor="middle"
          opacity={0}
        >
          20+ MIN
        </text>
        <text
          data-after=""
          className={s.txV}
          x={liveMid}
          y={t.liveY - 9}
          textAnchor="middle"
        >
          5–7 MIN
        </text>
        <g data-rev="">
          <path
            className={s.lnChalk}
            d={revCloud(liveMid - cloudW / 2, t.liveY - 34, cloudW, 34, 12)}
          />
          <RevTriangle
            x={liveMid + cloudW / 2 + 22}
            y={t.liveY - 18}
            label="C"
            size={22}
          />
          <text
            className={s.txRev}
            x={liveMid + cloudW / 2 + 42}
            y={t.liveY - 12}
          >
            ~70% FASTER
          </text>
          {t.revLines.map((ln, i) => (
            <text
              key={ln}
              className={s.txRevS}
              x={L.W > 800 ? liveMid + cloudW / 2 + 160 : t.x0}
              y={L.W > 800 ? t.liveY - 22 + i * 20 : t.revY + i * 22}
            >
              {ln}
            </text>
          ))}
        </g>
      </g>

      {L.balloons.map((b) => (
        <Tag
          key={b.id}
          id={b.id}
          n={b.n}
          at={b.at}
          from={b.from}
          label={NOTE_TEXT[b.id].k}
        />
      ))}
    </svg>
  );
}

function Tally() {
  // 57 marks, gates of five
  const groups: number[] = [];
  let left = 57;
  while (left > 0) {
    groups.push(Math.min(5, left));
    left -= 5;
  }
  return (
    <svg
      data-drawing=""
      viewBox="0 0 420 320"
      role="img"
      aria-labelledby="bp-tally-t"
    >
      <title id="bp-tally-t">
        Tally of 57 client designs in the first four weeks, before the marketing
        launch.
      </title>
      <text className={s.txXL} x={24} y={118}>
        57
      </text>
      <text className={s.txL} x={190} y={62}>
        Client designs
      </text>
      <text className={s.txS} x={190} y={88}>
        FIRST 4 WEEKS
      </text>
      <text className={s.txS} x={190} y={110}>
        BEFORE MARKETING
      </text>
      <text className={s.txS} x={190} y={132}>
        LAUNCH
      </text>
      {groups.map((g, gi) => {
        const row = Math.floor(gi / 6);
        const col = gi % 6;
        const x0 = 28 + col * 64;
        const y0 = 160 + row * 74;
        return (
          <g key={gi}>
            {Array.from({ length: Math.min(4, g) }, (_, i) => (
              <path
                key={i}
                className={s.ln}
                d={`M${x0 + i * 11} ${y0} l${(i % 2) - 0.5} 50`}
              />
            ))}
            {g === 5 && (
              <path
                className={s.lnChalk}
                d={`M${x0 - 6} ${y0 + 40} L${x0 + 40} ${y0 + 8}`}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DesignerTime() {
  const x0 = 40;
  const full = 340;
  const after = full * 0.65;
  return (
    <svg
      data-drawing=""
      viewBox="0 0 420 320"
      role="img"
      aria-labelledby="bp-time-t"
    >
      <title id="bp-time-t">
        Designer creative cognition time per client session, before and with
        SAIF: 35% less.
      </title>
      <defs>
        <pattern
          id="bp-dt-h"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="8" stroke="#a9dcff" strokeWidth="1" />
        </pattern>
      </defs>
      <text className={s.txS} x={16} y={44}>
        DESIGNER CREATIVE COGNITION TIME
      </text>
      <text className={s.txS} x={16} y={66}>
        PER CLIENT SESSION · RELATIVE
      </text>
      <text className={s.txL} x={x0} y={108}>
        Before
      </text>
      <rect
        data-fade=""
        x={x0}
        y={118}
        width={full}
        height={34}
        fill="url(#bp-dt-h)"
      />
      <rect className={s.ln} x={x0} y={118} width={full} height={34} />
      <text className={s.txL} x={x0} y={196}>
        With SAIF
      </text>
      <rect className={s.lnHeavy} x={x0} y={206} width={after} height={34} />
      <path
        className={s.lnHidden}
        d={`M${x0 + full} 152 V272 M${x0 + after} 240 V272`}
      />
      <path className={s.lnDim} d={`M${x0 + after} 264 H${x0 + full}`} />
      <Arrowhead at={[x0 + after, 264]} from={[x0 + full, 264]} size={10} />
      <Arrowhead at={[x0 + full, 264]} from={[x0 + after, 264]} size={10} />
      <text
        className={s.txV}
        x={x0 + (after + full) / 2}
        y={294}
        textAnchor="middle"
      >
        −35%
      </text>
    </svg>
  );
}

function ChangeNotices() {
  const ecn = [
    ['ECN-01', 'Edit', 'generations'],
    ['ECN-02', 'Multi-step', 'generation'],
    ['ECN-03', 'Night-view', 'renders'],
  ];
  return (
    <svg
      data-drawing=""
      viewBox="0 0 420 320"
      role="img"
      aria-labelledby="bp-ecn-t"
    >
      <title id="bp-ecn-t">
        Forty internal users across sales, design and R&amp;D. Their feedback
        became three engineering changes: edit generations, multi-step
        generation and night-view renders.
      </title>
      {Array.from({ length: 40 }, (_, i) => (
        <circle
          key={i}
          className={s.lnThin}
          cx={34 + (i % 5) * 26}
          cy={70 + Math.floor(i / 5) * 26}
          r={8}
        />
      ))}
      <text className={s.txS} x={30} y={36}>
        40 INTERNAL USERS
      </text>
      <text className={s.txS} x={30} y={300}>
        SALES · DESIGN · R&amp;D
      </text>
      {ecn.map(([code, a, b], i) => {
        const y = 40 + i * 90;
        return (
          <g key={code}>
            <Arrow
              pts={[
                [150, 70 + i * 80],
                [222, y + 36],
              ]}
            />
            <rect className={s.ln} x={226} y={y} width={180} height={74} />
            <path className={s.lnThin} d={`M226 ${y + 24} H406`} />
            <text className={s.txS} x={236} y={y + 18}>
              {code}
            </text>
            <text className={s.txL} x={236} y={y + 49}>
              {a}
            </text>
            <text className={s.txS} x={236} y={y + 67}>
              {b.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Library() {
  const ry = 10;
  return (
    <svg
      data-drawing=""
      viewBox="0 0 560 300"
      role="img"
      aria-labelledby="bp-lib-t"
    >
      <title id="bp-lib-t">
        Design library: unstructured project images and documents go through a
        pipeline that structures and embeds them; FastAPI and ChromaDB search
        thousands of images by meaning.
      </title>
      {[
        [16, 'Files', 'IMAGES + DOCS'],
        [196, 'Pipeline', 'EMBED'],
      ].map(([x, l, sub]) => (
        <g key={l as string}>
          <rect
            className={s.ln}
            x={x as number}
            y={40}
            width={150}
            height={66}
          />
          <text
            className={s.txL}
            x={(x as number) + 75}
            y={72}
            textAnchor="middle"
          >
            {l}
          </text>
          <text
            className={s.txS}
            x={(x as number) + 75}
            y={94}
            textAnchor="middle"
          >
            {sub}
          </text>
        </g>
      ))}
      <ellipse className={s.ln} cx={470} cy={40 + ry} rx={74} ry={ry} />
      <path
        className={s.ln}
        d={`M396 ${40 + ry} V${110 - ry} A74 ${ry} 0 0 0 544 ${110 - ry} V${40 + ry}`}
      />
      <text className={s.txL} x={470} y={82} textAnchor="middle">
        Library
      </text>
      <Arrow
        pts={[
          [166, 73],
          [196, 73],
        ]}
      />
      <Arrow
        pts={[
          [346, 73],
          [396, 73],
        ]}
      />
      <Arrow
        pts={[
          [470, 170],
          [470, 116],
        ]}
        start
      />
      <rect className={s.ln} x={322} y={170} width={222} height={62} />
      <text className={s.txL} x={433} y={198} textAnchor="middle">
        Search
      </text>
      <text className={s.txS} x={433} y={220} textAnchor="middle">
        FASTAPI · CHROMADB
      </text>
      <text className={s.txS} x={16} y={150}>
        THOUSANDS OF IMAGES
      </text>
      <text className={s.txS} x={16} y={194}>
        AUTOMATION SCRIPTS
      </text>
      <text className={s.txVs} x={16} y={216}>
        100+ MANUAL HRS SAVED
      </text>
      <text className={s.txS} x={16} y={260}>
        DEPLOY · RAILWAY · VPS · R2 · DBs
      </text>
      <text className={s.txS} x={16} y={282}>
        OWNED END TO END
      </text>
    </svg>
  );
}

function Sensei() {
  return (
    <svg
      data-drawing=""
      viewBox="0 0 560 300"
      role="img"
      aria-labelledby="bp-sensei-t"
    >
      <title id="bp-sensei-t">
        Atomic Sensei: roadmap, lesson and quiz-evaluation agents on Gemini;
        lessons pre-generated asynchronously; cron-driven Supabase edge
        functions send reminders.
      </title>
      <path className={s.lnThin} d="M16 30 V20 H544 V30" />
      <text className={s.txS} x={280} y={14} textAnchor="middle">
        AGENTS · GEMINI
      </text>
      {['Roadmap', 'Lesson', 'Quiz eval'].map((l, i) => {
        const x = 16 + i * 184;
        return (
          <g key={l}>
            <rect className={s.ln} x={x} y={44} width={160} height={66} />
            <text className={s.txL} x={x + 80} y={84} textAnchor="middle">
              {l}
            </text>
            {i < 2 && (
              <Arrow
                pts={[
                  [x + 160, 77],
                  [x + 184, 77],
                ]}
              />
            )}
          </g>
        );
      })}
      <path className={s.lnHidden} d="M280 110 V170" />
      <text className={s.txS} x={290} y={150}>
        ASYNC PRE-GENERATION
      </text>
      <rect className={s.ln} x={16} y={178} width={528} height={62} />
      <text className={s.txL} x={280} y={206} textAnchor="middle">
        Supabase edge functions
      </text>
      <text className={s.txS} x={280} y={228} textAnchor="middle">
        CRON → REMINDERS
      </text>
      <text className={s.txS} x={16} y={278}>
        ARCHITECTURE + DATA MODEL · MINE
      </text>
    </svg>
  );
}

export default function S03Saif() {
  const ref = useRef<HTMLDivElement>(null);

  // the generation-time dimension collapses as the sheet scrolls past
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const cleanups: (() => void)[] = [];
      root.querySelectorAll<SVGGElement>('[data-collapse]').forEach((g) => {
        const svg = g.ownerSVGElement;
        if (!svg || svg.getClientRects().length === 0) return;
        const x0 = Number(g.dataset.x0);
        const from = Number(g.dataset.from);
        const to = Number(g.dataset.to);
        const line = g.querySelector<SVGLineElement>('[data-line]');
        const end = g.querySelector<SVGGElement>('[data-end]');
        const before = g.querySelector<SVGTextElement>('[data-before]');
        const after = g.querySelector<SVGTextElement>('[data-after]');
        const rev = g.querySelector<SVGGElement>('[data-rev]');
        if (!line || !end || !before || !after || !rev) return;
        const st = { x: from };
        const apply = () => {
          line.setAttribute('x2', String(st.x));
          end.setAttribute('transform', `translate(${st.x - to} 0)`);
          const mid = String((x0 + st.x) / 2);
          before.setAttribute('x', mid);
          after.setAttribute('x', mid);
        };
        apply();
        gsap.set(before, { opacity: 1 });
        gsap.set([after, rev], { opacity: 0 });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: svg,
            start: 'center 75%',
            end: 'bottom 45%',
            scrub: 0.6,
          },
        });
        tl.to(
          st,
          { x: to, duration: 1, ease: 'power2.inOut', onUpdate: apply },
          0
        )
          .to(before, { opacity: 0, duration: 0.15 }, 0.7)
          .to(after, { opacity: 1, duration: 0.15 }, 0.85)
          .to(rev, { opacity: 1, duration: 0.25 }, 1);
        cleanups.push(() => {
          st.x = to;
          apply();
        });
      });
      return () => cleanups.forEach((c) => c());
    });
    return () => mm.revert();
  }, []);

  return (
    <Sheet
      n={3}
      kicker="Detail 2 · SAIF AI Designer · Ducon Industries, Dubai"
      title="Photo in. Design and BOQ out."
      line="My main production project, built in Ducon’s R&D team."
      fields={[
        { k: 'Project', v: 'SAIF AI Designer', wide: true },
        { k: 'Client', v: 'Ducon Industries · outdoor living', wide: true },
        { k: 'Role', v: 'AI Developer · R&D' },
        { k: 'Date', v: 'Aug 2025 – now' },
        {
          k: 'Status',
          v: (
            <a href={profile.saifWhatsapp} target="_blank" rel="noopener">
              Live · WhatsApp
            </a>
          ),
        },
        { k: 'Stack', v: 'LangGraph · Python · FastAPI' },
      ]}
    >
      <div ref={ref} className={`${s.span12} ${s.stampHost}`}>
        <Stamp className={s.stampSaif} rot={-8}>
          <b>Approved</b> for production
        </Stamp>
        <View
          W={WIDE.W}
          H={WIDE.H}
          notes={notesFor(WIDE)}
          letter="A"
          title="System diagram · N1–N7"
          sub="Tap a balloon"
          className={s.onlyWide}
        >
          <Pipeline L={WIDE} id="bp-saif-w" />
        </View>
        <View
          W={TALL.W}
          H={TALL.H}
          notes={notesFor(TALL)}
          letter="A"
          title="System diagram · N1–N7"
          sub="Tap a balloon"
          className={s.onlyTall}
        >
          <Pipeline L={TALL} id="bp-saif-t" />
        </View>
      </div>
      <View
        W={420}
        H={320}
        letter="B"
        title="57 client designs in 4 weeks, pre-launch."
        className={s.span4}
      >
        <Tally />
      </View>
      <View
        W={420}
        H={320}
        letter="C"
        title="35% less designer time per session."
        sub="Designer time"
        className={s.span4}
      >
        <DesignerTime />
      </View>
      <View
        W={420}
        H={320}
        letter="D"
        title="Their feedback became features."
        sub="ECN log"
        className={s.span4}
      >
        <ChangeNotices />
      </View>
      <View
        W={560}
        H={300}
        letter="E"
        title="Project files, turned into a searchable library."
        sub="Design library · also at Ducon"
        className={s.span6}
      >
        <Library />
      </View>
      <View
        W={560}
        H={300}
        letter="F"
        title="Lessons pre-generated before they’re needed."
        sub="Side build · Atomic Sensei"
        className={s.span6}
      >
        <Sensei />
      </View>
    </Sheet>
  );
}
