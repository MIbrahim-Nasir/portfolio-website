import type { Metadata, Viewport } from 'next';
import {
  Azeret_Mono,
  Big_Shoulders,
  Big_Shoulders_Stencil,
  Schibsted_Grotesk,
} from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import DevRafShim from '@/components/DevRafShim';
import './globals.css';

// Title cards: Big Shoulders, a condensed industrial face cut from Chicago signage.
const display = Big_Shoulders({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '800', '900'],
  display: 'swap',
});

// Wordmark: the stencil cut, as sprayed on crates and machine guards. IBRAHIM is sampled into particles from it.
const stencil = Big_Shoulders_Stencil({
  variable: '--font-wordmark',
  subsets: ['latin'],
  weight: ['800', '900'],
  display: 'swap',
});

const body = Schibsted_Grotesk({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
});

const mono = Azeret_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mibrahimnasirdev.vercel.app'),
  title: 'Mohammed Ibrahim Nasir · AI Engineer, Dubai',
  description:
    'Mohammed Ibrahim Nasir, AI Engineer in Dubai. He builds multi-agent LLM systems with LangGraph and RAG, and built robots and C# backends before that.',
  authors: [{ name: 'Mohammed Ibrahim Nasir' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Mohammed Ibrahim Nasir · AI Engineer',
    description:
      'Agentic AI, RAG and LLM systems in production. Robotics before that. Dubai, UAE.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0807',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${stencil.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="antialiased">
        <DevRafShim />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
