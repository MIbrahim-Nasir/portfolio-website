import Link from 'next/link';
import { profile } from '@/data/profile';
import { Cross } from './primitives';
import { Notes, Schedule, Sheet } from './Sheet';
import { SHEETS, nn } from './sheets';
import s from './blueprint.module.css';

export function RevTri({ r }: { r: string }) {
  return (
    <svg className={s.revTri} viewBox="0 0 26 24" aria-label={`Revision ${r}`}>
      <path d="M13 2 L24 22 H2 Z" />
      <text x="13" y="16.5" textAnchor="middle">
        {r}
      </text>
    </svg>
  );
}

/** HTML dimension line: extension lines, arrowheads, value. */
export function HDim({
  children,
  below = false,
  className = '',
}: {
  children: React.ReactNode;
  below?: boolean;
  className?: string;
}) {
  return (
    <div className={`${s.hdim} ${below ? s.hdimBelow : ''} ${className}`}>
      <i className={s.hdimLine} />
      <span className={s.hdimV}>{children}</span>
    </div>
  );
}

const DISCIPLINES = ['Mechanics', 'Electronics', 'Code', 'AI'];

export default function S01Title() {
  const [first, mid, last] = profile.name.split(' ');
  return (
    <Sheet
      n={1}
      kicker=""
      title=""
      scale="1:1"
      fields={[
        { k: 'Drawn by', v: profile.name, wide: true },
        { k: 'Role', v: `${profile.role} · ${profile.tagline}`, wide: true },
        { k: 'Location', v: profile.location },
        { k: 'Current', v: 'Ducon Industries · R&D' },
        { k: 'Trained', v: 'B.E. CSE · MJCET · 2025' },
        {
          k: 'Print',
          v: (
            <a href={profile.resumeUrl} target="_blank" rel="noopener">
              Résumé · PDF
            </a>
          ),
        },
        { k: 'Other cuts', v: <Link href="/concepts">All cuts</Link> },
      ]}
      head={
        <header className={s.cover}>
          <svg
            className={s.coverArt}
            viewBox="0 0 1200 520"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            data-drawing="load"
          >
            <path
              className={s.lnConstruct}
              d="M0 120 H1200 M0 400 H1200 M0 446 H1200"
            />
            <path className={s.lnConstruct} d="M70 0 V520 M930 0 V520" />
            <path className={s.lnConstruct} d="M640 520 L1160 0" />
            <path
              className={s.lnThin}
              d="M1060 470 m-300 0 a300 300 0 0 1 300 -300"
            />
            <path
              className={s.lnConstruct}
              d="M1060 470 m-220 0 a220 220 0 0 1 220 -220"
            />
            <path className={s.lnConstruct} d="M1060 470 L848 258" />
            <Cross x={1060} y={470} r={9} />
            <Cross x={70} y={120} />
            <Cross x={930} y={400} />
            <text
              className={s.txS}
              x={860}
              y={300}
              transform="rotate(45 860 300)"
            >
              R300
            </text>
          </svg>
          <p className={s.kicker}>
            Drawing set · {nn(SHEETS.length)} sheets · Issued for review
          </p>
          <div className={s.nameWrap}>
            <HDim>
              {profile.role} · {profile.location}
            </HDim>
            <h1
              id={`${SHEETS[0].id}-t`}
              className={s.name}
              data-stretch="60"
              style={{ fontVariationSettings: `'wdth' 60` }}
            >
              <span>{first}</span> <span>{mid}</span> <span>{last}</span>
            </h1>
            <div
              className={s.chain}
              aria-label="Disciplines: mechanics, electronics, code, AI"
            >
              {DISCIPLINES.map((d) => (
                <HDim key={d} below>
                  {d}
                </HDim>
              ))}
            </div>
          </div>
          <p className={s.line}>
            I studied computer science, but never stayed in software.
          </p>
        </header>
      }
    >
      <div className={`${s.span5}`}>
        <Schedule
          title="Revisions"
          cols={['Rev', 'Date', 'Description']}
          rows={[
            [
              <RevTri key="a" r="A" />,
              '2022–25',
              'TSIG, MJCET · joined in robotics, left Vice Chair & Technical Lead',
            ],
            [
              <RevTri key="b" r="B" />,
              'Jan–Jul 2025',
              'DeltaX, Hyderabad · Associate Software Product Engineer Intern',
            ],
            [
              <RevTri key="c" r="C" />,
              'Aug 2025 –',
              'Ducon Industries, Dubai · AI Developer, R&D team',
            ],
          ]}
        />
      </div>
      <div className={s.span7}>
        <Notes
          items={[
            'Works across mechanics, electronics, code and AI.',
            'Each field learned from its core concepts, then built with.',
            'Thinks in 3D: SolidWorks, Onshape, ~1 year of 3D printing.',
            'Teaches: ran a front-end internship and an electronics workshop for juniors.',
            'All dimensions are real. Do not scale from drawing.',
            <>
              Not issued until all seven sheets are checked.{' '}
              <em className={s.pencilNote}>Checker: you.</em>
            </>,
          ]}
        />
      </div>
      <div className={s.span12}>
        <Schedule
          title="Drawing index"
          className={s.index}
          cols={['Sht', 'Title', 'Views']}
          rows={SHEETS.map((sh) => [
            nn(sh.n),
            <a key={sh.id} href={`#${sh.id}`}>
              {sh.short}
            </a>,
            sh.view,
          ])}
        />
      </div>
    </Sheet>
  );
}
