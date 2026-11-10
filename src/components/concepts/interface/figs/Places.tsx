'use client';

import { useRef } from 'react';
import { lightUp, polyline, runRoute, useScrub } from '../motion';
import { Tag, popIn } from '../notes';
import { Dot, Route, cx } from '../svg';
import s from '../interface.module.css';

// The route so far, as a line diagram: three stations, what happened at each.
const ST = [
  { y: 92, name: 'Dubai' },
  { y: 268, name: 'Hyderabad' },
  { y: 486, name: 'Dubai' },
];
const R = polyline([
  [240, 0],
  [240, ST[0].y],
  [240, ST[1].y],
  [240, ST[2].y],
  [240, 640],
]);

export default function PlacesFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    ST.forEach((_, i) => {
      lightUp(tl, q(`[data-k="st${i}"]`), R.at(i + 1) - 0.015, 0.3);
      popIn(tl, q(`[data-k="t${i}"]`), R.at(i + 1));
    });
    popIn(tl, q('[data-k="also"]'), R.at(3) + 0.05);
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 640"
      className={s.svg}
      role="img"
      aria-labelledby="fig-places-t"
    >
      <title id="fig-places-t">
        Dubai, Hyderabad, Dubai. School in Dubai to 10th grade, CBSE 92 percent.
        In Hyderabad, 11th and 12th at 94 percent, then a B.E. in Computer
        Science and Engineering at MJCET, Osmania University, 2025, GPA 8.27,
        with TSIG and the DeltaX internship. Back in Dubai, AI Developer on the
        R&amp;D team at Ducon Industries since August 2025. Also: HackRevolution
        winner, ISRO Rover Competition top 50 all-India, inter-club debate
        champion.
      </title>

      <Route d={R.d} />

      {ST.map((st, i) => (
        <g key={i} data-k={`st${i}`}>
          <circle
            cx={240}
            cy={st.y}
            r={11}
            className={cx(s.box, s.sigStroke)}
          />
          <circle cx={240} cy={st.y} r={4} className={s.solidSig} />
          <text x={222} y={st.y + 9} textAnchor="end" className={s.tStation}>
            {st.name}
          </text>
        </g>
      ))}

      <Tag
        k="t0"
        x={262}
        y={92}
        lines={['school to 10th', 'New Indian Model School', 'CBSE · 92%']}
      />

      <Tag k="t1" x={262} y={226} lines={['11th – 12th · 94%']} />
      <Tag
        k="t1"
        x={262}
        y={300}
        lines={[
          'B.E. Computer Science',
          'MJCET · Osmania Univ.',
          '2025 · GPA 8.27',
        ]}
      />
      <Tag
        k="t1"
        x={218}
        y={318}
        anchor="end"
        lines={['TSIG lead', '2022 – 2025']}
      />
      <Tag
        k="t1"
        x={218}
        y={378}
        anchor="end"
        lines={['DeltaX intern', 'Jan – Jul 2025']}
      />

      <Tag
        k="t2"
        x={262}
        y={486}
        lines={['Ducon Industries', 'AI Developer · R&D', 'Aug 2025 – now']}
      />

      <Tag
        k="also"
        x={18}
        y={580}
        hole={false}
        quiet
        lines={[
          'also on the record',
          'HackRevolution · winner',
          'ISRO Rover · top 50 India',
          'inter-club debate · champion',
        ]}
      />

      <Dot />
    </svg>
  );
}
