import { toolkit } from '@/data/profile';

// Every fact on this page lives in here, as something the instrument shows:
// a channel legend, a mark pinned to a trace feature, a softkey (cursor
// measurement), a measurement readout, or a saved setup.
// Division space: x 0..10 (left → right), y -4..4 (up).

export type ModeId = 'id' | 'saif' | 'graph' | 'arm' | 'bus' | 'ref' | 'fft';

export type Span = [number, number];

export type Mark = {
  x: number;
  y: number;
  t: string;
  /** second, smaller line (dropped on a compact screen) */
  s?: string;
  /** horizontal anchor: label starts at (l), ends at (r) or centres on (c) the point */
  a?: 'l' | 'r' | 'c';
  tone?: 'lane' | 'dim' | 'amber' | 'big';
  /** softkey this mark belongs to; brightens while that key is active */
  k?: number;
  /** compact-screen text, or false to hide */
  c?: string | false;
};

export type SoftKey = {
  k: string;
  v: string;
  /** detail shown in the cursor readout while the key is active */
  d: string;
  cx?: Span | ((compact: boolean) => Span);
  cy?: Span;
  solo?: number;
  recall?: number;
  bin?: number;
};

export type MarkCtx = { compact: boolean; bin: number };

export type ModeDef = {
  id: ModeId;
  key: string;
  short: string;
  title: string;
  trig: string;
  tagline: string;
  support?: string;
  trace: string;
  meas: { k: string; v: string }[];
  keys: SoftKey[];
  marks: (c: MarkCtx) => Mark[];
  buddy: string;
};

// ── shared geometry (traces.ts draws with the same numbers) ────────────────

export const HARMONICS = [
  { n: 1, k: 'MECH' },
  { n: 3, k: 'ELEC' },
  { n: 5, k: 'ROBOT' },
  { n: 7, k: 'CODE' },
  { n: 9, k: 'AI' },
];
export const ID_X0 = 1.65;
export const ID_X1 = 6.1;
export const idLaneY = (i: number) => 3.35 - i * 0.66;
export const ID_SUM_Y = -1.15;

export const SAIF_EDGE = 3.6;
export const saifLvl = (min: number) => 0.55 + min * 0.145;
export const DUTY_Y = -0.75;
export const DUTY_BEFORE: Span = [1.0, 3.6];
export const DUTY_AFTER: Span = [5.6, 5.6 + 2.6 * 0.65]; // 35% shorter
export const DESIGNS_Y = -2.65;
export const DESIGNS_WIN: Span = [1.0, 8.4];

export const graphX0 = (compact: boolean) => (compact ? 1.55 : 1.85);
export const GRAPH_X1 = 9.85;
export const graphMap = (compact: boolean) => (tau: number) =>
  graphX0(compact) + tau * (GRAPH_X1 - graphX0(compact));
export const graphLaneY = (i: number) => 3.42 - i * 1.07;
export const GRAPH_NODES = [
  { id: 'input', label: 'PHOTO', c: 'PHOTO', sub: 'WHATSAPP' },
  { id: 'planner', label: 'PLANNER', c: 'PLAN', sub: 'AGENT' },
  { id: 'rag', label: 'CATALOGUE', c: 'RAG', sub: 'PGVECTOR RAG' },
  { id: 'render', label: 'RENDER', c: 'RENDER', sub: 'IMAGE MODEL' },
  { id: 'boq', label: 'BOQ', c: 'BOQ', sub: 'QUANTITIES' },
  { id: 'eval', label: 'EVALUATE', c: 'EVAL', sub: 'SCHEMA · CODE · LLM' },
  { id: 'out', label: 'CLIENT', c: 'OUT', sub: 'DESIGN + BOQ' },
];
export const GRAPH_SPANS: Record<string, Span[]> = {
  input: [[0.0, 0.05]],
  planner: [[0.05, 0.24]],
  rag: [
    [0.08, 0.11],
    [0.13, 0.16],
    [0.185, 0.215],
  ],
  render: [
    [0.25, 0.47],
    [0.58, 0.8],
  ],
  boq: [[0.25, 0.4]],
  eval: [
    [0.48, 0.56],
    [0.81, 0.88],
  ],
  out: [[0.89, 0.98]],
};

export const ARM_X0 = 1.6;
export const ARM_X1 = 6.1;
export const armMap = (tau: number) => ARM_X0 + tau * (ARM_X1 - ARM_X0);
export const ARM_LANES = { cam: 3.3, gem: 2.15, uart: 1.0, servo: -0.15 };
export const ARM_AMP = 0.3;
export const UART_AT = 0.4;
export const UART_BYTE = 0.075;
export const UART_WORD = 'GRAB';
export const XY_BOX = { x0: 6.7, x1: 9.65, y0: -2.3, y1: 2.85 };

export const busX0 = (compact: boolean) => (compact ? 1.55 : 2.0);
export const BUS_X1 = 9.85;
export const busMap = (compact: boolean) => (tau: number) =>
  busX0(compact) + tau * (BUS_X1 - busX0(compact));
export const busLaneY = (i: number) => 3.3 - i * 1.02;
export const BUS_AMP = 0.28;
export const BUS_NAMES = [
  ['CLIENT', 'CLIENT'],
  ['CONTROLLER', 'CTRL'],
  ['SERVICE', 'SVC'],
  ['REPOSITORY', 'REPO'],
  ['SQL SERVER', 'SQL'],
];

export const REF = {
  yD: 0.9,
  yH: 2.9,
  up: 3.0,
  down: 6.8,
  D0: 0.4,
  D1: 6.1,
  yc: -2.05,
  a: 0.42,
};
export const refHx = (h: number) => REF.D0 + (h / 24) * (REF.D1 - REF.D0);

export const FFT_FLOOR = -3.2;
export const fftX = (i: number) => 0.5 + (i * 9.0) / (toolkit.length - 1);
export const FFT_BANDS: {
  label: string;
  c: string;
  from: number;
  to: number;
}[] = [
  { label: 'AI · LLM', c: 'AI · LLM', from: 0, to: 12 },
  { label: 'BACKEND · DATA', c: 'BACKEND', from: 13, to: 19 },
  { label: 'DEPLOY', c: 'SHIP', from: 20, to: 22 },
  { label: 'TOOLS', c: 'DEV', from: 23, to: toolkit.length - 1 },
];

// ── the channels ────────────────────────────────────────────────────────────

const harmonicKey = (i: number, k: string, v: string, d: string): SoftKey => {
  const n = HARMONICS[i].n;
  const x = ID_X0 + 0.25;
  return { k, v, d, solo: i, cx: [x, x + 4.8 / n] };
};

export const MODES: ModeDef[] = [
  {
    id: 'id',
    key: 'CH1',
    short: 'ID',
    title: 'IDENTITY',
    trig: 'TRIG NORM · HOLDS TILL SOLVED',
    tagline: 'Mechanics. Electronics. Code. AI.',
    support: 'I learn each field from its core concepts, then build.',
    trace:
      'Five harmonics, one per field, summing into one square wave. A cube turns in 3D.',
    meas: [
      { k: 'ROLE', v: 'AI Engineer' },
      { k: 'LOC', v: 'Dubai, UAE' },
      { k: 'NOW', v: 'Ducon · R&D' },
      { k: 'B.E.', v: 'CSE · 2025' },
    ],
    keys: [
      harmonicKey(
        0,
        '1f MECH',
        'CAD · 3D print',
        'SolidWorks · Onshape · ~1 year of 3D printing: repair, model, slice, tune'
      ),
      harmonicKey(
        1,
        '3f ELEC',
        'ESP32 · Arduino',
        'soldering · basic PCB design · Jetson Nano · I2C / SPI'
      ),
      harmonicKey(
        2,
        '5f ROBOT',
        '4-DOF arm · IK',
        'mecanum car · EMG bionic arm · Core XY gantry'
      ),
      harmonicKey(
        3,
        '7f CODE',
        'Python · FastAPI',
        'C# / ASP.NET Core · SQL · REST API design · system design'
      ),
      harmonicKey(
        4,
        '9f AI',
        'LangGraph · RAG',
        'agentic workflows · context engineering · LLM evaluation · image models'
      ),
    ],
    marks: ({ compact }) => [
      ...HARMONICS.map((h, i) => ({
        x: 0.15,
        y: idLaneY(i),
        t: h.k,
        tone: 'lane' as const,
        k: i,
      })),
      { x: 0.3, y: 0.12, t: 'Σ  FIVE FIELDS, SUMMED', c: 'Σ  SUM' },
      { x: 6.65, y: 3.7, t: 'X-Y-Z', tone: 'lane' },
      { x: 9.75, y: 3.7, t: 'THINKS IN 3D', a: 'r', c: '3D' },
      {
        x: 9.75,
        y: -3.7,
        t: compact ? 'LINKS FIELDS' : 'LINKS IDEAS ACROSS FIELDS',
        a: 'r',
        tone: 'dim',
      },
    ],
    buddy: 'That square wave is all five fields added up.',
  },
  {
    id: 'saif',
    key: 'CH2',
    short: 'SAIF',
    title: 'SAIF AI DESIGNER',
    trig: 'TRIG ▲ PHOTO IN',
    tagline: 'WhatsApp photo in. Design and BOQ out.',
    support: 'Generation time: 20+ minutes down to 5–7.',
    trace:
      'Generation time steps down from over 20 minutes to 5 to 7. Designer time per session shrinks 35 percent. 57 client designs in 4 weeks.',
    meas: [
      { k: 'ROLE', v: 'AI Developer · R&D' },
      { k: 'AT', v: 'Ducon Industries' },
      { k: 'SINCE', v: 'Aug 2025' },
      { k: 'OUT', v: 'render + BOQ' },
    ],
    keys: [
      {
        k: 'Δ GEN TIME',
        v: '20+ → 5–7 min',
        d: 'parallel agent nodes · thinking level per node · Gemini Flash · logic moved to code',
        cy: [saifLvl(20), saifLvl(6)],
      },
      {
        k: 'N DESIGNS',
        v: '57 in 4 weeks',
        d: 'client designs, before the marketing launch',
        cx: DESIGNS_WIN,
      },
      {
        k: 'DUTY',
        v: '−35% designer',
        d: 'creative cognition time per client session',
        cx: DUTY_AFTER,
      },
      {
        k: 'USERS',
        v: '40 internal',
        d: 'sales · design · R&D · their asks shipped: edit-generations, multi-step, night view',
      },
    ],
    marks: () => [
      { x: 0.3, y: 3.82, t: 'GEN TIME · MIN', tone: 'lane' },
      { x: 0.3, y: saifLvl(20) - 0.4, t: '20+ MIN', tone: 'big', k: 0 },
      { x: 0.3, y: 0.82, t: 'BEFORE', tone: 'dim' },
      { x: SAIF_EDGE + 1.2, y: 0.82, t: 'AFTER', tone: 'dim' },
      {
        x: 3.95,
        y: 2.95,
        t: 'NODES IN PARALLEL',
        s: 'GEMINI FLASH · LOGIC → CODE',
        c: 'PARALLEL',
        k: 0,
      },
      {
        x: 9.75,
        y: saifLvl(5) - 0.32,
        t: '5–7 MIN',
        a: 'r',
        tone: 'big',
        k: 0,
      },
      {
        x: 0.3,
        y: -0.2,
        t: 'DESIGNER TIME / SESSION',
        c: 'DESIGNER TIME',
        tone: 'lane',
      },
      { x: DUTY_AFTER[1] + 0.2, y: DUTY_Y, t: '−35%', tone: 'amber', k: 2 },
      { x: 0.3, y: -1.55, t: 'CLIENT DESIGNS', tone: 'lane' },
      {
        x: (DESIGNS_WIN[0] + DESIGNS_WIN[1]) / 2,
        y: -3.3,
        t: '4 WEEKS',
        a: 'c',
        k: 1,
      },
      {
        x: 9.75,
        y: -3.72,
        t: 'BEFORE MARKETING LAUNCH',
        c: 'PRE-LAUNCH',
        a: 'r',
        tone: 'dim',
        k: 1,
      },
    ],
    buddy: 'You can try it yourself. It’s on WhatsApp.',
  },
  {
    id: 'graph',
    key: 'CH3',
    short: 'GRAPH',
    title: 'AGENT GRAPH · LANGGRAPH',
    trig: 'TRIG EVAL = FAIL',
    tagline: 'The agents check their own work.',
    support: 'Every design uses products from Ducon’s real catalogue.',
    trace:
      'Logic analyzer, one lane per agent node. The first evaluation fails and triggers a regenerate; the second passes.',
    meas: [
      { k: 'GRAPH', v: 'multi-agent' },
      { k: 'API', v: 'Python · FastAPI' },
      { k: 'NODES', v: String(GRAPH_NODES.length) },
    ],
    keys: [
      {
        k: 'RAG',
        v: 'catalogue-grounded',
        d: 'planner grounds every design in the real catalogue · structured + semantic · pgvector',
        solo: 2,
      },
      {
        k: 'LOOP',
        v: 'gen → eval → regen',
        d: 'strict JSON schemas · code and LLM validation nodes',
        cx: (c) => [graphMap(c)(0.25), graphMap(c)(0.88)],
        solo: 5,
      },
      {
        k: 'EVALS',
        v: 'LangSmith · Langfuse',
        d: 'evaluation dataset · models benchmarked before release',
      },
      {
        k: 'DATA',
        v: '100+ h saved',
        d: 'images + documents → embedded design library · ChromaDB search, thousands of images',
      },
      {
        k: 'SHIP',
        v: 'Railway · VPS · R2',
        d: 'I owned deployment and the databases',
      },
    ],
    marks: ({ compact }) => {
      const map = graphMap(compact);
      const ye = graphLaneY(5);
      return [
        ...GRAPH_NODES.map((n, i) => ({
          x: 0.15,
          y: graphLaneY(i) + (compact ? 0 : 0.14),
          t: n.label,
          s: n.sub,
          c: n.c,
          tone: 'lane' as const,
          k: i === 2 ? 0 : i === 5 ? 1 : undefined,
        })),
        {
          x: map(0.57),
          y: ye + 0.02,
          t: 'FAIL → REGEN',
          c: 'FAIL',
          tone: 'amber',
          k: 1,
        },
        { x: map(0.89) + 0.05, y: ye + 0.02, t: 'PASS', k: 1 },
        {
          x: map(0.42),
          y: graphLaneY(4),
          t: 'PARALLEL',
          c: false,
          tone: 'dim',
        },
      ];
    },
    buddy: 'Bad render caught. It tries again.',
  },
  {
    id: 'arm',
    key: 'CH4',
    short: 'ARM',
    title: 'AI ROBOTICS · CLOSED LOOP',
    trig: 'TRIG ▲ CAM FRAME',
    tagline: 'Gemini picks the move. Arduino makes it.',
    support: 'Some of my code has motors.',
    trace:
      'Control loop: camera frame, Gemini decision, the word GRAB decoded on the serial line, then the servo pulse widens. Beside it, a Core XY gantry in X-Y mode.',
    meas: [
      { k: 'MCU', v: 'Arduino · ESP32 · Jetson' },
      { k: 'BUS', v: 'UART · I2C · SPI' },
      { k: 'CAD', v: 'SolidWorks · Onshape' },
    ],
    keys: [
      {
        k: 'LOOP',
        v: 'cam → Gemini → servo',
        d: 'camera → Gemini → Python → Arduino over pyserial',
        cx: [armMap(0.02), armMap(0.9)],
      },
      {
        k: '3RD',
        v: 'national hackathon',
        d: 'a robotic arm steered by a vision LLM',
      },
      {
        k: 'CORE XY',
        v: 'published paper',
        d: 'item-retrieval machine · national conference paper · IIT Hack4SDG special mention',
      },
      { k: 'ISRO', v: 'top 50 all-India', d: 'ISRO Rover Competition' },
      {
        k: 'BUILDS ▸',
        v: '6 saved setups',
        d: 'open SAVE / RECALL',
        recall: 1,
      },
    ],
    marks: () => {
      const L = ARM_LANES;
      return [
        { x: 0.15, y: L.cam + 0.12, t: 'CAM', s: 'FRAME', tone: 'lane' },
        {
          x: 0.15,
          y: L.gem + 0.12,
          t: 'GEMINI',
          s: 'VISION LLM',
          tone: 'lane',
        },
        { x: 0.15, y: L.uart + 0.12, t: 'UART', s: 'PYSERIAL', tone: 'lane' },
        { x: 0.15, y: L.servo + 0.12, t: 'SERVO', s: 'ARDUINO', tone: 'lane' },
        { x: armMap(0.04), y: L.cam + 0.6, t: 'SEES', tone: 'amber', k: 0 },
        {
          x: armMap(0.215),
          y: L.gem + 0.6,
          t: 'DECIDES',
          a: 'c',
          tone: 'amber',
          k: 0,
        },
        ...UART_WORD.split('').map((ch, i) => ({
          x: armMap(UART_AT + UART_BYTE * (i + 0.5)),
          y: L.uart + 0.6,
          t: ch,
          a: 'c' as const,
        })),
        {
          x: armMap(0.84),
          y: L.servo + 0.6,
          t: 'MOVES',
          a: 'c',
          tone: 'amber',
          k: 0,
        },
        { x: 6.25, y: -1.0, t: 'CLOSED LOOP', a: 'r', tone: 'dim', c: 'LOOP' },
        { x: 2.75, y: -1.75, t: 'NATIONAL HACKATHON', c: 'HACKATHON', k: 1 },
        {
          x: 2.75,
          y: -2.25,
          t: 'GEMINI-VISION ARM',
          c: false,
          tone: 'dim',
          k: 1,
        },
        {
          x: 0.3,
          y: -3.05,
          t: 'TOP 50 · ISRO ROVER · ALL-INDIA',
          c: 'ISRO ROVER · TOP 50',
          k: 3,
        },
        { x: 6.7, y: 3.7, t: 'X-Y · CORE XY', tone: 'lane', k: 2 },
        { x: 6.7, y: 3.25, t: 'X=(A+B)/2 · Y=(A−B)/2', c: false, tone: 'dim' },
        { x: 6.7, y: -2.85, t: 'PUBLISHED PAPER', c: 'PAPER', k: 2 },
        {
          x: 6.7,
          y: -3.4,
          t: 'IIT HACK4SDG MENTION',
          c: 'HACK4SDG',
          tone: 'dim',
          k: 2,
        },
      ];
    },
    buddy: 'This one has motors.',
  },
  {
    id: 'bus',
    key: 'BUS',
    short: 'DELTAX',
    title: 'BACKEND TIMING · DELTAX',
    trig: 'TRIG ▲ HTTP REQUEST',
    tagline: 'I started on backends, at DeltaX.',
    support: 'Two backends in C# / ASP.NET Core over SQL Server.',
    trace:
      'Timing diagram: one request travels client, controller, service, repository, SQL Server, and back. 20 plus REST endpoints.',
    meas: [
      { k: 'ROLE', v: 'Assoc. Software Product Eng. Intern' },
      { k: 'AT', v: 'DeltaX · Hyderabad' },
      { k: 'SPAN', v: 'Jan – Jul 2025' },
    ],
    keys: [
      {
        k: 'PATH',
        v: 'ctrl → svc → repo',
        d: 'Controller–Service–Repository layers over SQL Server',
        cx: (c) => [busMap(c)(0.09), busMap(c)(0.31)],
      },
      {
        k: 'APP 1',
        v: 'IMDB-style catalogue',
        d: 'film catalogue backend · C# / ASP.NET Core',
      },
      {
        k: 'APP 2',
        v: 'BookSwap',
        d: 'book marketplace · history-based recommendation engine',
      },
      { k: 'EP', v: '20+ REST', d: 'endpoints across both backends' },
    ],
    marks: ({ compact }) => {
      const map = busMap(compact);
      return [
        ...BUS_NAMES.map(([n, c], i) => ({
          x: 0.15,
          y: busLaneY(i),
          t: n,
          c,
          tone: 'lane' as const,
        })),
        { x: map(0.06), y: busLaneY(0) + BUS_AMP + 0.26, t: 'REQ', a: 'c' },
        { x: map(0.915), y: busLaneY(0) + BUS_AMP + 0.26, t: 'RES', a: 'c' },
        { x: map(0.48), y: busLaneY(4), t: 'QUERY', a: 'c', tone: 'dim' },
        { x: 0.35, y: -3.4, t: 'REST ENDPOINTS', k: 3 },
        { x: 4.3, y: -2.1, t: 'C# · ASP.NET CORE' },
        {
          x: 4.3,
          y: -2.7,
          t: 'IMDB-STYLE CATALOGUE',
          c: 'CATALOGUE',
          tone: 'dim',
          k: 1,
        },
        {
          x: 4.3,
          y: -3.3,
          t: 'BOOKSWAP · RECOMMENDER',
          c: 'BOOKSWAP',
          tone: 'dim',
          k: 2,
        },
      ];
    },
    buddy: 'Respect the plumbing.',
  },
  {
    id: 'ref',
    key: 'REF',
    short: 'ORIGIN',
    title: 'ORIGIN · LONGITUDE',
    trig: 'TRIG ▲ 16:00',
    tagline: 'Dubai, then Hyderabad, then Dubai again.',
    support: 'TSIG: classes ended at 4, we stayed till 9 or 10.',
    trace:
      'Reference trace of longitude: Dubai, Hyderabad, Dubai. Below, one day at TSIG: high from 4 PM to 9 or 10 PM. 30 members led.',
    meas: [
      { k: 'GPA', v: '8.27' },
      { k: 'CBSE', v: '92%' },
      { k: '12TH', v: '94%' },
      { k: 'DONE', v: '+25% completion' },
    ],
    keys: [
      {
        k: 'TSIG',
        v: 'Vice Chair · Tech Lead',
        d: '30 members · 10+ concurrent projects · AI, web, robotics · 2022–25',
        cx: [refHx(16), refHx(22)],
      },
      {
        k: 'TEACH',
        v: 'mentor',
        d: 'month-long front-end internship for juniors · electronics workshop · placement mentoring',
      },
      {
        k: 'B.E.',
        v: 'CSE · GPA 8.27',
        d: 'MJCET, Osmania University · Hyderabad · 2025',
      },
      {
        k: 'WINS',
        v: 'HackRevolution',
        d: 'hackathon winner · inter-club debate champion',
      },
    ],
    marks: () => {
      const { yD, yH } = REF;
      return [
        { x: 0.3, y: 3.75, t: 'LONGITUDE', tone: 'lane' },
        { x: 0.4, y: yD + 0.4, t: 'DUBAI', tone: 'big' },
        {
          x: 0.4,
          y: yD - 0.4,
          t: 'NIMS · CBSE 92%',
          c: 'CBSE 92%',
          tone: 'dim',
        },
        { x: 3.75, y: yH + 0.4, t: 'HYDERABAD', tone: 'big' },
        {
          x: 3.75,
          y: yH - 0.4,
          t: 'MJCET · B.E. CSE · 8.27',
          c: 'B.E. CSE · 8.27',
          tone: 'dim',
          k: 2,
        },
        { x: 7.5, y: yD + 0.4, t: 'DUBAI', tone: 'big' },
        { x: 7.5, y: yD - 0.4, t: 'DUCON · AI', tone: 'dim' },
        { x: 9.75, y: yH, t: '78°E', a: 'r', tone: 'dim', c: false },
        {
          x: 0.4,
          y: -0.85,
          t: 'TSIG · ONE DAY · 2022–25',
          c: 'TSIG · ONE DAY',
          tone: 'lane',
          k: 0,
        },
        { x: refHx(11), y: -2.95, t: 'CLASSES', a: 'c', tone: 'dim', c: false },
        { x: refHx(16), y: -2.95, t: '4 PM', a: 'c', k: 0 },
        { x: refHx(21.5), y: -2.95, t: '9–10 PM', a: 'c', k: 0 },
        { x: 7.25, y: -2.6, t: 'MEMBERS LED', k: 0 },
        {
          x: 7.25,
          y: -3.1,
          t: 'VICE CHAIR · TECH LEAD',
          c: 'VICE CHAIR',
          tone: 'dim',
        },
        {
          x: 7.25,
          y: -3.6,
          t: '10+ PROJECTS AT ONCE',
          c: '10+ PROJECTS',
          tone: 'dim',
        },
      ];
    },
    buddy: 'Four PM. Shift starts.',
  },
  {
    id: 'fft',
    key: 'MATH',
    short: 'FFT',
    title: 'MATH · FFT(TOOLKIT)',
    trig: 'HANN · 26 LINES',
    tagline: 'The tools I use, grouped by field.',
    trace: `Spectrum, ${toolkit.length} lines, one per tool. Turn the cursor knob to move the marker.`,
    meas: [
      { k: 'LINES', v: String(toolkit.length) },
      { k: 'WIN', v: 'Hann' },
    ],
    keys: FFT_BANDS.map((b) => ({
      k: b.label,
      v: `${b.to - b.from + 1} lines`,
      d: toolkit.slice(b.from, b.to + 1).join(' · '),
      cx: [fftX(b.from) - 0.15, fftX(b.to) + 0.15] as Span,
      bin: b.from,
    })),
    marks: ({ compact, bin }) => [
      {
        x: 0.3,
        y: 3.7,
        t: `MKR ${String(bin + 1).padStart(2, '0')}/${toolkit.length}`,
        tone: 'dim',
      },
      { x: 0.3, y: 3.15, t: toolkit[bin].toUpperCase(), tone: 'big' },
      ...FFT_BANDS.map((b, i) => ({
        x: (fftX(b.from) + fftX(b.to)) / 2,
        y: -3.72,
        t: compact ? b.c : b.label,
        a: 'c' as const,
        tone: 'dim' as const,
        k: i,
      })),
    ],
    buddy: 'Turn CURSOR. I’ll read.',
  },
];

export const MODE_INDEX: Record<ModeId, number> = MODES.reduce(
  (acc, m, i) => ({ ...acc, [m.id]: i }),
  {} as Record<ModeId, number>
);

/** Which band a toolkit line sits in. */
export const bandOf = (bin: number) =>
  FFT_BANDS.findIndex((b) => bin >= b.from && bin <= b.to);

// ── SAVE / RECALL: the other builds ─────────────────────────────────────────

export const SETUPS: { k: string; v: string; d: string }[] = [
  {
    k: 'ATOMIC SENSEI',
    v: 'multi-agent learning platform',
    d: 'roadmap, lesson and quiz-evaluation agents on Gemini · async lesson pre-generation · cron-driven Supabase reminders · I designed the architecture and data model',
  },
  { k: '4-DOF ARM', v: '3D printed · servos', d: 'inverse kinematics' },
  { k: 'MECANUM CAR', v: 'steppers · Arduino', d: 'Bluetooth · CNC shield' },
  {
    k: 'EMG BIONIC ARM',
    v: 'muscle-signal control',
    d: 'EMG-controlled bionic arm',
  },
  {
    k: 'CORE XY',
    v: 'item retrieval',
    d: 'steppers · timing belts · Arduino · ESP32 · published paper · IIT Hack4SDG mention',
  },
  {
    k: '3D PRINTING',
    v: '~1 year',
    d: 'repairing printers · modelling · slicing · tuning',
  },
];

// ── knobs ──────────────────────────────────────────────────────────────────

export const TIME_DIV = [
  '1s',
  '.5s',
  '.2s',
  '.1s',
  '50ms',
  '20ms',
  '10ms',
  '5ms',
  '2ms',
];
export const VOLTS_DIV = ['5V', '2V', '1V', '.5V', '.2V', '.1V', '50mV'];
export const TIME_DEFAULT = 4;
export const VOLTS_DEFAULT = 3;
export const CURSOR_MAX = 100;

// X-Y mode: TIME/DIV sets the X frequency, VOLTS/DIV the Y frequency.
export const XY_FX = [1, 1, 2, 3, 3, 4, 5, 3, 7];
export const XY_FY = [1, 2, 3, 2, 4, 5, 3];
export const XY_LOCK = { time: 7, volts: 1 };
export const lockDistance = (timeIdx: number, voltsIdx: number) =>
  Math.abs(timeIdx - XY_LOCK.time) + Math.abs(voltsIdx - XY_LOCK.volts);

export function fftBin(cursor: number) {
  return Math.round((cursor / CURSOR_MAX) * (toolkit.length - 1));
}

// ── the probe tip's lines ───────────────────────────────────────────────────

export const BUDDY = {
  greet: 'Probe tip. Point me at anything.',
  hint: 'Try X-Y. Then turn both knobs.',
  xy: 'Find the lock. Watch the drift.',
  warm: 'Warmer.',
  egg: 'That’s his signature, drawn in Lissajous.',
  contact: 'Each jack is a way to reach him.',
  off: 'I’ll wait in the dark.',
};
