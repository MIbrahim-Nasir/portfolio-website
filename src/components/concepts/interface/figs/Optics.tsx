'use client';

import { useRef } from 'react';
import { drawOn, lightUp, polyline, runRoute, useScrub } from '../motion';
import { Dim, Dot, Head, Route, cx } from '../svg';
import s from '../interface.module.css';

// Thin lens, axis vertical. Lens at y=200, f=84, object at u=140 (y=60), so
// v = 1/(1/84 - 1/140) = 210 (y=410) and m = -v/u = -1.5: a real, inverted image 66 tall.
const R = polyline([
  [240, 0],
  [240, 22],
  [284, 22],
  [284, 60], // object tip
  [240, 200], // chief ray through the lens centre
  [174, 410], // image tip
  [174, 424],
  [128, 424], // down the readout edge as rows are read
  [128, 552],
  [240, 552],
  [240, 566],
  [240, 606],
  [240, 640],
]);

const COLS = 12;
const ROWS = 6;
const PX = 16;
const GX = 144;
const GY = 440;

const hash = (c: number, r: number) => {
  const n = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
  return n - Math.floor(n);
};
// The image lands on columns 2..5 (x 174..240): inverted relative to the object.
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  const inImg = c >= 2 && c <= 5 && r >= 1 && r <= 4;
  const v = inImg ? 0.6 + hash(c, r) * 0.25 : 0.05 + hash(c, r) * 0.1;
  return { c, r, v: Math.round(v * 1000) / 1000 };
});

export default function OpticsFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    lightUp(tl, q('[data-k="obj"]'), R.at(2), 0.35);
    drawOn(tl, q('[data-k="ray"]'), R.at(3), 0.22);
    lightUp(tl, q('[data-k="lens"]'), R.at(4) - 0.02, 0.4);
    tl.fromTo(
      q('[data-k="img"]'),
      { opacity: 0 },
      { opacity: 1, duration: 0.04 },
      R.at(5) - 0.03
    );
    const cells = q('[data-k="px"]');
    const a = R.at(7);
    const b = R.at(8);
    tl.fromTo(
      cells,
      { opacity: 0 },
      { opacity: 1, duration: 0.01, stagger: (b - a) / cells.length },
      a
    );
    lightUp(tl, q('[data-k="frame"]'), R.at(10) - 0.01, 0.3);
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 640"
      className={s.svg}
      role="img"
      aria-labelledby="fig-optics-t"
    >
      <title id="fig-optics-t">
        Ray diagram: an object 140 units above a thin lens of focal length 84
        forms a real, inverted image 210 units below it, magnified 1.5 times, on
        the camera sensor, which reads it out as a grid of 8-bit pixels.
      </title>

      {/* optical axis: centre line */}
      <line x1={240} y1={36} x2={240} y2={430} className={s.ctr} />

      {/* thin lens: converging symbol, with the biconvex section ghosted */}
      <g data-k="lens">
        <path
          d="M140 200 Q240 180 340 200 Q240 220 140 200 Z"
          className={s.glass}
        />
        <line x1={146} y1={200} x2={334} y2={200} className={s.ln} />
        <Head from={[300, 200]} to={[340, 200]} size={9} />
        <Head from={[180, 200]} to={[140, 200]} size={9} />
        <text x={134} y={205} textAnchor="end" className={s.tLab}>
          thin lens
        </text>
      </g>
      <line x1={348} y1={200} x2={458} y2={200} className={cx(s.ln, s.ext)} />

      {/* focal points */}
      <circle cx={240} cy={116} r={2.5} className={s.junction} />
      <text x={248} y={120} className={s.tLab}>
        F
      </text>
      <circle cx={240} cy={284} r={2.5} className={s.junction} />
      <text x={248} y={288} className={s.tLab}>
        F′
      </text>

      {/* object */}
      <g data-k="obj">
        <line x1={240} y1={60} x2={278} y2={60} className={cx(s.ln, s.thick)} />
        <Head from={[260, 60]} to={[286, 60]} size={9} />
        <text x={296} y={64} className={s.tLab}>
          object
        </text>
      </g>

      {/* rays: the parallel ray refracts through F′, the focal ray leaves parallel. The chief ray is the route. */}
      <polyline
        points="284,60 284,200 174,410"
        className={cx(s.ln, s.rayBase)}
      />
      <polyline
        points="284,60 240,116 174,200 174,410"
        className={cx(s.ln, s.rayBase)}
      />
      <polyline
        points="284,60 284,200 174,410"
        className={s.ray}
        data-k="ray"
      />
      <polyline
        points="284,60 240,116 174,200 174,410"
        className={s.ray}
        data-k="ray"
      />

      {/* sensor plane and the inverted image */}
      <line x1={120} y1={410} x2={360} y2={410} className={cx(s.ln, s.thick)} />
      <text x={366} y={414} className={s.tLab}>
        sensor
      </text>
      <g data-k="img" style={{ opacity: 0 }}>
        <line
          x1={240}
          y1={410}
          x2={182}
          y2={410}
          className={cx(s.ln, s.sigStroke, s.thick)}
        />
        <Head
          from={[200, 410]}
          to={[174, 410]}
          size={9}
          className={s.sigFill}
        />
      </g>

      {/* dimensions */}
      <line x1={354} y1={60} x2={428} y2={60} className={cx(s.ln, s.ext)} />
      <line x1={344} y1={284} x2={398} y2={284} className={cx(s.ln, s.ext)} />
      <line x1={424} y1={410} x2={458} y2={410} className={cx(s.ln, s.ext)} />
      <Dim a={[392, 200]} b={[392, 284]} label="f" side="left" offset={8} />
      <Dim a={[420, 60]} b={[420, 200]} label="u" side="right" offset={8} />
      <Dim a={[450, 200]} b={[450, 410]} label="v" side="left" offset={8} />

      {/* thin-lens equation */}
      <text x={20} y={262} className={s.tEq}>
        1/f = 1/u + 1/v
      </text>
      <text x={20} y={288} className={s.tEq}>
        m = −v/u = −1.5
      </text>
      <text x={20} y={312} className={s.tSub}>
        real, inverted
      </text>

      {/* Bayer colour filter array */}
      <g>
        {[
          ['R', 0, 0],
          ['G', 1, 0],
          ['G', 0, 1],
          ['B', 1, 1],
        ].map(([l, c, r]) => (
          <g key={`${c}${r}`}>
            <rect
              x={44 + (c as number) * 24}
              y={440 + (r as number) * 24}
              width={24}
              height={24}
              className={s.cell}
            />
            <text
              x={56 + (c as number) * 24}
              y={457 + (r as number) * 24}
              textAnchor="middle"
              className={s.tSub}
            >
              {l}
            </text>
          </g>
        ))}
        <text x={44} y={510} className={s.tSub}>
          Bayer CFA
        </text>
      </g>

      {/* pixel grid, read out row by row */}
      <rect
        x={GX}
        y={GY}
        width={COLS * PX}
        height={ROWS * PX}
        className={s.cell}
      />
      {CELLS.map(({ c, r, v }) => (
        <rect
          key={`${c}-${r}`}
          x={GX + c * PX + 0.5}
          y={GY + r * PX + 0.5}
          width={PX - 1}
          height={PX - 1}
          data-k="px"
          className={s.px}
          style={{ fillOpacity: v }}
        />
      ))}
      <text x={346} y={456} className={s.tSub}>
        8 bit / ch
      </text>
      <text x={346} y={474} className={s.tSub}>
        H × W × 3
      </text>
      <text x={346} y={530} className={s.tSub}>
        flipped in
      </text>
      <text x={346} y={546} className={s.tSub}>
        software
      </text>

      <Route d={R.d} />

      <g data-k="frame">
        <rect
          x={150}
          y={566}
          width={180}
          height={40}
          rx={4}
          className={s.box}
        />
        <text x={240} y={591} textAnchor="middle" className={s.tNode}>
          frame_t.jpg
        </text>
      </g>

      <Dot />
    </svg>
  );
}
