'use client';

import Link from 'next/link';
import { profile } from '@/data/profile';
import { Arrowhead, Dim, pathOf, type Pt } from './primitives';
import { useEgg } from './egg';
import { Sheet, Stamp } from './Sheet';
import { Tag, View, type Note } from './View';
import s from './blueprint.module.css';

/* Sheet 07 · site plan (equirectangular, true at 21°N), the club, and the
   issue block: contact details as title-block fields. */

const LON0 = 44;
const LON1 = 88;
const LAT0 = 13;
const LAT1 = 28;
const M = 60;
const K = 29.46;
const COS = Math.cos((21 * Math.PI) / 180);
const P = (lon: number, lat: number): Pt => [
  M + (lon - LON0) * K * COS,
  M + (LAT1 - lat) * K,
];
const MW = Math.round(M * 2 + (LON1 - LON0) * K * COS);
const MH = Math.round(M * 2 + (LAT1 - LAT0) * K);
const KM_PER_UNIT = 111.2 / K;

const DXB = { lat: 25.2, lon: 55.27 };
const HYD = { lat: 17.39, lon: 78.49 };
const D = P(DXB.lon, DXB.lat);
const Hy = P(HYD.lon, HYD.lat);

function quad(a: Pt, b: Pt, bulge: number) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const c: Pt = [mx + (dy / len) * bulge, my - (dx / len) * bulge];
  const at = (t: number): Pt => [
    (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
  ];
  return { d: `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`, at };
}

const MAP_NOTES: Note[] = [
  {
    id: 'st1',
    at: [D[0] - 34, D[1] - 50],
    k: 'Stn 1 · Dubai',
    v: 'School to 10th. New Indian Model School, CBSE: 92%.',
  },
  {
    id: 'st2',
    at: [Hy[0] + 34, Hy[1] - 50],
    k: 'Stn 2 · Hyderabad',
    v: '11th–12th: 94%. B.E. Computer Science, MJCET, Osmania University, 2025, GPA 8.27. TSIG. DeltaX.',
  },
  {
    id: 'st3',
    at: [D[0] + 34, D[1] + 50],
    k: 'Stn 3 · Dubai, again',
    v: 'Aug 2025 – now. AI Developer, R&D team, Ducon Industries.',
  },
];

function Benchmark({ p }: { p: Pt }) {
  const [x, y] = p;
  return (
    <g>
      <circle className={s.ln} cx={x} cy={y} r={16} />
      <circle className={s.lnThin} cx={x} cy={y} r={30} />
      <path
        className={s.ln}
        d={pathOf(
          [
            [x, y - 9],
            [x + 8, y + 5],
            [x - 8, y + 5],
          ],
          true
        )}
      />
      <circle data-fade="" className={s.fillInk} cx={x} cy={y} r={2} />
    </g>
  );
}

function SitePlan() {
  const leg1 = quad(D, Hy, 120);
  const leg2 = quad(Hy, D, 70);
  const m1 = leg1.at(0.5);
  const m1b = leg1.at(0.47);
  const m2 = leg2.at(0.5);
  const m2b = leg2.at(0.47);
  const gc = 2550; // great-circle Dubai–Hyderabad, km (haversine on the coordinates above)
  const kmUnit = 1 / KM_PER_UNIT;
  const sb = [0, 250, 500, 1000];
  const lons: number[] = [];
  for (let l = LON0; l <= LON1; l += 2) lons.push(l);
  const lats: number[] = [];
  for (let l = LAT0 + 1; l <= LAT1; l += 2) lats.push(l);
  return (
    <svg
      data-drawing=""
      viewBox={`0 0 ${MW} ${MH}`}
      role="img"
      aria-labelledby="bp-route-t"
    >
      <title id="bp-route-t">
        {`Site plan: Dubai to Hyderabad and back to Dubai, about ${gc.toLocaleString('en-US')} kilometres each way. Station 1 Dubai, school. Station 2 Hyderabad, 11th and 12th, degree, the club and DeltaX. Station 3 Dubai, Ducon.`}
      </title>
      <g data-fade="">
        {lons.map((l) => (
          <path
            key={`lo${l}`}
            className={s.lnConstruct}
            d={`M${P(l, LAT1)[0]} ${M} V${MH - M}`}
          />
        ))}
        {lats.map((l) => (
          <path
            key={`la${l}`}
            className={s.lnConstruct}
            d={`M${M} ${P(LON0, l)[1]} H${MW - M}`}
          />
        ))}
      </g>
      <rect
        className={s.lnHeavy}
        x={M}
        y={M}
        width={MW - 2 * M}
        height={MH - 2 * M}
      />
      {lons
        .filter((l) => (l - LON0) % 4 === 0)
        .map((l) => (
          <text
            key={`tl${l}`}
            className={s.txS}
            x={P(l, LAT0)[0]}
            y={MH - M + 24}
            textAnchor="middle"
          >
            {l}°E
          </text>
        ))}
      {lats
        .filter((l) => (l - LAT0 - 1) % 4 === 0)
        .map((l) => (
          <text
            key={`tt${l}`}
            className={s.txS}
            x={M - 8}
            y={P(LON0, l)[1] + 5}
            textAnchor="end"
          >
            {l}°N
          </text>
        ))}
      <text
        className={s.txSea}
        x={P(64.5, 15.6)[0]}
        y={P(64.5, 15.6)[1]}
        textAnchor="middle"
      >
        ARABIAN SEA
      </text>

      <path className={s.ln} d={leg1.d} />
      <Arrowhead at={m1} from={m1b} size={13} />
      <path className={s.lnHeavy} d={leg2.d} />
      <Arrowhead at={m2} from={m2b} size={14} />
      <text className={s.txS} x={m1[0]} y={m1[1] - 16} textAnchor="middle">
        LEG 1 · OUT
      </text>
      <text className={s.txS} x={m2[0]} y={m2[1] + 28} textAnchor="middle">
        LEG 2 · BACK
      </text>
      <Dim
        a={D}
        b={Hy}
        offset={96}
        label={`≈ ${gc.toLocaleString('en-US')} KM`}
        textSide={1}
      />

      <Benchmark p={D} />
      <Benchmark p={Hy} />
      <text className={s.txWord} x={D[0] - 44} y={D[1] + 2} textAnchor="end">
        Dubai
      </text>
      <text className={s.txS} x={D[0] - 44} y={D[1] + 26} textAnchor="end">
        25.20°N 55.27°E
      </text>
      <text className={s.txWord} x={Hy[0] + 44} y={Hy[1] + 2}>
        Hyderabad
      </text>
      <text className={s.txS} x={Hy[0] + 44} y={Hy[1] + 26}>
        17.39°N 78.49°E
      </text>
      {/* station callouts */}
      <text className={s.txS} x={D[0] - 60} y={D[1] - 46} textAnchor="end">
        STN 1 · SCHOOL · CBSE 92%
      </text>
      <text className={s.txS} x={Hy[0] + 60} y={Hy[1] - 56}>
        STN 2 · 94% · B.E. CSE ’25
      </text>
      <text className={s.txS} x={Hy[0] + 60} y={Hy[1] - 34}>
        GPA 8.27 · TSIG · DELTAX
      </text>
      <text className={s.txS} x={D[0] - 44} y={D[1] + 52} textAnchor="end">
        STN 3 · DUCON · AUG 2025 –
      </text>
      <Tag
        id="st1"
        n={1}
        at={MAP_NOTES[0].at}
        from={[D[0] - 10, D[1] - 12]}
        label="Dubai, school"
      />
      <Tag
        id="st2"
        n={2}
        at={MAP_NOTES[1].at}
        from={[Hy[0] + 10, Hy[1] - 12]}
        label="Hyderabad"
      />
      <Tag
        id="st3"
        n={3}
        at={MAP_NOTES[2].at}
        from={[D[0] + 10, D[1] + 12]}
        label="Dubai, Ducon"
      />

      <g>
        <circle className={s.lnThin} cx={MW - M - 50} cy={M + 62} r={30} />
        <path
          className={s.ln}
          d={pathOf(
            [
              [MW - M - 50, M + 24],
              [MW - M - 40, M + 78],
              [MW - M - 50, M + 68],
              [MW - M - 60, M + 78],
            ],
            true
          )}
        />
        <path
          data-fade=""
          className={s.fillInk}
          d={pathOf(
            [
              [MW - M - 50, M + 24],
              [MW - M - 50, M + 68],
              [MW - M - 60, M + 78],
            ],
            true
          )}
        />
        <text className={s.txL} x={MW - M - 50} y={M + 18} textAnchor="middle">
          N
        </text>
      </g>
      <g>
        {sb.slice(0, -1).map((km, i) => (
          <rect
            key={km}
            className={s.ln}
            x={M + 24 + km * kmUnit}
            y={MH - M - 36}
            width={(sb[i + 1] - km) * kmUnit}
            height={8}
            style={i % 2 ? undefined : { fill: 'var(--ink-3)' }}
          />
        ))}
        {sb.map((km) => (
          <text
            key={km}
            className={s.txS}
            x={M + 24 + km * kmUnit}
            y={MH - M - 46}
            textAnchor="middle"
          >
            {km}
          </text>
        ))}
        <text className={s.txS} x={M + 24 + 1000 * kmUnit + 14} y={MH - M - 28}>
          KM
        </text>
      </g>
    </svg>
  );
}

function Hours() {
  const X = (h: number) => 30 + (h - 15) * 62;
  return (
    <svg
      data-drawing=""
      viewBox="0 0 560 200"
      role="img"
      aria-labelledby="bp-hours-t"
    >
      <title id="bp-hours-t">
        Classes ended at 16:00. The club worked until 21:00 or 22:00.
      </title>
      <path className={s.ln} d={`M${X(15)} 140 H${X(23)}`} />
      {Array.from({ length: 9 }, (_, i) => 15 + i).map((h) => (
        <g key={h}>
          <path className={s.ln} d={`M${X(h)} 140 v10`} />
          <text className={s.txS} x={X(h)} y={174} textAnchor="middle">
            {h}
          </text>
        </g>
      ))}
      <rect
        data-fade=""
        x={X(16)}
        y={124}
        width={X(22) - X(16)}
        height={10}
        style={{ fill: 'var(--ink-4)' }}
      />
      <path className={s.lnDim} d={`M${X(16)} 50 V134 M${X(21)} 50 V134`} />
      <path className={s.lnDim} d={`M${X(16)} 72 H${X(21)}`} />
      <Arrowhead at={[X(16), 72]} from={[X(21), 72]} size={10} />
      <Arrowhead at={[X(21), 72]} from={[X(16), 72]} size={10} />
      <text
        className={s.txV}
        x={(X(16) + X(21)) / 2}
        y={62}
        textAnchor="middle"
      >
        5 H
      </text>
      <g data-fade="">
        <path
          className={s.lnHidden}
          d={`M${X(21)} 72 H${X(22)} M${X(22)} 60 V134`}
        />
      </g>
      <text className={s.txRev} x={X(21.5)} y={52} textAnchor="middle">
        +1 H
      </text>
      <text className={s.txS} x={X(16) - 4} y={34}>
        CLASSES END
      </text>
      <text className={s.txS} x={X(23)} y={194} textAnchor="end">
        HRS
      </text>
    </svg>
  );
}

const CLUB_NOTES: Note[] = [
  {
    id: 'lead',
    at: [500, 312],
    k: 'TSIG · MJCET · 2022–25',
    v: 'Joined in robotics, 2nd year. Left as Vice Chair & Technical Lead. Project completion rate up 25%.',
  },
  {
    id: 'teach',
    at: [380, 249],
    k: 'Front of the room',
    v: 'Ran a month-long front-end virtual internship and an electronics workshop. Mentored juniors on placements.',
  },
];

function Club() {
  const benches = Array.from({ length: 10 }, (_, i) => ({
    x: 46 + (i % 5) * 98,
    y: 70 + Math.floor(i / 5) * 84,
  }));
  return (
    <svg
      data-drawing=""
      viewBox="0 0 560 340"
      role="img"
      aria-labelledby="bp-club-t"
    >
      <title id="bp-club-t">
        Diagrammatic plan of the club: ten project benches with three seats
        each, thirty members, and a desk at the front.
      </title>
      <rect className={s.lnHeavy} x={20} y={46} width={520} height={234} />
      <path className={s.lnThin} d="M20 236 a28 28 0 0 1 28 -28" />
      {benches.map((b, i) => (
        <g key={i}>
          <rect className={s.ln} x={b.x} y={b.y} width={74} height={30} />
          <text className={s.txS} x={b.x + 37} y={b.y + 21} textAnchor="middle">
            P{i + 1}
          </text>
          {[0, 1, 2].map((k) => (
            <circle
              key={k}
              className={s.lnThin}
              cx={b.x + 14 + k * 23}
              cy={b.y + 46}
              r={7}
            />
          ))}
        </g>
      ))}
      <rect className={s.ln} x={220} y={236} width={120} height={26} />
      <text className={s.txS} x={280} y={255} textAnchor="middle">
        FRONT
      </text>
      <Dim a={[20, 46]} b={[540, 46]} offset={-20} label="ONE CLUB" />
      <text className={s.txS} x={20} y={308}>
        30 MEMBERS · 10+ CONCURRENT PROJECTS
      </text>
      <text className={s.txS} x={20} y={330}>
        AI · WEB · ROBOTICS · DIAGRAMMATIC
      </text>
      <Tag
        id="lead"
        n="T"
        at={CLUB_NOTES[0].at}
        from={[528, 280]}
        label="TSIG"
      />
      <Tag
        id="teach"
        n="F"
        at={CLUB_NOTES[1].at}
        from={[340, 249]}
        label="Front of the room"
      />
    </svg>
  );
}

const strip = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function Issue() {
  const { unlocked } = useEgg();
  const cells: { k: string; v: React.ReactNode; cls?: string }[] = [
    {
      k: 'Email',
      v: <a href={`mailto:${profile.email}`}>{profile.email}</a>,
      cls: s.issueBig,
    },
    {
      k: 'Phone',
      v: (
        <a href={`tel:${profile.phone.replace(/\s/g, '')}`}>{profile.phone}</a>
      ),
      cls: s.issueMid,
    },
    {
      k: 'Résumé',
      v: (
        <a href={profile.resumeUrl} target="_blank" rel="noopener">
          PDF
        </a>
      ),
    },
    {
      k: 'LinkedIn',
      v: (
        <a href={profile.linkedin} target="_blank" rel="noopener">
          {strip(profile.linkedin)}
        </a>
      ),
      cls: s.issueBig,
    },
    {
      k: 'GitHub',
      v: (
        <a href={profile.github} target="_blank" rel="noopener">
          {strip(profile.github)}
        </a>
      ),
      cls: s.issueMid,
    },
    { k: 'Location', v: profile.location },
    {
      k: 'Status',
      v: 'Open to AI engineering roles · remote or UAE',
      cls: s.issueMid,
    },
    { k: 'Drawn', v: 'M. I. Nasir' },
    {
      k: 'Checked',
      v: unlocked ? <span className={s.pencilNote}>you</span> : '—',
    },
    {
      k: 'Other cuts',
      v: <Link href="/concepts">All cuts</Link>,
      cls: s.issueMid,
    },
  ];
  return (
    <div className={s.issue} id="issue">
      <Stamp tone="chalk" rot={-5} className={s.stampIssue}>
        <b>Issued</b> for review
      </Stamp>
      <div className={s.issueHead}>
        <span className={s.tbK}>Client</span>
        <h3
          className={s.issueTitle}
          data-stretch="74"
          style={{ fontVariationSettings: `'wdth' 74` }}
        >
          Get in touch.
        </h3>
        <p className={s.line}>Contact details below.</p>
      </div>
      {cells.map((c) => (
        <div key={c.k} className={`${s.issueCell} ${c.cls ?? ''}`}>
          <span className={s.tbK}>{c.k}</span>
          <span className={s.tbV}>{c.v}</span>
        </div>
      ))}
    </div>
  );
}

export default function S07Route() {
  return (
    <Sheet
      n={7}
      kicker="Detail 6 · route · site plan · issue"
      title="Dubai, Hyderabad, Dubai again."
      fields={[
        { k: 'Route', v: 'Dubai → Hyderabad → Dubai', wide: true },
        { k: 'School', v: 'NIMS Dubai · CBSE 92%' },
        { k: '11–12th', v: 'Hyderabad · 94%' },
        {
          k: 'Degree',
          v: 'B.E. CSE · MJCET, Osmania · 2025 · GPA 8.27',
          wide: true,
        },
        { k: 'Club', v: 'TSIG · Vice Chair & Tech Lead' },
      ]}
    >
      <View
        W={MW}
        H={MH}
        notes={MAP_NOTES}
        letter="A"
        title="Site plan · stations 1–3"
        sub="Equirectangular, true at 21°N"
        className={s.span12}
        pan={960}
      >
        <SitePlan />
      </View>
      <View
        W={560}
        H={200}
        letter="B"
        title="Classes ended at 4. We stayed till 9 or 10."
        sub="TSIG · workshop hours"
        className={s.span6}
      >
        <Hours />
      </View>
      <View
        W={560}
        H={340}
        notes={CLUB_NOTES}
        letter="C"
        title="30 members, 10+ projects at once."
        sub="TSIG · plan"
        className={s.span6}
      >
        <Club />
      </View>
      <div className={`${s.span12} ${s.record}`} aria-label="Also on record">
        <span className={s.tbK}>Also on record</span>
        <Stamp rot={-4}>
          <b>Winner</b>
          <span>HackRevolution</span>
        </Stamp>
        <Stamp rot={3} tone="chalk">
          <b>Champion</b>
          <span>Inter-club debate</span>
        </Stamp>
        <Stamp rot={-2}>
          <b>Top 50</b>
          <span>ISRO Rover · all-India</span>
        </Stamp>
      </div>
      <div className={s.span12}>
        <Issue />
      </div>
    </Sheet>
  );
}
