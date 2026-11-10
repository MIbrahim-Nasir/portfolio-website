'use client';

import { useId, useRef } from 'react';
import { drawOn, lightUp, polyline, runRoute, useScrub } from '../motion';
import { Dot, Route, cx } from '../svg';
import { Tag, popIn } from '../notes';
import s from '../interface.module.css';

// Schedule: 08:00..22:00 across x 70..450.
const HX = 70;
const PH = 380 / 14;
const hx = (h: number) => HX + (h - 8) * PH;

const NODES = Array.from({ length: 11 }, (_, i) => 40 + i * 40); // 10 projects + "more"
const TAPS = Array.from({ length: 30 }, (_, i) => 40 + (i * 400) / 29);

const R = polyline([
  [240, 0],
  [240, 30],
  [hx(16), 30],
  [hx(16), 118], // 16:00, classes end
  [hx(21.5), 118], // the club, into the evening
  [462, 118],
  [462, 206],
  [240, 206],
  [240, 234], // lead
  [240, 340], // one of the projects
  [240, 430], // the member bus
  [240, 640],
]);

export default function PeopleFig() {
  const ref = useRef<SVGSVGElement>(null);
  const grad = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    lightUp(tl, q('[data-k="club"]'), R.at(3) - 0.01, 0.3, R.at(4) - R.at(3));
    lightUp(tl, q('[data-k="lead"]'), R.at(8) - 0.01, 0.3);
    drawOn(tl, q('[data-k="fan"]'), R.at(8), 0.07);
    tl.fromTo(
      q('[data-k="node"]'),
      { opacity: 0.25 },
      { opacity: 1, duration: 0.02, stagger: 0.004 },
      R.at(8) + 0.05
    );
    drawOn(tl, q('[data-k="drop"]'), R.at(9) - 0.02, 0.06);
    tl.fromTo(
      q('[data-k="tap"]'),
      { opacity: 0.2 },
      { opacity: 1, duration: 0.01, stagger: 0.003 },
      R.at(10) - 0.03
    );
    lightUp(tl, q('[data-k="note"]'), R.at(10) + 0.02, 0.3);
    popIn(tl, q('[data-k="tsig"]'), R.at(8));
    popIn(tl, q('[data-k="teach"]'), R.at(10) + 0.03);
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 640"
      className={s.svg}
      role="img"
      aria-labelledby="fig-ppl-t"
    >
      <title id="fig-ppl-t">
        Schedule and fan-out: classes end at 16:00, the club works until 21:00
        to 22:00. One lead fans out to ten or more concurrent projects in AI,
        web and robotics, which all run on a bus of 30 members.
      </title>
      <defs>
        <linearGradient id={grad} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.55" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* day schedule */}
      <text x={12} y={82} className={s.tLab}>
        classes
      </text>
      <text x={12} y={122} className={s.tLab}>
        TSIG
      </text>
      <rect
        x={HX}
        y={70}
        width={hx(16) - HX}
        height={16}
        fill={`url(#${grad})`}
        className={s.inkFill}
      />
      <line
        x1={hx(16)}
        y1={56}
        x2={hx(16)}
        y2={146}
        className={cx(s.ln, s.dash, s.faintLn)}
      />
      <polygon
        points={`${hx(16)},62 ${hx(16) + 6},68 ${hx(16)},74 ${hx(16) - 6},68`}
        className={s.solid}
      />
      <text x={hx(16) - 8} y={104} textAnchor="end" className={s.tSub}>
        classes end 16:00
      </text>
      <g data-k="club">
        <rect
          x={hx(16)}
          y={110}
          width={hx(21) - hx(16)}
          height={16}
          className={s.barSig}
        />
        <rect
          x={hx(21)}
          y={110}
          width={hx(22) - hx(21)}
          height={16}
          className={s.barSigHatch}
        />
        <text x={450} y={102} textAnchor="end" className={s.tSub}>
          until 9–10 pm
        </text>
      </g>
      <line
        x1={HX}
        y1={152}
        x2={hx(22)}
        y2={152}
        className={cx(s.ln, s.thin)}
      />
      {[8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
        <g key={h}>
          <line
            x1={hx(h)}
            y1={148}
            x2={hx(h)}
            y2={156}
            className={cx(s.ln, s.thin)}
          />
          <text x={hx(h)} y={172} textAnchor="middle" className={s.tSub}>
            {String(h).padStart(2, '0')}
          </text>
        </g>
      ))}
      <text x={12} y={172} className={s.tSub}>
        h
      </text>

      {/* fan-out to projects */}
      {NODES.map((x, i) => (
        <line
          key={i}
          x1={240}
          y1={250}
          x2={x}
          y2={329}
          className={cx(s.ln, s.faintLn)}
        />
      ))}
      {NODES.map((x, i) => (
        <line
          key={i}
          x1={240}
          y1={250}
          x2={x}
          y2={329}
          className={s.trace}
          data-k="fan"
        />
      ))}
      {NODES.map((x, i) => (
        <g key={i}>
          <line
            x1={x}
            y1={351}
            x2={x}
            y2={430}
            className={cx(s.ln, s.faintLn)}
          />
          <line
            x1={x}
            y1={351}
            x2={x}
            y2={430}
            className={s.trace}
            data-k="drop"
          />
        </g>
      ))}

      <Route d={R.d} />

      <g data-k="lead">
        <circle cx={240} cy={238} r={13} className={cx(s.box, s.sigStroke)} />
        <text x={262} y={243} className={s.tSub}>
          Vice Chair · Technical Lead
        </text>
      </g>
      {NODES.map((x, i) => (
        <g key={i} data-k="node">
          <rect
            x={x - 11}
            y={329}
            width={22}
            height={22}
            rx={3}
            className={cx(s.box, i === 10 && s.dashBox)}
          />
          {i === 10 && (
            <text x={x} y={345} textAnchor="middle" className={s.tLab}>
              +
            </text>
          )}
        </g>
      ))}
      <rect x={70} y={365} width={340} height={19} className={s.labelBg} />
      <text x={240} y={378} textAnchor="middle" className={s.tSub}>
        10+ concurrent projects · AI · web · robotics
      </text>

      {/* member bus */}
      <line x1={30} y1={430} x2={450} y2={430} className={cx(s.ln, s.thick)} />
      {TAPS.map((x, i) => (
        <g key={i} data-k="tap">
          <line x1={x} y1={430} x2={x} y2={444} className={s.ln} />
          <circle cx={x} cy={448} r={3} className={s.solidSig} />
        </g>
      ))}
      <text x={248} y={478} className={s.tLab}>
        30 members
      </text>
      <text x={248} y={500} className={s.tSub} data-k="note">
        project completion rate +25%
      </text>

      <Tag
        k="tsig"
        x={216}
        y={236}
        anchor="end"
        lines={['TSIG · MJCET', '2022 – 2025']}
        hole={false}
        quiet
      />
      <Tag
        k="teach"
        x={18}
        y={576}
        lines={[
          'taught',
          'front-end internship',
          'electronics workshop',
          'placement mentoring',
        ]}
        pin={[60, 450]}
      />
      <Tag
        k="teach"
        x={460}
        y={590}
        anchor="end"
        lines={['joined: robotics member', 'left: Vice Chair']}
      />

      <Dot />
    </svg>
  );
}
