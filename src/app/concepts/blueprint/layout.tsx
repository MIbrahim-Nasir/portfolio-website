import type { Metadata, Viewport } from 'next';
import { Saira, Overpass_Mono, Architects_Daughter } from 'next/font/google';

// Lettering + drawing titles: Saira. Its width axis (50–125) lets one family
// do condensed ISO-style callouts and stretched title-block lettering.
const letter = Saira({
  variable: '--bp-letter',
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
});

// Figures, dimension values, coordinates: Overpass Mono (Highway Gothic lineage).
const figures = Overpass_Mono({
  variable: '--bp-mono',
  subsets: ['latin'],
  display: 'swap',
});

// The checker's pencil: redlines, the compass buddy, sheet 00.
const pencil = Architects_Daughter({
  variable: '--bp-hand',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Blueprint · Mohammed Ibrahim Nasir, AI Engineer',
  description:
    'Mohammed Ibrahim Nasir, AI Engineer in Dubai, as a seven-sheet cyanotype drawing set. Every fact is a dimension, callout, revision or title-block field.',
};

export const viewport: Viewport = {
  themeColor: '#e6dfcc',
};

export default function BlueprintLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`${letter.variable} ${figures.variable} ${pencil.variable}`}
    >
      {children}
    </div>
  );
}
