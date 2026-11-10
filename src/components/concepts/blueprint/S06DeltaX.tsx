'use client';

import { foundations } from '@/data/profile';
import { Arrow, Dim } from './primitives';
import { Sheet } from './Sheet';
import { Tag, View, type Note } from './View';
import s from './blueprint.module.css';

/* Sheet 06 · DeltaX. Key plan with two bays, cut along A–A. The section is
   the layer stack; the endpoints are pipe stubs on the roof; the ground under
   it all is labelled for what it was: the foundation. */

const L = 40;
const R = 440;
const MID = 240;
const TOP = 304;
const BANDS = [62, 72, 62, 100];
const EDGES = BANDS.reduce<number[]>(
  (a, h) => [...a, a[a.length - 1] + h],
  [TOP]
);
const GROUND = EDGES[EDGES.length - 1];
const SUBS = ['HTTP · REST', 'BUSINESS RULES', 'DATA ACCESS', 'SHARED STORE'];
const VW = 640;
const VH = 830;
const callY = [EDGES[0] + 31, EDGES[1] + 36, EDGES[2] + 31, EDGES[3] + 50];
const TAG_X = R + 44;

const NOTES: Note[] = [
  {
    id: 'l1',
    at: [TAG_X, callY[0]],
    k: 'L1 · controller',
    v: 'HTTP layer. 20+ REST endpoints across the two backends.',
  },
  {
    id: 'l2',
    at: [TAG_X, callY[1]],
    k: 'L2 · service',
    v: 'Business rules. BookSwap’s history-based recommendation engine sits here.',
  },
  { id: 'l3', at: [TAG_X, callY[2]], k: 'L3 · repository', v: 'Data access.' },
  {
    id: 'l4',
    at: [TAG_X, callY[3]],
    k: 'L4 · SQL Server',
    v: 'Shared by both bays.',
  },
];

function Section() {
  const id = 'bp-sec';
  const hatches = [`${id}-h1`, `${id}-h2`, `${id}-h3`, `${id}-conc`];
  const stubs = Array.from(
    { length: 20 },
    (_, i) => L + 14 + (i * (R - L - 28)) / 19
  );
  const endpoints = foundations.stats[0];
  return (
    <svg
      data-drawing=""
      viewBox={`0 0 ${VW} ${VH}`}
      role="img"
      aria-labelledby={`${id}-t`}
    >
      <title id={`${id}-t`}>
        Key plan with two bays, an IMDB-style catalogue and BookSwap, cut along
        A–A. The section shows controller, service and repository layers over a
        shared SQL Server, 20 plus REST endpoints as pipe stubs on top, and the
        ground below labelled foundation.
      </title>
      <defs>
        <pattern
          id={hatches[0]}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line className={s.lnThin} x1="0" y1="0" x2="0" y2="10" />
        </pattern>
        <pattern
          id={hatches[1]}
          width="13"
          height="13"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path className={s.lnConstruct} d="M0 0 V13 M0 0 H13" />
        </pattern>
        <pattern
          id={hatches[2]}
          width="10"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <line className={s.lnConstruct} x1="0" y1="4" x2="10" y2="4" />
        </pattern>
        <pattern
          id={hatches[3]}
          width="34"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <circle className={s.fillInk} cx="5" cy="6" r="1" opacity="0.5" />
          <circle className={s.fillInk} cx="22" cy="20" r="1.2" opacity="0.5" />
          <circle className={s.fillInk} cx="28" cy="5" r="0.8" opacity="0.5" />
          <path
            className={s.lnThin}
            d="M14 9 l5 -2 l-1 5 z M2 18 l4 3 l-5 1 z M26 26 l5 -1 l-2 4 z"
            opacity="0.7"
          />
        </pattern>
      </defs>

      {/* key plan */}
      <text className={s.txS} x={L} y={30}>
        KEY PLAN · DELTAX, HYDERABAD
      </text>
      <rect className={s.lnHeavy} x={L} y={44} width={R - L} height={150} />
      <path className={s.lnHeavy} d={`M${MID} 44 V96 M${MID} 128 V194`} />
      <path className={s.lnThin} d={`M${MID} 96 a32 32 0 0 1 32 32`} />
      <text className={s.txL} x={(L + MID) / 2} y={104} textAnchor="middle">
        Catalogue
      </text>
      <text className={s.txS} x={(L + MID) / 2} y={126} textAnchor="middle">
        IMDB-STYLE
      </text>
      <text className={s.txL} x={(MID + R) / 2} y={104} textAnchor="middle">
        BookSwap
      </text>
      <text className={s.txS} x={(MID + R) / 2} y={126} textAnchor="middle">
        MARKETPLACE
      </text>
      <g data-fade="">
        <path
          className={s.lnHeavy}
          d={`M${L - 26} 162 H${R + 26}`}
          strokeDasharray="28 5 5 5"
        />
      </g>
      <Arrow
        pts={[
          [L - 24, 162],
          [L - 24, 186],
        ]}
        size={11}
        className={s.lnHeavy}
      />
      <Arrow
        pts={[
          [R + 24, 162],
          [R + 24, 186],
        ]}
        size={11}
        className={s.lnHeavy}
      />
      <text className={s.txWord} x={L - 24} y={222} textAnchor="middle">
        A
      </text>
      <text className={s.txWord} x={R + 24} y={222} textAnchor="middle">
        A
      </text>

      {/* endpoints: pipe stubs on the roof */}
      <Dim
        a={[stubs[0], TOP - 20]}
        b={[stubs[stubs.length - 1], TOP - 20]}
        offset={-20}
        label={`${endpoints.value}${endpoints.suffix ?? ''} REST ENDPOINTS`}
      />
      {stubs.map((x, i) => (
        <path
          key={i}
          className={s.lnThin}
          d={`M${x - 2} ${TOP} V${TOP - 14} M${x + 2} ${TOP} V${TOP - 14} M${x - 4.5} ${TOP - 14} h9`}
        />
      ))}

      {BANDS.map((h, i) => (
        <rect
          key={`f${i}`}
          data-fade=""
          x={L}
          y={EDGES[i]}
          width={R - L}
          height={h}
          fill={`url(#${hatches[i]})`}
        />
      ))}
      <rect
        data-fade=""
        x={282}
        y={EDGES[1] + 12}
        width={140}
        height={48}
        style={{ fill: 'var(--coat)' }}
      />
      <rect
        className={s.ln}
        x={282}
        y={EDGES[1] + 12}
        width={140}
        height={48}
      />
      <text className={s.txS} x={352} y={EDGES[1] + 32} textAnchor="middle">
        RECOMMENDER
      </text>
      <text className={s.txS} x={352} y={EDGES[1] + 50} textAnchor="middle">
        HISTORY-BASED
      </text>

      <rect
        className={s.lnHeavy}
        x={L}
        y={TOP}
        width={R - L}
        height={GROUND - TOP}
      />
      {EDGES.slice(1, -1).map((y) => (
        <path key={y} className={s.ln} d={`M${L} ${y} H${R}`} />
      ))}
      <path className={s.lnHeavy} d={`M${MID} ${TOP} V${EDGES[3]}`} />
      <rect
        data-fade=""
        x={MID - 84}
        y={EDGES[3] + 32}
        width={168}
        height={38}
        style={{ fill: 'var(--coat)' }}
      />
      <text className={s.txL} x={MID} y={EDGES[3] + 60} textAnchor="middle">
        {foundations.layers[3]}
      </text>

      {/* ground: the foundation */}
      <path className={s.lnHeavy} d={`M${L - 20} ${GROUND} H${R + 20}`} />
      {Array.from({ length: 24 }, (_, i) => (
        <path
          key={i}
          className={s.lnThin}
          d={`M${L - 14 + i * 20} ${GROUND + 4} l-10 12`}
        />
      ))}
      <text
        className={s.txS}
        x={(L + MID) / 2}
        y={GROUND + 44}
        textAnchor="middle"
      >
        BAY 1 · CATALOGUE
      </text>
      <text
        className={s.txS}
        x={(MID + R) / 2}
        y={GROUND + 44}
        textAnchor="middle"
      >
        BAY 2 · BOOKSWAP
      </text>
      <text className={s.txP} x={MID} y={GROUND + 82} textAnchor="middle">
        foundation · where I started
      </text>

      {BANDS.map((_, i) => (
        <Dim
          key={i}
          a={[L, EDGES[i]]}
          b={[L, EDGES[i + 1]]}
          offset={22}
          label={`L${i + 1}`}
        />
      ))}

      {foundations.layers.map((layer, i) => (
        <g key={layer}>
          <Tag
            id={`l${i + 1}`}
            n={`L${i + 1}`}
            at={[TAG_X, callY[i]]}
            from={[R - 14, callY[i]]}
            r={19}
            label={layer}
          />
          <text className={s.txL} x={TAG_X + 28} y={callY[i] + 2}>
            {layer}
          </text>
          <text className={s.txS} x={TAG_X + 28} y={callY[i] + 22}>
            {SUBS[i]}
          </text>
        </g>
      ))}

      <text className={s.txWord} x={MID} y={GROUND + 140} textAnchor="middle">
        Section A–A
      </text>
      <path
        className={s.lnHeavy}
        d={`M${MID - 100} ${GROUND + 152} H${MID + 100}`}
      />
      <path
        className={s.lnThin}
        d={`M${MID - 100} ${GROUND + 158} H${MID + 100}`}
      />

      {/* material legend */}
      <rect
        data-fade=""
        x={L}
        y={GROUND + 182}
        width={34}
        height={22}
        fill={`url(#${hatches[0]})`}
      />
      <rect
        className={s.lnThin}
        x={L}
        y={GROUND + 182}
        width={34}
        height={22}
      />
      <text className={s.txS} x={L + 46} y={GROUND + 199}>
        L1–L3 · C# · ASP.NET CORE
      </text>
      <rect
        data-fade=""
        x={L + 330}
        y={GROUND + 182}
        width={34}
        height={22}
        fill={`url(#${hatches[3]})`}
      />
      <rect
        className={s.lnThin}
        x={L + 330}
        y={GROUND + 182}
        width={34}
        height={22}
      />
      <text className={s.txS} x={L + 376} y={GROUND + 199}>
        L4 · SQL SERVER
      </text>
    </svg>
  );
}

/* Detail B · riser diagram: one request, down the stack and back up. */
function Riser() {
  const stops = ['Controller', 'Service', 'Repository', 'SQL Server'];
  const y0 = 90;
  const gap = 120;
  return (
    <svg
      data-drawing=""
      viewBox="0 0 420 640"
      role="img"
      aria-labelledby="bp-riser-t"
    >
      <title id="bp-riser-t">
        Riser diagram: a request enters at the controller, passes through
        service and repository to SQL Server, and the response rises back.
      </title>
      <text className={s.txS} x={20} y={36}>
        REQUEST IN
      </text>
      <text className={s.txS} x={400} y={36} textAnchor="end">
        JSON OUT
      </text>
      {/* supply (down) and return (up) */}
      <path className={s.lnHeavy} d={`M110 50 V${y0 + gap * 3}`} />
      <path className={s.lnThin} d={`M118 50 V${y0 + gap * 3}`} />
      <path className={s.lnHeavy} d={`M302 ${y0 + gap * 3} V50`} />
      <path className={s.lnThin} d={`M294 ${y0 + gap * 3} V50`} />
      <Arrow
        pts={[
          [60, 50],
          [100, 50],
        ]}
      />
      <Arrow
        pts={[
          [312, 50],
          [360, 50],
        ]}
      />
      {stops.map((st, i) => {
        const y = y0 + i * gap;
        return (
          <g key={st}>
            <rect className={s.ln} x={98} y={y - 10} width={32} height={20} />
            <rect className={s.ln} x={282} y={y - 10} width={32} height={20} />
            <path className={s.lnHidden} d={`M130 ${y} H282`} />
            <text className={s.txL} x={206} y={y - 20} textAnchor="middle">
              {st}
            </text>
            <text className={s.txS} x={206} y={y + 30} textAnchor="middle">
              {SUBS[i]}
            </text>
          </g>
        );
      })}
      <Arrow
        pts={[
          [60, y0 + gap * 1.5],
          [60, y0 + gap * 2.5],
        ]}
      />
      <text
        className={s.txS}
        x={48}
        y={y0 + gap * 2}
        textAnchor="middle"
        transform={`rotate(-90 48 ${y0 + gap * 2})`}
      >
        DOWN
      </text>
      <Arrow
        pts={[
          [352, y0 + gap * 2.5],
          [352, y0 + gap * 1.5],
        ]}
      />
      <text
        className={s.txS}
        x={372}
        y={y0 + gap * 2}
        textAnchor="middle"
        transform={`rotate(-90 372 ${y0 + gap * 2})`}
      >
        UP
      </text>
      <text className={s.txP} x={210} y={600} textAnchor="middle">
        same pattern, both bays
      </text>
    </svg>
  );
}

export default function S06DeltaX() {
  return (
    <Sheet
      n={6}
      kicker="Detail 5 · DeltaX backends · section A–A"
      title="I started on backends."
      line="An IMDB-style catalogue and BookSwap, in C# over SQL Server."
      rev="B"
      fields={[
        { k: 'Role', v: foundations.role, wide: true },
        { k: 'Firm', v: 'DeltaX · Hyderabad' },
        { k: 'Date', v: 'Jan – Jul 2025' },
        { k: 'Built', v: '2 backends · 20+ endpoints' },
        { k: 'Pattern', v: 'Controller → service → repository' },
      ]}
    >
      <View
        W={VW}
        H={VH}
        notes={NOTES}
        letter="A"
        title="Key plan + section A–A"
        sub="Tap L1–L4"
        className={s.span7}
        pan={520}
      >
        <Section />
      </View>
      <View
        W={420}
        H={640}
        letter="B"
        title="Riser · one request"
        sub="Typical"
        className={s.span5}
      >
        <Riser />
      </View>
    </Sheet>
  );
}
