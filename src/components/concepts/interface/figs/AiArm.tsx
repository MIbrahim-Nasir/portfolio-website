'use client';

import { useRef } from 'react';
import { drawOn, lightUp, polyline, runRoute, useScrub } from '../motion';
import { Arrow, Dot, GNode, Route, cx } from '../svg';
import { Tag, popIn } from '../notes';
import s from '../interface.module.css';

const R = polyline([
  [240, 0],
  [240, 64], // frame
  [240, 120],
  [240, 200], // Gemini
  [240, 270],
  [240, 350], // grab
  [240, 390],
  [240, 462], // output
  [240, 518],
  [240, 640],
]);

export default function AiArmFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    lightUp(tl, q('[data-k="frame"]'), R.at(1) - 0.01);
    drawOn(tl, q('[data-k="pedge"] polyline'), R.at(2), 0.06);
    lightUp(tl, q('[data-k="prompt"]'), R.at(2) - 0.02);
    lightUp(tl, q('[data-k="gem"]'), R.at(3) - 0.01);
    // the model considers all three moves, then commits to one
    drawOn(tl, q('[data-k="cedge"] polyline'), R.at(4), 0.06);
    lightUp(tl, q('[data-k="alt"]'), R.at(4) + 0.03, 0.3, 0.03);
    tl.to(
      q('[data-k="alt"]'),
      { opacity: 0.22, duration: 0.04 },
      R.at(5) - 0.01
    );
    tl.to(
      q('[data-k="cedge"][data-alt]'),
      { opacity: 0.18, duration: 0.04 },
      R.at(5) - 0.01
    );
    lightUp(tl, q('[data-k="grab"]'), R.at(5) - 0.02, 0.3);
    tl.fromTo(
      q('[data-k="pick"]'),
      { opacity: 0 },
      { opacity: 1, duration: 0.04 },
      R.at(5) - 0.02
    );
    lightUp(tl, q('[data-k="out"]'), R.at(7) - 0.02, 0.2);
    popIn(tl, q('[data-k="strict"]'), R.at(7) + 0.02);
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 640"
      className={s.svg}
      role="img"
      aria-labelledby="fig-aiarm-t"
    >
      <title id="fig-aiarm-t">
        Computation graph: the camera frame and a prompt go into Gemini, which
        considers three actions, shift, grab and place, and returns one as JSON:
        action grab.
      </title>

      <Route d={R.d} />

      <g data-k="pedge">
        <Arrow
          pts={[
            [404, 212],
            [404, 235],
            [342, 235],
          ]}
        />
      </g>
      <g data-k="cedge" data-alt="">
        <Arrow
          pts={[
            [236, 270],
            [236, 300],
            [110, 300],
            [110, 348],
          ]}
        />
      </g>
      <g data-k="cedge" data-alt="">
        <Arrow
          pts={[
            [244, 270],
            [244, 300],
            [370, 300],
            [370, 348],
          ]}
        />
      </g>
      <g data-k="cedge">
        <Arrow
          pts={[
            [240, 300],
            [240, 348],
          ]}
          className={s.sigG}
        />
      </g>

      <GNode
        data-k="frame"
        x={240}
        y={92}
        w={184}
        h={56}
        label="frame_t.jpg"
        sub="image/jpeg"
      >
        {/* image patches: what the vision encoder tokenises */}
        {Array.from({ length: 9 }, (_, i) => (
          <rect
            key={i}
            x={158 + (i % 3) * 9}
            y={79 + Math.floor(i / 3) * 9}
            width={8}
            height={8}
            className={s.px}
            style={{
              fillOpacity: [0.1, 0.5, 0.15, 0.6, 0.8, 0.2, 0.1, 0.4, 0.1][i],
            }}
          />
        ))}
      </GNode>
      <GNode
        data-k="prompt"
        x={404}
        y={190}
        w={112}
        h={44}
        label="prompt"
        sub="task + schema"
      />
      <GNode
        data-k="gem"
        x={240}
        y={235}
        w={200}
        h={70}
        label="Gemini"
        sub="vision-language model"
        big
      />

      <GNode data-k="alt" x={110} y={370} w={100} h={42} label="shift" />
      <g data-k="grab">
        <GNode x={240} y={370} w={100} h={42} label="grab" className={s.pick} />
      </g>
      <GNode data-k="alt" x={370} y={370} w={100} h={42} label="place" />
      <text
        x={240}
        y={414}
        textAnchor="middle"
        className={cx(s.tSub, s.tSig)}
        data-k="pick"
        style={{ opacity: 0 }}
      >
        chosen
      </text>

      <g data-k="out">
        <rect
          x={110}
          y={462}
          width={260}
          height={56}
          rx={7}
          className={s.box}
        />
        <text x={240} y={496} textAnchor="middle" className={s.tCode}>
          {'{"action": "grab"}'}
        </text>
      </g>
      <text x={240} y={544} textAnchor="middle" className={s.tSub}>
        schema: action ∈ {'{'}grab, shift, place{'}'}
      </text>
      <Tag
        k="strict"
        x={300}
        y={600}
        lines={['Strict schema:', 'three allowed values']}
        pin={[364, 518]}
      />

      <Dot />
    </svg>
  );
}
