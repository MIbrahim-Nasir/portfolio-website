// Everything the atom says, and where the camera stands for each chapter.
// Facts only from src/data/profile.ts and public/resume.pdf. Labels, not sentences.

export const C = {
  void: '#0a0b0c',
  ink: '#e9e7e2',
  dim: '#8d8c88',
  signal: '#ff5b1f', // the one accent: international orange
};

// Orbits. Each one is a chapter. Ring plane starts as XZ (equatorial), tilted about X by `incl`,
// then turned about Y by `node`. Angles in degrees.
export type Ring = {
  id: string;
  name: string;
  r: number;
  incl: number;
  node: number;
  packets: number;
  speed: number;
};

export const rings: Ring[] = [
  {
    id: 'ai',
    name: 'AI systems',
    r: 1.6,
    incl: 16,
    node: 0,
    packets: 4,
    speed: 0.42,
  },
  {
    id: 'sw',
    name: 'Software',
    r: 2.25,
    incl: -20,
    node: 38,
    packets: 3,
    speed: 0.3,
  },
  {
    id: 'me',
    name: 'Mechanics',
    r: 2.95,
    incl: 27,
    node: 112,
    packets: 3,
    speed: 0.22,
  },
  {
    id: 'el',
    name: 'Electronics',
    r: 3.65,
    incl: -11,
    node: 200,
    packets: 3,
    speed: 0.17,
  },
  {
    id: 'ro',
    name: 'Robotics',
    r: 4.4,
    incl: 21,
    node: 286,
    packets: 4,
    speed: 0.13,
  },
  {
    id: 'ts',
    name: 'TSIG · Education',
    r: 5.2,
    incl: -5,
    node: 64,
    packets: 2,
    speed: 0.1,
  },
];

export type Station = { th?: number; k: string; v?: string };
export type Stat = { n: string; u: string };

// Camera: spherical about a target. az/el in degrees, dist in world units.
export type Cam = {
  az: number;
  el: number;
  dist: number;
  tx: number;
  ty: number;
  tz: number;
  fov: number;
};

export type Chapter = {
  id: string;
  n: string;
  name: string;
  ring: number; // -1 = none
  move: string; // what the camera does to get here (HUD)
  cam: Cam;
  camN?: Partial<Cam>; // phone overrides
  frame?: 'ring'; // cam az/el measured in the orbit's own frame (el from the ring plane)
  aim?: number; // pull the target toward the near arc of the orbit (0..1)
  spread?: number; // degrees of arc the stations fan across
  title?: string;
  meta?: string;
  line?: string;
  stats?: Stat[];
  stations?: Station[];
  explode?: number; // core faces pulled apart
};

export const chapters: Chapter[] = [
  {
    id: 'ident',
    n: '00',
    name: 'Ident',
    ring: -1,
    move: 'establish',
    cam: { az: 24, el: 27, dist: 12, tx: -1.9, ty: -0.3, tz: 0, fov: 34 },
    camN: { dist: 11.5, tx: 0, ty: -0.6, el: 24 },
  },
  {
    id: 'ai',
    n: '01',
    name: 'AI systems',
    ring: 0,
    move: 'dive · nucleus',
    cam: { az: 58, el: 24, dist: 4.8, tx: 1.05, ty: 0.15, tz: 0, fov: 42 },
    camN: { dist: 5.6, tx: 0, ty: 0, el: 30 },
    explode: 0.5,
    title: 'SAIF AI Designer',
    meta: 'Ducon Industries · R&D · Aug 2025 → now',
    line: 'Photo in on WhatsApp. Design and bill of quantities out.',
    stats: [
      { n: '57', u: 'designs, first 4 weeks' },
      { n: '20+→5–7', u: 'minutes per run' },
      { n: '−35%', u: 'designer time' },
      { n: '40', u: 'internal users' },
    ],
    stations: [
      { th: 200, k: 'LangGraph', v: 'multi-agent · FastAPI' },
      { th: 248, k: 'RAG', v: 'pgvector · real catalogue' },
      { th: 302, k: 'Evals', v: 'LangSmith · Langfuse' },
      { th: 140, k: 'Gate', v: 'generate → evaluate → retry' },
    ],
  },
  {
    id: 'sw',
    n: '02',
    name: 'Software',
    ring: 1,
    move: 'slide · along orbit',
    frame: 'ring',
    aim: 0.55,
    spread: 120,
    cam: { az: 140, el: 24, dist: 4.6, tx: 0, ty: 0.2, tz: 0, fov: 46 },
    camN: { dist: 5.6, el: 30 },
    stations: [
      { k: 'Atomic Sensei', v: 'roadmap · lesson · quiz agents' },
      { k: 'Search', v: 'FastAPI + ChromaDB' },
      { k: 'Pipelines', v: 'images + docs → embeddings' },
      { k: 'Deploy', v: 'Railway · VPS · Docker · R2' },
      { k: 'DeltaX ’25', v: '2 REST backends · 20+ endpoints' },
    ],
  },
  {
    id: 'me',
    n: '03',
    name: 'Mechanics',
    ring: 2,
    move: 'orbit · 90°',
    frame: 'ring',
    aim: 0.15,
    spread: 130,
    cam: { az: 235, el: 36, dist: 8, tx: 0, ty: 0, tz: 0, fov: 38 },
    camN: { dist: 9.5, el: 44 },
    stations: [
      { k: 'CAD', v: 'SolidWorks · Onshape' },
      { k: '3D printing', v: '~1 year' },
      { k: '4-DOF arm', v: 'inverse kinematics' },
      { k: 'Core XY', v: 'published paper' },
    ],
  },
  {
    id: 'el',
    n: '04',
    name: 'Electronics',
    ring: 3,
    move: 'drop · through shell',
    frame: 'ring',
    aim: 0.1,
    spread: 140,
    cam: { az: 320, el: -32, dist: 9, tx: 0, ty: 0, tz: 0, fov: 40 },
    camN: { dist: 11, el: -40 },
    stations: [
      { k: 'MCU', v: 'Arduino · ESP32' },
      { k: 'Edge', v: 'Jetson Nano' },
      { k: 'EMG', v: 'sensors → bionic arm' },
      { k: 'Drive', v: 'steppers · servos' },
      { k: 'Serial', v: 'Python → Arduino' },
    ],
  },
  {
    id: 'ro',
    n: '05',
    name: 'Robotics',
    ring: 4,
    move: 'pull out · wide',
    frame: 'ring',
    spread: 150,
    cam: { az: 40, el: 20, dist: 14.2, tx: 0, ty: 0.3, tz: 0, fov: 30 },
    camN: { dist: 17, el: 26 },
    stations: [
      { k: 'Vision arm', v: '3rd · national hackathon' },
      { k: 'Core XY', v: 'IIT Hack4SDG · special mention' },
      { k: 'ISRO Rover', v: 'top 50 · all-India' },
      { k: 'Mecanum car' },
      { k: 'EMG bionic arm' },
    ],
  },
  {
    id: 'ts',
    n: '06',
    name: 'TSIG · Education',
    ring: 5,
    move: 'rise · plan view',
    frame: 'ring',
    spread: 230,
    cam: { az: 120, el: 78, dist: 19, tx: 0, ty: 0, tz: 0, fov: 38 },
    camN: { dist: 21 },
    stations: [
      { k: 'TSIG', v: 'Vice Chair & Tech Lead · 2022–25' },
      { k: '30 members', v: '10+ concurrent projects' },
      { k: '+25%', v: 'project completion' },
      { k: 'B.E. CSE', v: 'MJCET · Osmania · 2025' },
      { k: 'Hackathons', v: 'HackRevolution · winner' },
    ],
  },
  {
    id: 'contact',
    n: '07',
    name: 'Contact',
    ring: -1,
    move: 'return · core',
    cam: { az: 388, el: 14, dist: 7.4, tx: 1.15, ty: -0.05, tz: 0, fov: 36 },
    camN: { dist: 7.5, tx: 0, ty: 0, el: 20 },
    explode: 0.18,
  },
];

export const N = chapters.length;

// Scroll position (in chapters) -> which keyframes and how far between them.
// Each chapter holds still for the first part of its scroll length, then travels.
export const HOLD = 0.3;
export function travel(p: number) {
  const max = N - 1;
  const q = Math.min(max, Math.max(0, p));
  const i = Math.min(max - 1, Math.floor(q));
  const u = q - i;
  const x = Math.min(1, Math.max(0, (u - HOLD) / (1 - HOLD)));
  // one curve family for the whole piece: cubic in-out
  const t = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  return { i, t, active: t < 0.5 ? i : i + 1, settled: t < 0.06 || t > 0.94 };
}

export const buddy = {
  idle: [
    'drag to orbit',
    'try the arrow keys',
    'type ib',
    'the core has 80 faces. click it.',
  ],
  tap: ['hi, i’m bit.', 'i carry the packets around here.', 'type ib'],
  egg: '80 faces. all accounted for.',
};
