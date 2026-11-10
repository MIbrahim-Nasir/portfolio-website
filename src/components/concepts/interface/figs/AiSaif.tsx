'use client';

import { useRef } from 'react';
import { drawOn, lightUp, polyline, runRoute, useScrub } from '../motion';
import { Metric, Tag, popIn } from '../notes';
import { Arrow, Dot, GNode, Route, cx } from '../svg';
import s from '../interface.module.css';

// One pass through the SAIF graph, including one trip round the evaluate -> regenerate loop.
const R = polyline([
  [240, 0],
  [240, 146], // 1 photo
  [240, 194],
  [240, 246], // 3 planner
  [240, 294],
  [240, 346], // 5 render
  [240, 394],
  [240, 432], // 7 evaluate (1st)
  [240, 470],
  [168, 470], // 9 fail
  [92, 470],
  [92, 370],
  [160, 370], // 12 back into render
  [240, 370],
  [240, 394],
  [240, 432], // 15 evaluate (2nd)
  [240, 508], // 16 pass
  [240, 586], // 17 reply
  [240, 634],
  [240, 800],
]);

const DB = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => {
  const rx = w / 2;
  const ry = 8;
  return (
    <g>
      <path
        d={`M${x - rx} ${y - h / 2 + ry} v${h - 2 * ry} a${rx} ${ry} 0 0 0 ${w} 0 v${-(h - 2 * ry)}`}
        className={s.box}
      />
      <ellipse cx={x} cy={y - h / 2 + ry} rx={rx} ry={ry} className={s.box} />
    </g>
  );
};

export default function AiSaifFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    popIn(tl, q('[data-k="57"]'), 0.04);
    lightUp(tl, q('[data-k="photo"]'), R.at(1) - 0.01);
    lightUp(tl, q('[data-k="planner"]'), R.at(3) - 0.01);
    drawOn(tl, q('[data-k="rag"] polyline'), R.at(3), 0.05);
    lightUp(tl, q('[data-k="cat"]'), R.at(3) + 0.03);
    popIn(tl, q('[data-k="real"]'), R.at(3) + 0.03);
    lightUp(tl, q('[data-k="render"]'), R.at(5) - 0.01);
    lightUp(tl, q('[data-k="eval"]'), R.at(7) - 0.01);
    tl.fromTo(
      q('[data-k="fail"]'),
      { opacity: 0 },
      { opacity: 1, duration: 0.03 },
      R.at(8)
    );
    tl.to(q('[data-k="fail"]'), { opacity: 0.35, duration: 0.03 }, R.at(13));
    drawOn(tl, q('[data-k="loop"] polyline'), R.at(8), R.at(12) - R.at(8));
    tl.fromTo(
      q('[data-k="pass"]'),
      { opacity: 0 },
      { opacity: 1, duration: 0.03 },
      R.at(15)
    );
    popIn(tl, q('[data-k="check"]'), R.at(15));
    drawOn(tl, q('[data-k="boq-e"] polyline'), R.at(15) - 0.04, 0.08);
    lightUp(tl, q('[data-k="boq"]'), R.at(15) - 0.02);
    lightUp(tl, q('[data-k="reply"]'), R.at(17) - 0.01);
    popIn(tl, q('[data-k="users"]'), R.at(17) + 0.01);
    popIn(tl, q('[data-k="time"]'), R.at(18) + 0.02);
    popIn(tl, q('[data-k="cog"]'), R.at(18) + 0.06);
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 800"
      className={s.svg}
      role="img"
      aria-labelledby="fig-saif-t"
    >
      <title id="fig-saif-t">
        SAIF AI Designer, Ducon Industries R&amp;D, August 2025 to now. A
        LangGraph agent graph: a client photo from WhatsApp, a planner agent
        grounded in the real catalogue through RAG on pgvector, a render, an
        evaluate step that loops back to regenerate on failure, a bill of
        quantities from real products, and the reply. 57 client designs in the
        first 4 weeks before the marketing launch; generation cut from over 20
        minutes to 5 to 7; 35 percent less designer time per session; 40
        internal users whose feedback became features.
      </title>

      {/* title block */}
      <text x={20} y={40} className={s.tTitle}>
        SAIF AI Designer
      </text>
      <text x={20} y={62} className={s.tLab}>
        Ducon Industries · R&amp;D · Dubai
      </text>
      <text x={20} y={80} className={s.tSub}>
        Aug 2025 – now · live on WhatsApp
      </text>
      <Metric
        k="57"
        x={460}
        y={48}
        value="57"
        anchor="end"
        label={['designs in 4 weeks', 'no marketing yet']}
      />

      {/* graph boundary */}
      <rect
        x={14}
        y={104}
        width={452}
        height={612}
        rx={12}
        className={cx(s.ln, s.dash, s.faintLn)}
      />
      <text x={28} y={126} className={s.tSub}>
        LangGraph · Python / FastAPI
      </text>
      <text x={452} y={126} textAnchor="end" className={s.tSub}>
        traced: LangSmith · Langfuse
      </text>

      <Route d={R.d} />

      <g data-k="rag">
        <Arrow
          pts={[
            [322, 270],
            [354, 270],
          ]}
          both
        />
      </g>
      <text x={338} y={258} textAnchor="middle" className={s.tSub}>
        RAG
      </text>

      <g data-k="loop">
        <Arrow
          pts={[
            [168, 470],
            [92, 470],
            [92, 370],
            [158, 370],
          ]}
          className={s.sigG}
        />
      </g>
      <text
        x={80}
        y={420}
        textAnchor="middle"
        transform="rotate(-90 80 420)"
        className={s.tSub}
      >
        regenerate
      </text>
      <text
        x={150}
        y={462}
        textAnchor="end"
        className={cx(s.tSub, s.tSig)}
        data-k="fail"
        style={{ opacity: 0 }}
      >
        fail
      </text>
      <text
        x={252}
        y={540}
        className={cx(s.tSub, s.tSig)}
        data-k="pass"
        style={{ opacity: 0 }}
      >
        pass
      </text>

      <g data-k="boq-e">
        <Arrow
          pts={[
            [400, 302],
            [400, 444],
          ]}
        />
        <Arrow
          pts={[
            [400, 496],
            [400, 610],
            [332, 610],
          ]}
        />
      </g>
      <text x={408} y={370} className={s.tSub}>
        real
      </text>
      <text x={408} y={386} className={s.tSub}>
        products
      </text>

      <GNode
        data-k="photo"
        x={240}
        y={170}
        w={170}
        h={48}
        label="Client photo"
        sub="WhatsApp"
      />
      <GNode
        data-k="planner"
        x={240}
        y={270}
        w={150}
        h={48}
        label="Planner agent"
        sub="grounds the design"
      />
      <g data-k="cat">
        <DB x={400} y={270} w={88} h={62} />
        <text x={400} y={282} textAnchor="middle" className={s.tNodeS}>
          catalogue
        </text>
        <text x={400} y={296} textAnchor="middle" className={s.tSub}>
          pgvector
        </text>
      </g>
      <GNode
        data-k="render"
        x={240}
        y={370}
        w={150}
        h={48}
        label="Render"
        sub="image model"
      />
      <g data-k="eval">
        <polygon points="240,432 312,470 240,508 168,470" className={s.box} />
        <text x={240} y={468} textAnchor="middle" className={s.tNodeS}>
          Evaluate
        </text>
        <text x={240} y={484} textAnchor="middle" className={s.tSub}>
          code + LLM
        </text>
      </g>
      <GNode
        data-k="boq"
        x={400}
        y={470}
        w={96}
        h={48}
        label="BOQ"
        sub="quantities"
      />
      <GNode
        data-k="reply"
        x={240}
        y={610}
        w={180}
        h={48}
        label="Reply"
        sub="render + BOQ"
      />

      <Tag
        k="real"
        x={22}
        y={196}
        lines={['Only products', 'Ducon sells']}
        pin={[166, 262]}
      />
      <Tag
        k="check"
        x={22}
        y={560}
        lines={['Code + LLM checks', 'retry on failure']}
        pin={[206, 490]}
      />
      <Tag
        k="users"
        x={458}
        y={680}
        anchor="end"
        lines={[
          '40 internal users',
          'their asks became',
          'edit-generations,',
          'multi-step, night view',
        ]}
        pin={[322, 622]}
      />

      {/* what changed, measured */}
      <Metric
        k="time"
        x={20}
        y={748}
        value="5–7 min"
        size={30}
        label={['per design, was 20+', 'parallel nodes · Gemini Flash']}
      />
      <Metric
        k="cog"
        x={460}
        y={748}
        value="−35%"
        size={30}
        anchor="end"
        label={['designer time', 'per client session']}
      />

      <Dot />
    </svg>
  );
}
