'use client';

import { Fragment, useRef } from 'react';
import { lightUp, polyline, runRoute, useScrub } from '../motion';
import { Arrow, Dot, Route, cx } from '../svg';
import s from '../interface.module.css';

const LH = 24;
const L0 = 274; // baseline of line 1
const GUT = 34; // gutter x, where the execution pointer runs

// Simplified control loop. Token kinds: k keyword, s string, f call, p plain.
type Tok = [string, 'k' | 's' | 'f' | 'p' | 'n'];
const CODE: Tok[][] = [
  [
    ['ok, frame = cam.', 'p'],
    ['read', 'f'],
    ['()', 'p'],
  ],
  [
    ['img = ', 'p'],
    ['to_jpeg', 'f'],
    ['(frame)', 'p'],
  ],
  [
    ['resp = model.', 'p'],
    ['generate_content', 'f'],
    ['([img, PROMPT])', 'p'],
  ],
  [
    ['move = json.', 'p'],
    ['loads', 'f'],
    ['(resp.text)[', 'p'],
    ['"action"', 's'],
    [']', 'p'],
  ],
  [
    ['assert ', 'k'],
    ['move ', 'p'],
    ['in ', 'k'],
    ['(', 'p'],
    ['"grab"', 's'],
    [', ', 'p'],
    ['"shift"', 's'],
    [', ', 'p'],
    ['"place"', 's'],
    [')', 'p'],
  ],
  [
    ['ser.', 'p'],
    ['write', 'f'],
    ['(', 'p'],
    ['f"{move.upper()}\\n"', 's'],
    ['.encode())', 'p'],
  ],
];

const lineY = (i: number) => L0 + i * LH;

const R = polyline([
  [240, 0],
  [240, 8],
  [110, 8],
  [110, 96], // python sends
  [370, 96], // request arrives
  [370, 170], // API works
  [110, 170], // response
  [110, 232],
  [GUT, 232],
  [GUT, lineY(0) - 5],
  [GUT, lineY(5) - 5], // through the listing
  [GUT, 430],
  [240, 430],
  [240, 456], // packet
  [240, 512],
  [240, 640],
]);

export default function SoftwareFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    lightUp(tl, q('[data-k="req"]'), R.at(3) - 0.01);
    lightUp(tl, q('[data-k="act"]'), R.at(4) - 0.01);
    lightUp(tl, q('[data-k="res"]'), R.at(5));
    // execution pointer: highlight each line as the signal passes it
    const a = R.at(9);
    const b = R.at(10);
    const hl = q('[data-k="hl"]');
    hl.forEach((el, i) => {
      const t = a + ((b - a) * i) / (hl.length - 1);
      tl.fromTo(
        el,
        { opacity: 0 },
        { opacity: 1, duration: 0.01 },
        Math.max(0, t - 0.012)
      );
      tl.to(el, { opacity: 0, duration: 0.01 }, t + 0.03);
    });
    lightUp(tl, q('[data-k="code"]'), a - 0.02, 0.45);
    lightUp(tl, q('[data-k="pkt"]'), R.at(13) - 0.01, 0.25);
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 640"
      className={s.svg}
      role="img"
      aria-labelledby="fig-sw-t"
    >
      <title id="fig-sw-t">
        Sequence diagram and source: Python posts the frame and prompt to the
        Gemini API generateContent endpoint, gets 200 OK with JSON, validates
        the action, and writes the bytes GRAB newline to the serial port.
      </title>

      {/* lifelines */}
      <rect x={50} y={20} width={120} height={32} rx={4} className={s.box} />
      <text x={110} y={41} textAnchor="middle" className={s.tNodeS}>
        python
      </text>
      <rect x={300} y={20} width={140} height={32} rx={4} className={s.box} />
      <text x={370} y={41} textAnchor="middle" className={s.tNodeS}>
        Gemini API
      </text>
      <line
        x1={110}
        y1={52}
        x2={110}
        y2={226}
        className={cx(s.ln, s.dash, s.faintLn)}
      />
      <line
        x1={370}
        y1={52}
        x2={370}
        y2={226}
        className={cx(s.ln, s.dash, s.faintLn)}
      />

      {/* listing frame sits under the route so the execution pointer shows in the gutter */}
      <rect x={14} y={244} width={452} height={164} rx={6} className={s.box} />
      <line x1={54} y1={244} x2={54} y2={408} className={cx(s.ln, s.faintLn)} />

      <Route d={R.d} />

      <rect x={104} y={70} width={12} height={150} className={s.act} />
      <rect
        x={364}
        y={96}
        width={12}
        height={74}
        className={s.act}
        data-k="act"
      />

      <g data-k="req">
        <Arrow
          pts={[
            [116, 96],
            [362, 96],
          ]}
        />
        <text x={240} y={86} textAnchor="middle" className={s.tLab}>
          POST …:generateContent
        </text>
        <text x={240} y={115} textAnchor="middle" className={s.tSub}>
          HTTPS · JPEG + prompt
        </text>
      </g>
      <g data-k="res">
        <Arrow
          pts={[
            [364, 170],
            [118, 170],
          ]}
          className={s.dashG}
        />
        <text x={240} y={160} textAnchor="middle" className={s.tLab}>
          200 OK · application/json
        </text>
        <text x={240} y={190} textAnchor="middle" className={s.tCodeS}>
          {'{"action": "grab"}'}
        </text>
      </g>

      {/* listing */}
      {CODE.map((_, i) => (
        <rect
          key={i}
          x={55}
          y={lineY(i) - 17}
          width={410}
          height={LH - 1}
          className={s.hl}
          data-k="hl"
          style={{ opacity: 0 }}
        />
      ))}
      <g data-k="code">
        {CODE.map((toks, i) => (
          <Fragment key={i}>
            <text x={48} y={lineY(i)} textAnchor="end" className={s.tLn}>
              {i + 1}
            </text>
            <text x={62} y={lineY(i)} className={s.tCode}>
              {toks.map(([t, k], j) => (
                <tspan
                  key={j}
                  className={
                    k === 's'
                      ? s.cStr
                      : k === 'k'
                        ? s.cKey
                        : k === 'f'
                          ? s.cFn
                          : undefined
                  }
                >
                  {t}
                </tspan>
              ))}
            </text>
          </Fragment>
        ))}
      </g>
      <text x={462} y={426} textAnchor="end" className={s.tSub}>
        simplified
      </text>

      <g data-k="pkt">
        <rect
          x={120}
          y={456}
          width={240}
          height={56}
          rx={6}
          className={s.box}
        />
        <text x={240} y={482} textAnchor="middle" className={s.tCode}>
          b&quot;GRAB\n&quot;
        </text>
        <text x={240} y={502} textAnchor="middle" className={s.tSub}>
          5 bytes
        </text>
      </g>
      <text x={252} y={540} className={s.tSub}>
        → pyserial · /dev/ttyUSB0
      </text>

      <Dot />
    </svg>
  );
}
