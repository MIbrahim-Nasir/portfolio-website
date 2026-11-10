import type { PerspectiveCamera } from 'three';

/*
  The 3D scene and the DOM overlay talk through this: after the camera moves,
  the scene hands it over so callouts can be pinned to points on the parts.
*/
export const bus: {
  project: ((cam: PerspectiveCamera, w: number, h: number) => void) | null;
  poke: (() => void) | null;
  hover: ((on: boolean) => void) | null;
} = { project: null, poke: null, hover: null };

/** printer centre: plate mm -> world */
export const C = 125;
