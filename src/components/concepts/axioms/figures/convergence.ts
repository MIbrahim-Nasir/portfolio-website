import {
  bigNum,
  bracket,
  dot,
  key,
  line,
  mulberry32,
  px,
  smooth,
  stamp,
  text,
  titleBlock,
  type Scene,
} from './kit';

// Fig. IV — convergence. SAIF generation time per design, 20+ min → 5–7 min.
// The endpoints are measured; the order and size of the steps are schematic.

const LEVELS = [21.5, 15.8, 11.6, 8.7, 6.7];
const DROPS = [0.2, 0.41, 0.6, 0.77];
const STEPS: [string, string][] = [
  ['parallel', 'agent nodes'],
  ['thinking', 'tuned per node'],
  ['model', '→ Gemini Flash'],
  ['logic', 'LLM → plain code'],
];
const DROPS_N = [0.36, 0.53, 0.67, 0.8];
const STEPS_N: [string, string][] = [
  ['parallel', 'agent nodes'],
  ['thinking', 'per node'],
  ['model', 'Gemini Flash'],
  ['logic', '→ code'],
];
const DRAW = 9;
const HOLD = 5;

export default function convergence(): Scene {
  let w = 0,
    h = 0;
  let t = 0;
  const noise: number[] = [];
  {
    const r = mulberry32(11);
    let a = 0;
    for (let i = 0; i <= 400; i++) {
      a = a * 0.82 + (r() - 0.5) * 0.9;
      noise.push(a);
    }
  }

  let drops = DROPS;
  function f(x: number) {
    let v = LEVELS[0];
    drops.forEach((d, i) => {
      v += (LEVELS[i + 1] - LEVELS[i]) * smooth((x - d) / 0.03);
    });
    const fk = Math.max(
      0,
      Math.min(noise.length - 1.001, x * (noise.length - 1))
    );
    const k = Math.floor(fk);
    const n = noise[k] + (noise[k + 1] - noise[k]) * (fk - k);
    return v + n * 0.5 * (v / LEVELS[0]) * (1 - smooth((x - 0.93) / 0.07));
  }

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
      const ks = narrow ? 9.5 : 10.5;
      const pad = narrow ? 2 : 4;
      drops = narrow ? DROPS_N : DROPS;
      const steps = narrow ? STEPS_N : STEPS;

      const tbH = titleBlock(ctx, ink, pad, 4, {
        k: 'SAIF · generation time per design',
        line: 'Four changes, about 70% faster.',
        narrow,
        maxW: narrow ? w - 8 : w * 0.6,
      });
      const p = Math.min(1, t / DRAW);
      const done = p >= 1;
      if (!narrow)
        stamp(ctx, ink, ['~70% faster'], w - 8, 28, {
          align: 'right',
          size: 12,
        });

      const L = narrow ? 30 : 52;
      const R = narrow ? 6 : 24;
      const top = tbH + (narrow ? 44 : 40);
      const bottom = h - (narrow ? 96 : 78);
      const x0 = L;
      const x1 = w - R;
      const yOf = (m: number) => bottom - (m / 24) * (bottom - top);
      const xOf = (x: number) => x0 + x * (x1 - x0);

      ctx.lineWidth = 1;
      for (const m of [0, 5, 10, 15, 20]) {
        ctx.strokeStyle = m === 0 ? ink.rule : ink.faint;
        line(ctx, x0, px(yOf(m)), x1, px(yOf(m)));
        text(ctx, ink, String(m), x0 - 8, yOf(m) + 4, {
          align: 'right',
          size: ks,
        });
      }
      ctx.strokeStyle = ink.rule;
      line(ctx, px(x0), top - 6, px(x0), bottom);
      key(ctx, ink, 'min', x0 - 8, top - 12, { align: 'right', size: ks });
      key(ctx, ink, 'iterations →', x1, bottom + 18, {
        align: 'right',
        size: ks,
      });

      // the 5–7 minute band (a heat that cools toward the target)
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, 'rgba(194,58,29,0.03)');
      g.addColorStop(1, 'rgba(194,58,29,0.16)');
      ctx.fillStyle = g;
      ctx.fillRect(x0 + 1, yOf(7), x1 - x0 - 1, yOf(5) - yOf(7));
      ctx.strokeStyle = ink.accent;
      ctx.setLineDash([2, 3]);
      line(ctx, x0, px(yOf(7)), x1, px(yOf(7)));
      line(ctx, x0, px(yOf(5)), x1, px(yOf(5)));
      ctx.setLineDash([]);
      key(ctx, ink, '5–7 min', x0 + 6, yOf(5) - 4, {
        size: ks - 0.5,
        color: ink.accent,
      });

      // trace
      const N = Math.max(80, Math.floor((x1 - x0) / 1.5));
      const end = Math.floor(N * p);
      ctx.strokeStyle = ink.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= end; i++) {
        const X = xOf(i / N);
        const Y = yOf(f(i / N));
        if (i) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
      }
      ctx.stroke();

      // the four steps, labelled where they happen
      drops.forEach((d, i) => {
        if (p < d + 0.015) return;
        const X = xOf(d);
        const Y = yOf(LEVELS[i]) - (narrow ? 12 : 14);
        ctx.strokeStyle = ink.muted;
        ctx.lineWidth = 0.8;
        line(ctx, X, Y + 6, X, Y - 26);
        const [k, v] = steps[i];
        key(ctx, ink, `${'abcd'[i]} · ${k}`, X + 5, Y - 17, {
          size: ks,
          color: ink.ink,
        });
        text(ctx, ink, v, X + 5, Y - 2, {
          size: narrow ? 11 : 12.5,
          color: ink.muted,
        });
      });

      // plateau bracket on the first level
      if (p > 0.18 && !narrow) {
        ctx.strokeStyle = ink.muted;
        ctx.lineWidth = 0.8;
        const Y = yOf(LEVELS[0]) - 14;
        bracket(ctx, xOf(0.015), xOf(0.18), Y, -1, 4);
        key(ctx, ink, 'plateau · stay', xOf(0.0975), Y - 7, {
          align: 'center',
          size: ks - 0.5,
        });
      }

      // endpoints
      ctx.fillStyle = ink.ink;
      dot(ctx, xOf(0), yOf(f(0)), 3.4);
      bigNum(
        ctx,
        ink,
        '20+ min',
        xOf(0) + 6,
        yOf(LEVELS[0]) + (narrow ? 34 : 50),
        {
          size: narrow ? 22 : 38,
          color: ink.ink,
        }
      );
      const hx = xOf(p);
      const hy = yOf(f(p));
      ctx.fillStyle = done ? ink.accent : ink.ink;
      dot(ctx, hx, hy, done ? 4 : 3);
      if (done) {
        ctx.strokeStyle = ink.accent;
        ctx.lineWidth = 1;
        line(ctx, hx, hy + 6, hx, yOf(5) + (narrow ? 8 : 10));
        text(ctx, ink, '7 min', x1 - 2, yOf(5) + (narrow ? 32 : 46), {
          size: narrow ? 26 : 38,
          font: 'serif',
          color: ink.accent,
          align: 'right',
        });
      } else {
        ctx.strokeStyle = ink.rule;
        ctx.setLineDash([1, 3]);
        line(ctx, hx, hy + 5, hx, bottom);
        ctx.setLineDash([]);
      }

      // footer: the human side of the same number
      const fy = bottom + (narrow ? 40 : 44);
      key(ctx, ink, 'designers', pad, fy, { size: ks, color: ink.accent });
      text(
        ctx,
        ink,
        narrow
          ? '−35% designer time / session'
          : '−35% designer time per client session',
        pad,
        fy + 16,
        {
          size: narrow ? 11.5 : 12.5,
          color: ink.ink,
        }
      );
      if (narrow) {
        key(ctx, ink, '~70% faster', w - pad, fy, {
          size: ks,
          color: ink.accent,
          align: 'right',
        });
        key(ctx, ink, 'steps schematic', pad, fy + 36, { size: 9 });
      } else
        key(ctx, ink, 'endpoints measured · steps schematic', x0, bottom + 18, {
          size: ks - 0.5,
        });
    },
  };
}
