import {
  clipPoly,
  dot,
  hatch,
  key,
  line,
  mulberry32,
  polyPath,
  ring,
  text,
  titleBlock,
  type Half,
  type Pt,
  type Scene,
} from './kit';

// Fig. 2 — feasible set. Catalogue items are points in a design space.
// Structured filters are half-planes (hatched on their infeasible side);
// semantic search is nearest-neighbour, i.e. a Voronoi cell, inside the bound.

type Con = { a: Pt; b: Pt; label: string; at: number };

// normalised (u right, v down); each line passes through a and b
const CONS: Con[] = [
  {
    a: { x: 0, y: 0.6 },
    b: { x: 0.56, y: 0 },
    label: 'in the catalogue',
    at: 0.45,
  },
  {
    a: { x: 0.9, y: 0 },
    b: { x: 0.74, y: 1 },
    label: 'fits the space',
    at: 0.55,
  },
  { a: { x: 0, y: 0.84 }, b: { x: 1, y: 0.94 }, label: 'sellable', at: 0.3 },
];
const INSIDE: Pt = { x: 0.5, y: 0.55 };

export default function constraint(): Scene {
  let w = 0,
    h = 0;
  let box = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const norm: Pt[] = [];
  let pts: { p: Pt; ok: boolean }[] = [];
  let halves: Half[] = [];
  let feasible: Pt[] = [];
  let cells: Pt[][] = [];
  let feasIdx: number[] = [];
  let t = 3.2;
  const q: Pt = { x: 0, y: 0 };
  let ptr: Pt | null = null;
  let qInit = false;

  // Poisson-ish darts, deterministic
  {
    const r = mulberry32(42);
    for (let k = 0; k < 4000 && norm.length < 54; k++) {
      const p = { x: 0.03 + r() * 0.94, y: 0.05 + r() * 0.9 };
      if (norm.every((o) => Math.hypot(o.x - p.x, (o.y - p.y) * 0.8) > 0.088))
        norm.push(p);
    }
  }

  const toS = (p: Pt): Pt => ({
    x: box.x0 + p.x * (box.x1 - box.x0),
    y: box.y0 + p.y * (box.y1 - box.y0),
  });

  function build() {
    const narrow = w < 600;
    const pad = narrow ? 2 : 4;
    const tb = narrow ? 104 : 84;
    box = { x0: pad, y0: tb + 22, x1: w - pad, y1: h - (narrow ? 118 : 62) };
    halves = CONS.map((c) => {
      const a = toS(c.a);
      const b = toS(c.b);
      let nx = -(b.y - a.y);
      let ny = b.x - a.x;
      let cc = nx * a.x + ny * a.y;
      const ins = toS(INSIDE);
      if (nx * ins.x + ny * ins.y > cc) {
        nx = -nx;
        ny = -ny;
        cc = -cc;
      }
      return { nx, ny, c: cc };
    });
    const rect: Pt[] = [
      { x: box.x0, y: box.y0 },
      { x: box.x1, y: box.y0 },
      { x: box.x1, y: box.y1 },
      { x: box.x0, y: box.y1 },
    ];
    feasible = halves.reduce((poly, hp) => clipPoly(poly, hp), rect);
    pts = norm.map((n) => {
      const p = toS(n);
      return { p, ok: halves.every((hp) => hp.nx * p.x + hp.ny * p.y <= hp.c) };
    });
    feasIdx = pts.map((_, i) => i).filter((i) => pts[i].ok);
    cells = feasIdx.map((i) => {
      const pi = pts[i].p;
      let cell = feasible;
      for (const j of feasIdx) {
        if (j === i) continue;
        const pj = pts[j].p;
        const nx = pj.x - pi.x;
        const ny = pj.y - pi.y;
        const c = (pj.x * pj.x + pj.y * pj.y - pi.x * pi.x - pi.y * pi.y) / 2;
        cell = clipPoly(cell, { nx, ny, c });
        if (cell.length < 3) break;
      }
      return cell;
    });
  }

  function target(): Pt {
    return toS({
      x: 0.5 + 0.44 * Math.sin(t * 0.21),
      y: 0.5 + 0.41 * Math.sin(t * 0.33 + 1.1),
    });
  }

  return {
    resize(nw, nh) {
      w = nw;
      h = nh;
      build();
      const g = target();
      q.x = g.x;
      q.y = g.y;
      qInit = true;
    },
    step(dt) {
      t += dt;
      const g = ptr ?? target();
      const k = 1 - Math.exp(-dt * (ptr ? 9 : 3));
      if (!qInit) {
        q.x = g.x;
        q.y = g.y;
        qInit = true;
      }
      q.x += (g.x - q.x) * k;
      q.y += (g.y - q.y) * k;
    },
    settle() {
      const g = toS({ x: 0.16, y: 0.16 });
      q.x = g.x;
      q.y = g.y;
    },
    pointer(p) {
      ptr = p
        ? {
            x: Math.max(box.x0 + 4, Math.min(box.x1 - 4, p.x)),
            y: Math.max(box.y0 + 4, Math.min(box.y1 - 4, p.y)),
          }
        : null;
    },
    draw(ctx, ink) {
      const narrow = w < 600;
      const ks = narrow ? 10 : 10.5;
      titleBlock(ctx, ink, box.x0, 4, {
        k: 'SAIF · planner agent',
        sub: narrow
          ? 'structured + semantic RAG · pgvector'
          : 'structured + semantic RAG over PostgreSQL / pgvector',
        line: 'Each wish snaps to the nearest real product.',
        narrow,
        maxW: narrow ? w - 8 : w * 0.62,
      });
      // hatch the infeasible side of each constraint
      ctx.strokeStyle = ink.rule;
      ctx.lineWidth = 0.7;
      for (const hp of halves) {
        ctx.save();
        const rect: Pt[] = [
          { x: box.x0, y: box.y0 },
          { x: box.x1, y: box.y0 },
          { x: box.x1, y: box.y1 },
          { x: box.x0, y: box.y1 },
        ];
        const out = clipPoly(rect, { nx: -hp.nx, ny: -hp.ny, c: -hp.c });
        if (out.length > 2) {
          polyPath(ctx, out);
          ctx.clip();
          hatch(ctx, w, h, 7);
        }
        ctx.restore();
      }

      // frame
      ctx.strokeStyle = ink.rule;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        box.x0 + 0.5,
        box.y0 + 0.5,
        box.x1 - box.x0 - 1,
        box.y1 - box.y0 - 1
      );

      // nearest feasible item to the request
      let best = -1,
        bd = Infinity;
      feasIdx.forEach((i, k) => {
        const d = Math.hypot(pts[i].p.x - q.x, pts[i].p.y - q.y);
        if (d < bd) {
          bd = d;
          best = k;
        }
      });

      // voronoi tessellation of the feasible items
      ctx.strokeStyle = ink.rule;
      ctx.lineWidth = 0.8;
      cells.forEach((c, k) => {
        if (c.length < 3) return;
        polyPath(ctx, c);
        if (k === best) {
          ctx.fillStyle = ink.accentSoft;
          ctx.fill();
        }
        ctx.stroke();
      });
      if (best >= 0 && cells[best].length > 2) {
        ctx.strokeStyle = ink.accent;
        ctx.lineWidth = 1.2;
        polyPath(ctx, cells[best]);
        ctx.stroke();
      }

      // feasible boundary
      ctx.strokeStyle = ink.ink;
      ctx.lineWidth = 1.3;
      polyPath(ctx, feasible);
      ctx.stroke();

      // constraint labels, along each line
      CONS.forEach((c) => {
        const a = toS(c.a);
        const b = toS(c.b);
        const x = a.x + (b.x - a.x) * c.at;
        const y = a.y + (b.y - a.y) * c.at;
        let ang = Math.atan2(b.y - a.y, b.x - a.x);
        if (ang > Math.PI / 2) ang -= Math.PI;
        if (ang < -Math.PI / 2) ang += Math.PI;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.fillStyle = ink.paper;
        const lab = c.label.toUpperCase();
        ctx.font = `${ks}px ${ink.mono}`;
        const m = ctx.measureText(lab).width + lab.length * 1.1;
        ctx.fillRect(-m / 2 - 5, -14, m + 10, 13);
        key(ctx, ink, lab, 0, -4, {
          align: 'center',
          size: ks,
          color: ink.ink,
        });
        ctx.restore();
      });

      // items
      pts.forEach(({ p, ok }) => {
        if (ok) {
          ctx.fillStyle = ink.ink;
          dot(ctx, p.x, p.y, 2.2);
        } else {
          ctx.strokeStyle = ink.muted;
          ctx.lineWidth = 0.9;
          ring(ctx, p.x, p.y, 2.2);
        }
      });

      // request → nearest real product
      if (best >= 0) {
        const p = pts[feasIdx[best]].p;
        ctx.strokeStyle = ink.accent;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        line(ctx, q.x, q.y, p.x, p.y);
        ctx.setLineDash([]);
        ctx.fillStyle = ink.accent;
        dot(ctx, p.x, p.y, 3.4);
        ctx.strokeStyle = ink.accent;
        ring(ctx, p.x, p.y, 7);
        const right = p.x < box.x1 - (narrow ? 160 : 190);
        const below = q.y < p.y;
        key(
          ctx,
          ink,
          'nearest real product',
          p.x + (right ? 12 : -12),
          p.y + (below ? 22 : -24),
          {
            align: right ? 'left' : 'right',
            size: ks,
            color: ink.accent,
          }
        );
        text(
          ctx,
          ink,
          '→ render + BOQ',
          p.x + (right ? 12 : -12),
          p.y + (below ? 38 : -8),
          {
            align: right ? 'left' : 'right',
            size: narrow ? 11.5 : 12.5,
            color: ink.ink,
          }
        );
      }
      ctx.strokeStyle = ink.ink;
      ctx.lineWidth = 1.2;
      line(ctx, q.x - 5, q.y, q.x + 5, q.y);
      line(ctx, q.x, q.y - 5, q.x, q.y + 5);
      const qr = q.x < (box.x0 + box.x1) / 2;
      const wishUp = best >= 0 && q.y < pts[feasIdx[best]].p.y;
      key(
        ctx,
        ink,
        "client's wish",
        q.x + (qr ? 9 : -9),
        q.y + (wishUp ? -9 : 17),
        { align: qr ? 'left' : 'right', size: ks, color: ink.ink }
      );

      // legend
      key(ctx, ink, 'design space', box.x0, box.y0 - 7, { size: ks });
      ctx.fillStyle = ink.ink;
      const lx = box.x1 - (narrow ? 150 : 196);
      dot(ctx, lx, box.y0 - 11, 2.2);
      text(
        ctx,
        ink,
        narrow ? 'product' : 'catalogue product',
        lx + 8,
        box.y0 - 7,
        { size: ks }
      );
      ctx.strokeStyle = ink.muted;
      ctx.lineWidth = 0.9;
      const lx2 = lx + (narrow ? 70 : 132);
      ring(ctx, lx2, box.y0 - 11, 2.2);
      text(ctx, ink, 'filtered', lx2 + 8, box.y0 - 7, { size: ks });

      // the data sheet under the figure: how the catalogue became searchable
      const strip: [string, string][] = [
        ['design library', 'project images + docs → embedded'],
        ['image search', 'FastAPI + ChromaDB · thousands'],
        ['automation', '100+ manual hours saved'],
      ];
      ctx.strokeStyle = ink.rule;
      ctx.lineWidth = 1;
      if (!narrow) {
        const sy = box.y1 + 22;
        const cw = (box.x1 - box.x0) / 3;
        strip.forEach(([k, v], i) => {
          const sx = box.x0 + i * cw;
          if (i) line(ctx, sx - 8 + 0.5, sy - 10, sx - 8 + 0.5, sy + 20);
          key(ctx, ink, k, sx, sy, {
            size: ks,
            color: i === 2 ? ink.accent : ink.muted,
          });
          text(ctx, ink, v, sx, sy + 17, { size: 12.5, color: ink.ink });
        });
      } else {
        strip.forEach(([k, v], i) => {
          const sy = box.y1 + 22 + i * 33;
          key(ctx, ink, k, box.x0, sy, {
            size: 9.5,
            color: i === 2 ? ink.accent : ink.muted,
          });
          text(ctx, ink, v, box.x0, sy + 15, { size: 12, color: ink.ink });
        });
      }
    },
  };
}
