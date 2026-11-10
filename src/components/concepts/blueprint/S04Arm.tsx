'use client';

import {
  iso,
  isoBox,
  isoCylinder,
  pathOf,
  Arrow,
  type Pt,
  type V3,
} from './primitives';
import { Sheet, Stamp } from './Sheet';
import { Tag, View, useView, type Note } from './View';
import s from './blueprint.module.css';

/* Sheet 04 · the hackathon arm. Exploded iso of an arm (geometry illustrative),
   with the control loop drawn on top: the camera sees, the host decides,
   the Arduino moves. */

const O: Pt = [0, 0];
const Z = 150; // chain height

type Part = {
  n: number;
  name: string;
  role: string;
  paths: string[];
  anchor: V3;
  bx: number;
  by: number;
};

function cyl(c: V3, axis: 'x' | 'y' | 'z', len: number, r: number) {
  const g = isoCylinder(c, axis, len, r, O);
  return [g.back, ...g.sides, g.front];
}

const PARTS: Part[] = [
  {
    n: 1,
    name: 'Base',
    role: 'Fixed base.',
    paths: [...isoBox([-70, -70, 0], [140, 140, 30], O)],
    anchor: [70, 35, 15],
    bx: 40,
    by: 40,
  },
  {
    n: 2,
    name: 'Turntable',
    role: 'J1 · base rotation.',
    paths: cyl([0, 0, 62], 'z', 16, 54),
    anchor: [38, 38, 70],
    bx: 70,
    by: 8,
  },
  {
    n: 3,
    name: 'Shoulder joint',
    role: 'J2.',
    paths: [
      ...isoBox([-30, -38, 110], [60, 76, 64], O),
      ...cyl([30, 0, Z], 'x', 10, 20),
    ],
    anchor: [30, 24, 124],
    bx: 72,
    by: 26,
  },
  {
    n: 4,
    name: 'Upper link',
    role: 'Link.',
    paths: [...isoBox([-18, -200, Z - 16], [36, 120, 32], O)],
    anchor: [18, -140, Z - 8],
    bx: 28,
    by: 58,
  },
  {
    n: 5,
    name: 'Elbow joint',
    role: 'J3.',
    paths: cyl([-24, -236, Z], 'x', 48, 20),
    anchor: [24, -236, Z - 12],
    bx: 30,
    by: 56,
  },
  {
    n: 6,
    name: 'Forearm link',
    role: 'Link.',
    paths: [...isoBox([-16, -370, Z - 14], [32, 100, 28], O)],
    anchor: [16, -320, Z - 6],
    bx: 28,
    by: 58,
  },
  {
    n: 7,
    name: 'Wrist & gripper',
    role: 'J4 · end effector. Grab, shift, place.',
    paths: [
      ...isoBox([-22, -432, Z - 18], [44, 34, 36], O),
      ...isoBox([-22, -484, Z - 10], [10, 40, 20], O),
      ...isoBox([12, -484, Z - 10], [10, 40, 20], O),
    ],
    anchor: [22, -415, Z - 8],
    bx: 36,
    by: 54,
  },
  {
    n: 8,
    name: 'Camera',
    role: 'Sees. Sends each frame to Gemini.',
    paths: [
      ...isoBox([70, -500, 250], [42, 42, 32], O),
      ...cyl([112, -479, 266], 'x', 16, 12),
    ],
    anchor: [112, -470, 258],
    bx: 54,
    by: -26,
  },
  {
    n: 9,
    name: 'Arduino',
    role: 'Moves. Takes commands over serial (pyserial) and drives the servos.',
    paths: [
      ...isoBox([120, 80, 0], [110, 72, 5], O),
      ...isoBox([128, 86, 5], [70, 7, 9], O),
      ...isoBox([210, 96, 5], [16, 22, 12], O),
    ],
    anchor: [230, 120, 3],
    bx: 26,
    by: 40,
  },
];

// host (laptop) and the signal path, in screen units
const HOST = { x: -186, y: -486, w: 196, h: 100 };
const CAM_L: Pt = [452, -452];
const ARD_L: Pt = [-36, 142];
const SERIAL_X = -170;
const CABLE = (() => {
  const a = iso([218, 107, 12], O);
  const b = iso([70, 10, 15], O);
  return `M${a[0]} ${a[1]} C${a[0] - 10} ${a[1] + 50} ${b[0] + 40} ${b[1] + 40} ${b[0]} ${b[1]}`;
})();
const AXIS_Z = pathOf([iso([0, 0, -14], O), iso([0, 0, 196], O)]);
const AXIS_Y = pathOf([iso([0, 30, Z], O), iso([0, -520, Z], O)]);

const VB = { x: -214, y: -566, w: 816, h: 800 };
const sh = (p: Pt): Pt => [p[0] - VB.x, p[1] - VB.y];

const balloonAt = (p: Part): { at: Pt; from: Pt } => {
  const a = iso(p.anchor, O);
  return { from: a, at: [a[0] + p.bx, a[1] + p.by] };
};
const HOST_TAG = {
  at: [HOST.x + HOST.w + 32, HOST.y - 20] as Pt,
  from: [HOST.x + HOST.w - 4, HOST.y + 6] as Pt,
};

const NOTES: Note[] = [
  ...PARTS.map((p) => ({
    id: `p${p.n}`,
    at: sh(balloonAt(p).at),
    k: `Item ${p.n} · ${p.name}`,
    v: p.role,
  })),
  {
    id: 'host',
    at: sh(HOST_TAG.at),
    k: 'Item 10 · host',
    v: 'Python + Gemini vision. Looks at the frame, picks the move: grab, shift or place.',
  },
];

function Arm() {
  const { active } = useView();
  const cls = (id: string) =>
    `${s.part} ${active === null ? '' : active === id ? s.partOn : s.partOff}`;
  return (
    <svg
      data-drawing=""
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      role="img"
      aria-labelledby="bp-arm-t"
    >
      <title id="bp-arm-t">
        Exploded isometric of a robotic arm: base, turntable, shoulder, links,
        elbow, wrist and gripper, a camera and an Arduino. A host computer
        running Python and Gemini vision takes the camera frame, decides the
        move, and sends it to the Arduino over serial.
      </title>
      <g data-fade="">
        <path className={s.lnCenter} d={AXIS_Z} />
        <path className={s.lnCenter} d={AXIS_Y} />
        <path className={s.lnHidden} d={CABLE} />
      </g>
      {PARTS.map((p) => (
        <g key={p.n} className={cls(`p${p.n}`)}>
          {p.paths.map((d, i) => (
            <path key={i} className={s.ln} d={d} />
          ))}
        </g>
      ))}

      {/* host */}
      <g className={cls('host')}>
        <rect
          className={s.lnHeavy}
          x={HOST.x}
          y={HOST.y}
          width={HOST.w}
          height={HOST.h - 18}
          rx={4}
        />
        <rect
          className={s.lnThin}
          x={HOST.x + 10}
          y={HOST.y + 10}
          width={HOST.w - 20}
          height={HOST.h - 38}
        />
        <path
          className={s.ln}
          d={`M${HOST.x - 14} ${HOST.y + HOST.h - 18} H${HOST.x + HOST.w + 14} L${HOST.x + HOST.w} ${HOST.y + HOST.h} H${HOST.x} Z`}
        />
      </g>
      <text
        className={s.txL}
        x={HOST.x + HOST.w / 2}
        y={HOST.y + 42}
        textAnchor="middle"
      >
        Host
      </text>
      <text
        className={s.txS}
        x={HOST.x + HOST.w / 2}
        y={HOST.y + 64}
        textAnchor="middle"
      >
        PYTHON + GEMINI
      </text>

      {/* signal path: frame in, command out */}
      <Arrow
        pts={[CAM_L, [HOST.x + HOST.w + 2, CAM_L[1]]]}
        className={s.lnChalk}
      />
      <text
        className={s.txS}
        x={(CAM_L[0] + HOST.x + HOST.w) / 2}
        y={CAM_L[1] - 10}
        textAnchor="middle"
      >
        FRAME
      </text>
      <Arrow
        pts={[[HOST.x + 16, HOST.y + HOST.h], [HOST.x + 16, ARD_L[1]], ARD_L]}
        className={s.lnChalk}
      />
      <text
        className={s.txS}
        x={SERIAL_X - 12}
        y={-150}
        textAnchor="middle"
        transform={`rotate(-90 ${SERIAL_X - 12} -150)`}
      >
        SERIAL · PYSERIAL
      </text>

      {/* the three verbs */}
      <text className={s.txWord} x={494} y={-520} textAnchor="middle">
        Sees
      </text>
      <text
        className={s.txWord}
        x={HOST.x + HOST.w / 2}
        y={HOST.y - 22}
        textAnchor="middle"
      >
        Decides
      </text>
      <text className={s.txWord} x={470} y={-326}>
        Moves
      </text>

      {PARTS.map((p) => {
        const b = balloonAt(p);
        return (
          <Tag
            key={`b${p.n}`}
            id={`p${p.n}`}
            n={p.n}
            at={b.at}
            from={b.from}
            label={p.name}
          />
        );
      })}
      <Tag
        id="host"
        n={10}
        at={HOST_TAG.at}
        from={HOST_TAG.from}
        label="Host"
      />
      <text className={s.txS} x={VB.x + 12} y={VB.y + VB.h - 12}>
        GEOMETRY ILLUSTRATIVE · NTS
      </text>
    </svg>
  );
}

function Loop() {
  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    l: string,
    sub?: string
  ) => (
    <g>
      <rect className={s.ln} x={x} y={y} width={w} height={h} />
      <text
        className={sub ? s.txL : s.txS}
        x={x + w / 2}
        y={y + (sub ? h / 2 : h / 2 + 6)}
        textAnchor="middle"
      >
        {l}
      </text>
      {sub && (
        <text
          className={s.txS}
          x={x + w / 2}
          y={y + h / 2 + 20}
          textAnchor="middle"
        >
          {sub}
        </text>
      )}
    </g>
  );
  return (
    <svg
      data-drawing=""
      viewBox="0 0 560 330"
      role="img"
      aria-labelledby="bp-loop-t"
    >
      <title id="bp-loop-t">
        Control loop: camera frame to Gemini, which decides grab, shift or
        place; Python sends the command over pyserial to the Arduino, which
        drives the servos; then the next frame.
      </title>
      {box(16, 46, 124, 70, 'Camera', 'FRAME')}
      <path className={s.ln} d="M252 30 L330 81 L252 132 L174 81 Z" />
      <text className={s.txL} x={252} y={80} textAnchor="middle">
        Gemini
      </text>
      <text className={s.txS} x={252} y={100} textAnchor="middle">
        DECIDE
      </text>
      <Arrow
        pts={[
          [140, 81],
          [174, 81],
        ]}
      />
      {['GRAB', 'SHIFT', 'PLACE'].map((m, i) => (
        <g key={m}>
          <Arrow
            pts={[
              [330, 81],
              [352, 81],
              [352, 34 + i * 46],
              [384, 34 + i * 46],
            ]}
          />
          {box(384, 16 + i * 46, 160, 36, m)}
        </g>
      ))}
      <Arrow
        pts={[
          [464, 154],
          [464, 214],
        ]}
      />
      {box(384, 214, 160, 70, 'Python', 'COMMAND')}
      <Arrow
        pts={[
          [384, 249],
          [334, 249],
        ]}
      />
      <text className={s.txS} x={359} y={312} textAnchor="middle">
        PYSERIAL
      </text>
      <path className={s.lnThin} d="M359 296 V256" />
      {box(196, 214, 138, 70, 'Arduino', 'DRIVE')}
      <Arrow
        pts={[
          [196, 249],
          [146, 249],
        ]}
      />
      {box(16, 214, 130, 70, 'Servos', 'MOVE')}
      <Arrow
        pts={[
          [60, 214],
          [60, 116],
        ]}
        className={s.lnChalk}
      />
      <text
        className={s.txS}
        x={52}
        y={168}
        textAnchor="middle"
        transform="rotate(-90 52 168)"
      >
        NEXT FRAME
      </text>
    </svg>
  );
}

export default function S04Arm() {
  return (
    <Sheet
      n={4}
      kicker="Detail 3 · AI-driven robotics · vision-controlled arm"
      title="Gemini decides. Arduino moves."
      fields={[
        { k: 'Project', v: 'AI-driven robotics', wide: true },
        { k: 'Event', v: 'National hackathon' },
        { k: 'Result', v: '3rd place' },
        { k: 'Eyes', v: 'Gemini vision' },
        { k: 'Hands', v: 'Python → Arduino' },
      ]}
    >
      <div className={`${s.span7} ${s.stampHost}`}>
        <Stamp round tone="chalk" rot={-12} className={s.stampArm}>
          <b>3rd</b>
          <span>National hackathon</span>
        </Stamp>
        <View
          W={VB.w}
          H={VB.h}
          notes={NOTES}
          letter="A"
          title="Exploded iso · items 1–10"
          sub="Tap a balloon"
          pan={560}
          panStart={0.3}
        >
          <Arm />
        </View>
      </div>
      <View
        W={560}
        H={330}
        letter="B"
        title="Control loop"
        sub="Schematic"
        className={s.span5}
      >
        <Loop />
      </View>
    </Sheet>
  );
}
