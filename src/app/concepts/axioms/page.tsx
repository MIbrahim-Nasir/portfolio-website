import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Fragment_Mono } from 'next/font/google';
import AxiomsApp from '@/components/concepts/axioms/AxiomsApp';

// Title cards and figure math: Bodoni Moda, a sharp high-contrast Didone with an
// optical-size axis, so the axioms set at 100px get hairline serifs and the
// italic variables on the figures stay sturdy at 15px.
const serif = Bodoni_Moda({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--ax-serif',
  display: 'swap',
});

// Annotations, keys and readouts: Fragment Mono, a Helvetica-cut monospace.
const mono = Fragment_Mono({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--ax-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Axioms · Mohammed Ibrahim Nasir, AI Engineer',
  description:
    'Mohammed Ibrahim Nasir, AI Engineer in Dubai. Seven engineering axioms, each a live figure annotated with the work that proves it.',
};

export const viewport: Viewport = {
  themeColor: '#f4eee2',
};

export default function AxiomsPage() {
  return <AxiomsApp fontClassName={`${serif.variable} ${mono.variable}`} />;
}
