import type { Metadata, Viewport } from 'next';
import {
  Atkinson_Hyperlegible_Mono,
  Chakra_Petch,
  Workbench,
} from 'next/font/google';
import ScopeApp from '@/components/concepts/scope/ScopeApp';

// Panel silkscreen: Chakra Petch, squared and technical, prints well small and tracked.
const legend = Chakra_Petch({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--scope-legend',
  display: 'swap',
});

// On-screen readout: built for legibility at small sizes, which is what a scope's character generator needs.
const mono = Atkinson_Hyperlegible_Mono({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--scope-mono',
  display: 'swap',
});

// Taglines on the tube: a CRT face with real scanline (SCAN) and bleed (BLED) axes.
const crt = Workbench({
  subsets: ['latin'],
  axes: ['BLED', 'SCAN'],
  variable: '--scope-crt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SCOPE · Mohammed Ibrahim Nasir, AI Engineer',
  description:
    'Mohammed Ibrahim Nasir, AI Engineer in Dubai, as an oscilloscope. Mechanics, electronics, code and AI on one bench: every fact is a trace, a cursor or a readout.',
};

export const viewport: Viewport = {
  themeColor: '#1b1f20',
};

export default function ScopePage() {
  return (
    <ScopeApp
      fontClassName={`${legend.variable} ${mono.variable} ${crt.variable}`}
    />
  );
}
