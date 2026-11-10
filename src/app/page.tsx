import type { Metadata } from 'next';
import AtomPage from './concepts/atom/page';

// The live homepage is the Atom cut. The other cuts, including render(ibrahim), live under /concepts.
export { viewport } from './concepts/atom/page';

export const metadata: Metadata = {
  title: 'Mohammed Ibrahim Nasir · AI Engineer, Dubai',
  description:
    'AI Engineer in Dubai building agentic AI, RAG and LLM systems in production, with a robotics background. One core, six orbits: AI systems, software, mechanics, electronics, robotics, and the club and degree behind them.',
  openGraph: {
    title: 'Mohammed Ibrahim Nasir · AI Engineer',
    description:
      'Agentic AI, RAG and LLM systems in production. Robotics before that. Dubai, UAE.',
    type: 'website',
  },
};

export default AtomPage;
