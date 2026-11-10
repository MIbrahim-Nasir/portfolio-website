'use client';

import { useRef } from 'react';
import { lightUp, polyline, runRoute, useScrub, type Pt } from '../motion';
import { Arrow, Dim, Dot, Route, cx } from '../svg';
import { Tag, popIn } from '../notes';
import s from '../interface.module.css';

// UART, 8N1: idle high, start bit 0, eight data bits LSB first, stop bit 1.
// 'G' = 0x47 = 0b0100_0111 -> on the wire: 1 1 1 0 0 0 1 0.
const BIT = 40;
const X0 = 50;
const HI = 72;
const LO = 118;
const LEVELS = [0, 1, 1, 1, 0, 0, 0, 1, 0, 1];
const NAMES = ['ST', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'SP'];

const wave: Pt[] = [[34, HI]];
{
  let y = HI;
  LEVELS.forEach((l, i) => {
    const x = X0 + i * BIT;
    const ny = l ? HI : LO;
    if (ny !== y) {
      wave.push([x, y], [x, ny]);
      y = ny;
    }
  });
  wave.push([466, y]);
}

const BYTES = [
  ['47', "'G'"],
  ['52', "'R'"],
  ['41', "'A'"],
  ['42', "'B'"],
  ['0A', "'\\n'"],
];

const S = {
  idle: [120, 390],
  read: [360, 390],
  parse: [360, 520],
  act: [120, 520],
} as const;
const SR = 32;

const head: Pt[] = [
  [240, 0],
  [240, 30],
  [34, 30],
];
const tail: Pt[] = [
  [474, 72],
  [474, 214],
  [40, 214],
  [40, 256],
  [440, 256], // through rx_buf
  [440, 330],
  [120, 330],
  [120, 358],
  [...S.idle],
  [...S.read],
  [...S.parse],
  [...S.act],
  [120, 610],
  [240, 610],
  [240, 640],
];
const ALL = [...head, ...wave, ...tail];
const R = polyline(ALL);
const iw0 = head.length; // first waveform vertex
const iw1 = head.length + wave.length - 1;
const it = (k: number) => iw1 + 1 + k; // index into tail

/** straight transition between two state circles, trimmed to their edges */
const edge = (a: readonly number[], b: readonly number[], r = SR + 2): Pt[] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  return [
    [a[0] + (dx / l) * r, a[1] + (dy / l) * r],
    [b[0] - (dx / l) * r, b[1] - (dy / l) * r],
  ];
};

export default function FirmwareFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    lightUp(tl, q('[data-k="bits"]'), R.at(iw0), 0.35, R.at(iw1) - R.at(iw0));
    const bytes = q('[data-k="byte"]');
    const a = R.at(it(3));
    const b = R.at(it(4));
    bytes.forEach((el, i) =>
      lightUp(tl, el, a + ((b - a) * (i + 0.5)) / bytes.length - 0.01, 0.3)
    );
    lightUp(tl, q('[data-k="s-idle"]'), R.at(it(8)) - 0.01, 0.3);
    lightUp(tl, q('[data-k="s-read"]'), R.at(it(9)) - 0.01, 0.3);
    lightUp(tl, q('[data-k="s-parse"]'), R.at(it(10)) - 0.01, 0.3);
    lightUp(tl, q('[data-k="s-act"]'), R.at(it(11)) - 0.01, 0.3);
    popIn(tl, q('[data-k="bench"]'), R.at(it(11)) + 0.02);
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 640"
      className={s.svg}
      role="img"
      aria-labelledby="fig-fw-t"
    >
      <title id="fig-fw-t">
        UART timing of the byte 0x47, letter G, at 9600 baud 8N1, least
        significant bit first, each bit about 104 microseconds; the receive
        buffer holding G R A B newline; and the Arduino loop as a state machine:
        idle, read, parse, act.
      </title>

      <text x={24} y={20} className={s.tSub}>
        TX · &apos;G&apos; = 0x47 · 9600 baud · 8N1 · LSB first
      </text>

      {/* bit cells */}
      {LEVELS.map((l, i) => (
        <g key={i}>
          <line
            x1={X0 + i * BIT}
            y1={50}
            x2={X0 + i * BIT}
            y2={126}
            className={cx(s.ln, s.dash, s.faintLn)}
          />
          <text
            x={X0 + i * BIT + BIT / 2}
            y={62}
            textAnchor="middle"
            className={s.tSub}
          >
            {NAMES[i]}
          </text>
          <text
            x={X0 + i * BIT + BIT / 2}
            y={140}
            textAnchor="middle"
            className={s.tLab}
            data-k="bits"
          >
            {l}
          </text>
        </g>
      ))}
      <line
        x1={X0 + 10 * BIT}
        y1={50}
        x2={X0 + 10 * BIT}
        y2={126}
        className={cx(s.ln, s.dash, s.faintLn)}
      />
      <text x={4} y={76} className={s.tSub}>
        5V
      </text>
      <text x={4} y={122} className={s.tSub}>
        0V
      </text>
      <polyline
        points={wave.map((p) => p.join(',')).join(' ')}
        className={cx(s.ln, s.faintLn)}
      />

      {/* time axis */}
      <line
        x1={X0}
        y1={152}
        x2={X0 + 10 * BIT}
        y2={152}
        className={cx(s.ln, s.thin)}
      />
      {LEVELS.map((_, i) => (
        <line
          key={i}
          x1={X0 + i * BIT}
          y1={148}
          x2={X0 + i * BIT}
          y2={156}
          className={cx(s.ln, s.thin)}
        />
      ))}
      <line
        x1={X0 + 10 * BIT}
        y1={148}
        x2={X0 + 10 * BIT}
        y2={156}
        className={cx(s.ln, s.thin)}
      />
      <text x={X0} y={170} textAnchor="middle" className={s.tSub}>
        0
      </text>
      <text x={X0 + 5 * BIT} y={170} textAnchor="middle" className={s.tSub}>
        520.8 µs
      </text>
      <text x={X0 + 10 * BIT} y={170} textAnchor="end" className={s.tSub}>
        1041.7 µs
      </text>
      <Dim a={[X0 + BIT, 182]} b={[X0 + 2 * BIT, 182]} label="" />
      <text x={X0 + 2 * BIT + 8} y={187} className={s.tLab}>
        t_bit = 1/9600 s ≈ 104.2 µs
      </text>

      {/* rx buffer */}
      <text x={70} y={230} className={s.tSub}>
        rx_buf[0..4] · Serial.read()
      </text>

      {/* state machine transitions (drawn under the route) */}
      <Arrow pts={edge(S.idle, S.read)} />
      <Arrow pts={edge(S.read, S.parse)} />
      <Arrow pts={edge(S.parse, S.act)} />
      <Arrow pts={edge(S.act, S.idle)} className={s.faintG} />
      <Arrow
        pts={[
          [46, 354],
          [91, 373],
        ]}
      />
      <circle cx={42} cy={352} r={5} className={s.solid} />

      <Route d={R.d} />

      {BYTES.map(([h, a], i) => (
        <g key={h} data-k="byte">
          <rect
            x={70 + i * 70}
            y={236}
            width={60}
            height={40}
            rx={4}
            className={s.box}
          />
          <text
            x={100 + i * 70}
            y={262}
            textAnchor="middle"
            className={s.tCode}
          >
            {h}
          </text>
          <text x={100 + i * 70} y={296} textAnchor="middle" className={s.tSub}>
            {a}
          </text>
        </g>
      ))}

      {(
        [
          ['idle', 'IDLE'],
          ['read', 'READ'],
          ['parse', 'PARSE'],
          ['act', 'ACT'],
        ] as const
      ).map(([k, l]) => (
        <g key={k} data-k={`s-${k}`}>
          <circle cx={S[k][0]} cy={S[k][1]} r={SR} className={s.box} />
          <text
            x={S[k][0]}
            y={S[k][1] + 5}
            textAnchor="middle"
            className={s.tNodeS}
          >
            {l}
          </text>
        </g>
      ))}

      <text x={240} y={378} textAnchor="middle" className={s.tSub}>
        available() &gt; 0
      </text>
      <text x={400} y={460} className={s.tSub}>
        &apos;\n&apos; seen
      </text>
      <text x={240} y={540} textAnchor="middle" className={s.tSub}>
        cmd == &quot;GRAB&quot;
      </text>
      <text x={108} y={460} textAnchor="end" className={s.tSub}>
        done
      </text>
      <text x={130} y={600} className={s.tSub}>
        digitalWrite() → pins
      </text>

      <Tag
        k="bench"
        x={264}
        y={598}
        lines={['on my bench', 'Arduino · ESP32', 'Jetson Nano · I2C · SPI']}
      />

      <Dot />
    </svg>
  );
}
