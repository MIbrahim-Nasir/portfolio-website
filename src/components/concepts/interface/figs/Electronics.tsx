'use client';

import { useRef } from 'react';
import {
  drawOn,
  lightUp,
  polyline,
  runRoute,
  useScrub,
  type Pt,
} from '../motion';
import { Dot, Ground, Junction, Route, cx } from '../svg';
import { Tag, popIn } from '../notes';
import s from '../interface.module.css';

// Timing: 0..20 ms across x 80..450 -> 18.5 units per ms.
const TX = 80;
const MS = 18.5;
const tx = (ms: number) => TX + ms * MS;

// STEP: 1 kHz, 50 % duty, first rising edge at 1 ms (DIR already set).
const step: Pt[] = [[TX, 478]];
for (let k = 1; k <= 19; k++) {
  step.push([tx(k), 478], [tx(k), 456], [tx(k + 0.5), 456], [tx(k + 0.5), 478]);
}
step.push([tx(20), 478]);

const head: Pt[] = [
  [240, 0],
  [240, 20],
  [84, 20],
  [84, 52],
  [84, 70], // USB in
  [84, 100],
  [164, 100], // D2 out
  [230, 100], // STEP in
  [290, 100],
  [290, 90],
  [350, 90], // 1A out
  [372, 90],
  [372, 112], // coil A
  [424, 112],
  [424, 129], // rotor
  [470, 129],
  [470, 384],
  [72, 384],
  [72, 478],
];
const tail: Pt[] = [
  [462, 478],
  [462, 604],
  [240, 604],
  [240, 720],
];
const R = polyline([...head, ...step, ...tail]);
const iStep = head.length;

/** inductor, vertical, four turns bulging right */
const coil = (x: number, y: number, len = 22) => {
  const h = len / 4;
  return `M${x} ${y}` + ` a${h / 2} ${h / 2} 0 0 1 0 ${h}`.repeat(4);
};

export default function ElectronicsFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    lightUp(tl, q('[data-k="u1"]'), R.at(4) - 0.01);
    lightUp(tl, q('[data-k="u2"]'), R.at(7) - 0.01);
    lightUp(tl, q('[data-k="m1"]'), R.at(11) - 0.01);
    lightUp(tl, q('[data-k="pwr"]'), R.at(7), 0.35);
    drawOn(
      tl,
      q('[data-k="tr"]'),
      R.at(iStep),
      R.at(iStep + step.length - 1) - R.at(iStep)
    );
    lightUp(tl, q('[data-k="tl"]'), R.at(iStep) - 0.02, 0.35);
    lightUp(tl, q('[data-k="m2"]'), R.at(iStep) - 0.02, 0.3);
    popIn(tl, q('[data-k="uses"]'), 0.9);
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 720"
      className={s.svg}
      role="img"
      aria-labelledby="fig-ee-t"
    >
      <title id="fig-ee-t">
        Schematic: the Arduino receives the command over USB serial and drives
        STEP and DIR into a stepper driver, with enable tied low and a 100
        microfarad bulk capacitor on the motor supply, which powers a two-phase
        bipolar stepper. Pin D9 drives a servo with PWM. Below, the timing
        diagram over 20 milliseconds: DIR high, STEP at 1 kilohertz, and a 1.5
        millisecond servo pulse every 20 milliseconds.
      </title>

      {/* 1 ms grid */}
      {Array.from({ length: 21 }, (_, m) => (
        <line
          key={m}
          x1={tx(m)}
          y1={396}
          x2={tx(m)}
          y2={544}
          className={s.grid}
        />
      ))}

      <Route d={R.d} />

      {/* U1 */}
      <g data-k="u1">
        <line x1={84} y1={52} x2={84} y2={70} className={s.ln} />
        <rect x={24} y={70} width={120} height={180} rx={3} className={s.box} />
        <text x={84} y={90} textAnchor="middle" className={s.tSub}>
          USB
        </text>
        <text x={84} y={154} textAnchor="middle" className={s.tBig}>
          U1
        </text>
        <text x={84} y={174} textAnchor="middle" className={s.tSub}>
          Arduino
        </text>
        {[
          ['D2', 100],
          ['D5', 130],
          ['D9~', 200],
        ].map(([l, y]) => (
          <g key={l}>
            <line
              x1={144}
              y1={y as number}
              x2={164}
              y2={y as number}
              className={s.ln}
            />
            <text
              x={136}
              y={(y as number) + 4}
              textAnchor="end"
              className={s.tSub}
            >
              {l}
            </text>
          </g>
        ))}
        <line x1={64} y1={250} x2={64} y2={266} className={s.ln} />
        <text x={64} y={242} textAnchor="middle" className={s.tSub}>
          GND
        </text>
        <Ground x={64} y={266} />
      </g>
      <text x={92} y={40} className={s.tSub}>
        RX ← USB-serial
      </text>

      {/* wires U1 -> U2 */}
      <line x1={164} y1={100} x2={210} y2={100} className={s.ln} />
      <line x1={164} y1={130} x2={210} y2={130} className={s.ln} />
      <polyline points="164,200 180,200 180,330 146,330" className={s.ln} />
      <text x={186} y={284} className={s.tSub}>
        PWM
      </text>

      {/* U2 driver */}
      <g data-k="u2">
        <rect
          x={230}
          y={70}
          width={100}
          height={160}
          rx={3}
          className={s.box}
        />
        {[
          ['STEP', 100],
          ['DIR', 130],
          ['EN', 160],
        ].map(([l, y]) => (
          <g key={l}>
            <line
              x1={210}
              y1={y as number}
              x2={230}
              y2={y as number}
              className={s.ln}
            />
            <text x={238} y={(y as number) + 4} className={s.tSub}>
              {l}
            </text>
          </g>
        ))}
        {/* active-low enable: overbar */}
        <line
          x1={238}
          y1={151}
          x2={253}
          y2={151}
          className={cx(s.ln, s.thin)}
        />
        {[
          ['1A', 90],
          ['1B', 112],
          ['2A', 146],
          ['2B', 168],
        ].map(([l, y]) => (
          <g key={l}>
            <line
              x1={330}
              y1={y as number}
              x2={350}
              y2={y as number}
              className={s.ln}
            />
            <text
              x={322}
              y={(y as number) + 4}
              textAnchor="end"
              className={s.tSub}
            >
              {l}
            </text>
          </g>
        ))}
        <text x={280} y={190} textAnchor="middle" className={s.tBig}>
          U2
        </text>
        <text x={280} y={207} textAnchor="middle" className={s.tSub}>
          driver
        </text>
        <text x={254} y={224} textAnchor="middle" className={s.tSub}>
          GND
        </text>
        <text x={306} y={224} textAnchor="middle" className={s.tSub}>
          VMOT
        </text>
      </g>
      <polyline points="210,160 196,160 196,180" className={s.ln} />
      <Ground x={196} y={180} />
      <line x1={254} y1={230} x2={254} y2={248} className={s.ln} />
      <Ground x={254} y={248} />

      {/* motor supply + bulk capacitor */}
      <g data-k="pwr">
        <polyline points="306,230 306,300" className={s.ln} />
        <circle cx={306} cy={304} r={4} className={s.box} />
        <text x={306} y={326} textAnchor="middle" className={s.tLab}>
          +12 V
        </text>
        <Junction x={306} y={268} />
        <polyline points="306,268 352,268 352,280" className={s.ln} />
        <line
          x1={340}
          y1={280}
          x2={364}
          y2={280}
          className={cx(s.ln, s.thick)}
        />
        <path d="M340 291 Q352 284 364 291" className={cx(s.ln, s.thick)} />
        <line x1={352} y1={287} x2={352} y2={306} className={s.ln} />
        <Ground x={352} y={306} />
        <text x={336} y={279} textAnchor="end" className={s.tSub}>
          +
        </text>
        <text x={374} y={284} className={s.tSub}>
          C1
        </text>
        <text x={374} y={300} className={s.tSub}>
          100 µF
        </text>
      </g>

      {/* M1: two-phase bipolar stepper */}
      <g data-k="m1">
        <polyline points="350,90 372,90" className={s.ln} />
        <polyline points="372,112 350,112" className={s.ln} />
        <polyline points="350,146 372,146" className={s.ln} />
        <polyline points="372,168 350,168" className={s.ln} />
        <path d={coil(372, 90)} className={s.ln} />
        <path d={coil(372, 146)} className={s.ln} />
        <rect
          x={362}
          y={80}
          width={100}
          height={98}
          rx={6}
          className={cx(s.ln, s.dash, s.faintLn)}
        />
        <circle cx={424} cy={129} r={26} className={s.box} />
        <text x={424} y={137} textAnchor="middle" className={s.tBig}>
          M
        </text>
        <text x={412} y={198} textAnchor="middle" className={s.tLab}>
          M1 stepper
        </text>
        <text x={412} y={214} textAnchor="middle" className={s.tSub}>
          2-phase bipolar
        </text>
      </g>

      {/* M2: servo */}
      <g data-k="m2">
        <circle cx={124} cy={330} r={22} className={s.box} />
        <text x={124} y={338} textAnchor="middle" className={s.tBig}>
          M
        </text>
        <line x1={102} y1={322} x2={86} y2={322} className={s.ln} />
        <line x1={102} y1={338} x2={86} y2={338} className={s.ln} />
        <text x={82} y={326} textAnchor="end" className={s.tSub}>
          +5V
        </text>
        <text x={82} y={342} textAnchor="end" className={s.tSub}>
          GND
        </text>
        <text x={124} y={370} textAnchor="middle" className={s.tLab}>
          M2 servo
        </text>
      </g>

      {/* timing diagram */}
      <g data-k="tl">
        <text x={16} y={419} className={s.tLab}>
          DIR
        </text>
        <text x={16} y={471} className={s.tLab}>
          STEP
        </text>
        <text x={16} y={527} className={s.tLab}>
          PWM
        </text>
        <text x={450} y={450} textAnchor="end" className={s.tSub}>
          1 kHz
        </text>
        <text x={114} y={508} className={s.tSub}>
          1.5 ms
        </text>
        <text x={450} y={508} textAnchor="end" className={s.tSub}>
          T = 20 ms (50 Hz)
        </text>
      </g>
      <polyline
        points={step.map((p) => p.join(',')).join(' ')}
        className={cx(s.ln, s.faintLn)}
      />
      <polyline
        points={`80,426 ${tx(0.55)},426 ${tx(0.55)},404 450,404`}
        className={cx(s.ln, s.faintLn)}
      />
      <polyline
        points={`80,534 80,512 ${tx(1.5)},512 ${tx(1.5)},534 450,534 450,512 458,512`}
        className={cx(s.ln, s.faintLn)}
      />
      <polyline
        points={`80,426 ${tx(0.55)},426 ${tx(0.55)},404 450,404`}
        className={s.trace}
        data-k="tr"
      />
      <polyline
        points={`80,534 80,512 ${tx(1.5)},512 ${tx(1.5)},534 450,534 450,512 458,512`}
        className={s.trace}
        data-k="tr"
      />
      <line
        x1={TX}
        y1={560}
        x2={tx(20)}
        y2={560}
        className={cx(s.ln, s.thin)}
      />
      {[0, 5, 10, 15, 20].map((m) => (
        <g key={m}>
          <line
            x1={tx(m)}
            y1={556}
            x2={tx(m)}
            y2={564}
            className={cx(s.ln, s.thin)}
          />
          <text
            x={tx(m)}
            y={580}
            textAnchor={m === 20 ? 'end' : 'middle'}
            className={s.tSub}
          >
            {m === 20 ? '20 ms' : m}
          </text>
        </g>
      ))}

      {/* what each waveform has driven */}
      <Tag
        k="uses"
        x={18}
        y={660}
        lines={['servos drove', 'the 4-DOF arm']}
        pin={[96, 534]}
      />
      <Tag
        k="uses"
        x={460}
        y={666}
        anchor="end"
        lines={[
          'steppers drove',
          'the Core XY machine',
          'a mecanum car · CNC shield',
        ]}
        pin={[420, 478]}
      />

      <Dot />
    </svg>
  );
}
