import { box2, circ, ext, seg2, type Shape } from './slicer';
import { textField } from './textSdf';
import { CHAPTERS } from './content';

/*
  The plate. One object per chapter, printed one at a time (sequential,
  "complete individual objects"), and every number on them is raised
  lettering that goes through the same slicer as the rest. Modelled here as
  distance fields; none is claimed to be his CAD.
*/

export type PartMeta = { id: string; file: string; color: 'any' | 'red' };

export const BONUS = CHAPTERS.length;

export const PARTS: PartMeta[] = [
  ...CHAPTERS.map((c) => ({ id: c.id, file: c.file, color: c.color })),
  { id: 'benchy', file: '3dbenchy_mini.stl', color: 'any' },
];

const PLACE: [number, number][] = [
  [14, 18], // nameplate 74 x 24
  [14, 66], // saif 64 x 46
  [104, 20], // arm link 54 x 18
  [98, 70], // core xy 36 x 36
  [150, 76], // stack + graph 72 x 26
  [20, 140], // gear 36 x 36
  [84, 148], // tower 32 x 20
  [180, 16], // @ 30 x 30
  [140, 150], // benchy 34 x 13
];

export function buildShape(i: number, display: string): Shape {
  const meta = PARTS[i];
  const [ox, oy] = PLACE[i];
  const bold = `800 SIZE ${display}`;
  const base = { id: meta.id, file: meta.file, ox, oy } as const;

  switch (i) {
    case 0: {
      const t1 = textField('IBRAHIM', bold, 62, 11);
      const t2 = textField('AI ENGINEER', bold, 58, 4.6);
      return {
        ...base,
        w: 74,
        d: 24,
        h: 4.05,
        infill: { kind: 'gyroid', density: 0.15 },
        sdf: (x, y, z) =>
          Math.min(
            ext(box2(x, y, 37, 12, 37, 12, 3), z, -1, 1.55),
            ext(t1(x - 6, y - 10.5), z, 1.4, 4.05),
            ext(t2(x - 8, y - 2.8), z, 1.4, 2.6)
          ),
      };
    }
    case 1: {
      // a 1:50 pergola (what Ducon builds) and four number tiles: the report, printed
      const t57 = textField('57', bold, 17, 10.5);
      const t40 = textField('40', bold, 12, 7);
      const t70 = textField('−70%', bold, 25, 8.6);
      const t35 = textField('−35%', bold, 25, 8.6);
      const posts: [number, number][] = [
        [4, 22],
        [32, 22],
        [4, 42],
        [32, 42],
      ];
      return {
        ...base,
        w: 64,
        d: 46,
        h: 16.05,
        infill: { kind: 'gyroid', density: 0.15 },
        bridgeAngle: (z) => (z < 14.8 ? 0 : 90),
        sdf: (x, y, z) => {
          let d = ext(box2(x, y, 18, 32, 18, 14, 1.5), z, -1, 1.3);
          for (const [px, py] of posts)
            d = Math.min(d, ext(box2(x, y, px, py, 1.5, 1.5, 0.4), z, 0, 13.3));
          d = Math.min(
            d,
            ext(box2(x, y, 18, 22, 18, 1.5, 0.3), z, 13.05, 14.8)
          );
          d = Math.min(
            d,
            ext(box2(x, y, 18, 42, 18, 1.5, 0.3), z, 13.05, 14.8)
          );
          let sl = Infinity;
          for (let k = 0; k < 9; k++)
            sl = Math.min(sl, box2(x, y, 2.6 + k * 3.85, 32, 1.1, 13.5, 0.3));
          d = Math.min(d, ext(sl, z, 14.8, 16.05));
          // tiles
          d = Math.min(d, ext(box2(x, y, 52, 38, 12, 8, 1.5), z, -1, 1.8));
          d = Math.min(d, ext(box2(x, y, 52, 22, 12, 5.5, 1.5), z, -1, 1.8));
          d = Math.min(d, ext(box2(x, y, 15, 6.5, 15, 6.5, 1.5), z, -1, 1.8));
          d = Math.min(d, ext(box2(x, y, 49, 6.5, 15, 6.5, 1.5), z, -1, 1.8));
          if (z < 1.4) return d;
          const txt = Math.min(
            t57(x - 43.5, y - 32.75),
            t40(x - 46, y - 18.5),
            t70(x - 2.5, y - 2.2),
            t35(x - 36.5, y - 2.2)
          );
          return Math.min(d, ext(txt, z, 1.6, 3.8));
        },
      };
    }
    case 2: {
      const t3 = textField('3RD', bold, 15, 7.5);
      return {
        ...base,
        w: 54,
        d: 18,
        h: 7.05,
        infill: { kind: 'rect', density: 0.2 },
        sdf: (x, y, z) => {
          const plate = ext(seg2(x, y, 9, 9, 45, 9, 6), z, -1, 4.3);
          const boss = ext(
            Math.min(circ(x, y, 9, 9, 8.5), circ(x, y, 45, 9, 8.5)),
            z,
            -1,
            7.05
          );
          const bore = Math.min(circ(x, y, 9, 9, 3), circ(x, y, 45, 9, 3));
          const body = Math.max(Math.min(plate, boss), -bore);
          return Math.min(body, ext(t3(x - 19.5, y - 5.25), z, 4.05, 5.8));
        },
      };
    }
    case 3:
      return {
        ...base,
        w: 36,
        d: 36,
        h: 18.05,
        infill: { kind: 'gyroid', density: 0.15 },
        sdf: (x, y, z) => {
          const L = ext(
            Math.min(box2(x, y, 18, 7, 18, 7, 2), box2(x, y, 7, 18, 7, 18, 2)),
            z,
            -1,
            6.05
          );
          const a = ext(circ(x, y, 28.5, 7, 6.5), z, -1, 12.05);
          const b = ext(circ(x, y, 7, 28.5, 6.5), z, -1, 18.05);
          const holes = Math.min(
            circ(x, y, 28.5, 7, 1.6),
            circ(x, y, 7, 28.5, 1.6),
            circ(x, y, 7, 7, 2.6),
            circ(x, y, 17, 7, 1.6),
            circ(x, y, 7, 17, 1.6)
          );
          return Math.max(Math.min(L, a, b), -holes);
        },
      };
    case 4: {
      // a four-tier backend, and Atomic Sensei's three agents as a graph
      const tiers: [number, number, number, number, number][] = [
        [17, 12, 2, 0, 3.05],
        [14, 9.5, 1.8, 3.05, 6.05],
        [11, 7, 1.6, 6.05, 9.05],
        [8, 4.5, 1.4, 9.05, 12.05],
      ];
      const nodes: [number, number][] = [
        [46, 5],
        [66, 5],
        [56, 21],
      ];
      return {
        ...base,
        w: 72,
        d: 26,
        h: 12.05,
        infill: { kind: 'gyroid', density: 0.15 },
        sdf: (x, y, z) => {
          let d = Infinity;
          for (const [hx, hy, r, z0, z1] of tiers)
            d = Math.min(
              d,
              ext(box2(x, y, 17, 12, hx, hy, r), z, z0 === 0 ? -1 : z0, z1)
            );
          if (x < 38) return d;
          let n = Infinity;
          for (const [nx, ny] of nodes)
            n = Math.min(n, circ(x, y, nx, ny, 4.5));
          let e = Infinity;
          for (let k = 0; k < 3; k++) {
            const [ax, ay] = nodes[k];
            const [bx, by] = nodes[(k + 1) % 3];
            e = Math.min(e, seg2(x, y, ax, ay, bx, by, 1.5));
          }
          return Math.min(d, ext(n, z, -1, 7.05), ext(e, z, -1, 2.55));
        },
      };
    }
    case 5: {
      // TSIG: a 12-tooth gear with the headcount on it
      const t30 = textField('30', bold, 14, 10);
      const S = (Math.PI * 2) / 12;
      return {
        ...base,
        w: 36,
        d: 36,
        h: 6.05,
        infill: { kind: 'gyroid', density: 0.15 },
        sdf: (x, y, z) => {
          const dx = x - 18;
          const dy = y - 18;
          const r = Math.hypot(dx, dy);
          const a = Math.atan2(dy, dx);
          const af = ((((a + S / 2) % S) + S) % S) - S / 2;
          const tooth = box2(
            r * Math.cos(af),
            r * Math.sin(af),
            15.9,
            0,
            2.1,
            1.8,
            0.5
          );
          const gear = Math.min(r - 14.6, tooth);
          return Math.min(
            ext(gear, z, -1, 4.3),
            ext(t30(x - 11, y - 13), z, 4.05, 6.05)
          );
        },
      };
    }
    case 6: {
      // Dubai, Hyderabad, Dubai: three tiers in the order they happened, codes embossed on the fronts
      const dxb = textField('DXB', bold, 15, 4.2);
      const hyd = textField('HYD', bold, 22, 8);
      const dxb2 = textField('DXB', bold, 13, 3.8);
      return {
        ...base,
        w: 32,
        d: 20,
        h: 24.05,
        infill: { kind: 'gyroid', density: 0.15 },
        sdf: (x, y, z) => {
          const t1 = ext(box2(x, y, 16, 10.5, 16, 9.5, 1), z, -1, 6.05);
          const t2 = ext(box2(x, y, 16, 11, 14, 8.5, 1), z, 5.9, 18.05);
          const t3 = ext(box2(x, y, 16, 11, 12, 7, 1), z, 17.9, 24.05);
          let d = Math.min(t1, t2, t3);
          if (y < 4.5) {
            d = Math.min(
              d,
              Math.max(dxb(x - 8.5, z - 0.9), y - 1.2, 0.2 - y, z - 6.05)
            );
            d = Math.min(d, Math.max(hyd(x - 5, z - 8), y - 2.7, 1.7 - y));
            d = Math.min(
              d,
              Math.max(dxb2(x - 9.5, z - 19.1), y - 4.2, 3.2 - y)
            );
          }
          return d;
        },
      };
    }
    case 7: {
      const t = textField('@', bold, 30, 30);
      return {
        ...base,
        w: 30,
        d: 30,
        h: 5.05,
        infill: { kind: 'gyroid', density: 0.15 },
        sdf: (x, y, z) => ext(t(x, y), z, -1, 5.05),
      };
    }
    default: {
      // a small boat-shaped torture test: tapered hull, hollow cabin with
      // windows, bridged roof, hollow chimney
      const hull2 = (x: number, y: number) =>
        Math.min(
          box2(x, y, 9.5, 6.5, 9.5, 6.5, 2.5),
          Math.max(circ(x, y, 18, -9, 22), circ(x, y, 18, 22, 22))
        );
      return {
        ...base,
        w: 34,
        d: 13,
        h: 19.05,
        infill: { kind: 'gyroid', density: 0.15 },
        bridgeAngle: () => 90,
        sdf: (x, y, z) => {
          const hull = Math.max(
            hull2(x, y) + Math.max(0, 6.5 - z) * 0.22,
            -1 - z,
            z - 6.5
          );
          const outer = Math.max(
            box2(x, y, 10, 6.5, 6, 5, 0.6),
            6 - z,
            z - 14.4
          );
          const inner = Math.max(
            box2(x, y, 10, 6.5, 4.8, 3.8, 0.3),
            6.6 - z,
            z - 13.6
          );
          const winY = Math.max(
            Math.abs(x - 10) - 2.6,
            Math.abs(z - 10.4) - 1.8
          );
          const winX = Math.max(
            Math.abs(y - 6.5) - 2.2,
            Math.abs(z - 10.4) - 1.8
          );
          const cab = Math.max(outer, -inner, -winY, -winX);
          const roof = Math.max(
            box2(x, y, 10, 6.5, 7.2, 6.2, 0.5),
            14.2 - z,
            z - 15.2
          );
          const rc = circ(x, y, 7, 6.5, 2);
          const chim = Math.max(rc, 14.5 - z, z - 19.05, -(rc + 0.9));
          return Math.min(hull, cab, roof, chim);
        },
      };
    }
  }
}

export const PLATE = 250;
