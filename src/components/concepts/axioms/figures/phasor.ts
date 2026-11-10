import { dot, key, line, px, text, titleBlock, type Scene } from './kit';

// Fig. VI — one idea, three materials. A turning radius, projected, traces a
// sine: the stroke of a crank, an alternating current, and, sampled, a signal
// in code. Each stretch of the wave carries the work he did in that material.
// Wide screens run the wave sideways; phones run it down the page.

const OMEGA = 0.9;

type Domain = { name: string; eq: string; work: string[]; accent?: number[] };

const DOMAINS: Domain[] = [
  {
    name: 'mechanics',
    eq: 's = r sin θ',
    work: [
      'Core XY item-retrieval machine',
      'x = ½(a+b) · y = ½(a−b)',
      'published paper · national conf.',
      'IIT Hack4SDG · special mention',
      '4-DOF arm · inverse kinematics',
      'ISRO Rover · top 50 all-India',
    ],
    accent: [2, 3, 5],
  },
  {
    name: 'electronics',
    eq: 'i = I sin ωt',
    work: [
      'EMG-controlled bionic arm',
      'mecanum car · steppers · CNC shield',
      'Arduino · ESP32 · Jetson Nano',
      'I²C · SPI · soldering · basic PCB',
      'SolidWorks · Onshape',
      '~1 year of 3D printing',
    ],
  },
  {
    name: 'code',
    eq: 'x[n] = sin(ωnT)',
    work: [
      'B.E. Computer Science · MJCET',
      'Osmania University · 2025 · 8.27',
      'HackRevolution · winner',
      'system design · OOD · DSA',
      '→ AI engineer, today',
    ],
    accent: [2, 4],
  },
];

export default function phasor(): Scene {
  let w = 0,
    h = 0;
  let th = 0.9;

  return {
    resize(nw, nh) {
      w = nw;
      h = nh;
    },
    step(dt) {
      th += dt * OMEGA;
    },
    settle() {
      th = 0.9;
    },
    draw(ctx, ink) {
      const narrow = w < 640;
      const a = th % (Math.PI * 2);
      const tbH = titleBlock(ctx, ink, narrow ? 2 : 4, 4, {
        k: 'The bench · TSIG robotics · MJCET',
        line: 'Some of my code has motors.',
        narrow,
        maxW: narrow ? w - 8 : w * 0.6,
      });

      if (!narrow) {
        // ——— sideways ———
        const waveTop = tbH + 74;
        const R = Math.min(78, (h - waveTop) * 0.2);
        const cy = waveTop + R + 6;
        const cx = 10 + R;
        const xw0 = cx + R + 40;
        const xw1 = w - 10;
        const span = xw1 - xw0;
        const lambda = span / 2.25;
        const segs = [xw0, xw0 + span / 3, xw0 + (2 * span) / 3, xw1];
        const val = (x: number) =>
          Math.sin(a - ((x - xw0) / lambda) * Math.PI * 2);

        ctx.strokeStyle = ink.rule;
        ctx.lineWidth = 1;
        line(ctx, cx - R - 8, px(cy), xw1, px(cy));
        line(ctx, px(cx), cy - R - 8, px(cx), cy + R + 8);
        ctx.strokeStyle = ink.ink;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
        const P = { x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) };
        ctx.strokeStyle = ink.muted;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.3, 0, -a, true);
        ctx.stroke();
        text(
          ctx,
          ink,
          'θ',
          cx + R * 0.42 * Math.cos(a / 2),
          cy - R * 0.42 * Math.sin(a / 2) + 5,
          {
            size: 15,
            font: 'italic',
            color: ink.ink,
            align: 'center',
          }
        );
        ctx.strokeStyle = ink.accent;
        ctx.lineWidth = 1.8;
        line(ctx, cx, cy, P.x, P.y);
        ctx.lineWidth = 0.9;
        ctx.setLineDash([2, 3]);
        line(ctx, P.x, P.y, xw0, cy - R * val(xw0));
        ctx.setLineDash([]);
        key(ctx, ink, 'one sine', cx, cy - R - 16, {
          align: 'center',
          size: 10.5,
          color: ink.ink,
        });
        key(ctx, ink, 'three domains', cx, cy + R + 26, {
          align: 'center',
          size: 9.5,
        });

        ctx.strokeStyle = ink.faint;
        for (let i = 1; i < 3; i++)
          line(ctx, px(segs[i]), waveTop - 40, px(segs[i]), h - 6);

        ctx.strokeStyle = ink.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = xw0; x <= segs[2]; x += 1.5) {
          const y = cy - R * val(x);
          if (x === xw0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        const Ts = lambda / 14;
        const first = segs[2] + (Ts - ((segs[2] - xw0) % Ts));
        for (let x = first; x <= xw1; x += Ts) {
          const y = cy - R * val(x);
          ctx.strokeStyle = ink.muted;
          ctx.lineWidth = 1;
          line(ctx, x, cy, x, y);
          ctx.fillStyle = ink.ink;
          dot(ctx, x, y, 2.2);
        }
        ctx.fillStyle = ink.accent;
        dot(ctx, P.x, P.y, 3.6);
        dot(ctx, xw0, cy - R * val(xw0), 2.8);

        DOMAINS.forEach((d, i) => {
          const sx = segs[i] + 12;
          key(ctx, ink, d.name, sx, waveTop - 24, {
            size: 11,
            color: ink.accent,
          });
          text(ctx, ink, d.eq, sx, waveTop - 4, {
            size: 17,
            font: 'italic',
            color: ink.ink,
          });
          let yy = cy + R + 34;
          d.work.forEach((s, j) => {
            const hi = d.accent?.includes(j);
            text(ctx, ink, s, sx, yy, {
              size: 12,
              color: j === 0 ? ink.ink : hi ? ink.accent : ink.muted,
            });
            yy += j === 0 ? 19 : 17;
          });
        });
      } else {
        // ——— down the page ———
        const R = 38;
        const cx = 6 + R + 6;
        const cy = tbH + 34 + R;
        const yw0 = cy + R + 26;
        const yw1 = h - 6;
        const span = yw1 - yw0;
        const lambda = span / 2.4;
        const segs = [yw0, yw0 + span / 3, yw0 + (2 * span) / 3, yw1];
        const val = (y: number) =>
          Math.cos(a - ((y - yw0) / lambda) * Math.PI * 2);

        ctx.strokeStyle = ink.rule;
        ctx.lineWidth = 1;
        line(ctx, px(cx), cy - R - 8, px(cx), yw1);
        line(ctx, cx - R - 8, px(cy), cx + R + 8, px(cy));
        ctx.strokeStyle = ink.ink;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
        const P = { x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) };
        ctx.strokeStyle = ink.accent;
        ctx.lineWidth = 1.8;
        line(ctx, cx, cy, P.x, P.y);
        ctx.lineWidth = 0.9;
        ctx.setLineDash([2, 3]);
        line(ctx, P.x, P.y, cx + R * val(yw0), yw0);
        ctx.setLineDash([]);
        text(
          ctx,
          ink,
          'θ',
          cx + 13 * Math.cos(a / 2),
          cy - 13 * Math.sin(a / 2) + 5,
          {
            size: 14,
            font: 'italic',
            color: ink.ink,
            align: 'center',
          }
        );
        key(ctx, ink, 'one sine', cx + R + 16, cy - 4, {
          size: 10,
          color: ink.ink,
        });
        key(ctx, ink, 'three domains', cx + R + 16, cy + 12, { size: 9.5 });

        ctx.strokeStyle = ink.faint;
        for (let i = 1; i < 3; i++)
          line(ctx, 4, px(segs[i]), w - 4, px(segs[i]));

        ctx.strokeStyle = ink.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let y = yw0; y <= segs[2]; y += 1.5) {
          const x = cx + R * val(y);
          if (y === yw0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        const Ts = lambda / 12;
        const first = segs[2] + (Ts - ((segs[2] - yw0) % Ts));
        for (let y = first; y <= yw1; y += Ts) {
          const x = cx + R * val(y);
          ctx.strokeStyle = ink.muted;
          ctx.lineWidth = 1;
          line(ctx, cx, y, x, y);
          ctx.fillStyle = ink.ink;
          dot(ctx, x, y, 2.1);
        }
        ctx.fillStyle = ink.accent;
        dot(ctx, P.x, P.y, 3.4);

        const tx = cx + R + 16;
        DOMAINS.forEach((d, i) => {
          let yy = segs[i] + 18;
          key(ctx, ink, d.name, tx, yy, { size: 10, color: ink.accent });
          text(ctx, ink, d.eq, tx + 4 + d.name.length * 7.4, yy + 1, {
            size: 14,
            font: 'italic',
            color: ink.ink,
          });
          yy += 21;
          d.work.forEach((s, j) => {
            const hi = d.accent?.includes(j);
            text(ctx, ink, s, tx, yy, {
              size: w < 370 ? 10.5 : 11,
              color: j === 0 ? ink.ink : hi ? ink.accent : ink.muted,
            });
            yy += 16;
          });
        });
      }
    },
  };
}
