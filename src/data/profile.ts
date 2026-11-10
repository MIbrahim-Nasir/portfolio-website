// Source of truth: MIbrahim_Nasir_AI_Resume (Oct 2026) + My Profile.md.
// Only facts from those two files. No invented numbers.

export const profile = {
  name: 'Mohammed Ibrahim Nasir',
  short: 'Ibrahim',
  role: 'AI Engineer',
  tagline: 'Agentic AI, RAG & LLM systems',
  location: 'Dubai, UAE',
  email: 'mibrahimnasir.engineer@gmail.com',
  phone: '+971 50 576 3323',
  resumeUrl: '/resume.pdf',
  github: 'https://github.com/MIbrahim-Nasir',
  linkedin: 'https://www.linkedin.com/in/mohammed-ibrahim-nasir/',
  saifWhatsapp: 'https://wa.me/971565050775',
};

export type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

export type Scene = {
  id: string;
  code: string; // scene label in the HUD
  title: string; // scrubber label
  vh: number; // scroll length of the scene, in viewport heights
  trace: string[]; // lines streamed into the agent console
};

export const scenes: Scene[] = [
  {
    id: 'open',
    code: 'SC.00',
    title: 'Intro',
    vh: 170,
    trace: [
      'boot  render(ibrahim)',
      'load  profile · ai engineer · dubai',
      'ok    32,768 particles allocated',
    ],
  },
  {
    id: 'origin',
    code: 'SC.01',
    title: 'Background',
    vh: 260,
    trace: [
      'whoami    engineer · cs by degree',
      'domains   mechanics · electronics · code · ai',
      'tsig      joined as a robotics member',
      'geo       dubai → hyderabad → dubai',
      'edu       b.e. cse · osmania · 2025',
    ],
  },
  {
    id: 'matter',
    code: 'SC.02',
    title: 'Robotics',
    vh: 260,
    trace: [
      'cam       frame captured',
      'vision    gemini decides: grab',
      'serial    pyserial → arduino',
      'motor     steppers · servos · ik',
      'result    3rd place, national hackathon',
      'club      tsig · vice chair · 30 members',
    ],
  },
  {
    id: 'stack',
    code: 'SC.03',
    title: 'Backend',
    vh: 220,
    trace: [
      'lang      c# · asp.net core · ef core · dapper',
      'layer     controller → service → repository',
      'db        sql server',
      'ship      20+ rest endpoints',
      'engine    history-based recommendations',
    ],
  },
  {
    id: 'saif',
    code: 'SC.04',
    title: 'SAIF',
    vh: 320,
    trace: [
      'input     client photo received via whatsapp',
      'planner   grounding design in real catalogue',
      'rag       pgvector · structured + semantic',
      'render    generating outdoor design',
      'evaluate  pass ✓',
      'output    render + bill of quantities',
    ],
  },
  {
    id: 'graph',
    code: 'SC.05',
    title: 'Pipeline',
    vh: 260,
    trace: [
      'graph     langgraph · multi-agent',
      'opt       parallelized agent nodes',
      'opt       thinking level tuned per node',
      'opt       deterministic logic moved to code',
      'model     gemini flash',
      'result    20+ min → 5–7 min',
      'trace     langsmith · langfuse',
    ],
  },
  {
    id: 'contact',
    code: 'SC.06',
    title: 'Contact',
    vh: 190,
    trace: [
      'status    open to ai engineering roles',
      'where     remote or uae',
    ],
  },
];

export const saif = {
  name: 'SAIF AI Designer',
  where: 'Ducon Industries · R&D · Aug 2025 – now',
  before: {
    kicker: 'Input',
    line: 'A client sends a photo of their space on WhatsApp.',
  },
  after: {
    kicker: 'Output',
    line: 'They get back a rendered outdoor design and a bill of quantities built from real, sellable products.',
  },
  stats: [
    {
      value: 57,
      label: 'client designs in the first 4 weeks, before the marketing launch',
    },
    {
      value: 70,
      prefix: '~',
      suffix: '%',
      label: 'faster generation. 20+ min down to 5–7',
    },
    { value: 35, suffix: '%', label: 'less designer time per client session' },
    { value: 40, label: 'internal users across sales, design and R&D' },
  ] as Stat[],
};

export const graph = {
  lead: 'Multi-agent LangGraph pipeline on Python and FastAPI.',
  body: 'A planner agent grounds every design in Ducon’s real catalogue with structured and semantic RAG over pgvector, so renders and BOQs only use products that can be sold. Strict JSON schemas, validation nodes and a generate → evaluate → regenerate loop catch bad images before a client sees one.',
  points: [
    'Evaluation dataset; runs traced in LangSmith and Langfuse to benchmark models before release',
    'Pipelines that turned unstructured project images and documents into a structured, embedded design library',
    'FastAPI + ChromaDB semantic search over thousands of images',
    'Owned deployment end to end: Railway, VPS, Cloudflare R2, databases',
  ],
  nodes: [
    { id: 'input', label: 'Photo', sub: 'whatsapp' },
    { id: 'planner', label: 'Planner', sub: 'agent' },
    { id: 'rag', label: 'Catalogue', sub: 'pgvector rag' },
    { id: 'render', label: 'Render', sub: 'image model' },
    { id: 'boq', label: 'BOQ', sub: 'quantities' },
    { id: 'eval', label: 'Evaluate', sub: 'gate · retry' },
    { id: 'out', label: 'Client', sub: 'design + boq' },
  ],
};

export const foundations = {
  role: 'Associate Software Product Engineer Intern',
  where: 'DeltaX · Hyderabad · Jan – Jul 2025',
  lead: 'Backends first, then agents.',
  body: 'Two backends in C# / ASP.NET Core and SQL Server: an IMDB-style catalogue, and BookSwap, a marketplace for books with a history-based recommendation engine.',
  layers: ['Controller', 'Service', 'Repository', 'SQL Server'],
  stats: [{ value: 20, suffix: '+', label: 'REST endpoints' }] as Stat[],
};

export const matter = {
  lead: 'Some of my code has motors.',
  body: 'A robot arm that uses Gemini as its eyes. The camera sends a frame, Gemini picks the move (grab, shift or place), and Python passes it to the Arduino over serial.',
  wins: [
    { k: '3rd', v: 'National hackathon · Gemini-vision robotic arm' },
    { k: 'IIT', v: 'Hack4SDG special mention · Core XY retrieval machine' },
    {
      k: 'Paper',
      v: 'Published research (national conference) on the Core XY mechanism',
    },
    { k: 'Top 50', v: 'ISRO Rover Competition, all-India' },
  ],
  bench: [
    '4-DOF arm · inverse kinematics',
    'Mecanum car',
    'EMG bionic arm',
    'Core XY gantry',
    '3D printing · ~1 year',
    'SolidWorks · Onshape',
    'Arduino · ESP32 · Jetson Nano',
  ],
};

// who he is, before any project
export const identity = {
  lead: 'A CS degree, and most evenings on the robotics bench.',
  body: 'I studied computer science and spent a lot of university on hardware: robot arms, a mecanum car, a Core XY machine. Now I build multi-agent AI systems at work. In each field I start with how the thing works, then build with it.',
  domains: [
    'Mechanics',
    'Electronics',
    'Robotics',
    'Software',
    'AI systems',
    'Teaching',
  ],
};

export const origin = {
  lead: 'Dubai, then Hyderabad, then Dubai again.',
  stops: [
    { k: 'Dubai', v: 'School through 10th grade · NIMS · CBSE 92%' },
    {
      k: 'Hyderabad',
      v: 'B.E. Computer Science · MJCET, Osmania University · 2025 · GPA 8.27',
    },
    { k: 'Dubai', v: 'AI Developer · Ducon Industries · R&D' },
  ],
  club: {
    name: 'TSIG',
    role: 'Vice Chair & Technical Lead · 2022–2025',
    body: 'The most tech-intensive club on campus. After classes ended at 4, we stayed till 9 or 10. I joined as a robotics member and left as Vice Chair, running a 30-member team across AI, web and robotics.',
    stats: [
      { value: 30, label: 'members led' },
      { value: 10, suffix: '+', label: 'concurrent projects' },
      { value: 25, suffix: '%', label: 'higher completion rate' },
    ] as Stat[],
  },
  extra: [
    'HackRevolution winner',
    'Inter-club debate champion',
    'Month-long front-end virtual internship, run for juniors',
  ],
};

export const toolkit = [
  'LangGraph',
  'LangChain',
  'RAG',
  'Agentic workflows',
  'Context engineering',
  'LLM evaluation',
  'LangSmith',
  'Langfuse',
  'Claude',
  'Gemini',
  'OpenAI',
  'Image models',
  'Embeddings',
  'Python',
  'FastAPI',
  'PostgreSQL / pgvector',
  'ChromaDB',
  'Supabase',
  'SQL Server',
  'C# · ASP.NET Core',
  'Docker',
  'Railway',
  'Cloudflare R2',
  'Claude Code',
  'Cursor',
  'System design',
];

export const sideProjects = [
  {
    name: 'Atomic Sensei',
    body: 'Multi-agent learning platform. Roadmap, lesson and quiz-evaluation agents on Gemini, async lesson pre-generation, cron-driven Supabase edge functions for reminders. I designed the architecture and data model.',
  },
  {
    name: 'AI-Driven Robotics',
    body: '3rd place, national hackathon: a robotic arm controlled by a vision LLM through a Python control pipeline and Arduino.',
  },
];
