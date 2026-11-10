import {
  arrowHead,
  callout,
  dot,
  key,
  line,
  mulberry32,
  gaussian,
  px,
  ring,
  text,
  titleBlock,
  type Scene,
} from './kit';

// Fig. I — a control chart of SAIF generations. Every attempt is evaluated;
// outside the tolerance band it is rejected and regenerated, inside it ships.
// The count is real (57 client designs in the first four weeks); the spread of
// the samples and where the rejections fall are schematic.

const T = 1.75; // tolerance limit, in σ
const RANGE = 3.4; // half-height of the value axis, in σ
const KEPT = 57;
const DRAW = 11; // seconds to plot the run
const HOLD = 6;
// rejected attempts: [after this many kept designs, value]
const REJECTS: [number, number][] = [
  [7, 2.55],
  [19, -2.35],
  [27, 2.15],
  [38, -2.7],
  [48, 2.4],
];
const NOTES: Record<number, string[]> = {
  0: ['image drift', '→ regenerate'],
  3: ['fails validation', '→ regenerate'],
};

type S = { v: number; rej: boolean; kept: number; note?: number };

function build(): S[] {
  const r = mulberry32(7);
  const out: S[] = [];
  let kept = 0;
  let ri = 0;
  while (kept < KEPT) {
    if (ri < REJECTS.length && REJECTS[ri][0] === kept) {
      out.push({
        v: REJECTS[ri][1],
        rej: true,
        kept,
        note: NOTES[ri] ? ri : undefined,
      });
      ri++;
    }
    const drift = 0.28 * Math.sin(kept / 6);
    let v = drift + gaussian(r) * 0.62;
    v = Math.max(-T + 0.12, Math.min(T - 0.12, v));
    kept++;
    out.push({ v, rej: false, kept });
  }
  return out;
}

const SAMPLES = build();
const N = SAMPLES.length;

export default function tolerance(): Scene {
  let w = 0,
    h = 0;
  let t = 0;

  return {
    resize(nw, nh) {
      w = nw;
      h = nh;
    },
    step(dt) {
      t = (t + dt) % (DRAW + HOLD);
    },
    settle() {
      t = DRAW + 0.01;
    },
    draw(ctx, ink) {
      const narrow = w < 600;
      const ks = narrow ? 10 : 10.5;
      const pad = narrow ? 2 : 4;
      const p = Math.min(1, t / DRAW);
      const shown = p * N;
      const nShown = Math.floor(shown);
      const keptNow =
        nShown > 0 ? SAMPLES[Math.min(N - 1, nShown - 1)].kept : 0;
      const done = p >= 1;

      // ——— title block + counter ———
      const tbH = titleBlock(ctx, ink, pad, 4, {
        k: 'SAIF AI Designer · Ducon Industries R&D',
        sub: narrow
          ? 'WhatsApp photo in → design + BOQ out'
          : 'WhatsApp photo in → rendered design + bill of quantities out · Aug 2025 → now',
        line: 'Renders that drift get regenerated.',
        narrow,
        maxW: narrow ? w * 0.66 : w * 0.6,
      });
      const cs = narrow ? 46 : 72;
      text(ctx, ink, String(keptNow), w - pad, cs * 0.86 + 4, {
        size: cs,
        font: 'serif',
        color: done ? ink.accent : ink.ink,
        align: 'right',
      });
      const cl = narrow
        ? ['client designs', 'first 4 weeks']
        : ['client designs · first 4 weeks', 'before the marketing launch'];
      cl.forEach((s, i) =>
        key(ctx, ink, s, w - pad, cs * 0.86 + 22 + i * 14, {
          align: 'right',
          size: ks,
          color: i ? ink.muted : ink.ink,
        })
      );

      // ——— chart frame ———
      const L = narrow ? 34 : 62;
      const Rm = narrow ? 8 : 190;
      const top = Math.max(tbH + 30, cs * 0.86 + 22 + cl.length * 14 + 10);
      const bottom = h - (narrow ? 96 : 40);
      const x0 = L;
      const x1 = w - Rm;
      const yOf = (v: number) =>
        top + ((RANGE - v) / (2 * RANGE)) * (bottom - top);
      const yU = yOf(T);
      const yL = yOf(-T);
      const y0 = yOf(0);
      const dx = (x1 - x0 - 10) / (N - 1);
      const xOf = (i: number) => x0 + 6 + i * dx;

      // tolerance band (a soft light falloff toward the limits)
      const g = ctx.createLinearGradient(0, yU, 0, yL);
      g.addColorStop(0, 'rgba(24,21,15,0.025)');
      g.addColorStop(0.5, 'rgba(24,21,15,0.07)');
      g.addColorStop(1, 'rgba(24,21,15,0.025)');
      ctx.fillStyle = g;
      ctx.fillRect(x0, yU, x1 - x0, yL - yU);
      // rejection zones
      ctx.fillStyle = ink.accentSoft;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(x0, top, x1 - x0, yU - top);
      ctx.fillRect(x0, yL, x1 - x0, bottom - yL);
      ctx.globalAlpha = 1;

      ctx.lineWidth = 1;
      ctx.strokeStyle = ink.rule;
      line(ctx, px(x0), top, px(x0), bottom);
      line(ctx, x0, px(bottom), x1, px(bottom));
      ctx.strokeStyle = ink.ink;
      line(ctx, x0, px(yU), x1, px(yU));
      line(ctx, x0, px(yL), x1, px(yL));
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = ink.muted;
      line(ctx, x0, px(y0), x1, px(y0));
      ctx.setLineDash([]);

      text(ctx, ink, 'UTL', x0 - 7, yU + 4, { align: 'right', size: ks });
      text(ctx, ink, 'LTL', x0 - 7, yL + 4, { align: 'right', size: ks });
      text(ctx, ink, 'μ', x0 - 7, y0 + 5, {
        align: 'right',
        size: 15,
        font: 'italic',
        color: ink.ink,
      });
      key(ctx, ink, 'reject', x0 + 6, top + 13, {
        size: ks - 0.5,
        color: ink.accent,
      });
      key(ctx, ink, 'reject', x0 + 6, bottom - 6, {
        size: ks - 0.5,
        color: ink.accent,
      });

      // week ticks (schematic split of the 57 across four weeks)
      const weekAt = [0, 14, 28, 43, KEPT].map((k) => {
        const i = SAMPLES.findIndex((s) => !s.rej && s.kept >= Math.max(1, k));
        return k === KEPT ? N - 1 : Math.max(0, i);
      });
      for (let wk = 0; wk < 4; wk++) {
        const xa = xOf(weekAt[wk]);
        const xb = xOf(weekAt[wk + 1]);
        ctx.strokeStyle = ink.rule;
        line(ctx, px(xa), bottom, px(xa), bottom + 5);
        text(
          ctx,
          ink,
          narrow ? `W${wk + 1}` : `week ${wk + 1}`,
          (xa + xb) / 2,
          bottom + 16,
          {
            align: 'center',
            size: ks,
            color: ink.ink,
          }
        );
      }
      ctx.strokeStyle = ink.rule;
      line(ctx, px(xOf(N - 1)), bottom, px(xOf(N - 1)), bottom + 5);

      // ——— samples ———
      const notes: { x: number; y: number; s: S }[] = [];
      for (let i = 0; i < Math.min(N, Math.ceil(shown)); i++) {
        const s = SAMPLES[i];
        const fresh = Math.min(1, shown - i);
        const x = xOf(i);
        const y = yOf(s.v);
        ctx.globalAlpha = 0.25 + 0.75 * fresh;
        if (s.rej) {
          ctx.strokeStyle = ink.accent;
          ctx.lineWidth = 1.3;
          ring(ctx, x, y, 4);
          if (i + 1 < shown) {
            // regeneration: a dashed return into the band
            ctx.setLineDash([2, 2.5]);
            ctx.lineWidth = 1;
            const nx = xOf(i + 1);
            const ny = yOf(SAMPLES[i + 1].v);
            line(ctx, x, y + (s.v > 0 ? 4 : -4), nx, ny);
            ctx.setLineDash([]);
            ctx.fillStyle = ink.accent;
            arrowHead(ctx, nx, ny, Math.atan2(ny - y, nx - x), 4);
          }
          if (s.note !== undefined) notes.push({ x, y, s });
        } else {
          ctx.fillStyle = ink.ink;
          dot(ctx, x, y, narrow ? 2 : 2.3);
        }
        ctx.globalAlpha = 1;
      }

      // head
      if (!done && nShown < N) {
        const hx = xOf(Math.min(N - 1, shown));
        ctx.strokeStyle = ink.rule;
        ctx.setLineDash([1, 3]);
        line(ctx, hx, top, hx, bottom);
        ctx.setLineDash([]);
      }

      // ——— callouts on the rejected samples ———
      for (const n of notes) {
        const up = n.s.v > 0;
        const right = n.x < x1 - (narrow ? 130 : 170);
        const lx = n.x + (right ? 16 : -16);
        const ly = up
          ? Math.max(top + 30, n.y - 24)
          : Math.min(bottom - 24, n.y + 26);
        callout(
          ctx,
          ink,
          n.x + (right ? 3 : -3),
          n.y + (up ? -3 : 3),
          lx,
          ly,
          NOTES[n.s.note!],
          {
            color: ink.accent,
            side: right ? 'right' : 'left',
            ks,
            vs: narrow ? 11.5 : 12.5,
            dot: false,
          }
        );
      }

      // ——— the band's spec, on the right (desktop) or below (phone) ———
      const spec = [
        ['schema', 'strict JSON'],
        ['validation', 'code + LLM nodes'],
        ['benchmark', 'eval dataset'],
        ['traces', 'LangSmith · Langfuse'],
      ];
      if (!narrow) {
        const bx = x1 + 14;
        ctx.strokeStyle = ink.ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx - 4, yU);
        ctx.lineTo(bx, yU);
        ctx.lineTo(bx, yL);
        ctx.lineTo(bx - 4, yL);
        ctx.stroke();
        const ys = Math.max(
          top + 8,
          (yU + yL) / 2 - (spec.length * 34 + 22) / 2
        );
        line(ctx, bx, ys + 4, bx + 8, ys + 4);
        key(ctx, ink, 'ships to client', bx + 14, ys + 8, {
          size: ks,
          color: ink.ink,
        });
        spec.forEach(([k, v], i) => {
          const ya = ys + 34 + i * 34;
          key(ctx, ink, k, bx + 14, ya, { size: ks - 0.5 });
          text(ctx, ink, v, bx + 14, ya + 15, { size: 12, color: ink.ink });
        });
        key(ctx, ink, 'generate → evaluate → regenerate', x0, h - 8, {
          size: ks,
          color: ink.muted,
        });
      } else {
        const sy = bottom + 36;
        spec.forEach(([k, v], i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const sx = pad + col * (w / 2);
          key(ctx, ink, k, sx, sy + row * 32, { size: 9.5 });
          text(ctx, ink, v, sx, sy + row * 32 + 14, {
            size: 11.5,
            color: ink.ink,
          });
        });
      }

      // legend
      if (!narrow) {
        const lx = x1 - 250;
        const ly = top - 10;
        ctx.fillStyle = ink.ink;
        dot(ctx, lx, ly - 4, 2.3);
        text(ctx, ink, 'kept', lx + 8, ly, { size: ks });
        ctx.strokeStyle = ink.accent;
        ctx.lineWidth = 1.3;
        ring(ctx, lx + 58, ly - 4, 4);
        text(ctx, ink, 'rejected', lx + 67, ly, {
          size: ks,
          color: ink.accent,
        });
        text(ctx, ink, 'spread schematic', x1, ly, {
          size: ks,
          align: 'right',
        });
      }
    },
  };
}
