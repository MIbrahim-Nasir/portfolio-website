'use client';

import { useRef } from 'react';
import { drawOn, lightUp, polyline, runRoute, useScrub } from '../motion';
import { BomBlock, Stamp, popIn } from '../notes';
import { Arrow, Dot, GNode, Route, cx } from '../svg';
import s from '../interface.module.css';

// Atomic Sensei, as a computation graph: three Gemini agents in the middle, lessons generated ahead of time
// on the right, and the cron-driven reminder path on Supabase on the left.
const R = polyline([
  [240, 0],
  [240, 118], // 1 roadmap
  [240, 162],
  [240, 208], // 3 lesson
  [240, 252],
  [240, 298], // 5 quiz eval
  [240, 342],
  [240, 560],
]);

export default function SenseiFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    popIn(tl, q('[data-k="stamp"]'), 0.05);
    lightUp(tl, q('[data-k="road"]'), R.at(1) - 0.01);
    lightUp(tl, q('[data-k="lesson"]'), R.at(3) - 0.01);
    drawOn(tl, q('[data-k="async"] polyline'), R.at(3), 0.05);
    tl.fromTo(
      q('[data-k="card"]'),
      { opacity: 0 },
      { opacity: 1, duration: 0.02, stagger: 0.025 },
      R.at(3) + 0.03
    );
    lightUp(tl, q('[data-k="quiz"]'), R.at(5) - 0.01);
    tl.fromTo(
      q('[data-k="sb"]'),
      { opacity: 0.3 },
      { opacity: 1, duration: 0.03, stagger: 0.06 },
      0.2
    );
    popIn(tl, q('[data-k="bom"]'), R.at(6));
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 560"
      className={s.svg}
      role="img"
      aria-labelledby="fig-sensei-t"
    >
      <title id="fig-sensei-t">
        Atomic Sensei, a side project: a multi-agent learning platform whose
        architecture and data model I designed. Roadmap, lesson and
        quiz-evaluation agents on Gemini; lessons pre-generated asynchronously;
        cron-driven Supabase edge functions send reminders. Below, the AI tools
        I work with.
      </title>

      <text x={20} y={40} className={s.tTitle}>
        Atomic Sensei
      </text>
      <text x={20} y={62} className={s.tSub}>
        side project · learning platform
      </text>
      <Stamp
        k="stamp"
        x={370}
        y={48}
        lines={['DESIGNED BY ME', 'architecture · data model']}
      />

      <text x={256} y={104} className={s.tSub}>
        agents · Gemini
      </text>
      <text x={90} y={104} textAnchor="middle" className={s.tSub}>
        Supabase
      </text>

      <Route d={R.d} />

      <GNode data-k="road" x={240} y={140} w={150} h={44} label="roadmap" />
      <GNode data-k="lesson" x={240} y={230} w={150} h={44} label="lesson" />
      <GNode data-k="quiz" x={240} y={320} w={150} h={44} label="quiz eval" />

      {/* lessons made ahead of time */}
      <g data-k="async">
        <Arrow
          pts={[
            [316, 230],
            [350, 230],
          ]}
          className={s.dashG}
        />
      </g>
      {[2, 1, 0].map((i) => (
        <rect
          key={i}
          data-k="card"
          x={360 + i * 7}
          y={210 - i * 7}
          width={80}
          height={44}
          rx={4}
          className={cx(s.box, i === 0 && s.sigStroke)}
        />
      ))}
      <text x={400} y={236} textAnchor="middle" className={s.tNodeS}>
        lessons
      </text>
      <text x={404} y={280} textAnchor="middle" className={s.tSub}>
        pre-generated, async
      </text>

      {/* reminders */}
      <g data-k="sb">
        <GNode x={90} y={140} w={120} h={44} label="cron" />
        <circle cx={46} cy={140} r={9} className={s.ln} />
        <polyline points="46,134 46,140 50,143" className={s.ln} />
      </g>
      <g data-k="sb">
        <Arrow
          pts={[
            [90, 162],
            [90, 206],
          ]}
        />
        <GNode x={90} y={230} w={120} h={44} label="edge fn" />
      </g>
      <g data-k="sb">
        <Arrow
          pts={[
            [90, 252],
            [90, 296],
          ]}
        />
        <GNode x={90} y={320} w={120} h={44} label="reminder" />
      </g>

      <BomBlock
        k="bom"
        x={14}
        y={396}
        w={214}
        title="BOM · AI"
        rows={[
          'LangGraph · LangChain · RAG',
          'evals · LangSmith · Langfuse',
          'Gemini · Claude · OpenAI',
          'image models · embeddings',
        ]}
      />

      <Dot />
    </svg>
  );
}
