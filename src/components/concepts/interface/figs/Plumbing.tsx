'use client';

import { useRef } from 'react';
import { lightUp, polyline, runRoute, useScrub } from '../motion';
import { BomBlock, Tag, popIn } from '../notes';
import { Dot, GNode, Route, cx } from '../svg';
import s from '../interface.module.css';

// Two pieces of plumbing on one line: the Ducon data pipeline (now), and the DeltaX backends (where it started).
const R = polyline([
  [240, 0],
  [240, 86], // 1 files
  [240, 134],
  [240, 160], // 3 extract
  [240, 200],
  [240, 220], // 5 embed
  [240, 260],
  [240, 282], // 7 chroma
  [240, 338],
  [240, 360], // 9 search
  [240, 400],
  [240, 555], // 11 controller
  [240, 705], // 12 sql
  [240, 860],
]);

const LAYERS = ['Controller', 'Service', 'Repository', 'SQL Server'];
const LY = (i: number) => 570 + i * 40;

export default function PlumbingFig() {
  const ref = useRef<SVGSVGElement>(null);
  useScrub(ref, (tl, q, svg) => {
    runRoute(tl, svg, 'main', 0, 1);
    [1, 3, 5, 7, 9].forEach((v, i) =>
      lightUp(tl, q(`[data-k="p${i}"]`), R.at(v) - 0.01)
    );
    popIn(tl, q('[data-k="hours"]'), R.at(3) + 0.01);
    popIn(tl, q('[data-k="imgs"]'), R.at(7) + 0.01);
    popIn(tl, q('[data-k="deploy"]'), R.at(10));
    popIn(tl, q('[data-k="dx"]'), R.at(10) + 0.04);
    const ls = q('[data-k="layer"]');
    ls.forEach((el, i) =>
      lightUp(
        tl,
        el,
        R.at(11) + ((R.at(12) - R.at(11)) * i) / ls.length - 0.01,
        0.3
      )
    );
    popIn(tl, q('[data-k="rest"]'), R.at(11) + 0.01);
    popIn(tl, q('[data-k="rec"]'), R.at(11) + 0.04);
    popIn(tl, q('[data-k="bom"]'), R.at(12) + 0.02);
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 860"
      className={s.svg}
      role="img"
      aria-labelledby="fig-plumb-t"
    >
      <title id="fig-plumb-t">
        Ducon data and infrastructure: project images and documents are
        extracted, structured, embedded into ChromaDB and served by a FastAPI
        semantic search over thousands of images; automation scripts saved over
        100 manual hours; I own deployment on Railway, a VPS, Cloudflare R2 and
        the databases. Before that, DeltaX in Hyderabad, January to July 2025:
        two C# ASP.NET Core backends on SQL Server, an IMDB-style catalogue and
        BookSwap, a book marketplace, with 20+ REST endpoints in Controller,
        Service and Repository layers and a history-based recommendation engine.
      </title>

      {/* Ducon */}
      <text x={20} y={40} className={s.tTitle}>
        Ducon
      </text>
      <text x={20} y={60} className={s.tSub}>
        data + infra · Aug 2025 – now
      </text>

      <Route d={R.d} />

      <GNode
        data-k="p0"
        x={240}
        y={110}
        w={170}
        h={48}
        label="project files"
        sub="images · documents"
      />
      <GNode
        data-k="p1"
        x={240}
        y={180}
        w={150}
        h={40}
        label="extract · structure"
      />
      <GNode data-k="p2" x={240} y={240} w={150} h={40} label="embed" />
      <g data-k="p3">
        <path d="M185 290 v40 a55 8 0 0 0 110 0 v-40" className={s.box} />
        <ellipse cx={240} cy={290} rx={55} ry={8} className={s.box} />
        <text x={240} y={322} textAnchor="middle" className={s.tNodeS}>
          ChromaDB
        </text>
      </g>
      <GNode
        data-k="p4"
        x={240}
        y={380}
        w={170}
        h={40}
        label="FastAPI · /search"
      />

      <Tag
        k="hours"
        x={458}
        y={152}
        anchor="end"
        lines={['scripts saved', '100+ manual hours']}
        pin={[316, 180]}
      />
      <Tag
        k="imgs"
        x={22}
        y={312}
        lines={['semantic search', 'thousands of images']}
        pin={[184, 312]}
      />
      <Tag
        k="deploy"
        x={458}
        y={446}
        anchor="end"
        lines={['I own deployment', 'Railway · VPS · R2', 'and the databases']}
        pin={[300, 401]}
      />

      {/* DeltaX */}
      <line
        x1={14}
        y1={488}
        x2={466}
        y2={488}
        className={cx(s.ln, s.dash, s.faintLn)}
      />
      <text x={20} y={516} className={s.tTitle}>
        DeltaX
      </text>
      <text x={20} y={536} className={s.tSub}>
        Hyderabad · intern · Jan – Jul 2025
      </text>
      <Tag
        k="dx"
        x={20}
        y={600}
        lines={['two backends', 'IMDB-style catalogue', 'BookSwap market']}
        hole={false}
        quiet
      />

      {LAYERS.map((l, i) => (
        <g key={l} data-k="layer">
          <rect
            x={170}
            y={LY(i) - 15}
            width={140}
            height={30}
            rx={3}
            className={cx(s.box, i === 3 && s.dbBox)}
          />
          <text x={240} y={LY(i) + 5} textAnchor="middle" className={s.tNodeS}>
            {l}
          </text>
        </g>
      ))}
      <text x={322} y={695} className={s.tSub}>
        C# · ASP.NET Core
      </text>
      <Tag
        k="rest"
        x={458}
        y={560}
        anchor="end"
        lines={['20+ REST', 'endpoints']}
        pin={[311, 570]}
      />
      <Tag
        k="rec"
        x={458}
        y={640}
        anchor="end"
        lines={['recommendations', 'from history']}
        pin={[311, 610]}
      />

      <BomBlock
        k="bom"
        x={14}
        y={748}
        w={214}
        title="BOM · software"
        rows={[
          'Python · FastAPI · REST',
          'PostgreSQL / pgvector',
          'Supabase · Docker · Git',
        ]}
      />

      <Dot />
    </svg>
  );
}
