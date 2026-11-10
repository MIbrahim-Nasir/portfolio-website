import { profile } from '@/data/profile';
import { D, type DomainId } from './domains';
import { Head, cx } from './svg';
import { vars } from './ui';
import s from './interface.module.css';

// Closed loop of the vision arm, as a block diagram. 01 sits bottom centre so the page's line leaves from it.
const BLOCKS: { id: DomainId; title: string; x: number; y: number }[] = [
  { id: 'optics', title: 'Camera', x: 240, y: 238 },
  { id: 'ai', title: 'Gemini', x: 400, y: 238 },
  { id: 'software', title: 'Python', x: 400, y: 82 },
  { id: 'firmware', title: 'Arduino', x: 240, y: 82 },
  { id: 'electronics', title: 'Drivers', x: 80, y: 82 },
  { id: 'mechanics', title: 'Joints', x: 80, y: 238 },
];
const BW = 120;
const BH = 64;
const LOOP = 'M240 238 H400 V82 H80 V238 Z';

function LoopDiagram() {
  return (
    <svg
      viewBox="0 0 480 340"
      className={s.loopSvg}
      role="img"
      aria-labelledby="fig-loop-t"
    >
      <title id="fig-loop-t">
        Block diagram of the closed loop this page follows, my vision-guided
        robotic arm, 3rd place at a national hackathon: camera, Gemini, Python,
        Arduino, motor drivers, joints, and back to the camera. Each block is a
        different discipline.
      </title>
      <defs>
        <linearGradient
          id="loopGrad"
          gradientUnits="userSpaceOnUse"
          x1="80"
          y1="82"
          x2="400"
          y2="238"
        >
          <stop offset="0" stopColor={D.electronics.color} />
          <stop offset="0.35" stopColor={D.firmware.color} />
          <stop offset="0.65" stopColor={D.software.color} />
          <stop offset="1" stopColor={D.ai.color} />
        </linearGradient>
      </defs>
      <text x={0} y={18} className={s.tSub}>
        fig. 0 · the loop this page follows
      </text>
      <path d={LOOP} className={s.loopPath} />
      <path
        d={LOOP}
        pathLength={100}
        className={s.loopPulse}
        stroke="url(#loopGrad)"
      />
      <Head from={[300, 238]} to={[338, 238]} />
      <Head from={[400, 206]} to={[400, 116]} />
      <Head from={[340, 82]} to={[302, 82]} />
      <Head from={[180, 82]} to={[142, 82]} />
      <Head from={[80, 114]} to={[80, 204]} />
      <Head from={[140, 238]} to={[178, 238]} />

      {/* the triad, inside the loop it describes */}
      <g className={s.triad}>
        <text
          x={240}
          y={146}
          textAnchor="middle"
          style={vars({ '--c': D.optics.color })}
        >
          Camera sees.
        </text>
        <text
          x={240}
          y={170}
          textAnchor="middle"
          style={vars({ '--c': D.ai.color })}
        >
          Gemini decides.
        </text>
        <text
          x={240}
          y={194}
          textAnchor="middle"
          style={vars({ '--c': D.mechanics.color })}
        >
          Arm moves.
        </text>
      </g>

      {BLOCKS.map((b) => {
        const d = D[b.id];
        return (
          <a
            key={b.id}
            href={`#${b.id}`}
            className={s.loopLink}
            style={vars({ '--c': d.color })}
            aria-label={`${d.n} ${d.name}`}
          >
            <rect
              x={b.x - BW / 2}
              y={b.y - BH / 2}
              width={BW}
              height={BH}
              rx={6}
              className={s.box}
            />
            <rect
              x={b.x - BW / 2}
              y={b.y - BH / 2}
              width={8}
              height={BH}
              rx={2}
              className={s.bandFill}
            />
            <text x={b.x - BW / 2 + 18} y={b.y - 4} className={s.tLoopT}>
              {b.title}
            </text>
            <text x={b.x - BW / 2 + 18} y={b.y + 16} className={s.tLoopS}>
              {d.n} {d.name.toLowerCase()}
            </text>
          </a>
        );
      })}

      {/* project tag, tied to the loop */}
      <g className={s.heroTag}>
        <line x1={318} y1={270} x2={318} y2={292} />
        <circle cx={318} cy={270} r={2.6} />
        <rect x={262} y={292} width={218} height={44} rx={3.5} />
        <circle cx={272} cy={314} r={2.4} className={s.tagHole} />
        <text x={282} y={310} className={s.tagMain}>
          AI-Driven Robotics
        </text>
        <text x={282} y={328} className={s.tagSub}>
          3rd place · national hackathon
        </text>
      </g>
      <line
        x1={240}
        y1={270}
        x2={240}
        y2={340}
        className={cx(s.ln, s.sigLead)}
        style={vars({ '--c': D.optics.color })}
      />
    </svg>
  );
}

const W = ({ id, children }: { id: DomainId; children: string }) => (
  <a href={`#${id}`} className={s.word} style={vars({ '--c': D[id].color })}>
    {children}
  </a>
);

export default function Hero() {
  return (
    <section
      id="top"
      className={s.hero}
      data-domain="identity"
      aria-labelledby="hero-h"
    >
      <div className={s.heroName}>
        <p className={s.kicker}>
          <i className={cx(s.swatch, s.swatchBlack)} aria-hidden />
          <span className={s.kickerNum}>00 · Identity</span>
          <span className={s.conv}>block diagram</span>
        </p>
        <h1 id="hero-h" className={s.h1}>
          <span>Mohammed</span> <span>Ibrahim Nasir</span>
        </h1>
        <p className={s.role}>
          <span className={s.pill}>
            <i aria-hidden /> {profile.role}
          </span>
          <span className={s.roleAt}>
            R&amp;D · Ducon Industries · {profile.location}
          </span>
        </p>
      </div>
      <div className={s.heroText}>
        <p className={s.thesis}>
          <W id="mechanics">Mechanics.</W> <W id="electronics">Electronics.</W>{' '}
          <W id="software">Code.</W> <W id="ai">AI.</W>
        </p>
        <p className={s.heroLine}>
          I studied computer science, then kept going: motors, sensors,
          firmware.
        </p>
        <div className={s.ctas}>
          <a href="#optics" className={s.btn}>
            Follow one signal <span aria-hidden>↓</span>
          </a>
          <a href={profile.resumeUrl} className={s.btnGhost}>
            Résumé (PDF)
          </a>
        </div>
      </div>
      <div className={s.heroFig}>
        <LoopDiagram />
        <div className={s.heroLead} style={vars({ '--c': D.optics.color })}>
          <span data-wire data-ride className={s.wireC} />
        </div>
        <span
          className={cx(s.elbow, s.elbowOut, s.elbowStatic)}
          style={vars({ '--c': D.optics.color })}
        />
      </div>
    </section>
  );
}
