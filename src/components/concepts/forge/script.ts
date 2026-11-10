// The whole resume, as the bench sees it. Step 0 is the operator on an empty stand,
// 1–6 seat one module each (module index = step − 1), 7 is suit-up / contact.
// Every fact here lives on the hologram: a panel anchored to its module, part tags on
// sub-parts, and a short exchange between Rivet (the bench drone) and Ibrahim.

export type V3 = [number, number, number];
/** md: extra distance on a phone, where the model sits in the band between panel and dialogue */
export type Cam = { t: V3; d: number; yaw: number; pitch: number; md: number };

/** a point on the suit: module index, piece index, world position when seated. mi −1 = static world point */
export type Pin = { mi: number; piece: number; p: V3 };

export type Tag = Pin & { label: string; dx: number; dy: number; m?: boolean };

export type Row = {
  k: string;
  v: string;
  /** a big dot-matrix number in front of the value */
  big?: string;
  n?: string;
  /** gauge, as [from, to] fractions: the bar sweeps from one to the other when the module seats */
  g?: [number, number];
  /** a lit span on a 24 h dial, as fractions of the day */
  span?: [number, number];
  live?: 'xy' | 'grip';
  /** keep on the compact (phone) panel */
  m?: boolean;
};

export type Who = 'rivet' | 'me';
export type Line = { who: Who; text: string };

export type Step = {
  key: string;
  code: string;
  name: string;
  domain: string;
  status: string;
  meta?: string;
  title: string;
  support?: string;
  rows: Row[];
  chain?: string[];
  chips?: { k: string; items: string[] }[];
  lines: Line[];
  tags: Tag[];
  anchor: Pin;
  /** what Rivet inspects (defaults to the module's own anchor) */
  inspect?: Pin;
  cam: Cam;
};

export const STEPS: Step[] = [
  {
    key: 'operator',
    code: 'M00',
    name: 'Operator',
    domain: 'Dubai, UAE',
    status: 'STANDBY',
    title: 'Mechanics, electronics, code, AI.',
    support: 'Robot arms first. AI agents now.',
    rows: [
      { k: 'ROLE', v: 'AI Engineer · agentic AI, RAG, LLM systems', m: true },
      { k: 'NOW', v: 'AI Developer · R&D · Ducon Industries', m: true },
    ],
    lines: [
      { who: 'rivet', text: 'Operator on the bench.' },
      { who: 'me', text: 'Lights down. Start with the core.' },
    ],
    tags: [
      {
        mi: 0,
        piece: 0,
        p: [0.1, 1.48, 0.1],
        label: 'M01 CORE',
        dx: 18,
        dy: -16,
        m: true,
      },
      {
        mi: 1,
        piece: 0,
        p: [0.07, 1.91, 0.15],
        label: 'M02 SENSOR',
        dx: 18,
        dy: -16,
        m: true,
      },
      {
        mi: 2,
        piece: 0,
        p: [0, 1.45, -0.16],
        label: 'M03 SPINE',
        dx: -20,
        dy: 34,
      },
      {
        mi: 3,
        piece: 3,
        p: [0.46, 1.17, 0.07],
        label: 'M04 ARMS',
        dx: 18,
        dy: 16,
        m: true,
      },
      {
        mi: 4,
        piece: 0,
        p: [0.82, 1.95, 0.35],
        label: 'M05 GANTRY',
        dx: 14,
        dy: -16,
      },
      {
        mi: 5,
        piece: 2,
        p: [0.2, 0.54, 0.05],
        label: 'M06 LEGS',
        dx: 18,
        dy: 16,
        m: true,
      },
    ],
    anchor: { mi: -1, piece: 0, p: [-0.95, 0.02, 0.55] },
    cam: { t: [0, 1.2, 0], d: 6.3, yaw: 0.55, pitch: 0.1, md: 1.75 },
  },
  {
    key: 'core',
    code: 'M01',
    name: 'Power core',
    domain: 'Identity',
    status: 'ONLINE · 4/4 CELLS',
    title: 'I’ve built in all four fields.',
    rows: [
      {
        k: 'CELL A',
        v: 'Mechanics · SolidWorks · Onshape · 3D printing',
        g: [0, 1],
        m: true,
      },
      {
        k: 'CELL B',
        v: 'Electronics · Arduino · ESP32 · Jetson · I2C/SPI',
        g: [0, 1],
        m: true,
      },
      {
        k: 'CELL C',
        v: 'Code · Python · FastAPI · C# · SQL · system design',
        g: [0, 1],
        m: true,
      },
      {
        k: 'CELL D',
        v: 'AI · LangGraph · RAG · agents · LLM eval',
        g: [0, 1],
        m: true,
      },
      { k: 'BUS', v: 'Thinks in 3D · the vision arm used all four' },
    ],
    lines: [
      { who: 'rivet', text: 'Four cells. Which one is the main?' },
      { who: 'me', text: 'Depends on the job. Some need all four.' },
      { who: 'rivet', text: 'And if it won’t solve?' },
      { who: 'me', text: 'It stays on the bench until it does.' },
    ],
    tags: [
      {
        mi: 0,
        piece: 1,
        p: [-0.069, 1.5, 0.08],
        label: 'A · MECHANICS',
        dx: 190,
        dy: -84,
        m: true,
      },
      {
        mi: 0,
        piece: 1,
        p: [-0.023, 1.47, 0.08],
        label: 'B · ELECTRONICS',
        dx: 160,
        dy: -30,
        m: true,
      },
      {
        mi: 0,
        piece: 1,
        p: [0.023, 1.4, 0.08],
        label: 'C · CODE',
        dx: 130,
        dy: 24,
        m: true,
      },
      {
        mi: 0,
        piece: 1,
        p: [0.069, 1.36, 0.08],
        label: 'D · AI',
        dx: 100,
        dy: 78,
        m: true,
      },
    ],
    anchor: { mi: 0, piece: 0, p: [-0.13, 1.42, 0.08] },
    cam: { t: [0, 1.4, 0], d: 2.3, yaw: 0.4, pitch: 0.06, md: 1.3 },
  },
  {
    key: 'sensor',
    code: 'M02',
    name: 'Sensor mast',
    domain: 'AI systems',
    status: 'ONLINE',
    meta: 'AI Developer · R&D · Ducon Industries · Dubai · Aug 2025 – now',
    title: 'Clients send a photo. SAIF sends back a design.',
    support: '57 client designs in four weeks, before the marketing launch.',
    rows: [
      {
        k: 'SAIF',
        v: 'AI Designer · live on WhatsApp · photo in, design + BOQ out',
        m: true,
      },
      { k: 'DESIGNS', big: '57', v: 'client designs · first 4 weeks', m: true },
      { k: 'GEN TIME', v: '20+ → 5–7 min', n: '−70%', g: [1, 0.33], m: true },
      {
        k: 'DESIGNER',
        v: '−35% designer time per client session',
        g: [1, 0.65],
      },
      { k: 'USERS', big: '40', v: 'internal · sales · design · R&D' },
    ],
    chain: ['photo', 'planner', 'catalogue RAG', 'render', 'evaluate ↺', 'BOQ'],
    chips: [
      {
        k: 'STACK',
        items: [
          'LangGraph',
          'FastAPI',
          'pgvector',
          'strict JSON',
          'Gemini Flash',
          'LangSmith',
          'Langfuse',
        ],
      },
      {
        k: 'FEEDBACK → FEATURES',
        items: ['edit-generations', 'multi-step', 'night-view renders'],
      },
      {
        k: 'INFRA',
        items: [
          'ChromaDB search · 1000s of images',
          '100+ hrs automated',
          'Railway · VPS · R2',
        ],
      },
      {
        k: 'AUX · ATOMIC SENSEI',
        items: ['roadmap · lesson · quiz agents', 'Gemini', 'Supabase cron'],
      },
    ],
    lines: [
      { who: 'rivet', text: 'Generation time?' },
      { who: 'me', text: 'Five to seven minutes. It was over twenty.' },
      { who: 'rivet', text: 'Product list?' },
      { who: 'me', text: 'Straight from Ducon’s catalogue. All sellable.' },
    ],
    tags: [
      {
        mi: 1,
        piece: 0,
        p: [0.14, 2.17, -0.11],
        label: 'AUX · ATOMIC SENSEI',
        dx: 70,
        dy: -40,
      },
      {
        mi: 1,
        piece: 1,
        p: [0.042, 2.065, -0.01],
        label: 'LIDAR · CATALOGUE RAG',
        dx: 130,
        dy: 6,
        m: true,
      },
      {
        mi: 1,
        piece: 0,
        p: [0.155, 1.93, 0],
        label: 'HOOP · EVAL → REGEN',
        dx: 120,
        dy: 52,
      },
      {
        mi: 1,
        piece: 0,
        p: [0.068, 1.9, 0.177],
        label: 'CAM · CLIENT PHOTO',
        dx: 90,
        dy: 96,
        m: true,
      },
    ],
    anchor: { mi: 1, piece: 0, p: [-0.105, 1.9, 0.135] },
    cam: { t: [0, 1.92, 0], d: 2.2, yaw: -0.5, pitch: 0.14, md: 1.3 },
  },
  {
    key: 'spine',
    code: 'M03',
    name: 'Spine & harness',
    domain: 'Foundations',
    status: 'CONTINUITY OK',
    meta: 'Assoc. Software Product Engineer Intern · DeltaX · Hyderabad · Jan – Jul 2025',
    title: 'Two REST backends, before the agents.',
    rows: [
      {
        k: 'BACKENDS',
        big: '2',
        v: 'IMDB-style catalogue · BookSwap marketplace',
        m: true,
      },
      {
        k: 'ENDPOINTS',
        big: '20+',
        v: 'REST · C# / ASP.NET Core · SQL Server',
        m: true,
      },
      { k: 'ENGINE', v: 'History-based recommendations' },
    ],
    chips: [
      {
        k: 'HARNESS · TOOLKIT',
        items: [
          'LangGraph',
          'LangChain',
          'RAG',
          'LLM eval',
          'Claude · Gemini · OpenAI',
          'embeddings',
          'Python',
          'PostgreSQL',
          'ChromaDB',
          'Supabase',
          'Docker',
          'Claude Code',
          'Cursor',
          'OOD · DSA',
        ],
      },
    ],
    lines: [
      { who: 'rivet', text: 'The spine is older than the rest.' },
      { who: 'me', text: 'DeltaX, early 2025. The agents came after.' },
      { who: 'rivet', text: 'Continuity?' },
      {
        who: 'me',
        text: 'Controller, service, repository, SQL Server. 20+ endpoints.',
      },
    ],
    tags: [
      {
        mi: 2,
        piece: 0,
        p: [-0.085, 1.65, -0.13],
        label: 'L1 · CONTROLLER',
        dx: 110,
        dy: -12,
        m: true,
      },
      {
        mi: 2,
        piece: 0,
        p: [-0.085, 1.45, -0.13],
        label: 'L2 · SERVICE',
        dx: 110,
        dy: -4,
        m: true,
      },
      {
        mi: 2,
        piece: 0,
        p: [-0.085, 1.25, -0.13],
        label: 'L3 · REPOSITORY',
        dx: 110,
        dy: 4,
        m: true,
      },
      {
        mi: 2,
        piece: 0,
        p: [-0.085, 1.05, -0.13],
        label: 'L4 · SQL SERVER',
        dx: 110,
        dy: 12,
        m: true,
      },
    ],
    anchor: { mi: 2, piece: 0, p: [0.1, 1.55, -0.15] },
    cam: { t: [0, 1.32, -0.1], d: 2.9, yaw: 2.45, pitch: 0.1, md: 1.25 },
  },
  {
    key: 'arms',
    code: 'M04',
    name: 'Forearm actuators',
    domain: 'Robotics',
    status: 'GRIP TEST',
    meta: 'Hackathons · TSIG bench',
    title: 'Some of my code has motors.',
    rows: [
      {
        k: 'VISION ARM',
        big: '3rd',
        v: 'national hackathon · Gemini as the eyes',
        m: true,
      },
      { k: 'GRIP', v: 'grab', live: 'grip', m: true },
      { k: 'BUILT', v: '4-DOF arm · IK · servos · 3D printed', m: true },
      { k: 'ALSO', v: 'EMG bionic arm · mecanum car on steppers + Bluetooth' },
    ],
    chain: ['camera frame', 'Gemini', 'Python', 'pyserial', 'Arduino'],
    chips: [
      {
        k: 'BENCH',
        items: [
          'SolidWorks',
          'Onshape',
          'soldering',
          'PCB basics',
          'ESP32',
          'Jetson Nano',
          'CNC shield',
        ],
      },
    ],
    lines: [
      { who: 'rivet', text: 'Who is driving the arm?' },
      { who: 'me', text: 'Gemini. It reads the camera and picks the move.' },
      { who: 'rivet', text: 'Result?' },
      { who: 'me', text: 'Third place at a national hackathon.' },
    ],
    tags: [
      {
        mi: 3,
        piece: 2,
        p: [0.47, 1.69, -0.07],
        label: '4-DOF · INVERSE KINEMATICS',
        dx: 70,
        dy: -50,
      },
      {
        mi: 3,
        piece: 2,
        p: [0.5, 1.33, -0.025],
        label: 'SERVO · ARDUINO SERIAL',
        dx: 90,
        dy: -6,
        m: true,
      },
      {
        mi: 3,
        piece: 3,
        p: [0.465, 0.93, 0.14],
        label: 'GRIPPER · GEMINI DECIDES',
        dx: 80,
        dy: 44,
        m: true,
      },
    ],
    anchor: { mi: 3, piece: 3, p: [0.42, 1.12, 0.08] },
    cam: { t: [0.24, 1.28, 0], d: 2.6, yaw: -0.75, pitch: 0.06, md: 1.45 },
  },
  {
    key: 'gantry',
    code: 'M05',
    name: 'Core XY gantry',
    domain: 'Mechanism · research',
    status: 'HOMED',
    meta: 'Item-retrieval machine · retail & warehouse shelves',
    title: 'Two fixed motors drive one carriage.',
    rows: [
      { k: 'LIVE', v: '—', live: 'xy', m: true },
      { k: 'PAPER', v: 'Core XY mechanism · national conference', m: true },
      {
        k: 'AWARD',
        v: 'IIT Hack4SDG · state level · special mention',
        m: true,
      },
      { k: 'DRIVE', v: 'Steppers · timing belts · Arduino · ESP32' },
      { k: 'PRINT', v: '~1 yr of 3D printing · repair · model · slice · tune' },
    ],
    lines: [
      { who: 'rivet', text: 'This stand looks familiar.' },
      { who: 'me', text: 'It should. I published a paper on it.' },
    ],
    tags: [
      {
        mi: 4,
        piece: 0,
        p: [-0.82, 2.45, -0.56],
        label: 'MOTOR A · FIXED',
        dx: -20,
        dy: -46,
        m: true,
      },
      {
        mi: 4,
        piece: 0,
        p: [0.82, 2.45, -0.56],
        label: 'MOTOR B · FIXED',
        dx: 40,
        dy: -46,
        m: true,
      },
      {
        mi: 4,
        piece: 2,
        p: [0, 2.3, 0],
        label: 'CARRIAGE · x, y',
        dx: 70,
        dy: 40,
      },
    ],
    anchor: { mi: 4, piece: 0, p: [-0.82, 1.5, 0.35] },
    inspect: { mi: 4, piece: 2, p: [0, 2.2, 0] },
    cam: { t: [0, 1.5, -0.1], d: 5.4, yaw: 0.62, pitch: 0.34, md: 1.8 },
  },
  {
    key: 'legs',
    code: 'M06',
    name: 'Legs & lift fans',
    domain: 'Leadership · background',
    status: 'LIFT NOMINAL',
    meta: 'Vice Chair & Technical Lead · TSIG · MJCET · 2022 – 2025',
    title: 'Classes ended at four. We stayed till nine or ten.',
    rows: [
      { k: 'CREW', big: '30', v: 'members · one engineering club', m: true },
      {
        k: 'PROJECTS',
        big: '10+',
        v: 'concurrent · AI · web · robotics',
        m: true,
      },
      { k: 'COMPLETION', big: '+25%', v: 'project completion rate' },
      {
        k: 'HOURS',
        v: '16:00 class ends → 21:00–22:00',
        span: [16 / 24, 22 / 24],
        m: true,
      },
      {
        k: 'TAUGHT',
        v: '1-month front-end internship · electronics workshop · placements',
      },
    ],
    chips: [
      {
        k: 'ROUTE',
        items: [
          'Dubai · CBSE 92%',
          'Hyderabad · 94%',
          'B.E. CSE · MJCET · Osmania · 2025 · GPA 8.27',
          'Dubai · Ducon',
        ],
      },
      {
        k: 'ALSO',
        items: [
          'ISRO Rover · top 50 all-India',
          'HackRevolution · winner',
          'inter-club debate · champion',
        ],
      },
    ],
    lines: [
      { who: 'rivet', text: 'What spins the fans?' },
      { who: 'me', text: 'A 30-member club running 10+ projects at once.' },
      { who: 'rivet', text: 'And the route here?' },
      { who: 'me', text: 'Dubai, then Hyderabad, then back to Dubai.' },
    ],
    tags: [
      {
        mi: 5,
        piece: 2,
        p: [0.225, 0.54, 0.025],
        label: '+25% COMPLETION',
        dx: 80,
        dy: -40,
      },
      {
        mi: 5,
        piece: 3,
        p: [0.17, 0.33, -0.17],
        label: 'LIFT · 30 CREW · 10+ PROJECTS',
        dx: 100,
        dy: 0,
        m: true,
      },
      {
        mi: 5,
        piece: 2,
        p: [0.162, 0.03, 0.18],
        label: 'B.E. CSE · GPA 8.27',
        dx: 70,
        dy: 34,
        m: true,
      },
    ],
    anchor: { mi: 5, piece: 0, p: [-0.24, 0.54, 0.025] },
    cam: { t: [0, 0.5, 0], d: 2.6, yaw: 0.6, pitch: 0.12, md: 1.35 },
  },
  {
    key: 'contact',
    code: 'M07',
    name: 'Suit-up complete',
    domain: 'Contact',
    status: 'ALL ONLINE · 6/6',
    title: 'Get in touch.',
    support: 'Open to AI engineering roles, remote or in the UAE.',
    rows: [],
    lines: [
      { who: 'rivet', text: 'Six of six seated.' },
      { who: 'me', text: 'Good. Email’s below.' },
    ],
    tags: [],
    anchor: { mi: 0, piece: 0, p: [-0.13, 1.42, 0.08] },
    cam: { t: [0, 1.18, 0], d: 5.0, yaw: 0.35, pitch: 0.08, md: 1.85 },
  },
];

export const LAST = STEPS.length - 1;

export const MODULE_NAMES = STEPS.slice(1, 7).map((s) => s.name);

/** tags on screen: the step's own, or the module names while the frame is pulled apart */
export function tagsFor(step: number, exploded: boolean, compact: boolean) {
  const t = exploded ? STEPS[0].tags : STEPS[step].tags;
  return compact ? t.filter((x) => x.m) : t;
}

// Rivet, the bench drone: tap lines, the hint, and the overclock egg.
export const POKES = [
  'Hands off the rotors.',
  'I inspect. You scroll.',
  'Five taps. Or type overclock.',
];
export const OC_LINES: Line[] = [
  { who: 'rivet', text: 'Overclock engaged. Fans at one-forty.' },
  { who: 'me', text: 'Don’t tell the club.' },
];
export const OC_DONE = 'Thermal limit. Back to nominal.';
export const OC_WORD = 'overclock';
export const OC_MS = 7000;
