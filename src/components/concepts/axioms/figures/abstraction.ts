import {
  arrow,
  dot,
  key,
  line,
  px,
  ring,
  smooth,
  text,
  wrap,
  type Ink,
  type Scene,
} from './kit';

// Fig. V — two stacks he built, in the order he built them. A request goes
// down one layer at a time and its answer comes back up; each layer speaks
// only its own language. The SAIF stack also has a slower outer loop: people.

type Stack = {
  k: string;
  sub: string;
  layers: [string, string][];
  foot: [string, string];
  loop: string | null;
  offset: number;
};

const STACKS: Stack[] = [
  {
    k: 'DeltaX · Hyderabad · Jan–Jul 2025',
    sub: 'BookSwap + an IMDB-style catalogue · C# / ASP.NET Core',
    layers: [
      ['endpoint', '20+ REST endpoints'],
      ['controller', 'routes'],
      ['service', 'rules · recommendations'],
      ['repository', 'queries'],
      ['SQL Server', 'rows'],
    ],
    foot: ['recommendations', 'history-based, in the service layer'],
    loop: null,
    offset: 0,
  },
  {
    k: 'Ducon · SAIF · Aug 2025 → now',
    sub: '40 internal users · sales, design, R&D',
    layers: [
      ['client', 'WhatsApp photo → design + BOQ'],
      ['FastAPI', 'Python · REST'],
      ['LangGraph', 'multi-agent pipeline'],
      ['pgvector', 'catalogue RAG'],
      ['deploy', 'Railway · VPS · Cloudflare R2'],
    ],
    foot: [
      'their feedback → features',
      'edit-generations · multi-step · night view',
    ],
    loop: 'feedback',
    offset: 0.5,
  },
];

const PERIOD = 8;

export default function abstraction(): Scene {
  let w = 0,
    h = 0;
  let t = 1.1;
  let still = false;

  function drawStack(
    ctx: CanvasRenderingContext2D,
    ink: Ink,
    st: Stack,
    x0: number,
    y0: number,
    cw: number,
    ch: number,
    narrow: boolean
  ) {
    const ks = narrow ? 9.5 : 10.5;
    const k = st.layers.length;
    key(ctx, ink, st.k, x0, y0 + 11, { size: ks, color: ink.accent });
    const subs = wrap(ctx, ink, st.sub, cw, narrow ? 11 : 12);
    subs.forEach((s, i) =>
      text(ctx, ink, s, x0, y0 + 30 + i * 15, {
        size: narrow ? 11 : 12,
        color: ink.ink,
      })
    );
    const head = 30 + subs.length * 15 + 6;
    const footH = narrow ? 40 : 44;
    const gy = narrow ? 7 : 12;
    const lh = (ch - head - footH - gy * (k - 1)) / k;
    const loopW = st.loop ? (narrow ? 22 : 30) : 0;
    const boxW = cw - loopW;
    const busX = x0 + boxW - 12;
    const yTop = (i: number) => y0 + head + i * (lh + gy);

    // token: s in [0,2): 0..1 down, 1..2 back up
    const ph = (((t / PERIOD + st.offset) % 1) + 1) % 1;
    const s = ph * 2;
    const down = s < 1;
    const u = down ? s : s - 1;
    const raw = u * (k - 1 + 0.6);
    const seg = Math.min(k - 1, Math.floor(raw));
    const frac = smooth((raw - seg - 0.45) / 0.55);
    let pos = Math.min(k - 1, seg + (seg < k - 1 ? frac : 0));
    if (!down) pos = k - 1 - pos;
    let active = Math.round(pos);
    const dwell = Math.abs(pos - active) < 0.08;
    if (still) {
      active = 2;
      pos = 2;
    }

    for (let i = 0; i < k; i++) {
      const y = yTop(i);
      const on = i === active && (dwell || still);
      ctx.fillStyle = on ? 'rgba(194,58,29,0.07)' : 'rgba(255,253,247,0.6)';
      ctx.fillRect(x0, y, boxW, lh);
      ctx.strokeStyle = on ? ink.ink : ink.rule;
      ctx.lineWidth = 1;
      ctx.strokeRect(px(x0), px(y), Math.round(boxW) - 1, Math.round(lh));
      if (on) {
        ctx.fillStyle = ink.accent;
        ctx.fillRect(x0, y, 3, lh + 1);
      }
      const [name, lang] = st.layers[i];
      if (narrow || boxW < 380) {
        key(ctx, ink, name, x0 + 10, y + Math.min(15, lh * 0.42), {
          size: ks,
          color: on ? ink.accent : ink.muted,
        });
        text(ctx, ink, lang, x0 + 10, y + Math.min(lh - 7, lh * 0.42 + 16), {
          size: narrow ? 12 : 13,
          color: ink.ink,
        });
      } else {
        key(ctx, ink, name, x0 + 14, y + lh / 2 + 4, {
          size: ks,
          color: on ? ink.accent : ink.muted,
        });
        text(ctx, ink, lang, busX - 16, y + lh / 2 + 5, {
          align: 'right',
          size: 13.5,
          color: ink.ink,
        });
      }
      if (i < k - 1) {
        // the interface between two layers: a short double rule
        ctx.strokeStyle = ink.rule;
        const yi = y + lh + gy / 2;
        line(ctx, x0 + 18, px(yi - 1), x0 + 40, px(yi - 1));
        line(ctx, x0 + 18, px(yi + 1), x0 + 40, px(yi + 1));
      }
    }

    ctx.strokeStyle = ink.faint;
    line(ctx, px(busX), yTop(0) + 6, px(busX), yTop(k - 1) + lh - 6);
    const ty = yTop(0) + lh / 2 + pos * (lh + gy);
    if (!still) {
      if (down) {
        ctx.fillStyle = ink.accent;
        dot(ctx, busX, ty, 3.4);
      } else {
        ctx.strokeStyle = ink.accent;
        ctx.lineWidth = 1.3;
        ring(ctx, busX, ty, 3.6);
      }
    }

    // outer loop: people back into the pipeline
    if (st.loop) {
      const ex = x0 + cw - 6;
      const yA = yTop(0) + lh / 2;
      const yB = yTop(2) + lh / 2;
      ctx.strokeStyle = ink.accent;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x0 + boxW, yA);
      ctx.lineTo(ex, yA);
      ctx.lineTo(ex, yB);
      ctx.lineTo(x0 + boxW + 4, yB);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ink.accent;
      arrow(ctx, x0 + boxW + 8, yB, x0 + boxW + 1, yB, 5);
      const yy = yA + ((t * 0.18) % 1) * (yB - yA);
      if (!still) dot(ctx, ex, yy, 2.4);
      ctx.save();
      ctx.translate(ex - 1, (yA + yB) / 2);
      ctx.rotate(-Math.PI / 2);
      const lab = st.loop.toUpperCase();
      ctx.fillStyle = ink.paper;
      const mw = lab.length * (ks * 0.62 + 1.1);
      ctx.fillRect(-mw / 2 - 4, -7, mw + 8, 13);
      key(ctx, ink, lab, 0, 3.5, {
        size: ks - 0.5,
        color: ink.accent,
        align: 'center',
      });
      ctx.restore();
    }

    // footer
    const fy = y0 + ch - footH + (narrow ? 16 : 18);
    key(ctx, ink, st.foot[0], x0, fy, {
      size: ks,
      color: st.loop ? ink.accent : ink.muted,
    });
    text(ctx, ink, st.foot[1], x0, fy + 16, {
      size: narrow ? 11 : 12,
      color: ink.ink,
    });
  }

  return {
    resize(nw, nh) {
      w = nw;
      h = nh;
    },
    step(dt) {
      t += dt;
    },
    settle() {
      still = true;
    },
    draw(ctx, ink) {
      const narrow = w < 640;
      const ks = narrow ? 9.5 : 10.5;
      if (!narrow) {
        const gap = 78;
        const cw = (w - gap - 8) / 2;
        drawStack(ctx, ink, STACKS[0], 4, 4, cw, h - 8, narrow);
        drawStack(ctx, ink, STACKS[1], 4 + cw + gap, 4, cw, h - 8, narrow);
        const mx = 4 + cw + gap / 2;
        const my = h * 0.52;
        ctx.strokeStyle = ink.ink;
        ctx.fillStyle = ink.ink;
        ctx.lineWidth = 1;
        arrow(ctx, mx - 22, my, mx + 22, my, 6);
        key(ctx, ink, 'then', mx, my - 12, { size: ks, align: 'center' });
        key(ctx, ink, 'same', mx, my + 22, {
          size: ks - 0.5,
          align: 'center',
          color: ink.muted,
        });
        key(ctx, ink, 'layers', mx, my + 36, {
          size: ks - 0.5,
          align: 'center',
          color: ink.muted,
        });
      } else {
        const gap = 44;
        const ch = (h - gap - 8) / 2;
        drawStack(ctx, ink, STACKS[0], 2, 4, w - 4, ch, narrow);
        drawStack(ctx, ink, STACKS[1], 2, 4 + ch + gap, w - 4, ch, narrow);
        const my = 4 + ch + gap / 2;
        ctx.strokeStyle = ink.ink;
        ctx.fillStyle = ink.ink;
        arrow(ctx, w / 2, my - 14, w / 2, my + 14, 6);
        key(ctx, ink, 'then · same layers', w / 2 + 14, my + 4, { size: ks });
      }
    },
  };
}
