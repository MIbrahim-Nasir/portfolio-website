import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Alternate cuts · Mohammed Ibrahim Nasir',
  description: 'Other directions for the same portfolio.',
};

const cuts = [
  {
    href: '/concepts/render',
    code: '00',
    name: 'render(ibrahim)',
    note: '32,768 particles reshape into each chapter as you scroll.',
  },
  {
    href: '/concepts/scope',
    code: '01',
    name: 'Scope',
    note: 'An oscilloscope bench. Each channel is a chapter.',
  },
  {
    href: '/concepts/printbed',
    code: '02',
    name: 'Print Bed',
    note: 'The page is 3D-printed layer by layer, with live G-code.',
  },
  {
    href: '/concepts/blueprint',
    code: '03',
    name: 'Blueprint',
    note: 'A cyanotype engineering drawing that drafts itself.',
  },
  {
    href: '/concepts/forge',
    code: '04',
    name: 'Forge',
    note: 'A late-night holo-lab where an exosuit is assembled, one module per chapter.',
  },
  {
    href: '/',
    code: '05',
    name: 'Atom',
    note: 'The live homepage. One core, six orbits. The camera flies through each one.',
  },
  {
    href: '/concepts/axioms',
    code: '06',
    name: 'Axioms',
    note: 'Seven engineering principles, each drawn as a live figure with the work behind it.',
  },
  {
    href: '/concepts/interface',
    code: '07',
    name: 'Interface',
    note: 'One signal crosses optics, AI, code, firmware, circuits and motors.',
  },
  {
    href: '/concepts/latent',
    code: '08',
    name: 'Latent',
    note: 'Ask the system about me. Watch it retrieve, answer and check itself.',
  },
  {
    href: '/concepts/hire',
    code: '09',
    name: 'Hire',
    note: 'A landing page with a 3D bench. My 4-DOF arm tracks your cursor; click it to run the hackathon routine.',
  },
];

export default function Concepts() {
  return (
    <main className="text-sand min-h-dvh bg-[#0a0807] px-[var(--gutter)] py-16">
      <p className="kicker">
        <span className="text-ember">Alternate cuts</span> · same engineer,{' '}
        {cuts.length} directions
      </p>
      <h1 className="display mt-6 max-w-[14ch] text-[clamp(44px,7vw,112px)]">
        Pick a <em>cut</em>.
      </h1>
      <ol className="mt-14 border-t border-[var(--line)]">
        {cuts.map((c) => (
          <li key={c.href} className="border-b border-[var(--line)]">
            <Link
              href={c.href}
              className="group hover:text-ember grid grid-cols-[3rem_1fr] items-baseline gap-x-6 gap-y-1 py-6 transition-colors md:grid-cols-[4rem_18rem_1fr]"
            >
              <span className="mono text-dune group-hover:text-ember text-[12px]">
                {c.code}
              </span>
              <span className="display text-[clamp(28px,3vw,44px)]">
                {c.name}
              </span>
              <span className="text-dune col-start-2 text-[14px] md:col-start-3">
                {c.note}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
