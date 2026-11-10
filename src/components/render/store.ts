// A tiny mutable store shared between the DOM layer and the WebGL layer.
// Per-frame values are read directly (no React re-render); discrete changes
// (scene, load stage) notify subscribers.

export type Keyframe = { y: number; shape: number };

type Listener = () => void;

export const film = {
  // scroll
  scroll: 0, // px
  maxScroll: 1,
  progress: 0, // 0..1 over the whole film
  shape: 0, // fractional shape index the particles morph to
  keyframes: [] as Keyframe[],
  scene: 0,
  sceneLocal: 0, // 0..1 inside the current scene
  velocity: 0,

  // pointer, normalized -1..1
  mx: 0,
  my: 0,
  pointer: false, // a real mouse has moved
  shock: 0, // set > 0 on click; the scene consumes it

  intro: 0, // 0..1 particles assembling after the preloader
  labels: [] as (HTMLDivElement | null)[], // DOM labels positioned by the scene

  // boot
  stage: 0, // 0 fonts, 1 image, 2 shapes, 3 gpu ready
  started: false,
  reduced: false,
  mobile: false,
};

const listeners = new Set<Listener>();

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emit() {
  listeners.forEach((fn) => fn());
}

export function shapeAt(y: number, k: Keyframe[]) {
  if (!k.length) return 0;
  if (y <= k[0].y) return k[0].shape;
  for (let i = 1; i < k.length; i++) {
    if (y <= k[i].y) {
      const a = k[i - 1];
      const b = k[i];
      const t = (y - a.y) / Math.max(1, b.y - a.y);
      return a.shape + (b.shape - a.shape) * t;
    }
  }
  return k[k.length - 1].shape;
}
