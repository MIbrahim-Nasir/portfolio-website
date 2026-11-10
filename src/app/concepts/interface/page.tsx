import type { Metadata, Viewport } from 'next';
import { Anybody, Red_Hat_Mono } from 'next/font/google';
import InterfaceApp from '@/components/concepts/interface/InterfaceApp';

// Display, taglines and every annotation on the drawings: Anybody, a grotesk with a 50–150 width axis.
// Condensed it labels a schematic; stretched it is a title card. The taglines animate along that axis.
const display = Anybody({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--if-display',
  display: 'swap',
});

// Code, units, bytes and UI labels.
const mono = Red_Hat_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--if-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Interface · Mohammed Ibrahim Nasir, AI Engineer',
  description:
    'Mohammed Ibrahim Nasir, AI Engineer in Dubai. Mechanics, electronics, code and AI: one signal through his vision-guided robot arm, one domain at a time.',
};

export const viewport: Viewport = {
  themeColor: '#0e0f10',
};

export default function InterfacePage() {
  return (
    <InterfaceApp fontClassName={`${display.variable} ${mono.variable}`} />
  );
}
