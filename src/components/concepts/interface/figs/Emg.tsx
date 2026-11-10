'use client';

import { useRef } from 'react';
import { drawOn, lightUp, polyline, runRoute, useScrub } from '../motion';
import { Tag, popIn } from '../notes';
import { Dot, Route, cx } from '../svg';
import s from '../interface.module.css';

// EMG bionic arm: the usual surface-EMG chain, drawn as blocks on the signal with the waveform after each stage.
// amplify -> rectify -> smooth into an envelope -> compare with a threshold -> drive the arm.
const BX = 240;
const STAGES = [
  { y: 120, label: 'amp', side: 1 },
  { y: 240, label: '|x|', side: -1 },
  { y: 360, label: 'LPF', side: 1 },
  { y: 480, label: '> th', side: -1 },
] as const;

const R = polyline([
  [240, 0],
  [240, 100], // 1 amp
  [240, 220], // 2 rectify
  [240, 340], // 3 lpf
  [240, 460], // 4 threshold
  [240, 540], // 5 actuator
  [240, 640],
]);

const noise = (i: number) => {
  const n = Math.sin(i * 91.7 + 3.1) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
};
const N = 120;
const PW = 180;
// one contraction, centred in the window
const bump = (u: number) => Math.exp(-Math.pow((u - 0.5) / 0.17, 2));
const env = (u: number) => 0.06 + 0.94 * bump(u);
const TH = 0.45;

/** waveform for each stage, in a 180 x 64 box with its origin at the top left */
function wave(stage: number) {
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const a = env(u);
    let v: number;
    if (stage === 0) v = 32 - noise(i) * 28 * a;
    else if (stage === 1) v = 60 - Math.abs(noise(i)) * 54 * a;
    else if (stage === 2) v = 60 - 50 * a;
    else v = a > TH ? 10 : 58;
    pts.push(`${(u * PW).toFixed(1)},${v.toFixed(1)}`);
  }
  return pts.join(' ');
}

export default function EmgFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    STAGES.forEach((_, i) => {
      lightUp(tl, q(`[data-k="b${i}"]`), R.at(i + 1) - 0.01, 0.35);
      drawOn(tl, q(`[data-k="w${i}"]`), R.at(i + 1), 0.09);
    });
    lightUp(tl, q('[data-k="act"]'), R.at(5) - 0.01, 0.3);
    popIn(tl, q('[data-k="bench"]'), R.at(5) + 0.02);
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 640"
      className={s.svg}
      role="img"
      aria-labelledby="fig-emg-t"
    >
      <title id="fig-emg-t">
        EMG-controlled bionic arm from the TSIG robotics bench: the muscle
        signal is amplified, rectified, smoothed into an envelope, and compared
        with a threshold that drives the arm. Also at the bench: soldering,
        basic PCB design, and an electronics workshop I ran for juniors.
      </title>

      <text x={20} y={40} className={s.tTitle}>
        EMG bionic arm
      </text>
      <text x={20} y={60} className={s.tSub}>
        TSIG robotics bench
      </text>
      <text x={460} y={40} textAnchor="end" className={s.tLab}>
        muscle → electrode
      </text>
      <text x={460} y={58} textAnchor="end" className={s.tSub}>
        small and noisy
      </text>

      <Route d={R.d} />

      {STAGES.map((st, i) => {
        const x0 = st.side > 0 ? 276 : 24;
        const y0 = st.y - 32;
        return (
          <g key={i}>
            {/* plot frame and zero line */}
            <rect
              x={x0 - 6}
              y={y0 - 6}
              width={PW + 12}
              height={76}
              rx={3}
              className={cx(s.ln, s.faintLn, s.thin)}
            />
            {i === 2 && (
              <line
                x1={x0}
                y1={y0 + 60 - 50 * TH}
                x2={x0 + PW}
                y2={y0 + 60 - 50 * TH}
                className={cx(s.ln, s.dash, s.thin, s.faintLn)}
              />
            )}
            <polyline
              points={wave(i)}
              transform={`translate(${x0} ${y0})`}
              className={cx(s.ln, s.thin, s.faintLn)}
            />
            <polyline
              points={wave(i)}
              transform={`translate(${x0} ${y0})`}
              className={s.trace}
              data-k={`w${i}`}
            />
            <text
              x={st.side > 0 ? x0 + PW : x0}
              y={y0 + 88}
              textAnchor={st.side > 0 ? 'end' : 'start'}
              className={s.tSub}
            >
              {['raw', 'rectified', 'envelope · threshold', 'on / off'][i]}
            </text>
            {/* the block on the signal, and a stub out to its plot */}
            <line
              x1={st.side > 0 ? BX + 26 : BX - 26}
              y1={st.y}
              x2={st.side > 0 ? x0 - 6 : x0 + PW + 6}
              y2={st.y}
              className={cx(s.ln, s.thin)}
            />
            <g data-k={`b${i}`}>
              {i === 0 ? (
                <polygon
                  points={`${BX - 22},${st.y - 20} ${BX + 22},${st.y} ${BX - 22},${st.y + 20}`}
                  className={s.box}
                />
              ) : (
                <rect
                  x={BX - 24}
                  y={st.y - 18}
                  width={48}
                  height={36}
                  rx={4}
                  className={s.box}
                />
              )}
              <text
                x={i === 0 ? BX - 6 : BX}
                y={st.y + 5}
                textAnchor="middle"
                className={s.tNodeS}
              >
                {i === 0 ? '' : st.label}
              </text>
            </g>
          </g>
        );
      })}

      <g data-k="act">
        <circle cx={BX} cy={562} r={22} className={s.box} />
        <text x={BX} y={570} textAnchor="middle" className={s.tBig}>
          M
        </text>
        <text x={BX - 34} y={567} textAnchor="end" className={s.tLab}>
          the arm moves
        </text>
      </g>

      <Tag
        k="bench"
        x={460}
        y={590}
        anchor="end"
        lines={[
          'at the bench',
          'soldering · basic PCB',
          'electronics workshop',
          'I ran for juniors',
        ]}
      />

      <Dot />
    </svg>
  );
}
