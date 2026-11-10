import type { Metadata, Viewport } from 'next';
import { Archivo, Instrument_Sans, Martian_Mono } from 'next/font/google';
import { PrintBed } from '@/components/concepts/printbed/PrintBed';

// Display: Archivo across its whole width axis, heavy and wide like a machine nameplate.
// The printed lettering on the parts is set in it too.
const display = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--pb-display',
  display: 'swap',
});

// Supporting lines: Instrument Sans, plain and narrow.
const body = Instrument_Sans({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--pb-body',
  display: 'swap',
});

// G-code, slicer readouts, labels.
const mono = Martian_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--pb-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Print Bed · Mohammed Ibrahim Nasir, AI Engineer',
  description:
    'Mohammed Ibrahim Nasir, AI Engineer in Dubai: mechanics, electronics, code and AI. A resume printed as eight parts on one plate, with the facts raised on them and the story in the G-code.',
};

export const viewport: Viewport = {
  themeColor: '#0e0f11',
};

export default function PrintBedPage() {
  return (
    <PrintBed
      fontClass={`${display.variable} ${body.variable} ${mono.variable}`}
    />
  );
}
