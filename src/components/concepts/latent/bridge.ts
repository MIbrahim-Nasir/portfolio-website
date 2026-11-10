// Mutable state shared between the DOM overlay and the WebGL scene.
// React renders the overlay; the scene reads/writes this every frame.

import { CLUSTERS, FACTS } from './corpus';

export type LiveHit = {
  fact: number;
  score: number;
  kept: boolean;
  rank: number;
};

export type Bridge = {
  reduced: boolean;
  mobile: boolean;
  temp: number;
  focus: number; // cluster index, -1 = whole space
  run: { t0: number; hits: LiveHit[]; top: number; system: boolean } | null;
  streamFact: number; // fact being "generated" right now (-1 none)
  hover: number; // fact hovered in the answer/trace (-1)
  yaw: number; // user orbit offsets
  pitch: number;
  // DOM, registered by the overlay
  factLabels: (HTMLElement | null)[];
  clusterLabels: (HTMLElement | null)[];
  queryLabel: HTMLElement | null;
  leaders: (SVGPathElement | null)[];
  anchors: { el: HTMLElement | null; fact: number }[];
  root: HTMLElement | null;
  sheet: HTMLElement | null;
  // written by the scene: fact screen positions (x, y, depth-visible)
  screen: Float32Array;
};

export function createBridge(): Bridge {
  return {
    reduced: false,
    mobile: false,
    temp: 0.7,
    focus: -1,
    run: null,
    streamFact: -1,
    hover: -1,
    yaw: 0,
    pitch: 0,
    factLabels: FACTS.map(() => null),
    clusterLabels: CLUSTERS.map(() => null),
    queryLabel: null,
    leaders: [null, null, null, null, null],
    anchors: [],
    root: null,
    sheet: null,
    screen: new Float32Array(FACTS.length * 3),
  };
}

// run timeline, ms after submit
export const T_RETRIEVE = 420;
export const T_RERANK = 1150;
export const T_GENERATE = 1550;
