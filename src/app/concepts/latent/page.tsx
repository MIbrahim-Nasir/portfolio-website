import type { Metadata, Viewport } from 'next';
import { Gloock, Mona_Sans, Reddit_Mono } from 'next/font/google';
import LatentApp from '@/components/concepts/latent/LatentApp';

// UI + title cards: Mona Sans, with its width axis animated on every run.
const sans = Mona_Sans({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--lt-sans',
  display: 'swap',
});

// The generated answer: Gloock, a high-contrast serif that reads like a title card.
const serif = Gloock({
  subsets: ['latin'],
  weight: '400',
  variable: '--lt-serif',
  display: 'swap',
});

// Traces, scores, labels.
const mono = Reddit_Mono({
  subsets: ['latin'],
  variable: '--lt-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LATENT · Mohammed Ibrahim Nasir, AI Engineer',
  description:
    'Mohammed Ibrahim Nasir, AI Engineer in Dubai, as a retrieval system over his résumé. Ask it a question and watch it retrieve, rerank, generate and check its own answer.',
};

export const viewport: Viewport = {
  themeColor: '#0a0c0b',
};

export default function LatentPage() {
  return (
    <LatentApp
      fontClassName={`${sans.variable} ${serif.variable} ${mono.variable}`}
    />
  );
}
