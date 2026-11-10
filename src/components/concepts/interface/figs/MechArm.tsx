'use client';

import { useId, useRef } from 'react';
import { ease, lerp, polyline, runRoute, seg, useScrub } from '../motion';
import { Dot, HatchDef, Route, cx } from '../svg';
import { Tag, popIn } from '../notes';
import s from '../interface.module.css';

// Side elevation of a 4-DOF arm (base yaw is out of plane). Shoulder S, links L1, L2, wrist to tool L3.
const SX = 340;
const SY = 500;
const L1 = 170;
const L2 = 150;
const PALM = 30;
const FING = 26;
const BLOCK = { x: 96, y: 532, w: 28 };

// wrist waypoints in screen coords, tool angle in screen degrees (90 = pointing down)
const HOME = { x: 230, y: 300, a: 120 };
const APPR = { x: 110, y: 420, a: 90 };
const GRAB = { x: 110, y: 490, a: 90 };
const LIFT = { x: 110, y: 440, a: 90 };

const R = polyline([
  [240, 0],
  [240, 12],
  [468, 12],
  [468, 500],
  [356, 500],
]);
const OUT = polyline([
  [110, 562],
  [110, 616],
  [240, 616],
  [240, 640],
]);

const deg = (r: number) => (r * 180) / Math.PI;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const fmt = (d: number) => `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}°`;

/** Closed-form 2-link IK, elbow up. Local frame: x towards the object (screen left), y up. */
function solve(wx: number, wy: number, aScreen: number) {
  const x = SX - wx;
  const y = SY - wy;
  const c3 = Math.max(
    -1,
    Math.min(1, (x * x + y * y - L1 * L1 - L2 * L2) / (2 * L1 * L2))
  );
  const t3 = -Math.acos(c3);
  const t2 =
    Math.atan2(y, x) - Math.atan2(L2 * Math.sin(t3), L1 + L2 * Math.cos(t3));
  const ex = SX - L1 * Math.cos(t2);
  const ey = SY - L1 * Math.sin(t2);
  const as = (aScreen * Math.PI) / 180;
  const phiLocal = Math.atan2(-Math.sin(as), -Math.cos(as));
  const t4 = wrap(deg(phiLocal - t2 - t3));
  return { ex, ey, t2: deg(t2), t3: deg(t3), t4 };
}

/** joint angles at the home pose, in degrees (the debug view dumps these as float32) */
export const HOME_ANGLES = (() => {
  const k = solve(HOME.x, HOME.y, HOME.a);
  return [k.t2, k.t3, k.t4];
})();

function pose(t: number) {
  const a = ease(seg(t, 0.2, 0.6));
  const b = ease(seg(t, 0.6, 0.74));
  const c = ease(seg(t, 0.8, 0.92));
  let p = {
    x: lerp(HOME.x, APPR.x, a),
    y: lerp(HOME.y, APPR.y, a),
    a: lerp(HOME.a, APPR.a, a),
  };
  if (t > 0.6)
    p = { x: lerp(APPR.x, GRAB.x, b), y: lerp(APPR.y, GRAB.y, b), a: 90 };
  if (t > 0.8)
    p = { x: lerp(GRAB.x, LIFT.x, c), y: lerp(GRAB.y, LIFT.y, c), a: 90 };
  const grip = lerp(19, 14, ease(seg(t, 0.74, 0.8))); // half-gap; the block is 28 wide
  const carry = t > 0.8 ? p.y - GRAB.y : 0;
  return { ...p, grip, carry, closed: t >= 0.8 };
}

function Link({
  k,
  a,
  b,
}: {
  k: string;
  a: [number, number];
  b: [number, number];
}) {
  return (
    <g data-k={k}>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={s.linkOuter} />
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={s.linkInner} />
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={s.ctr} />
    </g>
  );
}
function Joint({ k, x, y }: { k?: string; x: number; y: number }) {
  return (
    <g data-k={k} transform={`translate(${x} ${y})`}>
      <circle r={9} className={s.box} />
      <line x1={-13} y1={0} x2={13} y2={0} className={cx(s.ln, s.thin)} />
      <line x1={0} y1={-13} x2={0} y2={13} className={cx(s.ln, s.thin)} />
    </g>
  );
}

export default function MechArmFig() {
  const ref = useRef<SVGSVGElement>(null);
  const hatch = `h${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useScrub(ref, (tl, q, svg) => {
    const $ = <T extends Element>(k: string) =>
      svg.querySelector<T>(`[data-k="${k}"]`)!;
    const links = ['l1', 'l2', 'l3'].map((k) =>
      svg.querySelectorAll<SVGLineElement>(`[data-k="${k}"] line`)
    );
    const jE = $<SVGGElement>('jE');
    const jW = $<SVGGElement>('jW');
    const fingers = $<SVGPathElement>('fingers');
    const block = $<SVGGElement>('block');
    const lab1 = $<SVGTextElement>('lab1');
    const lab2 = $<SVGTextElement>('lab2');
    const r2 = $<SVGTextElement>('r2');
    const r3 = $<SVGTextElement>('r3');
    const r4 = $<SVGTextElement>('r4');
    const rg = $<SVGTextElement>('rg');

    const setLine = (
      els: NodeListOf<SVGLineElement>,
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ) =>
      els.forEach((l) => {
        l.setAttribute('x1', x1.toFixed(1));
        l.setAttribute('y1', y1.toFixed(1));
        l.setAttribute('x2', x2.toFixed(1));
        l.setAttribute('y2', y2.toFixed(1));
      });

    const apply = (t: number) => {
      const p = pose(t);
      const k = solve(p.x, p.y, p.a);
      const as = (p.a * Math.PI) / 180;
      const ux = Math.cos(as);
      const uy = Math.sin(as);
      const nx = -uy;
      const ny = ux;
      const px = p.x + ux * PALM;
      const py = p.y + uy * PALM;
      setLine(links[0], SX, SY, k.ex, k.ey);
      setLine(links[1], k.ex, k.ey, p.x, p.y);
      setLine(links[2], p.x, p.y, px, py);
      jE.setAttribute(
        'transform',
        `translate(${k.ex.toFixed(1)} ${k.ey.toFixed(1)})`
      );
      jW.setAttribute(
        'transform',
        `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`
      );
      const g = p.grip;
      const f = (sgn: number) =>
        `M${px + nx * sgn * g} ${py + ny * sgn * g} l${ux * FING} ${uy * FING}`;
      fingers.setAttribute(
        'd',
        `M${px - nx * (g + 4)} ${py - ny * (g + 4)} L${px + nx * (g + 4)} ${py + ny * (g + 4)} ${f(1)} ${f(-1)}`
      );
      block.setAttribute('transform', `translate(0 ${p.carry.toFixed(1)})`);
      // link labels, offset from each link's midpoint
      lab1.setAttribute('x', ((SX + k.ex) / 2 + 16).toFixed(1));
      lab1.setAttribute('y', ((SY + k.ey) / 2).toFixed(1));
      lab2.setAttribute('x', ((k.ex + p.x) / 2).toFixed(1));
      lab2.setAttribute('y', ((k.ey + p.y) / 2 - 18).toFixed(1));
      r2.textContent = `θ₂ ${fmt(k.t2)}`;
      r3.textContent = `θ₃ ${fmt(k.t3)}`;
      r4.textContent = `θ₄ ${fmt(k.t4)}`;
      rg.textContent = p.closed ? 'grip closed' : 'grip open';
    };

    runRoute(tl, svg, 'main', 0, 0.14);
    tl.fromTo(
      q('[data-k="l1"]'),
      { opacity: 0.35 },
      { opacity: 1, duration: 0.03 },
      0.14
    );
    tl.fromTo(
      q('[data-k="l2"]'),
      { opacity: 0.35 },
      { opacity: 1, duration: 0.03 },
      0.17
    );
    tl.fromTo(
      q('[data-k="l3"], [data-k="fingers"]'),
      { opacity: 0.35 },
      { opacity: 1, duration: 0.03 },
      0.2
    );
    const o = { t: 0 };
    apply(0);
    tl.to(
      o,
      { t: 1, duration: 1, ease: 'none', onUpdate: () => apply(o.t) },
      0
    );
    runRoute(tl, svg, 'out', 0.92, 0.08);
    popIn(tl, q('[data-k="print"]'), 0.08);
    popIn(tl, q('[data-k="arm"]'), 0.2);
  });

  // initial pose for first paint (and no-JS)
  const p0 = pose(0);
  const k1 = solve(p0.x, p0.y, p0.a);
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const k0 = { ...k1, ex: r1(k1.ex), ey: r1(k1.ey) };
  const as0 = (p0.a * Math.PI) / 180;
  const P0 = {
    x: r1(p0.x + Math.cos(as0) * PALM),
    y: r1(p0.y + Math.sin(as0) * PALM),
  };
  const n0 = { x: -Math.sin(as0), y: Math.cos(as0) };
  const u0 = { x: Math.cos(as0), y: Math.sin(as0) };
  const g0 = p0.grip;
  const f = (n: number) => n.toFixed(1);
  const f0 = (sgn: number) =>
    `M${f(P0.x + n0.x * sgn * g0)} ${f(P0.y + n0.y * sgn * g0)} l${f(u0.x * FING)} ${f(u0.y * FING)}`;
  const fingers0 = `M${f(P0.x - n0.x * (g0 + 4))} ${f(P0.y - n0.y * (g0 + 4))} L${f(P0.x + n0.x * (g0 + 4))} ${f(P0.y + n0.y * (g0 + 4))} ${f0(1)} ${f0(-1)}`;

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 640"
      className={s.svg}
      role="img"
      aria-labelledby="fig-arm-t"
    >
      <title id="fig-arm-t">
        Side elevation of a 4-DOF arm solving inverse kinematics: law of cosines
        for the elbow, atan2 for the shoulder, wrist angle keeping the gripper
        pointing down. The arm moves from home, descends over the object, closes
        the gripper and lifts it.
      </title>
      <defs>
        <HatchDef id={hatch} />
      </defs>

      {/* IK, closed form */}
      <text x={20} y={40} className={s.tEqS}>
        c₃ = (x² + y² − L₁² − L₂²) / 2L₁L₂
      </text>
      <text x={20} y={62} className={s.tEqS}>
        θ₃ = −arccos c₃ (elbow up)
      </text>
      <text x={20} y={84} className={s.tEqS}>
        θ₂ = atan2(y, x) − atan2(L₂sinθ₃, L₁+L₂cosθ₃)
      </text>
      <text x={20} y={106} className={s.tEqS}>
        θ₄ = φ − θ₂ − θ₃
      </text>
      <text x={20} y={146} className={cx(s.tLab, s.tSig)} data-k="r2">
        θ₂ {fmt(k0.t2)}
      </text>
      <text x={132} y={146} className={cx(s.tLab, s.tSig)} data-k="r3">
        θ₃ {fmt(k0.t3)}
      </text>
      <text x={244} y={146} className={cx(s.tLab, s.tSig)} data-k="r4">
        θ₄ {fmt(k0.t4)}
      </text>
      <text x={356} y={146} className={s.tLab} data-k="rg">
        grip open
      </text>

      {/* planned wrist path */}
      <polyline
        points={`${HOME.x},${HOME.y} ${APPR.x},${APPR.y} ${GRAB.x},${GRAB.y}`}
        className={cx(s.ln, s.dash, s.faintLn)}
      />

      {/* ground and base, in section */}
      <line x1={20} y1={560} x2={460} y2={560} className={cx(s.ln, s.thick)} />
      {Array.from({ length: 37 }, (_, i) => (
        <line
          key={i}
          x1={26 + i * 12}
          y1={561}
          x2={18 + i * 12}
          y2={571}
          className={cx(s.ln, s.thin, s.faintLn)}
        />
      ))}
      <rect
        x={304}
        y={512}
        width={72}
        height={48}
        fill={`url(#${hatch})`}
        className={s.section}
      />
      <line x1={SX} y1={470} x2={SX} y2={590} className={s.ctr} />
      <text x={474} y={532} textAnchor="end" className={s.tSub}>
        θ₁ base yaw
      </text>

      <Route d={R.d} />
      <Route d={OUT.d} name="out" />

      <g data-k="block">
        <rect
          x={BLOCK.x}
          y={BLOCK.y}
          width={BLOCK.w}
          height={BLOCK.w}
          className={cx(s.box, s.sigStroke)}
        />
        <line
          x1={BLOCK.x}
          y1={BLOCK.y}
          x2={BLOCK.x + BLOCK.w}
          y2={BLOCK.y + BLOCK.w}
          className={cx(s.ln, s.thin, s.faintLn)}
        />
      </g>
      <text x={124} y={598} className={s.tSub}>
        object, from fig. 1
      </text>

      <Link k="l1" a={[SX, SY]} b={[k0.ex, k0.ey]} />
      <Link k="l2" a={[k0.ex, k0.ey]} b={[p0.x, p0.y]} />
      <g data-k="l3">
        <line
          x1={p0.x}
          y1={p0.y}
          x2={P0.x}
          y2={P0.y}
          className={s.linkOuterS}
        />
        <line
          x1={p0.x}
          y1={p0.y}
          x2={P0.x}
          y2={P0.y}
          className={s.linkInnerS}
        />
      </g>
      <path d={fingers0} className={cx(s.ln, s.thick)} data-k="fingers" />
      <circle cx={SX} cy={SY} r={15} className={s.box} />
      <Joint x={SX} y={SY} />
      <Joint k="jE" x={k0.ex} y={k0.ey} />
      <Joint k="jW" x={p0.x} y={p0.y} />

      <text
        x={r1((SX + k0.ex) / 2 + 16)}
        y={r1((SY + k0.ey) / 2)}
        className={s.tLab}
        data-k="lab1"
      >
        L₁
      </text>
      <text
        x={r1((k0.ex + p0.x) / 2)}
        y={r1((k0.ey + p0.y) / 2 - 18)}
        className={s.tLab}
        data-k="lab2"
      >
        L₂
      </text>

      <Tag
        k="print"
        x={460}
        y={204}
        anchor="end"
        lines={[
          '~1 year of 3D printing',
          'repair · model · slice · tune',
          'CAD: SolidWorks · Onshape',
        ]}
      />
      <Tag
        k="arm"
        x={460}
        y={604}
        anchor="end"
        lines={['4-DOF arm · TSIG', '3D printed · servos']}
        pin={[376, 536]}
      />

      <Dot />
      <Dot name="out" />
    </svg>
  );
}
