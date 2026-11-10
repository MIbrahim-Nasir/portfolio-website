'use client';

import { useRef } from 'react';
import { profile } from '@/data/profile';
import { DOMAINS } from '../domains';
import { polyline, runRoute, useScrub } from '../motion';
import { HitLink } from '../notes';
import { Dot, Head, Route, cx } from '../svg';
import { vars } from '../ui';
import s from '../interface.module.css';

// Summing junction, then the error signal goes out through J1, a six-pin header: one pin per way to reach me.
const J = { x: 240, y: 92, r: 24 };
const PIN0 = 236;
const PITCH = 62;
const py = (i: number) => PIN0 + i * PITCH;
const BODY = { x: 40, w: 50 };

const Y_IN = polyline([
  [240, 0],
  [240, J.y - J.r],
]);
const R_IN = polyline([
  [20, J.y],
  [J.x - J.r, J.y],
]);
const E_OUT = polyline([
  [J.x, J.y + J.r],
  [J.x, 160],
  [65, 160],
  [65, py(5) + 34],
  [240, py(5) + 34],
  [240, 640],
]);

type Pin = {
  name: string;
  value: string;
  href?: string;
  label: string;
  external?: boolean;
};
const PINS: Pin[] = [
  {
    name: 'EMAIL',
    value: profile.email,
    href: `mailto:${profile.email}`,
    label: `Email ${profile.email}`,
  },
  {
    name: 'PHONE',
    value: profile.phone,
    href: `tel:${profile.phone.replace(/\s/g, '')}`,
    label: `Call ${profile.phone}`,
  },
  {
    name: 'LINKEDIN',
    value: 'in/mohammed-ibrahim-nasir',
    href: profile.linkedin,
    label: 'LinkedIn profile',
    external: true,
  },
  {
    name: 'GITHUB',
    value: 'MIbrahim-Nasir',
    href: profile.github,
    label: 'GitHub profile',
    external: true,
  },
  {
    name: 'RÉSUMÉ',
    value: 'resume.pdf',
    href: profile.resumeUrl,
    label: 'Résumé, PDF',
  },
  { name: 'GND · ref', value: profile.location, label: 'Based in Dubai, UAE' },
];

export default function ContactFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'y', 0, 0.14);
    runRoute(tl, svg, 'r', 0.06, 0.1);
    runRoute(tl, svg, 'e', 0.16, 0.8);
    // light each pin as the error signal passes it on its way down the header
    const a = E_OUT.at(2);
    const b = E_OUT.at(3);
    q('[data-k="pin"]').forEach((p, i) => {
      const f = a + ((b - a) * (py(i) - 160)) / (py(5) + 34 - 160);
      tl.fromTo(
        p,
        { opacity: 0.3 },
        { opacity: 1, duration: 0.03 },
        0.16 + 0.8 * f - 0.01
      );
    });
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 640"
      className={s.svg}
      aria-labelledby="fig-contact-t"
      role="group"
    >
      <title id="fig-contact-t">
        Summing junction: your message r of t enters with a plus sign,
        everything above, y of t, with a minus sign. The error e of t runs into
        J1, a six-pin header with one pin per contact: email, phone, LinkedIn,
        GitHub, résumé, and the ground reference, Dubai.
      </title>

      <Route d={Y_IN.d} name="y" />
      <Route d={R_IN.d} name="r" />
      <Route d={E_OUT.d} name="e" />
      <Head from={[200, J.y]} to={[J.x - J.r, J.y]} />

      <text x={252} y={34} className={s.tLab}>
        y(t)
      </text>
      <text x={252} y={52} className={s.tSub}>
        everything above
      </text>
      <text x={20} y={78} className={s.tLab}>
        r(t)
      </text>
      <text x={20} y={116} className={s.tSub}>
        your message
      </text>
      <text x={278} y={98} className={s.tEq}>
        e(t) = r(t) − y(t)
      </text>
      <text x={278} y={120} className={s.tSub}>
        the loop runs on the error
      </text>

      <g>
        <circle cx={J.x} cy={J.y} r={J.r} className={s.box} />
        <line
          x1={J.x - 17}
          y1={J.y - 17}
          x2={J.x + 17}
          y2={J.y + 17}
          className={s.ln}
        />
        <line
          x1={J.x + 17}
          y1={J.y - 17}
          x2={J.x - 17}
          y2={J.y + 17}
          className={s.ln}
        />
        <text x={J.x - 40} y={J.y - 8} className={s.tLab}>
          +
        </text>
        <text x={J.x + 8} y={J.y - 30} className={s.tLab}>
          −
        </text>
      </g>

      {/* J1: connector body */}
      <rect
        x={BODY.x}
        y={py(0) - 34}
        width={BODY.w}
        height={PITCH * 6 + 6}
        rx={4}
        className={cx(s.box, s.faintBox)}
      />
      <text
        x={BODY.x + BODY.w / 2}
        y={py(0) - 44}
        textAnchor="middle"
        className={s.tLab}
      >
        J1
      </text>

      {PINS.map((p, i) => {
        const y = py(i);
        const d = DOMAINS[i + 1];
        const inner = (
          <g data-k="pin" style={vars({ '--c': d.color })}>
            <rect
              x={BODY.x + 13}
              y={y - 12}
              width={24}
              height={24}
              rx={2}
              className={s.pinPad}
            />
            <text
              x={BODY.x + 25}
              y={y + 5}
              textAnchor="middle"
              className={s.pinNum}
            >
              {i + 1}
            </text>
            <line
              x1={BODY.x + BODY.w}
              y1={y}
              x2={118}
              y2={y}
              className={cx(s.ln, s.sigStroke)}
            />
            <text x={128} y={y - 8} className={s.pinName}>
              {p.name}
            </text>
            <text
              x={128}
              y={y + 15}
              className={p.href ? s.pinVal : s.pinValQuiet}
            >
              {p.value}
              {p.external ? ' ↗' : ''}
            </text>
          </g>
        );
        return p.href ? (
          <HitLink
            key={p.name}
            href={p.href}
            x={100}
            y={y - 29}
            w={372}
            h={58}
            label={p.label}
            external={p.external}
          >
            {inner}
          </HitLink>
        ) : (
          <g key={p.name}>{inner}</g>
        );
      })}

      <Dot name="y" />
      <Dot name="r" />
      <Dot name="e" />
    </svg>
  );
}
