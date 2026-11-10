import type { Metadata, Viewport } from 'next';
import { Doto, Kode_Mono, Tektur } from 'next/font/google';
import ForgeApp from '@/components/concepts/forge/ForgeApp';

// Titles: Tektur, a squared techno face with a width axis. Panels "widen" from 75 to 100 as they project.
const display = Tektur({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--forge-display',
  display: 'swap',
});

// Labels, tags and the dialogue: Kode Mono, a screenplay-style mono with machined terminals.
const mono = Kode_Mono({
  subsets: ['latin'],
  variable: '--forge-mono',
  display: 'swap',
});

// Big readout numerals: Doto, a dot-matrix face. Its ROND axis rounds the dots as a module seats.
const dots = Doto({
  subsets: ['latin'],
  axes: ['ROND'],
  variable: '--forge-dots',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FORGE · Mohammed Ibrahim Nasir, AI Engineer',
  description:
    'Mohammed Ibrahim Nasir, AI Engineer in Dubai. A holographic workbench where an exoframe is assembled one module at a time, and each module shows part of his record.',
};

export const viewport: Viewport = {
  themeColor: '#04070a',
};

export default function ForgePage() {
  return (
    <ForgeApp
      fontClassName={`${display.variable} ${mono.variable} ${dots.variable}`}
    />
  );
}
