import {
  arrow,
  bigNum,
  bracket,
  callout,
  dot,
  hatch,
  key,
  line,
  px,
  smooth,
  text,
  titleBlock,
  wrap,
  type Ink,
  type Scene,
} from './kit';

// Fig. VII — load path. A point load F spreads through the body to n supports;
// each reaction is F/n and the stress on each path falls as n grows. The club's
// work is the load; the thirty members are the supports.

const SEQ = [1, 2, 3, 5, 8, 13, 21, 30];
const DWELL = 2.1;
const HOLD = 5;
const CYCLE = SEQ.length * DWELL + HOLD - DWELL;

export default function loadpath(): Scene {
  let w = 0,
    h = 0;
  let t = 0;
  let flow = 0;

  const stage = () => {
    const i = Math.min(SEQ.length - 1, Math.floor(t / DWELL));
    return { i, f: smooth((t - i * DWELL) / 0.6) };
  };

  function strip(
    ctx: CanvasRenderingContext2D,
    ink: Ink,
    x: number,
    y: number,
    cw: number,
    narrow: boolean,
    i: number
  ) {
    const ks = narrow ? 9.5 : 10.5;
    if (i === 0) {
      key(ctx, ink, 'club hours', x, y, { size: ks, color: ink.accent });
      // a time bar: 16:00 → 22:00
      const bx0 = x + 16;
      const bx1 = bx0 + Math.min(cw - 40, 220);
      const by = y + 16;
      const hx = (hh: number) => bx0 + ((hh - 16) / 6) * (bx1 - bx0);
      ctx.strokeStyle = ink.rule;
      ctx.lineWidth = 1;
      line(ctx, bx0, px(by), bx1, px(by));
      ctx.fillStyle = ink.accent;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(hx(16), by - 2.5, hx(21.5) - hx(16), 5);
      ctx.globalAlpha = 1;
      [16, 18, 20, 22].forEach((hh) => {
        ctx.strokeStyle = ink.muted;
        line(ctx, px(hx(hh)), by + 4, px(hx(hh)), by + 8);
        text(ctx, ink, `${hh}:00`, hx(hh), by + 19, {
          size: 9.5,
          align: 'center',
        });
      });
      const fs = narrow ? 14 : 15;
      wrap(
        ctx,
        ink,
        'Classes ended at four. We stayed till nine or ten.',
        cw - 16,
        fs,
        'italic'
      ).forEach((s, j) =>
        text(ctx, ink, s, x, by + 40 + j * (fs + 3), {
          size: fs,
          font: 'italic',
          color: ink.ink,
        })
      );
    } else if (i === 1) {
      key(ctx, ink, 'what I passed on', x, y, { size: ks, color: ink.accent });
      [
        'front-end internship · one month',
        'electronics workshop',
        'placement mentoring',
      ].forEach((s, j) =>
        text(ctx, ink, s, x, y + 18 + j * 16, {
          size: narrow ? 11.5 : 12,
          color: ink.ink,
        })
      );
    } else {
      key(ctx, ink, 'Atomic Sensei · learning platform', x, y, {
        size: ks,
        color: ink.accent,
      });
      [
        'roadmap · lesson · quiz agents (Gemini)',
        'async lessons · Supabase cron',
        'architecture + data model: mine',
      ].forEach((s, j) =>
        text(ctx, ink, s, x, y + 18 + j * 16, {
          size: narrow ? 11.5 : 12,
          color: j === 2 ? ink.muted : ink.ink,
        })
      );
    }
  }

  return {
    resize(nw, nh) {
      w = nw;
      h = nh;
    },
    step(dt) {
      t = (t + dt) % CYCLE;
      flow += dt;
    },
    settle() {
      t = (SEQ.length - 1) * DWELL + 1;
      flow = 0.4;
    },
    draw(ctx, ink) {
      const narrow = w < 640;
      const ks = narrow ? 9.5 : 10.5;
      const { i, f } = stage();
      const n = SEQ[i];
      const prev = i > 0 ? SEQ[i - 1] : 1;

      const tbH = titleBlock(ctx, ink, narrow ? 2 : 4, 4, {
        k: 'TSIG · MJCET engineering club',
        sub: 'Vice Chair & Technical Lead · 2022–25 · joined in robotics',
        line: '30 members, 10+ projects running at once.',
        narrow,
        maxW: narrow ? w - 8 : w * 0.56,
      });

      const stripH = narrow ? 250 : 112;
      const top = tbH + (narrow ? 62 : 64);
      const base = h - stripH - (narrow ? 70 : 84);
      const x0 = narrow ? 6 : 24;
      const x1 = w - (narrow ? 6 : 24);
      const cx = narrow ? w * 0.42 : (x0 + x1) / 2;
      const span = (x1 - x0) * 0.92;
      const scx = (x0 + x1) / 2;

      // readouts
      if (!narrow) {
        text(ctx, ink, `n = ${n}`, w - 6, 40, {
          size: 34,
          font: 'serif',
          color: ink.ink,
          align: 'right',
        });
        text(ctx, ink, `R = F / ${n}`, w - 6, 64, {
          size: 17,
          font: 'italic',
          color: ink.accent,
          align: 'right',
        });
        key(ctx, ink, 'σ = F / nA · stress per path', w - 6, 84, {
          size: ks,
          align: 'right',
        });
      } else {
        text(ctx, ink, `n = ${n}`, w - 4, top - 16, {
          size: 24,
          font: 'serif',
          color: ink.ink,
          align: 'right',
        });
        text(ctx, ink, `R = F/${n}`, w - 4, top + 4, {
          size: 14,
          font: 'italic',
          color: ink.accent,
          align: 'right',
        });
      }

      // body
      ctx.strokeStyle = ink.rule;
      ctx.lineWidth = 1;
      line(ctx, x0, px(top), x1, px(top));
      line(ctx, x0, px(base), x1, px(base));

      ctx.strokeStyle = ink.ink;
      ctx.fillStyle = ink.ink;
      ctx.lineWidth = 1.6;
      arrow(ctx, cx, top - 40, cx, top - 2, 7);
      text(ctx, ink, 'F', cx - 10, top - 22, {
        size: 19,
        font: 'italic',
        color: ink.ink,
        align: 'right',
      });
      callout(
        ctx,
        ink,
        cx + 4,
        top - 30,
        cx + (narrow ? 18 : 30),
        top - 40,
        narrow
          ? ['the load', '10+ projects']
          : ['the load', '10+ concurrent projects', 'AI · web · robotics'],
        {
          ks,
          vs: narrow ? 11.5 : 12.5,
          dot: false,
          shoulder: 8,
        }
      );

      const supportsX = (m: number) =>
        Array.from({ length: m }, (_, k) =>
          m === 1 ? cx : scx - span / 2 + (k / (m - 1)) * span
        );

      const drawPaths = (m: number, alpha: number) => {
        if (alpha <= 0.01) return;
        const xs = supportsX(m);
        const lw = Math.max(0.6, 3.4 / Math.sqrt(m));
        const H = base - top;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = ink.ink;
        ctx.lineWidth = lw;
        xs.forEach((sx) => {
          ctx.beginPath();
          ctx.moveTo(cx, top);
          ctx.bezierCurveTo(cx, top + H * 0.42, sx, base - H * 0.5, sx, base);
          ctx.stroke();
        });
        ctx.fillStyle = ink.accent;
        const per = m > 12 ? 1 : 2;
        xs.forEach((sx, k) => {
          for (let j = 0; j < per; j++) {
            const u =
              (((flow * 0.32 + j / per + ((k * 0.137) % 1)) % 1) + 1) % 1;
            const a = 1 - u;
            const bx =
              a * a * a * cx +
              3 * a * a * u * cx +
              3 * a * u * u * sx +
              u * u * u * sx;
            const by =
              a * a * a * top +
              3 * a * a * u * (top + H * 0.42) +
              3 * a * u * u * (base - H * 0.5) +
              u * u * u * base;
            dot(ctx, bx, by, Math.max(1.6, 3.6 / Math.sqrt(m)) + 0.3);
          }
        });
        ctx.fillStyle = ink.paper;
        ctx.strokeStyle = ink.ink;
        ctx.lineWidth = 1;
        const tri = m > 16 ? 3.2 : 5;
        const rlen = Math.max(4, 30 / m);
        xs.forEach((sx) => {
          ctx.beginPath();
          ctx.moveTo(sx, base);
          ctx.lineTo(sx - tri, base + tri * 1.6);
          ctx.lineTo(sx + tri, base + tri * 1.6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = ink.accent;
          ctx.strokeStyle = ink.accent;
          arrow(
            ctx,
            sx,
            base + tri * 1.6 + 6 + rlen,
            sx,
            base + tri * 1.6 + 5,
            3.5
          );
          ctx.fillStyle = ink.paper;
          ctx.strokeStyle = ink.ink;
        });
        ctx.globalAlpha = 1;
      };

      drawPaths(prev, i > 0 ? 1 - f : 0);
      drawPaths(n, i > 0 ? f : 1);
      ctx.fillStyle = ink.accent;
      dot(ctx, cx, top, 3.2);

      // ground
      const gTop = base + (n > 16 ? 3.2 : 5) * 1.6;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, gTop, x1 - x0, 5);
      ctx.clip();
      ctx.strokeStyle = ink.rule;
      ctx.lineWidth = 0.8;
      ctx.translate(0, gTop);
      hatch(ctx, w, 5, 4);
      ctx.restore();
      ctx.strokeStyle = ink.ink;
      ctx.lineWidth = 1;
      line(ctx, x0, px(gTop), x1, px(gTop));

      // count the supports
      const xs = supportsX(n);
      const by = gTop + 38;
      ctx.strokeStyle = n === 30 ? ink.accent : ink.muted;
      bracket(ctx, xs[0] - 4, xs[xs.length - 1] + 4, by, 1, 5);
      key(
        ctx,
        ink,
        n === 30
          ? '30 members · the supports'
          : `${n} member${n > 1 ? 's' : ''}`,
        scx,
        by + 17,
        {
          size: ks + 0.5,
          align: 'center',
          color: n === 30 ? ink.accent : ink.ink,
        }
      );

      // completion stamp
      if (!narrow) {
        key(ctx, ink, 'project completion', x0, top + 26, { size: ks });
        bigNum(ctx, ink, '+25%', x0, top + 58, { size: 32, color: ink.accent });
      } else {
        key(ctx, ink, 'completion', x0, top + 22, { size: ks });
        bigNum(ctx, ink, '+25%', x0, top + 48, { size: 24, color: ink.accent });
      }

      // strip
      const sy = h - stripH + 14;
      ctx.strokeStyle = ink.rule;
      line(ctx, 0, px(sy - 22), w, px(sy - 22));
      if (!narrow) {
        const cw = w / 3;
        for (let k = 0; k < 3; k++)
          strip(ctx, ink, 4 + k * cw, sy, cw, narrow, k);
      } else {
        strip(ctx, ink, 2, sy, w, narrow, 0);
        strip(ctx, ink, 2, sy + 92, w, narrow, 1);
        strip(ctx, ink, 2, sy + 168, w, narrow, 2);
      }
    },
  };
}
