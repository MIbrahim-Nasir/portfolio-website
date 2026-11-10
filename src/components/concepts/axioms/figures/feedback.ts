import {
  arrowHead,
  at,
  dot,
  key,
  line,
  mkPath,
  px,
  ring,
  stamp,
  text,
  type Ink,
  type Path,
  type Pt,
  type Scene,
} from './kit';

// Fig. III — the hackathon arm as a closed loop, and its step response.
// Camera (sensor) → Gemini (controller: grab · shift · place) → Python →
// Arduino → arm (plant). The response is a second-order model of the loop:
//   τ y'' + y' = K (r − y)   ⇒   ωn = √(K/τ),  ζ = 1 / (2√(Kτ))
// The reader can drag the gain K. ζ = 1 lands fastest without overshoot.

export const TAU = 0.25;
const WIN = 6; // seconds shown
const PLAY = 3.6; // seconds to trace the window
const PAUSE = 1.6;

export const zetaOf = (K: number) => 1 / (2 * Math.sqrt(K * TAU));
export const SOLVE_TOL = 0.025;

export type Metrics = {
  K: number;
  zeta: number;
  overshoot: number;
  settle: number | null;
};

export function simulate(K: number) {
  const n = 600;
  const dt = WIN / n;
  const sub = 4;
  const ys: number[] = [0];
  let y = 0,
    v = 0,
    peak = 0,
    lastOut = 0;
  for (let i = 1; i <= n; i++) {
    for (let k = 0; k < sub; k++) {
      const a = (K * (1 - y) - v) / TAU;
      v += a * (dt / sub);
      y += v * (dt / sub);
    }
    ys.push(y);
    peak = Math.max(peak, y);
    if (Math.abs(y - 1) > 0.02) lastOut = i * dt;
  }
  const settled = Math.abs(ys[n] - 1) <= 0.02 && lastOut < WIN - 0.05;
  const m: Metrics = {
    K,
    zeta: zetaOf(K),
    overshoot: Math.max(0, peak - 1),
    settle: settled ? lastOut : null,
  };
  return { ys, m };
}

export type FeedbackScene = Scene & { setGain(K: number, live: boolean): void };

type Node = {
  id: string;
  name: string;
  role: string;
  verb?: string;
  sub?: string;
  x: number;
  y: number;
};

export default function feedback(initialK = 6): FeedbackScene {
  let w = 0,
    h = 0;
  let K = initialK;
  let run = simulate(K);
  let head = 0; // seconds into the play cycle
  let flow = 0;

  const solved = () => Math.abs(run.m.zeta - 1) <= SOLVE_TOL;

  function layout(narrow: boolean) {
    const L = narrow ? 4 : 8;
    const R = narrow ? 4 : 8;
    const W = w - L - R;
    const X = (f: number) => L + f * W;
    let nodes: Node[];
    let fwd: Path;
    let back: Path;
    let sum: Pt;
    let tap: Pt;
    let rIn: Pt[];
    let yOut: Pt[] | null;
    const bw = narrow
      ? Math.min(98, W * 0.29)
      : Math.max(84, Math.min(122, W * 0.13));
    const bh = narrow ? 32 : 36;
    if (!narrow) {
      const yA = 104;
      const yB = yA + 92;
      sum = { x: X(0.075), y: yA };
      tap = { x: X(0.925), y: yA };
      nodes = [
        {
          id: 'gemini',
          name: 'Gemini',
          role: 'controller',
          verb: 'decides',
          sub: 'grab · shift · place',
          x: X(0.25),
          y: yA,
        },
        {
          id: 'python',
          name: 'Python',
          role: 'link',
          sub: 'pyserial',
          x: X(0.44),
          y: yA,
        },
        {
          id: 'arduino',
          name: 'Arduino',
          role: 'driver',
          verb: 'moves',
          sub: 'servos',
          x: X(0.62),
          y: yA,
        },
        {
          id: 'arm',
          name: 'arm',
          role: 'plant',
          sub: 'the arm',
          x: X(0.8),
          y: yA,
        },
        {
          id: 'camera',
          name: 'Camera',
          role: 'sensor',
          verb: 'sees',
          sub: 'one frame',
          x: X(0.5),
          y: yB,
        },
      ];
      fwd = mkPath([sum, { x: X(1), y: yA }]);
      back = mkPath([
        tap,
        { x: tap.x, y: yB },
        { x: sum.x, y: yB },
        { x: sum.x, y: yA + 10 },
      ]);
      rIn = [
        { x: X(0), y: yA },
        { x: sum.x - 11, y: yA },
      ];
      yOut = [tap, { x: X(1), y: yA }];
    } else {
      const y1 = 132;
      const y2 = y1 + 132;
      const cxL = X(0.14);
      sum = { x: cxL, y: y1 };
      const xv = w - 10;
      const xr = xv - bw / 2 - 16;
      const xm = X(0.42);
      tap = { x: cxL, y: y2 };
      nodes = [
        {
          id: 'gemini',
          name: 'Gemini',
          role: 'controller',
          verb: 'decides',
          x: xm,
          y: y1,
        },
        {
          id: 'python',
          name: 'Python',
          role: 'link',
          sub: 'pyserial',
          x: xr,
          y: y1,
        },
        {
          id: 'arduino',
          name: 'Arduino',
          role: 'driver',
          verb: 'moves',
          x: xr,
          y: y2,
        },
        { id: 'arm', name: 'arm', role: 'plant', sub: 'the arm', x: xm, y: y2 },
        {
          id: 'camera',
          name: 'Camera',
          role: 'sensor',
          verb: 'sees',
          x: cxL,
          y: (y1 + y2) / 2 + 6,
        },
      ];
      fwd = mkPath([sum, { x: xv, y: y1 }, { x: xv, y: y2 }, tap]);
      back = mkPath([tap, { x: cxL, y: y1 + 10 }]);
      rIn = [
        { x: cxL, y: y1 - 44 },
        { x: cxL, y: y1 - 11 },
      ];
      yOut = null;
    }
    return { nodes, fwd, back, sum, tap, rIn, yOut, bw, bh, L, R, W, X };
  }

  function drawBlock(
    ctx: CanvasRenderingContext2D,
    ink: Ink,
    n: Node,
    bw0: number,
    bh: number,
    narrow: boolean,
    below: boolean
  ) {
    const isArm = n.id === 'arm';
    const bw = n.id === 'camera' && narrow ? 72 : bw0;
    ctx.fillStyle = ink.paper;
    ctx.fillRect(n.x - bw / 2, n.y - bh / 2, bw, bh);
    ctx.strokeStyle = ink.ink;
    ctx.lineWidth = isArm ? 1.4 : 1;
    ctx.strokeRect(px(n.x - bw / 2), px(n.y - bh / 2), Math.round(bw), bh);
    if (isArm) {
      // a two-link arm glyph inside the plant box
      const b = { x: n.x - bw * 0.22, y: n.y + bh * 0.3 };
      const e = { x: n.x - bw * 0.05, y: n.y - bh * 0.22 };
      const g = { x: n.x + bw * 0.2, y: n.y + bh * 0.02 };
      ctx.strokeStyle = ink.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(b.x - 6, b.y);
      ctx.lineTo(b.x + 6, b.y);
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(e.x, e.y);
      ctx.lineTo(g.x, g.y);
      ctx.stroke();
      ctx.fillStyle = ink.accent;
      dot(ctx, e.x, e.y, 2);
      ctx.strokeStyle = ink.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(g.x + 5, g.y - 4);
      ctx.lineTo(g.x, g.y);
      ctx.lineTo(g.x + 5, g.y + 4);
      ctx.stroke();
    } else {
      text(ctx, ink, n.name, n.x, n.y + 5, {
        size: narrow ? 13 : 14.5,
        align: 'center',
        color: ink.ink,
      });
    }
    const ks = narrow ? 9.5 : 10;
    if (n.id === 'camera' && narrow) {
      key(ctx, ink, n.role, n.x + bw / 2 + 8, n.y - 4, { size: ks });
      text(ctx, ink, n.verb!, n.x + bw / 2 + 8, n.y + 14, {
        size: 16,
        font: 'italic',
        color: ink.accent,
      });
      return;
    }
    let yy = below ? n.y + bh / 2 + 15 : n.y - bh / 2 - 8;
    key(ctx, ink, n.role, n.x, yy, { size: ks, align: 'center' });
    yy = below ? yy + 19 : n.y + bh / 2 + 19;
    if (n.verb) {
      text(ctx, ink, n.verb, n.x, yy, {
        size: narrow ? 15 : 17,
        font: 'italic',
        color: ink.accent,
        align: 'center',
      });
      yy += 16;
    } else yy -= 3;
    if (n.sub)
      text(ctx, ink, n.sub, n.x, yy, {
        size: narrow ? 10.5 : 11,
        align: 'center',
        color: ink.muted,
      });
  }

  return {
    setGain(nk, live) {
      K = nk;
      run = simulate(K);
      if (live) head = PLAY; // show the whole curve while dragging
    },
    resize(nw, nh) {
      w = nw;
      h = nh;
    },
    step(dt) {
      head = (head + dt) % (PLAY + PAUSE);
      flow += dt;
    },
    settle() {
      head = PLAY;
      flow = 0.5;
    },
    draw(ctx, ink) {
      const narrow = w < 640;
      const lay = layout(narrow);
      const { nodes, fwd, back, sum, tap, bw, bh } = lay;
      const ks = narrow ? 10 : 10.5;
      const ok = solved();
      const prog = Math.min(1, head / PLAY);
      const iHead = Math.round(prog * (run.ys.length - 1));
      const yNow = run.ys[iHead];
      const e = 1 - yNow;

      // ——— title ———
      key(ctx, ink, 'AI-driven robotics · vision-LLM arm', 4, 14, {
        size: ks,
        color: ink.accent,
      });
      text(ctx, ink, 'A vision LLM drives the arm.', 4, narrow ? 40 : 44, {
        size: narrow ? 19 : 24,
        font: 'italic',
        color: ink.ink,
      });
      if (!narrow)
        stamp(ctx, ink, ['3rd place', 'national hackathon'], w - 6, 30, {
          align: 'right',
          size: 10.5,
        });
      else
        stamp(ctx, ink, ['3rd place', 'national hackathon'], w - 4, 70, {
          align: 'right',
          size: 9,
          angle: -0.04,
        });

      // ——— wires ———
      ctx.lineWidth = 1;
      ctx.strokeStyle = ink.ink;
      ctx.fillStyle = ink.ink;
      const stroke = (p: Path) => {
        ctx.beginPath();
        p.pts.forEach((q, i) =>
          i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)
        );
        ctx.stroke();
      };
      stroke(fwd);
      stroke(back);
      const lb = back.pts[back.pts.length - 1];
      arrowHead(ctx, lb.x, lb.y, -Math.PI / 2, 5);
      // input r
      ctx.beginPath();
      ctx.moveTo(lay.rIn[0].x, lay.rIn[0].y);
      ctx.lineTo(lay.rIn[1].x, lay.rIn[1].y);
      ctx.stroke();
      arrowHead(
        ctx,
        lay.rIn[1].x,
        lay.rIn[1].y,
        Math.atan2(lay.rIn[1].y - lay.rIn[0].y, lay.rIn[1].x - lay.rIn[0].x),
        5
      );
      if (lay.yOut) {
        const o = lay.yOut[1];
        arrowHead(ctx, o.x, o.y, 0, 5);
      } else {
        arrowHead(ctx, tap.x + 12, tap.y, Math.PI, 5);
      }
      dot(ctx, tap.x, tap.y, 2.4);
      // arrowheads into each block on the forward path
      for (const n of nodes) {
        if (n.id === 'camera') continue;
        // find entry direction along fwd
        let best = 0;
        let bd = Infinity;
        for (let s = 0; s < fwd.len; s += 2) {
          const q = at(fwd, s);
          const d = Math.hypot(q.x - n.x, q.y - n.y);
          if (d < bd) {
            bd = d;
            best = s;
          }
        }
        const half =
          (Math.abs(at(fwd, best).x - at(fwd, best - 4).x) > 1 ? bw : bh) / 2;
        const pin = at(fwd, best - half - 1);
        const pre = at(fwd, best - half - 8);
        arrowHead(
          ctx,
          pin.x,
          pin.y,
          Math.atan2(pin.y - pre.y, pin.x - pre.x),
          5
        );
      }

      // packets travelling round the loop; their size is the error
      const gap = narrow ? 30 : 40;
      const speed = 30 + 10 * Math.min(4, Math.sqrt(K));
      const off = (flow * speed) % gap;
      const eMag = Math.min(1, Math.abs(e) / 0.35);
      ctx.fillStyle = ink.accent;
      for (let s = off; s < fwd.len; s += gap) {
        const q = at(fwd, s);
        dot(ctx, q.x, q.y, 1.5 + 2.6 * eMag);
      }
      ctx.fillStyle = ink.ink;
      for (let s = off; s < back.len; s += gap) {
        const q = at(back, s);
        dot(ctx, q.x, q.y, 1.8);
      }

      // blocks
      nodes.forEach((n) =>
        drawBlock(
          ctx,
          ink,
          n,
          bw,
          bh,
          narrow,
          narrow ? n.y > sum.y + 60 : n.id === 'camera'
        )
      );

      // summing junction
      const rs = 10;
      ctx.fillStyle = ink.paper;
      ctx.beginPath();
      ctx.arc(sum.x, sum.y, rs, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ink.ink;
      ctx.lineWidth = 1;
      ring(ctx, sum.x, sum.y, rs);
      line(
        ctx,
        sum.x - rs * 0.7,
        sum.y - rs * 0.7,
        sum.x + rs * 0.7,
        sum.y + rs * 0.7
      );
      line(
        ctx,
        sum.x - rs * 0.7,
        sum.y + rs * 0.7,
        sum.x + rs * 0.7,
        sum.y - rs * 0.7
      );
      text(ctx, ink, '+', sum.x - rs - 2, sum.y - rs - 2, {
        align: 'right',
        size: 12,
        color: ink.ink,
      });
      text(ctx, ink, '−', sum.x + rs + 2, sum.y + rs + 12, {
        size: 12,
        color: ink.ink,
      });
      if (!narrow) {
        text(ctx, ink, 'r', lay.rIn[0].x + 2, sum.y - 9, {
          size: 15,
          font: 'italic',
          color: ink.ink,
        });
        key(ctx, ink, 'target', lay.rIn[0].x + 2, sum.y + 20, { size: 9.5 });
        text(ctx, ink, 'y', lay.yOut![1].x - 4, sum.y - 9, {
          size: 15,
          font: 'italic',
          color: ink.ink,
          align: 'right',
        });
        text(ctx, ink, 'e', (sum.x + nodes[0].x - bw / 2) / 2, sum.y - 9, {
          size: 15,
          font: 'italic',
          color: ink.accent,
          align: 'center',
        });
      } else {
        text(ctx, ink, 'r', lay.rIn[0].x + 8, lay.rIn[0].y + 10, {
          size: 15,
          font: 'italic',
          color: ink.ink,
        });
        key(ctx, ink, 'target', lay.rIn[0].x + 8, lay.rIn[0].y + 22, {
          size: 9,
        });
        text(ctx, ink, 'e', (sum.x + nodes[0].x - bw / 2) / 2 + 4, sum.y - 7, {
          size: 15,
          font: 'italic',
          color: ink.accent,
          align: 'center',
        });
        text(ctx, ink, 'y', tap.x + 18, tap.y - 7, {
          size: 15,
          font: 'italic',
          color: ink.ink,
        });
      }

      // ——— step response ———
      const p0 = narrow ? 352 : 286;
      const p1 = h - (narrow ? 122 : 34);
      const q0 = narrow ? 30 : 40;
      const q1 = narrow ? w - 6 : w * 0.68;
      const yOf = (v: number) => p1 - (v / 1.45) * (p1 - p0);
      const xOf = (i: number) => q0 + (i / (run.ys.length - 1)) * (q1 - q0);

      key(ctx, ink, 'step response · arm position', q0, p0 - 14, { size: ks });
      ctx.strokeStyle = ink.rule;
      ctx.lineWidth = 1;
      line(ctx, q0, px(p1), q1, px(p1));
      line(ctx, px(q0), p0, px(q0), p1);
      for (let s = 0; s <= WIN; s++) {
        const x = q0 + (s / WIN) * (q1 - q0);
        line(ctx, px(x), p1, px(x), p1 + 4);
        if (s % 2 === 0)
          text(ctx, ink, `${s}s`, x, p1 + 15, { size: 9.5, align: 'center' });
      }
      text(ctx, ink, '1', q0 - 7, yOf(1) + 4, { size: 10, align: 'right' });
      text(ctx, ink, '0', q0 - 7, yOf(0) + 4, { size: 10, align: 'right' });

      // ±2% band, the target
      ctx.fillStyle = ok ? 'rgba(194,58,29,0.16)' : ink.accentSoft;
      ctx.fillRect(q0 + 1, yOf(1.02), q1 - q0 - 1, yOf(0.98) - yOf(1.02));
      ctx.strokeStyle = ink.muted;
      ctx.setLineDash([3, 3]);
      line(ctx, q0, px(yOf(1)), q1, px(yOf(1)));
      ctx.setLineDash([]);

      // the ideal (ζ = 1), as a faint ghost so the reader has something to aim at
      const ideal = simulate(1 / (4 * TAU)).ys;
      ctx.strokeStyle = ink.faint;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ideal.forEach((v, i) =>
        i ? ctx.lineTo(xOf(i), yOf(v)) : ctx.moveTo(xOf(i), yOf(v))
      );
      ctx.stroke();

      // y(t) up to the head
      ctx.save();
      ctx.beginPath();
      ctx.rect(q0, p0 - 30, q1 - q0 + 4, p1 - p0 + 30);
      ctx.clip();
      ctx.strokeStyle = ink.accent;
      ctx.lineWidth = ok ? 2.4 : 1.6;
      ctx.beginPath();
      for (let i = 0; i <= iHead; i++) {
        const X = xOf(i);
        const Y = yOf(Math.min(1.45, run.ys[i]));
        if (i) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
      }
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = ink.accent;
      dot(ctx, xOf(iHead), yOf(Math.min(1.45, yNow)), 3);

      // overshoot callout at the peak
      const m = run.m;
      if (m.overshoot > 0.01) {
        let ip = 0;
        run.ys.forEach((v, i) => {
          if (v > run.ys[ip]) ip = i;
        });
        if (iHead >= ip) {
          const x = xOf(ip);
          const y = yOf(Math.min(1.45, run.ys[ip]));
          ctx.strokeStyle = ink.ink;
          ctx.lineWidth = 0.8;
          line(ctx, x, y - 5, x, y - 16);
          key(
            ctx,
            ink,
            `overshoot ${Math.round(m.overshoot * 100)}%`,
            x + 4,
            y - 20,
            { size: ks, color: ink.ink }
          );
        }
      }
      if (ok && prog >= 1) {
        const x = xOf(
          Math.round(((m.settle ?? 3) / WIN) * (run.ys.length - 1))
        );
        key(
          ctx,
          ink,
          'lands. no overshoot.',
          Math.min(x + 8, q1 - 150),
          yOf(1) - 12,
          { size: ks, color: ink.accent }
        );
      }

      // ——— readouts ———
      const rows: [string, string, boolean][] = [
        ['gain', `K = ${K.toFixed(2)}`, false],
        ['damping', `ζ = ${m.zeta.toFixed(2)}`, ok],
        ['overshoot', `${(m.overshoot * 100).toFixed(1)}%`, false],
        [
          'settles',
          m.settle === null ? `> ${WIN} s` : `${m.settle.toFixed(2)} s`,
          false,
        ],
      ];
      const status = ok
        ? 'settled exactly'
        : m.zeta < 1
          ? 'rings · lower the gain'
          : 'crawls · raise the gain';
      if (!narrow) {
        const rx = w * 0.74;
        rows.forEach(([k, v, hi], i) => {
          const yy = p0 + 4 + i * 44;
          key(ctx, ink, k, rx, yy, { size: ks });
          text(ctx, ink, v, rx, yy + 21, {
            size: i === 1 ? 21 : 17,
            font: i < 2 ? 'italic' : 'mono',
            color: hi ? ink.accent : ink.ink,
          });
        });
        key(ctx, ink, status, rx, p0 + 4 + 4 * 44 + 6, {
          size: ks,
          color: ok ? ink.accent : ink.muted,
        });
        if (ok)
          stamp(ctx, ink, ['ζ = 1.00', 'critically damped'], w - 8, p1 - 18, {
            align: 'right',
            size: 10,
            angle: -0.08,
          });
      } else {
        const ry = p1 + 36;
        rows.forEach(([k, v, hi], i) => {
          const rx = 4 + (i % 2) * (w / 2);
          const yy = ry + Math.floor(i / 2) * 36;
          key(ctx, ink, k, rx, yy, { size: 9.5 });
          text(ctx, ink, v, rx, yy + 18, {
            size: i === 1 ? 18 : 15,
            font: i < 2 ? 'italic' : 'mono',
            color: hi ? ink.accent : ink.ink,
          });
        });
        key(ctx, ink, status, 4, ry + 2 * 36 + 6, {
          size: 9.5,
          color: ok ? ink.accent : ink.muted,
        });
      }
    },
  };
}
