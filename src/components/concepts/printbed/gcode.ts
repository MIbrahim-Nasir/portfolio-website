import { F, FEAT, PROFILE as P, type Toolpath } from './slicer';

/*
  G-code is generated lazily around the move that is printing, PrusaSlicer
  flavour: Marlin, relative extrusion (M83), ;TYPE: comments, retract on
  travels over 2 mm, fan off for the first layer.
*/

export type GLine = {
  t: string;
  k: 'c' | 'g' | 'm' | 't' | 's';
  cur?: boolean;
};

const n3 = (v: number) => v.toFixed(3);
const e5 = (v: number) => {
  const s = v.toFixed(5);
  return s.startsWith('0.')
    ? s.slice(1)
    : s.startsWith('-0.')
      ? `-${s.slice(2)}`
      : s;
};
const filA = Math.PI * (P.filD / 2) ** 2;

export const START_GCODE: GLine[] = [
  { t: '; ibrahim.3mf · 8 objects · sequential · PLA Bone', k: 'c' },
  { t: '; terminal accepts G28, M600, M117 <msg>', k: 's' },
  { t: 'M140 S60 ; bed', k: 'm' },
  { t: 'M104 S215 ; nozzle', k: 'm' },
  { t: 'M190 S60 ; wait for bed', k: 'm' },
  { t: 'M109 S215 ; wait for nozzle', k: 'm' },
  { t: 'G28 ; home all axes', k: 'g' },
  { t: 'G29 ; mesh bed leveling', k: 'g' },
  { t: 'M83 ; relative extrusion', k: 'm' },
  { t: 'M106 S0 ; fan off, first layer', k: 'm' },
];

/** story line k lands on the layer where k/n of the part has been reached */
export function storyAt(
  layers: number,
  story: string[],
  l: number
): string | null {
  const n = story.length;
  if (!n) return null;
  const k = Math.floor((l * n) / layers);
  const p = l === 0 ? -1 : Math.floor(((l - 1) * n) / layers);
  return k !== p ? story[k] : null;
}

function linesFor(
  tp: Toolpath,
  i: number,
  out: GLine[],
  cur: boolean,
  story: string[]
) {
  const l = tp.lay[i];
  const f = tp.f[i];
  if (i === tp.layerStart[l]) {
    out.push(
      { t: ';LAYER_CHANGE', k: 'c' },
      { t: `;Z:${tp.layerZ[l].toFixed(2)}`, k: 'c' }
    );
    const st = storyAt(tp.layers, story, l);
    if (st) out.push({ t: st, k: 's' });
    if (l === 1) out.push({ t: 'M106 S255 ; fan 100%', k: 'm' });
  }
  if (f === F.TRAVEL) {
    if (tp.retract[i])
      out.push({ t: `G1 E-${P.retract} F${P.retractV * 60}`, k: 'g', cur });
    if (i === tp.layerStart[l])
      out.push({ t: `G1 Z${tp.z[i].toFixed(2)} F720`, k: 'g', cur });
    out.push({
      t: `G1 X${n3(tp.x1[i])} Y${n3(tp.y1[i])} F${P.v.travel * 60}`,
      k: 't',
      cur,
    });
    if (tp.retract[i])
      out.push({ t: `G1 E${e5(P.retract)} F${P.retractV * 60}`, k: 'g', cur });
    return;
  }
  // feature change?
  let j = i - 1;
  while (j >= 0 && tp.f[j] === F.TRAVEL) j--;
  if (j < 0 || tp.f[j] !== f || tp.lay[j] !== l) {
    out.push(
      { t: `;TYPE:${FEAT[f].name}`, k: 'c' },
      { t: `;WIDTH:${tp.w[i].toFixed(2)}`, k: 'c' }
    );
  }
  const len = Math.hypot(tp.x1[i] - tp.x0[i], tp.y1[i] - tp.y0[i]);
  const h = tp.h[i];
  const e = (len * ((tp.w[i] - h) * h + Math.PI * (h / 2) ** 2)) / filA;
  const prevV = i > 0 ? tp.v[i - 1] : 0;
  const fpart = prevV !== tp.v[i] ? ` F${Math.round(tp.v[i] * 60)}` : '';
  out.push({
    t: `G1 X${n3(tp.x1[i])} Y${n3(tp.y1[i])} E${e5(e)}${fpart}`,
    k: 'g',
    cur,
  });
}

/** `rows` lines of G-code with the current move's lines near the bottom */
export function gcodeWindow(
  tp: Toolpath,
  i: number,
  rows: number,
  header: GLine[] = [],
  story: string[] = []
): GLine[] {
  const out: GLine[] = [];
  const from = Math.max(0, i - rows);
  if (from === 0) out.push(...header);
  for (let k = from; k <= Math.min(tp.n - 1, i + 1); k++)
    linesFor(tp, k, out, k === i, story);
  // keep the current line one row above the bottom
  let last = out.length - 1;
  for (let k = out.length - 1; k >= 0; k--)
    if (out[k].cur) {
      last = Math.min(out.length - 1, k + 1);
      break;
    }
  return out.slice(Math.max(0, last + 1 - rows), last + 1);
}
