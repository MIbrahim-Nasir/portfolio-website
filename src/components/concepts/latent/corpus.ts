// The knowledge base. Every chunk is one fact from the brief, nothing else.
// `text` is the source the evaluator checks against, `line` is what the
// generator is allowed to say, `tags` are retrieval metadata (search terms),
// never claims.

import { profile } from '@/data/profile';

export type ClusterId =
  | 'identity'
  | 'ai'
  | 'robotics'
  | 'foundations'
  | 'tsig'
  | 'background'
  | 'contact';

export type Cluster = {
  id: ClusterId;
  name: string;
  color: string; // hex
  center: [number, number, number];
};

export const CLUSTERS: Cluster[] = [
  { id: 'identity', name: 'Identity', color: '#efeadc', center: [0, 0.2, 0] },
  { id: 'ai', name: 'AI systems', color: '#c9f24f', center: [4.1, 0.9, -1.0] },
  {
    id: 'robotics',
    name: 'Robotics',
    color: '#f2a93b',
    center: [-4.0, 1.1, -1.3],
  },
  {
    id: 'foundations',
    name: 'Foundations',
    color: '#5fcbb8',
    center: [2.5, -2.5, 2.1],
  },
  { id: 'tsig', name: 'TSIG', color: '#ff7d6b', center: [-2.7, -2.2, 2.2] },
  {
    id: 'background',
    name: 'Background',
    color: '#c7b48c',
    center: [0.6, 2.5, 2.8],
  },
  {
    id: 'contact',
    name: 'Contact',
    color: '#9fc3ff',
    center: [0.3, -3.4, -2.6],
  },
];

export const CLUSTER_INDEX: Record<ClusterId, number> = Object.fromEntries(
  CLUSTERS.map((c, i) => [c.id, i])
) as Record<ClusterId, number>;

export type Fact = {
  id: string;
  cluster: ClusterId;
  label: string; // floats on the point
  text: string; // source chunk
  line: string; // generated claim
  tags?: string;
  href?: string;
};

export const FACTS: Fact[] = [
  // ── identity
  {
    id: 'i1',
    cluster: 'identity',
    label: 'Mohammed Ibrahim Nasir',
    text: 'Mohammed Ibrahim Nasir, Ibrahim. AI Engineer in Dubai, UAE.',
    line: "I'm Ibrahim, an AI Engineer in Dubai.",
    tags: 'who name person engineer role about him introduce hire',
  },
  {
    id: 'i2',
    cluster: 'identity',
    label: 'mechanics · electronics · code · AI',
    text: 'An engineer across mechanics, electronics, robotics, code and AI. Studied computer science, never kept to software.',
    line: 'I studied CS, then kept going into hardware.',
    tags: 'who engineer hardware software domains fields skills',
  },
  {
    id: 'i3',
    cluster: 'identity',
    label: 'learns the core, then builds',
    text: 'Learns each domain from its core concepts, then builds in it.',
    line: 'I learn the core of a field, then build.',
    tags: 'who method approach how work learn generalist',
  },
  {
    id: 'i4',
    cluster: 'identity',
    label: 'thinks in 3D · links fields',
    text: 'A visual thinker who pictures problems in 3D and links ideas across fields.',
    line: 'I think in 3D and borrow across fields.',
    tags: 'who think visual approach how work',
  },
  {
    id: 'i5',
    cluster: 'identity',
    label: 'stays on a problem',
    text: 'If he cannot solve a problem he does not leave it.',
    line: "I stay on a problem until it's solved.",
    tags: 'hire why persistent stubborn problem solve approach work',
  },
  {
    id: 'i6',
    cluster: 'identity',
    label: 'learns · teaches · mentors',
    text: 'Loves learning and teaching; mentored juniors.',
    line: 'I like teaching what I learn.',
    tags: 'teach mentor learn hire team',
  },
  {
    id: 'i7',
    cluster: 'identity',
    label: 'agentic AI · RAG · LLM systems',
    text: 'Professionally an AI Engineer: agentic AI, RAG, LLM systems, Python.',
    line: 'Agentic AI, RAG and LLM systems, in Python.',
    tags: 'who role job ai engineer skills llm',
  },

  // ── ai systems
  {
    id: 'a1',
    cluster: 'ai',
    label: 'Ducon Industries · R&D · Aug 2025 →',
    text: 'AI Developer on the R&D team at Ducon Industries, Dubai, Aug 2025 to now. Outdoor living construction and design company.',
    line: "I'm an AI Developer at Ducon Industries.",
    tags: 'now current job work role company employer',
  },
  {
    id: 'a2',
    cluster: 'ai',
    label: 'SAIF · photo → render + BOQ',
    text: 'SAIF AI Designer, live on WhatsApp: a client sends a photo of their space and gets a rendered outdoor design plus a Bill of Quantities.',
    line: 'SAIF turns a WhatsApp photo into a design.',
    tags: 'saif shipped ship production live product whatsapp built now',
  },
  {
    id: 'a3',
    cluster: 'ai',
    label: '57 designs · 4 weeks',
    text: '57 client designs in the first 4 weeks, before the marketing launch.',
    line: '57 designs in 4 weeks, before any marketing.',
    tags: 'saif shipped results impact users hire',
  },
  {
    id: 'a4',
    cluster: 'ai',
    label: '20+ min → 5–7 min',
    text: 'Generation cut from 20+ min to 5–7 min (~70%) by parallelizing agent nodes, tuning thinking level per node, moving to Gemini Flash, and moving deterministic logic from LLMs into code.',
    line: 'I cut generation from 20+ min to 5–7.',
    tags: 'saif faster speed latency optimize performance results impact hire',
  },
  {
    id: 'a5',
    cluster: 'ai',
    label: '−35% designer cognition time',
    text: '35% less designer creative cognition time per client session.',
    line: '35% less designer time per session.',
    tags: 'saif results impact',
  },
  {
    id: 'a6',
    cluster: 'ai',
    label: '40 internal users',
    text: '40 internal users across sales, design and R&D; their feedback became features: edit-generations, multi-step generation, night-view renders.',
    line: '40 users; their requests became features.',
    tags: 'saif users feedback product shipped',
  },
  {
    id: 'a7',
    cluster: 'ai',
    label: 'LangGraph · multi-agent · FastAPI',
    text: 'Multi-agent LangGraph pipeline on Python and FastAPI.',
    line: 'A multi-agent LangGraph pipeline on FastAPI.',
    tags: 'saif architecture built how agents stack langgraph python',
  },
  {
    id: 'a8',
    cluster: 'ai',
    label: 'catalogue RAG · pgvector',
    text: "A planner agent grounds each design in Ducon's real catalogue with structured and semantic RAG on PostgreSQL/pgvector, so renders and BOQs only use real, sellable products.",
    line: 'It only uses products Ducon actually sells.',
    tags: 'saif architecture how rag retrieval grounding vector database',
  },
  {
    id: 'a9',
    cluster: 'ai',
    label: 'generate → evaluate → regenerate',
    text: 'Strict JSON schemas, code and LLM validation nodes, and a generate, evaluate, regenerate loop for images.',
    line: 'Validation nodes catch bad images first.',
    tags: 'saif architecture how validation quality evals reliable',
  },
  {
    id: 'a10',
    cluster: 'ai',
    label: 'LangSmith · Langfuse · eval set',
    text: 'Evaluation dataset; runs traced in LangSmith and Langfuse to benchmark models before release.',
    line: 'I benchmark models before they ship.',
    tags: 'saif evaluation evals tracing observability benchmark llm',
  },
  {
    id: 'a11',
    cluster: 'ai',
    label: 'ChromaDB · semantic image search',
    text: 'Pipelines turned unstructured project images and documents into a structured, embedded design library; FastAPI and ChromaDB semantic search over thousands of images.',
    line: 'Thousands of images, searchable in ChromaDB.',
    tags: 'shipped data pipeline embeddings search built',
  },
  {
    id: 'a12',
    cluster: 'ai',
    label: '100+ manual hours saved',
    text: 'Automation scripts saved 100+ manual hours.',
    line: 'My scripts saved 100+ manual hours.',
    tags: 'shipped automation results impact',
  },
  {
    id: 'a13',
    cluster: 'ai',
    label: 'Railway · VPS · R2 · databases',
    text: 'Owned deployment: Railway, VPS, Cloudflare R2, databases.',
    line: 'I handle the deployment too.',
    tags: 'shipped deploy infra devops production ship',
  },
  {
    id: 'a14',
    cluster: 'ai',
    label: 'Atomic Sensei · learning agents',
    text: 'Atomic Sensei: multi-agent AI learning platform. He designed the architecture and data model: roadmap, lesson and quiz-evaluation agents (Gemini), async lesson pre-generation, cron-driven Supabase edge functions for reminders.',
    line: 'Atomic Sensei: I designed its architecture.',
    tags: 'shipped project built side agents learning gemini supabase',
  },
  {
    id: 'a15',
    cluster: 'ai',
    label: 'Claude · Gemini · OpenAI · embeddings',
    text: 'Claude, Gemini and OpenAI APIs, image-generation models, embeddings, prompt and context engineering, LLM evaluation, LangChain.',
    line: 'I use Claude, Gemini and OpenAI models.',
    tags: 'skills stack tools models llm',
  },

  // ── robotics
  {
    id: 'r1',
    cluster: 'robotics',
    label: 'vision-LLM arm · 3rd place',
    text: 'AI-Driven Robotics: 3rd place at a national hackathon with a robotic arm controlled by a vision LLM (Gemini).',
    line: 'My robot arm took 3rd at a national hackathon.',
    tags: 'hardware build robot arm hackathon award gemini vision',
  },
  {
    id: 'r2',
    cluster: 'robotics',
    label: 'camera → Gemini → pyserial → Arduino',
    text: 'Camera frame, Gemini decides the move (grab, shift, place), Python, Arduino over serial with pyserial.',
    line: 'Gemini picks the move; Arduino makes it.',
    tags: 'hardware build robot arm arduino python',
  },
  {
    id: 'r3',
    cluster: 'robotics',
    label: '4-DOF arm · inverse kinematics',
    text: '4-DOF robotic arm: 3D printed, servos, inverse kinematics.',
    line: 'I built a 4-DOF arm with inverse kinematics.',
    tags: 'hardware build robot arm servo 3d printed',
  },
  {
    id: 'r4',
    cluster: 'robotics',
    label: 'mecanum car · steppers · BT',
    text: 'Mecanum-wheel car: steppers, Arduino, Bluetooth, CNC shield.',
    line: 'A mecanum car on steppers and Bluetooth.',
    tags: 'hardware build robot car',
  },
  {
    id: 'r5',
    cluster: 'robotics',
    label: 'EMG bionic arm',
    text: 'EMG-controlled bionic arm.',
    line: 'An EMG-controlled bionic arm.',
    tags: 'hardware build robot arm',
  },
  {
    id: 'r6',
    cluster: 'robotics',
    label: 'Core XY machine · paper',
    text: 'Core XY retail and warehouse item-retrieval machine (steppers, timing belts, Arduino, ESP32). IIT Hack4SDG state-level special mention, and a published research paper at a national conference on the Core XY mechanism.',
    line: 'I published a paper on my Core XY machine.',
    tags: 'hardware build research paper machine award',
  },
  {
    id: 'r7',
    cluster: 'robotics',
    label: '3D printing · ~1 year',
    text: 'About a year of 3D printing: repairing printers, modelling, slicing, tuning.',
    line: 'About a year of 3D printing, repairs included.',
    tags: 'hardware build printer',
  },
  {
    id: 'r8',
    cluster: 'robotics',
    label: 'SolidWorks · PCB · ESP32 · Jetson',
    text: 'SolidWorks, Onshape, soldering, basic PCB design, Arduino, ESP32, Jetson Nano, I2C and SPI.',
    line: 'SolidWorks, soldering, ESP32, Jetson Nano.',
    tags: 'hardware skills electronics cad',
  },
  {
    id: 'r9',
    cluster: 'robotics',
    label: 'ISRO rover · top 50 India',
    text: 'ISRO Rover Competition, top 50 all-India.',
    line: 'Top 50 in India at the ISRO Rover Competition.',
    tags: 'hardware award competition rover',
  },

  // ── foundations
  {
    id: 'f1',
    cluster: 'foundations',
    label: 'DeltaX · Hyderabad · Jan–Jul 2025',
    text: 'Associate Software Product Engineer Intern at DeltaX, Hyderabad, Jan to Jul 2025.',
    line: 'I started as a backend intern at DeltaX.',
    tags: 'start first job intern internship backend',
  },
  {
    id: 'f2',
    cluster: 'foundations',
    label: 'IMDB-style catalogue · BookSwap',
    text: 'Two backends: an IMDB-style catalogue and BookSwap, a book marketplace, in C#/ASP.NET Core and SQL Server.',
    line: 'Two backends: a catalogue and BookSwap.',
    tags: 'start backend shipped built api',
  },
  {
    id: 'f3',
    cluster: 'foundations',
    label: '20+ REST endpoints · C·S·R layers',
    text: '20+ REST endpoints in Controller, Service and Repository layers.',
    line: '20+ REST endpoints between them.',
    tags: 'start backend api design',
  },
  {
    id: 'f4',
    cluster: 'foundations',
    label: 'history-based recommender',
    text: 'A history-based recommendation engine.',
    line: 'A recommender built on user history.',
    tags: 'start backend built',
  },
  {
    id: 'f5',
    cluster: 'foundations',
    label: 'system design · OOD · DSA',
    text: 'System design, OOD, DSA, deep-learning concepts.',
    line: 'System design, OOD, DSA, deep learning.',
    tags: 'skills fundamentals',
  },
  {
    id: 'f6',
    cluster: 'foundations',
    label: 'Docker · Git · Claude Code · Cursor',
    text: 'Docker, Git, Cursor, Claude Code, Copilot.',
    line: 'Docker, Git, Claude Code, Cursor.',
    tags: 'skills tools stack',
  },

  // ── tsig
  {
    id: 't1',
    cluster: 'tsig',
    label: 'Vice Chair & Tech Lead · 2022–25',
    text: 'TSIG engineering club at MJCET: joined in 2nd year in robotics, became Vice Chair and Technical Lead, 2022 to 2025.',
    line: 'I joined for robotics and became Vice Chair.',
    tags: 'lead leadership club led team tsig',
  },
  {
    id: 't2',
    cluster: 'tsig',
    label: '30 members · 10+ projects',
    text: 'Led a 30-member club with 10+ concurrent projects across AI, web and robotics.',
    line: 'I led 30 members on 10+ projects at once.',
    tags: 'tsig club lead leadership led team hire',
  },
  {
    id: 't3',
    cluster: 'tsig',
    label: '4 pm → 9–10 pm',
    text: 'Classes ended at 4pm; the club worked until 9 to 10pm.',
    line: "Classes ended at four. That's when we started.",
    tags: 'tsig club team work ethic',
  },
  {
    id: 't4',
    cluster: 'tsig',
    label: '+25% completion rate',
    text: 'Raised project completion rate by 25%.',
    line: 'Project completion went up 25%.',
    tags: 'tsig club lead results impact',
  },
  {
    id: 't5',
    cluster: 'tsig',
    label: 'internship · workshop · mentoring',
    text: 'Ran a month-long front-end virtual internship for juniors and an electronics workshop; mentored juniors on placements.',
    line: 'I ran an internship and a workshop for juniors.',
    tags: 'tsig club teach mentor juniors lead',
  },

  // ── background
  {
    id: 'b1',
    cluster: 'background',
    label: 'Dubai → Hyderabad → Dubai',
    text: 'School in Dubai till 10th (New Indian Model School, CBSE 92%); 11th and 12th in Hyderabad (94%); now Dubai.',
    line: 'Dubai, then Hyderabad, then Dubai again.',
    tags: 'from where grew up school home origin',
  },
  {
    id: 'b2',
    cluster: 'background',
    label: 'B.E. CSE · MJCET · 2025 · 8.27',
    text: 'B.E. Computer Science and Engineering, MJCET, Osmania University, Hyderabad, 2025, GPA 8.27.',
    line: 'B.E. Computer Science, Osmania University, 2025. GPA 8.27.',
    tags: 'education degree college university study gpa grade',
  },
  {
    id: 'b3',
    cluster: 'background',
    label: 'HackRevolution · winner',
    text: 'HackRevolution hackathon winner.',
    line: 'I won HackRevolution.',
    tags: 'award hackathon win',
  },
  {
    id: 'b4',
    cluster: 'background',
    label: 'inter-club debate champion',
    text: 'Inter-club debate champion.',
    line: 'Inter-club debate champion.',
    tags: 'award debate speak',
  },

  // ── contact
  {
    id: 'c1',
    cluster: 'contact',
    label: 'email',
    text: `Email ${profile.email}.`,
    line: profile.email,
    tags: 'contact reach email hire',
    href: `mailto:${profile.email}`,
  },
  {
    id: 'c2',
    cluster: 'contact',
    label: 'phone',
    text: `Phone ${profile.phone}, Dubai.`,
    line: profile.phone,
    tags: 'contact reach phone call',
    href: `tel:${profile.phone.replace(/\s/g, '')}`,
  },
  {
    id: 'c3',
    cluster: 'contact',
    label: 'github',
    text: 'GitHub github.com/MIbrahim-Nasir.',
    line: 'github.com/MIbrahim-Nasir',
    tags: 'contact code github',
    href: profile.github,
  },
  {
    id: 'c4',
    cluster: 'contact',
    label: 'linkedin',
    text: 'LinkedIn linkedin.com/in/mohammed-ibrahim-nasir.',
    line: 'linkedin.com/in/mohammed-ibrahim-nasir',
    tags: 'contact reach linkedin',
    href: profile.linkedin,
  },
  {
    id: 'c5',
    cluster: 'contact',
    label: 'resume.pdf',
    text: 'Resume PDF.',
    line: 'resume.pdf',
    tags: 'contact resume cv hire',
    href: profile.resumeUrl,
  },
  {
    id: 'c6',
    cluster: 'contact',
    label: 'open to AI roles · remote / UAE',
    text: 'Open to AI engineering roles, remote or UAE.',
    line: 'Open to AI roles, remote or in the UAE.',
    tags: 'contact hire available roles job',
  },
];

export const FACT_INDEX: Record<string, number> = Object.fromEntries(
  FACTS.map((f, i) => [f.id, i])
);

// ── The default story: ten runs the system plays before you ask anything.
export type Beat = {
  id: string;
  prompt: string;
  chip: string;
  filter?: ClusterId;
  k?: number;
  /** system beat: fixed lines, still cited and evaluated */
  system?: { text: string; cite: string }[];
};

export const BEATS: Beat[] = [
  {
    id: 'sys',
    prompt: 'system',
    chip: 'System',
    system: [
      { text: 'You are Ibrahim, an AI Engineer in Dubai.', cite: 'i1' },
      { text: 'You build in hardware, code and AI.', cite: 'i2' },
      { text: 'You learn the core of a field, then build.', cite: 'i3' },
      { text: "You stay on a problem until it's solved.", cite: 'i5' },
    ],
  },
  { id: 'who', prompt: 'Who is he?', chip: 'Who', filter: 'identity', k: 3 },
  {
    id: 'now',
    prompt: 'What does he do now?',
    chip: 'Now',
    filter: 'ai',
    k: 4,
  },
  {
    id: 'how',
    prompt: 'How is SAIF built?',
    chip: 'How it works',
    filter: 'ai',
    k: 3,
  },
  {
    id: 'ship',
    prompt: 'What else has he shipped?',
    chip: 'Shipped',
    filter: 'ai',
    k: 3,
  },
  {
    id: 'hw',
    prompt: 'Does he build hardware?',
    chip: 'Hardware',
    filter: 'robotics',
    k: 4,
  },
  {
    id: 'start',
    prompt: 'Where did he start?',
    chip: 'Foundations',
    filter: 'foundations',
    k: 3,
  },
  {
    id: 'lead',
    prompt: 'Has he led a team?',
    chip: 'TSIG',
    filter: 'tsig',
    k: 3,
  },
  {
    id: 'from',
    prompt: 'Where is he from?',
    chip: 'Background',
    filter: 'background',
    k: 3,
  },
  {
    id: 'reach',
    prompt: 'How do I reach him?',
    chip: 'Contact',
    filter: 'contact',
    k: 4,
  },
];

export const SUGGESTED = [
  'Who is he?',
  'What has he shipped?',
  'Does he build hardware?',
  'Why should we hire him?',
];
