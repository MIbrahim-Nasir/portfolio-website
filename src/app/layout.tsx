import type { Metadata } from 'next';
import { IBM_Plex_Mono, Outfit } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

const ibm = IBM_Plex_Mono({
  variable: '--font-ibm',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Ibrahim Nasir, AI Developer',
  description:
    'AI Developer in Dubai. Production GenAI: RAG, agents, and systems that ship.',
  authors: [{ name: 'Mohammed Ibrahim Nasir' }],
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-room="home" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${ibm.variable} h-dvh overflow-hidden antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
