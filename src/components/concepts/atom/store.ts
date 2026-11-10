// Tiny mutable store shared by the DOM (writes intent) and the WebGL scene (reads it each frame,
// then writes projected positions straight into DOM nodes; no React render per frame).

type FrameHook = (t: number, dt: number) => void;

export const atom = {
  p: 0, // scroll position in chapters (float)
  chapter: 0,
  narrow: false,
  reduced: false,
  booted: 0, // performance.now() seconds when the scene first drew
  // user camera offsets (degrees), from drag and arrow keys
  yaw: 0,
  pitch: 0,
  dragging: false,
  releasedAt: -1e9,
  pointer: { nx: 0, ny: 0, x: -100, y: -100, moved: -1e9 },
  eggAt: -1e9,
  clicks: 0,
  clickAt: -1e9,
  // screen-space outputs (px)
  W: 1,
  H: 1,
  core: { x: 0, y: 0, r: 40 },
  // DOM nodes the scene positions
  stations: {} as Record<string, HTMLElement | null>,
  tags: [] as (HTMLElement | null)[],
  coreEl: null as HTMLElement | null,
  coreBtn: null as HTMLElement | null,
  hud: null as HTMLElement | null,
  say: null as null | ((line: string, ms?: number) => void),
  hooks: new Set<FrameHook>(),
};

export const now = () => performance.now() / 1000;

export function onFrame(h: FrameHook) {
  atom.hooks.add(h);
  return () => {
    atom.hooks.delete(h);
  };
}

if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  (window as unknown as { __atom: typeof atom }).__atom = atom;
}
