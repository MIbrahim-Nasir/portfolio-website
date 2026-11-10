import type { Metadata, Viewport } from 'next';
import { Hubot_Sans, Martian_Mono } from 'next/font/google';
import AtomApp from '@/components/concepts/atom/AtomApp';

// Display: Hubot Sans, GitHub's "robotic" grotesk. Its width axis (75–125) carries the system:
// wide and light for names and titles, condensed for numbers.
const display = Hubot_Sans({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--atom-display',
  display: 'swap',
});

// Readouts: Martian Mono, drawn for interfaces; precise at 9–11px.
const mono = Martian_Mono({
  subsets: ['latin'],
  variable: '--atom-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Atom · Mohammed Ibrahim Nasir, AI Engineer',
  description:
    'Mohammed Ibrahim Nasir, AI Engineer in Dubai. One core, six orbits: AI systems, software, mechanics, electronics, robotics, and the club and degree behind them.',
};

export const viewport: Viewport = {
  themeColor: '#0a0b0c',
};

export default function AtomPage() {
  return <AtomApp fontClassName={`${display.variable} ${mono.variable}`} />;
}
