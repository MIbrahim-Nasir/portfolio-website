/*
  The resume, as a print job. Each chapter is one object on the plate.
  - `tags` are pinned to real points on the printed part (part-local mm, z up)
    and only firm up once the nozzle has reached that height.
  - `story` lines are G-code comments: they stream with the layers and run as
    the ticker under the printer.
  - `material` is the per-object setting: the stack that part was built with.
  Facts only from the brief; nothing here is invented.
*/

export type Tag = { at: [number, number, number]; k: string; v?: string };

export type Chapter = {
  id: string;
  file: string;
  nav: string;
  /** 'red' forces an M600 to PLA Signal Red before this part */
  color: 'any' | 'red';
  /** where the card's leader line lands, part-local mm */
  anchor: [number, number, number];
  kicker: string;
  title: string;
  line?: string;
  facts?: { k: string; v: string }[];
  tags: Tag[];
  story: string[];
  material: string;
  /** what the layer slider calls a height on this part */
  zLabel?: (z: number) => string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: 'who',
    file: 'nameplate.stl',
    nav: 'Who',
    color: 'any',
    anchor: [6, 21.5, 4.05],
    kicker: 'AI Engineer · Dubai',
    title: 'Mohammed Ibrahim Nasir',
    line: 'Mechanics. Electronics. Code. AI.',
    tags: [
      { at: [62, 16, 4.05], k: 'Agentic AI', v: 'RAG · LLM systems · Python' },
      { at: [64, 5, 2.6], k: 'Method', v: 'learn the core, then build' },
      {
        at: [72, 1.5, 1.55],
        k: '~1 year',
        v: 'of printers: repair, model, slice, tune',
      },
    ],
    story: [
      '; who: Mohammed Ibrahim Nasir',
      '; studied CS. never stayed in software',
      '; mechanics · electronics · robotics · code · AI',
      '; I don’t drop a problem until it’s solved',
      '; psst: the terminal takes G28 and M600',
    ],
    material: 'PLA Bone · 0.25 mm layers · 2 walls',
  },
  {
    id: 'now',
    file: 'saif_report.stl',
    nav: 'SAIF',
    color: 'any',
    anchor: [6, 40, 16.05],
    kicker: 'Now · AI Developer, R&D · Ducon Industries · since Aug 2025',
    title: 'SAIF AI Designer, live on WhatsApp.',
    line: 'Send a photo of your space; get back a rendered outdoor design and a bill of quantities.',
    tags: [
      {
        at: [56, 41, 3.8],
        k: '57',
        v: 'client designs, first 4 weeks, before launch',
      },
      { at: [55, 24, 3.8], k: '40', v: 'internal users · sales, design, R&D' },
      {
        at: [32, 32, 16.05],
        k: 'Real catalogue',
        v: 'only real, sellable products',
      },
      { at: [56, 9, 3.8], k: '−35%', v: 'designer time per client session' },
      { at: [24, 9, 3.8], k: '20+ → 5–7 min', v: 'per design, ~70% faster' },
    ],
    story: [
      '; SAIF: photo in, design + BOQ out',
      '; planner agent: real, sellable catalogue products only',
      '; structured + semantic RAG over PostgreSQL / pgvector',
      '; strict JSON schemas · code + LLM validation nodes',
      '; generate → evaluate → regenerate',
      '; generation time: 20+ min → 5–7 min',
      '; parallel nodes · thinking tuned per node · Gemini Flash',
      '; feedback → edit-generations, multi-step, night view',
      '; evals traced in LangSmith + Langfuse before release',
      '; ChromaDB search over thousands of images',
      '; 100+ manual hours automated · I own the deploys',
    ],
    material:
      'LangGraph · FastAPI · pgvector · ChromaDB · Gemini Flash · LangSmith · Langfuse · Railway · R2',
  },
  {
    id: 'robots',
    file: 'arm_link_3rd.stl',
    nav: 'Robots',
    color: 'any',
    anchor: [3, 9, 4.3],
    kicker: 'AI-driven robotics · 3rd place, national hackathon',
    title: 'Gemini picks the move. Arduino makes it.',
    line: 'Some of my code has motors.',
    facts: [
      { k: '4-DOF arm', v: 'printed, servos, IK' },
      { k: 'Mecanum car', v: 'steppers, CNC shield' },
      { k: 'Bionic arm', v: 'EMG-controlled' },
      { k: 'ISRO Rover', v: 'top 50, all-India' },
      { k: 'HackRevolution', v: 'winner' },
    ],
    tags: [
      { at: [9, 13, 7.05], k: 'Sees', v: 'camera frame' },
      {
        at: [27, 12, 5.8],
        k: 'Decides',
        v: 'Gemini vision: grab, shift, place',
      },
      { at: [45, 13, 7.05], k: 'Moves', v: 'Python → pyserial → Arduino' },
    ],
    story: [
      '; frame → Gemini → move → serial',
      '; 4-DOF arm: printed links, servos, inverse kinematics',
      '; mecanum car: steppers, CNC shield, Bluetooth',
      '; bionic arm, driven by EMG',
      '; ISRO Rover Competition: top 50, all-India',
      '; HackRevolution: winner',
    ],
    material: 'Gemini vision · Python · pyserial · Arduino · servos',
  },
  {
    id: 'corexy',
    file: 'corexy_corner.stl',
    nav: 'Core XY',
    color: 'any',
    anchor: [3, 30, 6.05],
    kicker: 'Mechanism · research',
    title: 'A Core XY machine, and a paper on it.',
    line: 'A Core XY machine that fetches items off retail shelves. This printer is Core XY too.',
    facts: [
      { k: 'IIT Hack4SDG', v: 'state-level special mention' },
      { k: 'Paper', v: 'national conference' },
    ],
    tags: [
      { at: [7, 32, 18.05], k: 'Belt B', v: 'idler at 18 mm, its own plane' },
      { at: [31, 9, 12.05], k: 'Belt A', v: 'idler at 12 mm' },
      { at: [22, 7, 6.05], k: 'ΔX = ½(ΔA + ΔB)', v: 'ΔY = ½(ΔA − ΔB)' },
    ],
    story: [
      '; both motors stay put. the belts do the moving',
      '; same direction: X. opposite: Y',
      '; item retrieval for retail and warehouse shelves',
      '; IIT Hack4SDG · state-level special mention',
      '; paper on the mechanism · national conference',
      '; SolidWorks · Onshape · soldering · basic PCB',
    ],
    material:
      'Steppers · timing belts · Arduino · ESP32 · SolidWorks · Onshape',
  },
  {
    id: 'software',
    file: 'stack_and_graph.stl',
    nav: 'Stack',
    color: 'any',
    anchor: [2, 12, 3.05],
    kicker: 'Foundations · DeltaX intern, Hyderabad · Jan–Jul 2025',
    title: 'I started on backends.',
    line: 'Two backends: a film catalogue and BookSwap, with recommendations from history.',
    facts: [
      { k: '20+', v: 'REST endpoints · C# / ASP.NET Core' },
      { k: 'Atomic Sensei', v: 'my architecture and data model' },
    ],
    tags: [
      { at: [16, 7.5, 12.05], k: 'Controller' },
      { at: [17, 5, 9.05], k: 'Service' },
      { at: [17, 2.5, 6.05], k: 'Repository' },
      { at: [17, 0, 3.05], k: 'SQL Server' },
      {
        at: [70.5, 5, 7.05],
        k: 'Atomic Sensei',
        v: 'roadmap, lesson, quiz agents',
      },
    ],
    story: [
      '; DeltaX: an IMDB-style catalogue + BookSwap',
      '; C# / ASP.NET Core · SQL Server',
      '; controller → service → repository',
      '; recommendations from reading history',
      '; Atomic Sensei: roadmap, lesson, quiz-eval agents',
      '; lessons pre-generated async · Supabase cron reminders',
    ],
    material: 'C# · ASP.NET Core · SQL Server · Gemini · Supabase',
  },
  {
    id: 'tsig',
    file: 'tsig_gear_30.stl',
    nav: 'TSIG',
    color: 'any',
    anchor: [0, 18, 4.3],
    kicker: 'TSIG · MJCET engineering club · 2022–25',
    title: 'Classes ended at 4. We stayed till 9 or 10.',
    line: 'I joined as a robotics member and left as Vice Chair.',
    facts: [{ k: 'Vice Chair', v: '& Technical Lead' }],
    tags: [
      { at: [25, 21, 6.05], k: '30', v: 'members led' },
      {
        at: [34, 24, 4.3],
        k: '10+',
        v: 'projects at once · AI, web, robotics',
      },
      { at: [31, 8, 4.3], k: '+25%', v: 'project completion rate' },
      {
        at: [18, 0, 4.3],
        k: 'Juniors',
        v: 'front-end internship · electronics workshop · placements',
      },
    ],
    story: [
      '; 30 members · 10+ concurrent projects',
      '; vice chair + technical lead, 2022–2025',
      '; month-long front-end virtual internship for juniors',
      '; electronics workshop',
      '; mentored juniors on placements',
    ],
    material: 'Robotics · AI · web',
  },
  {
    id: 'route',
    file: 'route_tower.stl',
    nav: 'Route',
    color: 'any',
    anchor: [2, 2.5, 12],
    kicker: 'Background · drag the layer slider',
    title: 'Dubai, Hyderabad, Dubai again.',
    line: 'The tower prints in the order I lived it.',
    tags: [
      { at: [28, 4, 21], k: 'Dubai', v: 'Ducon · Aug 2025 → now' },
      { at: [30, 2.5, 16], k: 'TSIG · DeltaX', v: '2022–25 · 2025' },
      {
        at: [30, 2.5, 12],
        k: 'B.E. CSE',
        v: 'MJCET, Osmania University · 2025 · GPA 8.27',
      },
      { at: [30, 2.5, 8], k: 'Hyderabad', v: '11th–12th · 94%' },
      { at: [32, 1, 3], k: 'Dubai', v: 'school to 10th · CBSE 92%' },
    ],
    story: [
      '; DXB → HYD → DXB',
      '; New Indian Model School, Dubai · CBSE 92%',
      '; 11th–12th, Hyderabad · 94%',
      '; B.E. Computer Science & Engineering · MJCET · 2025',
      '; inter-club debate champion',
      '; back to Dubai: Ducon, Aug 2025',
    ],
    material: 'PLA Bone · three tiers · embossed fronts',
    zLabel: (z) => (z <= 6.05 ? 'DXB' : z <= 18.05 ? 'HYD' : 'DXB'),
  },
  {
    id: 'contact',
    file: 'at.stl',
    nav: 'Contact',
    color: 'red',
    anchor: [0, 15, 5.05],
    kicker: 'M600 · PLA Bone → PLA Signal Red',
    title: 'Get in touch.',
    line: 'Open to AI engineering roles, remote or in the UAE.',
    tags: [
      { at: [27, 22, 5.05], k: 'PLA Signal Red', v: 'loaded at the M600' },
    ],
    story: [
      '; M600 · PLA Bone → PLA Signal Red',
      '; open to AI engineering roles · remote or UAE',
      '; email, LinkedIn and phone are on the card',
    ],
    material: 'PLA Signal Red',
  },
];

/** the end-of-file settings block: the toolkit, as slicer config */
export const CONFIG: [string, string][] = [
  [
    'ai',
    'LangGraph, LangChain, RAG, agentic workflows, prompt + context engineering, LLM evaluation, LangSmith, Langfuse, Claude / Gemini / OpenAI APIs, image models, embeddings',
  ],
  ['data', 'PostgreSQL / pgvector, ChromaDB, SQL Server, Supabase'],
  ['backend', 'Python (FastAPI), REST API design, C# / ASP.NET Core'],
  [
    'ship',
    'Railway, Docker, VPS, Cloudflare R2, Git, Cursor, Claude Code, Copilot',
  ],
  ['craft', 'system design, OOD, DSA, deep-learning concepts, robotics'],
  [
    'hardware',
    'SolidWorks, Onshape, Arduino, ESP32, Jetson Nano, I2C / SPI, soldering, basic PCB design',
  ],
];

/** the hidden part */
export const BENCHY_TAG: Tag = {
  at: [30, 6.5, 6],
  k: '3DBenchy',
  v: 'everyone’s first torture test',
};
