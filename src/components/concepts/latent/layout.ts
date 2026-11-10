// Where every vector sits in 3D. Cluster centres are fixed (the themes);
// inside a cluster, a fact's offset is a seeded Gaussian random projection of
// its own TF-IDF vector (R^|V| -> R^3), so near-identical facts land near
// each other. Then a few rounds of repulsion keep labels legible.

import { CLUSTERS, CLUSTER_INDEX, FACTS } from './corpus';
import { DIM, VECTORS } from './engine';

export type V3 = [number, number, number];

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gauss(r: () => number) {
  const u = Math.max(1e-6, r());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

const rng = mulberry(20250801);
const R: Float32Array[] = [0, 1, 2].map(() => {
  const row = new Float32Array(DIM);
  for (let i = 0; i < DIM; i++) row[i] = gauss(rng);
  return row;
});

function project(v: Float32Array): V3 {
  const o: V3 = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    let s = 0;
    const r = R[k];
    for (let i = 0; i < DIM; i++) if (v[i] !== 0) s += r[i] * v[i];
    o[k] = s;
  }
  return o;
}

const WORLD = 1.35;
const SPREAD: Record<string, number> = {
  ai: 2.6,
  robotics: 2.1,
  identity: 2.0,
  contact: 1.6,
  foundations: 1.7,
  tsig: 1.6,
  background: 1.45,
};

function build(): V3[] {
  const pos: V3[] = FACTS.map(() => [0, 0, 0]);
  for (const c of CLUSTERS) {
    const idx = FACTS.map((f, i) => (f.cluster === c.id ? i : -1)).filter(
      (i) => i >= 0
    );
    const raw = idx.map((i) => project(VECTORS[i]));
    const mean: V3 = [0, 0, 0];
    raw.forEach((p) => p.forEach((x, k) => (mean[k] += x / raw.length)));
    const cen = raw.map((p) => p.map((x, k) => x - mean[k]) as V3);
    const maxR = Math.max(1e-6, ...cen.map((p) => Math.hypot(...p)));
    const s = SPREAD[c.id] ?? 1.2;
    const pts = cen.map((p) => p.map((x) => (x / maxR) * s) as V3);
    // repulsion
    const minD = 0.95;
    for (let it = 0; it < 60; it++) {
      for (let a = 0; a < pts.length; a++)
        for (let b = a + 1; b < pts.length; b++) {
          const d: V3 = [
            pts[b][0] - pts[a][0],
            pts[b][1] - pts[a][1],
            pts[b][2] - pts[a][2],
          ];
          const L = Math.hypot(...d) || 1e-3;
          if (L < minD) {
            const push = (minD - L) * 0.5;
            for (let k = 0; k < 3; k++) {
              pts[a][k] -= (d[k] / L) * push;
              pts[b][k] += (d[k] / L) * push;
            }
          }
        }
    }
    idx.forEach((fi, j) => {
      pos[fi] = [
        c.center[0] * WORLD + pts[j][0],
        c.center[1] * WORLD + pts[j][1],
        c.center[2] * WORLD + pts[j][2],
      ];
    });
  }
  return pos;
}

export const FACT_POS: V3[] = build();

// seeds per fact for drift (shared with the shader)
const srng = mulberry(77);
export const FACT_SEED: V3[] = FACTS.map(() => [srng(), srng(), srng()]);

// Drift. Mirrors the GLSL in Space.tsx exactly.
export function driftAmp(T: number) {
  const hot = Math.max(T - 0.9, 0);
  return 0.035 + 0.03 * T + 0.95 * hot * hot;
}
export function driftSpeed(T: number) {
  return 0.12 + 0.55 * T + 1.6 * Math.max(T - 1, 0);
}
export function drift(seed: V3, phase: number, amp: number, out: V3) {
  for (let k = 0; k < 3; k++) {
    const s = seed[k];
    out[k] = amp * Math.sin(phase * (0.6 + 0.8 * s) + s * 6.2831 + k * 1.7);
  }
  return out;
}

export type Cloud = {
  position: Float32Array;
  color: Float32Array;
  seed: Float32Array;
  size: Float32Array;
  kind: Float32Array; // 0 dust, 1 token, 2 fact
  fact: Float32Array; // fact index or -1
  cluster: Float32Array; // cluster index or -1
  count: number;
};

function hex(h: string): V3 {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export const CLUSTER_RGB: V3[] = CLUSTERS.map((c) => hex(c.color));

export function buildCloud(mobile: boolean): Cloud {
  const r = mulberry(4242);
  const SAT = mobile ? 12 : 26;
  const PER_CLUSTER = mobile ? 70 : 160;
  const DUST = mobile ? 700 : 1700;
  const count = FACTS.length * (1 + SAT) + CLUSTERS.length * PER_CLUSTER + DUST;
  const c: Cloud = {
    position: new Float32Array(count * 3),
    color: new Float32Array(count * 3),
    seed: new Float32Array(count * 3),
    size: new Float32Array(count),
    kind: new Float32Array(count),
    fact: new Float32Array(count),
    cluster: new Float32Array(count),
    count,
  };
  let n = 0;
  const push = (
    p: V3,
    col: V3,
    size: number,
    kind: number,
    fact: number,
    cl: number,
    seed?: V3
  ) => {
    c.position.set(p, n * 3);
    c.color.set(col, n * 3);
    c.seed.set(seed ?? [r(), r(), r()], n * 3);
    c.size[n] = size;
    c.kind[n] = kind;
    c.fact[n] = fact;
    c.cluster[n] = cl;
    n++;
  };
  FACTS.forEach((f, i) => {
    const cl = CLUSTER_INDEX[f.cluster];
    push(FACT_POS[i], CLUSTER_RGB[cl], 1, 2, i, cl, FACT_SEED[i]);
    for (let s = 0; s < SAT; s++) {
      const p = FACT_POS[i];
      const q: V3 = [
        p[0] + gauss(r) * 0.16,
        p[1] + gauss(r) * 0.16,
        p[2] + gauss(r) * 0.16,
      ];
      push(
        q,
        CLUSTER_RGB[cl],
        0.28 + r() * 0.3,
        1,
        i,
        cl,
        FACT_SEED[i].map((x) => x + gauss(r) * 0.04) as V3
      );
    }
  });
  CLUSTERS.forEach((cc, cl) => {
    for (let s = 0; s < PER_CLUSTER; s++) {
      const rad = 0.6 + Math.abs(gauss(r)) * 1.3;
      const d = [gauss(r), gauss(r), gauss(r)];
      const L = Math.hypot(...d) || 1;
      const q: V3 = [
        cc.center[0] * WORLD + (d[0] / L) * rad,
        cc.center[1] * WORLD + (d[1] / L) * rad,
        cc.center[2] * WORLD + (d[2] / L) * rad,
      ];
      push(q, CLUSTER_RGB[cl], 0.16 + r() * 0.22, 1, -1, cl);
    }
  });
  for (let s = 0; s < DUST; s++) {
    const rad = 4 + Math.pow(r(), 0.6) * 12;
    const d = [gauss(r), gauss(r) * 0.7, gauss(r)];
    const L = Math.hypot(...d) || 1;
    push(
      [(d[0] / L) * rad, (d[1] / L) * rad, (d[2] / L) * rad],
      [0.55, 0.6, 0.56],
      0.12 + r() * 0.16,
      0,
      -1,
      -1
    );
  }
  return c;
}

export function clusterCentroid(id: string): V3 {
  const idx = FACTS.map((f, i) => (f.cluster === id ? i : -1)).filter(
    (i) => i >= 0
  );
  const m: V3 = [0, 0, 0];
  idx.forEach((i) => FACT_POS[i].forEach((x, k) => (m[k] += x / idx.length)));
  return m;
}
