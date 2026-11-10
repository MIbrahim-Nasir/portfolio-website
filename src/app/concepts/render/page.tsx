import type { Metadata, Viewport } from 'next';
import Experience from '@/components/render/Experience';

export const metadata: Metadata = {
  title: 'render(ibrahim) · Mohammed Ibrahim Nasir, AI Engineer',
  description:
    'An interactive film résumé of Mohammed Ibrahim Nasir, AI Engineer in Dubai. 32,768 particles reshape into each chapter as you scroll.',
  openGraph: {
    title: 'render(ibrahim)',
    description:
      'An interactive film résumé of Mohammed Ibrahim Nasir, AI Engineer, Dubai.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0807',
};

export default function RenderPage() {
  return <Experience />;
}
