// Built with elayadesign/ai-design-skills · landing-page-design (.claude/skills/landing-page-design).
// One offer: hire Ibrahim as an AI engineer. One audience: teams hiring for agentic AI, RAG and
// LLM systems. One action: email him about a role. Every fact comes from src/data/profile.ts or the
// master resume; nothing here is invented. Copy rule from the skill: no hyphens inside sentences.

import { profile } from '@/data/profile';

export const cta = {
  label: 'Email me about a role',
  href: `mailto:${profile.email}?subject=AI%20engineering%20role`,
};

export const hero = {
  // shown under his name in the nav
  eyebrow: 'AI engineer · Dubai, UAE',
  // line breaks sit where the thought breaks (B5); on phones "and" moves up a line
  title: ['I build AI agents', 'for production,', 'and machines that move'],
  sub: 'Mohammed Ibrahim Nasir. LangGraph agents, RAG and LLM evals in production at Ducon Industries, with a robotics bench on the side.',
  proof: {
    value: '57',
    text: 'client designs in the first 4 weeks of SAIF, before its marketing launch',
  },
};

export const flow = {
  name: 'SAIF AI Designer',
  meta: 'Live on WhatsApp · Ducon Industries R&D',
  steps: [
    'Photo in',
    'Planner',
    'Catalogue RAG',
    'Render',
    'Evaluate',
    'Design + BOQ out',
  ],
  before: '20+ min',
  after: '5–7 min',
  caption: 'Illustration of the flow. Image: outdoor design render.',
};

export const problem = {
  title: ['Most of it happens', 'after the demo works'],
  body: 'Broken JSON, retrieval that returns the wrong products, runs that take twenty minutes. That is what I spend my days fixing.',
};

export const benefits = [
  {
    icon: 'shield',
    scene: 'graph',
    title: 'Agents that hold up in production',
    body: 'Strict JSON schemas, code and LLM validation nodes, and a generate, evaluate, regenerate loop for images.',
    proof: 'SAIF, live on WhatsApp',
  },
  {
    icon: 'gauge',
    scene: 'bars',
    title: 'Pipelines that get faster',
    body: 'Parallel agent nodes, thinking level tuned per node, Gemini Flash, and deterministic logic moved into code.',
    proof: '20+ min down to 5–7 min',
  },
  {
    icon: 'database',
    scene: 'tiles',
    title: 'Answers grounded in real data',
    body: 'Structured and semantic RAG over pgvector, so every render and bill of quantities uses products that can be sold.',
    proof: 'ChromaDB search over thousands of images',
  },
  {
    icon: 'graph',
    scene: 'dial',
    title: 'Evals before release',
    body: 'An evaluation dataset, with every run traced in LangSmith and Langfuse to compare models before they ship.',
    proof: 'LangSmith · Langfuse',
  },
  {
    icon: 'lightning',
    scene: 'rack',
    title: 'Owned end to end',
    body: 'Deployment on Railway, a VPS, Cloudflare R2 and the databases, plus the automation scripts around them.',
    proof: '100+ manual hours saved',
  },
] as const;

// hero stage: his own 4 DOF arm (3D printed, servo driven, inverse kinematics)
export const arm = {
  caption: '4 DOF arm · inverse kinematics · 3D printed, servo driven',
  hint: 'Click the bench to run the hackathon pick routine',
};

export const machines = {
  title: ['And machines', 'that move'],
  body: 'In college I was in the robotics club: motors, belts, sensors and a lot of printed parts.',
  items: [
    {
      scene: 'corexy',
      title: 'Core XY retrieval machine',
      line: 'Two steppers, one belt path, any point on the grid.',
      proof: 'National conference paper · IIT Hack4SDG special mention',
    },
    {
      scene: 'mecanum',
      title: 'Mecanum car',
      line: 'Moves in any direction, diagonals included, without turning.',
      proof: 'Steppers · Arduino · CNC shield · Bluetooth',
    },
    {
      scene: 'printer',
      title: '3D printing',
      line: 'About a year of modelling, slicing, repairs and tuning.',
      proof: 'SolidWorks · Onshape',
    },
    {
      scene: 'hand',
      title: 'EMG bionic arm',
      line: 'An EMG sensor reads the muscle and closes the hand.',
      proof: 'Robotics bench',
    },
  ],
} as const;

export const tagline = [
  'Mechanics. Electronics. Code. AI.',
  'I learn how each one works, then build with it.',
];

export const how = { title: ['Three things I do', 'on every project'] };

export const steps = [
  {
    n: '01',
    title: 'Learn the core',
    body: 'Before I build with something new, I learn how it works underneath.',
    proof:
      'Computer science degree, then motors, sensors and firmware at the robotics bench.',
  },
  {
    n: '02',
    title: 'Build and measure',
    body: 'Model changes run against an evaluation set before release.',
    proof: 'Runs traced in LangSmith and Langfuse before a model goes live.',
  },
  {
    n: '03',
    title: 'Ship and support',
    body: 'I deploy it myself and keep taking feedback after launch.',
    proof:
      '40 internal users. Their feedback became edit generations, multi step generation and night view renders.',
  },
];

export const caseStudy = {
  title: 'SAIF AI Designer',
  where: 'AI Developer · R&D · Ducon Industries · Aug 2025 to now',
  line: 'A client sends a photo of their space on WhatsApp. Minutes later they get a rendered outdoor design and a bill of quantities.',
  stats: [
    {
      value: '57',
      label: 'client designs in the first 4 weeks, before the marketing launch',
    },
    { value: '~70%', label: 'faster generation, from 20+ min to 5–7 min' },
    { value: '35%', label: 'less designer time per client session' },
    { value: '40', label: 'internal users across sales, design and R&D' },
  ],
};

export const more = [
  {
    icon: 'robot',
    title: '3rd place, national hackathon',
    body: 'A robotic arm that uses Gemini as its eyes. Camera, then Gemini, then Python, then Arduino over serial.',
  },
  {
    icon: 'tree',
    title: 'Published research',
    body: 'A national conference paper on the Core XY mechanism, plus a special mention at IIT Hack4SDG.',
  },
  {
    icon: 'graph',
    title: 'Atomic Sensei',
    body: 'A multi agent learning platform. I designed the architecture and the data model.',
  },
  {
    icon: 'database',
    title: 'Backend foundations',
    body: 'DeltaX internship, Jan to Jul 2025. Two backends in C# and ASP.NET Core with 20+ REST endpoints.',
  },
  {
    icon: 'check',
    title: 'Vice Chair, TSIG',
    body: 'Led a 30 member engineering club across 10+ concurrent projects. Completion rate up 25%.',
  },
] as const;

export const reversal = {
  title: 'Check the work before we talk.',
  body: 'SAIF is live. Send it a photo on WhatsApp and see what comes back.',
};

export const faqTitle = ['Questions', 'hiring teams ask'];

export const faq = [
  {
    q: 'What roles are you looking for?',
    a: 'AI engineering roles: agentic AI, RAG and LLM systems, built in Python.',
  },
  { q: 'Remote or on site?', a: 'Remote, or on site in the UAE.' },
  { q: 'Where are you based?', a: 'Dubai, UAE, on an employment visa.' },
  {
    q: 'How much production experience do you have?',
    a: 'AI Developer at Ducon Industries since August 2025, after a backend internship at DeltaX from January to July 2025.',
  },
  {
    q: 'What does SAIF actually do?',
    a: 'A client sends a photo of their outdoor space on WhatsApp and gets back a rendered design and a bill of quantities, built only from products Ducon sells.',
  },
  {
    q: 'Which models and tools do you use?',
    a: 'Gemini, Claude and OpenAI APIs. LangGraph and LangChain. FastAPI. PostgreSQL with pgvector, ChromaDB and Supabase. LangSmith and Langfuse for tracing.',
  },
  {
    q: 'Do you only work on software?',
    a: 'No. I built a 4 DOF arm with inverse kinematics, a mecanum car, an EMG bionic arm and a Core XY machine, and spent about a year on 3D printers.',
  },
  {
    q: 'What did you study?',
    a: 'B.E. in Computer Science and Engineering at MJCET, Osmania University, 2025, with a GPA of 8.27.',
  },
  {
    q: 'Can I see code?',
    a: 'My GitHub is linked below. SAIF is Ducon’s product, so the fastest way to judge it is to try it on WhatsApp.',
  },
];

export const final = {
  title: ['I’m looking for my next', 'AI engineering role'],
  body: 'Remote, or on site in the UAE. Email is the fastest way to reach me.',
};

// the easter egg: press ? to see the rules this page was built to
export const rules = [
  'One offer, one audience, one primary action',
  'No competing calls to action above the fold',
  'Specific numbers instead of vague verbs',
  'Proof sits next to the claim it supports',
  'One typeface for copy, a mono only for the arm’s live readout, no italics',
  'No hyphens in copy, no orphaned words',
  'Every size on the Tailwind type scale, every gap on the spacing table',
  'Paper and blue ink, with amber only for what is live',
  'Every drawing is a live 3D scene, etched in ink',
  'Motion on one curve, transform and opacity only',
  'A tagline that lights up one word at a time',
  'No invented facts',
];
