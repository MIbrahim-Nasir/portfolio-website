// Interface glyphs: the physical or logical connector at each domain boundary, as a small motion graphic.
// Drawn in a 64 x 64 box; --c1 is the upstream domain colour, --c2 the downstream one.
// --b (0..1) is the band's scroll progress: each glyph performs its conversion as the signal crosses it.
import type { ReactNode } from 'react';
import s from './interface.module.css';

const G = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 64 64" className={s.glyphSvg}>
    <rect x={1} y={1} width={62} height={62} rx={8} className={s.glyphBox} />
    {children}
  </svg>
);

/** 01 -> 02: analogue to digital. A light wave is sampled into steps. */
export const GlyphADC = () => (
  <G>
    <path
      d="M8 34 C14 14 20 14 26 34 S38 54 44 34 S52 18 56 26"
      pathLength={1}
      className={`${s.g1} ${s.gOut}`}
    />
    <polyline
      points="8,34 14,34 14,22 20,22 20,26 26,26 26,34 32,34 32,46 38,46 38,42 44,42 44,34 50,34 50,24 56,24"
      pathLength={1}
      className={`${s.g2} ${s.gIn}`}
    />
    <text x={32} y={60} textAnchor="middle" className={s.gtS}>
      ADC
    </text>
  </G>
);

/** 02 -> 03: structured output. The braces close around one word. */
export const GlyphJSON = () => (
  <G>
    <text x={32} y={39} textAnchor="middle" className={s.gtWord}>
      grab
    </text>
    <text
      x={14}
      y={42}
      textAnchor="middle"
      className={`${s.gtBig} ${s.gt1} ${s.braceL}`}
    >
      {'{'}
    </text>
    <text
      x={50}
      y={42}
      textAnchor="middle"
      className={`${s.gtBig} ${s.gt2} ${s.braceR}`}
    >
      {'}'}
    </text>
  </G>
);

/** 03 -> 04: UART crossover, TX of one side to RX of the other, bits streaming across. */
export const GlyphUART = () => (
  <G>
    <line x1={14} y1={22} x2={50} y2={42} className={s.g1} />
    <line x1={14} y1={42} x2={50} y2={22} className={s.g2} />
    <line x1={14} y1={22} x2={50} y2={42} className={`${s.g2w} ${s.gStream}`} />
    <text x={12} y={17} className={s.gtS}>
      TX
    </text>
    <text x={52} y={17} textAnchor="end" className={s.gtS}>
      RX
    </text>
    <text x={12} y={55} className={s.gtS}>
      RX
    </text>
    <text x={52} y={55} textAnchor="end" className={s.gtS}>
      TX
    </text>
  </G>
);

/** 04 -> 05: a GPIO pin leaving an IC body, a pulse travelling out along it. */
export const GlyphPin = () => (
  <G>
    <rect x={8} y={16} width={24} height={32} rx={2} className={s.gl} />
    <circle cx={14} cy={22} r={2} className={s.glFill} />
    <line x1={32} y1={32} x2={58} y2={32} className={s.glFaint} />
    <polyline
      points="32,40 38,40 38,30 44,30 44,40 58,40"
      pathLength={1}
      className={`${s.g2} ${s.gIn}`}
    />
    <text x={20} y={36} textAnchor="middle" className={s.gtS}>
      IC
    </text>
  </G>
);

/** 05 -> 06: a motor and its shaft. The rotor turns with the scroll. */
export const GlyphMotor = () => (
  <G>
    <circle cx={26} cy={32} r={14} className={s.g1} />
    <g className={s.rotor}>
      <line x1={26} y1={32} x2={26} y2={21} className={s.g2} />
      <line x1={26} y1={32} x2={35.5} y2={37.5} className={s.g2} />
      <line x1={26} y1={32} x2={16.5} y2={37.5} className={s.g2} />
    </g>
    <circle cx={26} cy={32} r={2.4} className={s.glFill} />
    <line x1={40} y1={32} x2={58} y2={32} className={s.g2w} />
  </G>
);

/** 06 -> 07: feedback, the loop closes. */
export const GlyphLoop = () => (
  <G>
    <g className={s.spin}>
      <path d="M44 22 A14 14 0 1 0 46 38" className={s.g1} />
      <polygon points="46,14 48,26 38,22" className={s.g1Fill} />
    </g>
    <circle cx={32} cy={32} r={3} className={s.g2Fill} />
  </G>
);

/** 07 -> 08: summing junction, setpoint in. */
export const GlyphSum = () => (
  <G>
    <circle cx={32} cy={32} r={13} className={`${s.gl} ${s.sumPulse}`} />
    <line x1={23} y1={23} x2={41} y2={41} className={s.gl} />
    <line x1={41} y1={23} x2={23} y2={41} className={s.gl} />
    <line x1={4} y1={32} x2={19} y2={32} className={s.g2} />
    <line x1={32} y1={4} x2={32} y2={19} className={s.g1} />
    <text x={13} y={27} className={s.gtS}>
      +
    </text>
    <text x={36} y={15} className={s.gtS}>
      −
    </text>
  </G>
);
