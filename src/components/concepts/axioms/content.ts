// Chapters, figure facts and the index. Facts only from the concept brief / profile.ts.
// An axiom is written with *one* emphasised word.

export type ChapterMeta = {
  id: string;
  numeral: string;
  title: string;
  axiom: string;
};

export const CHAPTERS: ChapterMeta[] = [
  {
    id: 'tolerance',
    numeral: 'I',
    title: 'Tolerance',
    axiom: 'No render reaches a client *unchecked.*',
  },
  {
    id: 'constraint',
    numeral: 'II',
    title: 'Constraint',
    axiom: 'Every design uses products Ducon *sells.*',
  },
  {
    id: 'feedback',
    numeral: 'III',
    title: 'Feedback',
    axiom: 'Every arm move starts from a camera *frame.*',
  },
  {
    id: 'persistence',
    numeral: 'IV',
    title: 'Persistence',
    axiom: 'I kept cutting until 20+ minutes became *5–7.*',
  },
  {
    id: 'abstraction',
    numeral: 'V',
    title: 'Abstraction',
    axiom: 'Backends at DeltaX came before the *agents.*',
  },
  {
    id: 'first-principles',
    numeral: 'VI',
    title: 'First principles',
    axiom: 'Core XY: built the machine, published the *paper.*',
  },
  {
    id: 'transmission',
    numeral: 'VII',
    title: 'Transmission',
    axiom: 'I led 30 members on 10+ projects at *once.*',
  },
];

export const EIGHTH = {
  id: 'damping',
  numeral: 'VIII',
  title: 'Damping',
  axiom: 'ζ = 1: fastest to target, no *overshoot.*',
};

// Screen-reader versions of each figure's annotations (same facts, in order).
export const FACTS: Record<string, string[]> = {
  tolerance: [
    'SAIF AI Designer, Ducon Industries R&D team, Dubai, August 2025 to now.',
    'A client sends a photo of their space on WhatsApp and gets a rendered outdoor design and a bill of quantities.',
    '57 client designs in the first four weeks, before the marketing launch.',
    'Every generation is checked: strict JSON schemas, code and LLM validation nodes; images that drift are regenerated.',
    'Models are benchmarked on an evaluation dataset, with runs traced in LangSmith and Langfuse.',
  ],
  constraint: [
    'SAIF’s planner agent grounds every design in Ducon’s real catalogue with structured and semantic RAG over PostgreSQL and pgvector.',
    'Constraints: in the catalogue, fits the space, sellable. Renders and BOQs only use real products.',
    'Pipelines turned unstructured project images and documents into a structured, embedded design library.',
    'FastAPI and ChromaDB semantic search over thousands of images.',
    'Automation scripts saved 100+ manual hours.',
  ],
  feedback: [
    'AI-driven robotics: a robotic arm controlled by a vision LLM, 3rd place at a national hackathon.',
    'Camera sees a frame, Gemini decides the move (grab, shift, place), Python sends it over serial with pyserial, Arduino moves the servos.',
    'The step response is a second-order model of the loop; drag the gain K to change its damping.',
  ],
  persistence: [
    'SAIF generation time per design fell from 20+ minutes to 5–7 minutes, about 70% faster.',
    'Steps: parallel agent nodes, thinking level tuned per node, a move to Gemini Flash, deterministic logic moved from LLMs into code.',
    'Designers spend 35% less time per client session.',
  ],
  abstraction: [
    'DeltaX, Hyderabad, January to July 2025: two backends, BookSwap and an IMDB-style catalogue, in C#, ASP.NET Core and SQL Server.',
    '20+ REST endpoints in controller, service and repository layers; a history-based recommendation engine.',
    'SAIF at Ducon: WhatsApp client, FastAPI, a LangGraph multi-agent pipeline, pgvector catalogue RAG; deployed on Railway, a VPS and Cloudflare R2.',
    '40 internal users across sales, design and R&D; their feedback became edit-generations, multi-step generation and night-view renders.',
  ],
  'first-principles': [
    'Mechanics: Core XY item-retrieval machine, a published paper at a national conference and an IIT Hack4SDG special mention; 4-DOF arm with inverse kinematics; ISRO Rover Competition top 50 all-India.',
    'Electronics: EMG-controlled bionic arm; mecanum-wheel car on steppers and a CNC shield; Arduino, ESP32, Jetson Nano, I2C, SPI, soldering, basic PCB design; SolidWorks, Onshape; about a year of 3D printing.',
    'Code: B.E. Computer Science and Engineering, MJCET, Osmania University, 2025, GPA 8.27; HackRevolution hackathon winner; now an AI engineer.',
  ],
  transmission: [
    'TSIG, MJCET’s engineering club: joined in robotics, became Vice Chair and Technical Lead, 2022 to 2025.',
    'Led 30 members across 10+ concurrent projects in AI, web and robotics; project completion rate up 25%.',
    'Classes ended at 4pm; the club worked until 9 or 10pm.',
    'Ran a month-long front-end virtual internship and an electronics workshop; mentored juniors on placements.',
    'Atomic Sensei: designed the architecture and data model of a multi-agent learning platform with roadmap, lesson and quiz agents on Gemini, async lesson generation and Supabase cron reminders.',
  ],
};

// A treatise has an index. Every skill points at the figure where it is used.
export const INDEX: [string, string][] = [
  ['Agentic workflows', 'I, II, V'],
  ['Arduino', 'III, VI'],
  ['ASP.NET Core, C#', 'V'],
  ['ChromaDB', 'II'],
  ['Claude, Gemini, OpenAI APIs', 'III, IV, VII'],
  ['Claude Code, Cursor, Copilot', 'passim'],
  ['Cloudflare R2', 'V'],
  ['Data structures & algorithms', 'VI'],
  ['Deep-learning concepts', 'passim'],
  ['Docker, Git', 'passim'],
  ['Embeddings', 'II'],
  ['ESP32, Jetson Nano', 'VI'],
  ['FastAPI', 'II, V'],
  ['I²C, SPI', 'VI'],
  ['Image-generation models', 'I'],
  ['LangChain, LangGraph', 'V'],
  ['LangSmith, Langfuse', 'I'],
  ['LLM evaluation', 'I'],
  ['Object-oriented design', 'V, VI'],
  ['PCB design, soldering', 'VI'],
  ['PostgreSQL, pgvector', 'II, V'],
  ['Prompt & context engineering', 'IV'],
  ['Python', 'III, V'],
  ['RAG', 'II'],
  ['Railway, VPS', 'V'],
  ['REST API design', 'V'],
  ['Robotics', 'III, VI'],
  ['SolidWorks, Onshape', 'VI'],
  ['SQL Server', 'V'],
  ['Supabase', 'VII'],
  ['System design', 'V, VI'],
  ['3D printing', 'VI'],
];

export const NUMERAL_ID: Record<string, string> = Object.fromEntries(
  [...CHAPTERS, EIGHTH].map((c) => [c.numeral, c.id])
);
