import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Manrope } from 'next/font/google';
import HireApp from '@/components/concepts/hire/HireApp';

// landing-page-design allows one typeface per site; Manrope is on its approved list.
// Headings are Regular; nothing heavier than Semibold is used.
const sans = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--hire-sans',
  display: 'swap',
});
// allowed beside the primary face only for the arm's live readout (HUD numerics, aim chip)
const mono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--hire-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hire Ibrahim · AI engineer for agentic AI, RAG and LLM systems',
  description:
    'Mohammed Ibrahim Nasir, AI engineer in Dubai. LangGraph agents, RAG and LLM evals in production: SAIF AI Designer cut generation from 20+ minutes to 5–7. Open to AI engineering roles, remote or in the UAE.',
  openGraph: {
    title: 'Hire Ibrahim · AI engineer',
    description:
      'LangGraph agents, RAG and LLM evals in production. Open to AI engineering roles, remote or in the UAE.',
    images: ['/images/reel-villa.jpg'],
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#f4efe4',
};

export default function HirePage() {
  return <HireApp fontClassName={`${sans.variable} ${mono.variable}`} />;
}
