/*
  Text as a 2D signed distance field, so letters can be sliced like any other
  geometry: render the glyphs to a canvas, then a Felzenszwalb exact Euclidean
  distance transform on the inside and outside masks.
*/

export type Field2D = (x: number, y: number) => number;

const INF = 1e20;

function edt1d(
  f: Float64Array,
  n: number,
  d: Float64Array,
  v: Int32Array,
  z: Float64Array
) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

function edt2d(g: Float64Array, w: number, h: number) {
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = g[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) g[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = g[y * w + x];
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) g[y * w + x] = d[x];
  }
}

/**
 * Distance field of `text` fitted inside a bw x bh mm box (origin bottom-left, y up).
 * `font` is a CSS font shorthand without the size, e.g. "800 'Archivo'".
 */
export function textField(
  text: string,
  font: string,
  bw: number,
  bh: number,
  ppm = 10
): Field2D {
  const pad = 6;
  const W = Math.ceil(bw * ppm) + pad * 2;
  const H = Math.ceil(bh * ppm) + pad * 2;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const size = 200;
  // the display face is variable in width: print the lettering wide, like a machine plate
  const wide = (c: CanvasRenderingContext2D) => {
    if ('fontStretch' in c)
      (c as CanvasRenderingContext2D & { fontStretch: string }).fontStretch =
        'semi-expanded';
  };
  ctx.font = `${font.replace('SIZE', `${size}px`)}`;
  wide(ctx);
  const m = ctx.measureText(text);
  const tw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const th = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const k = Math.min((bw * ppm) / tw, (bh * ppm) / th);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = `${font.replace('SIZE', `${size * k}px`)}`;
  wide(ctx);
  const m2 = ctx.measureText(text);
  const x = W / 2 - (m2.actualBoundingBoxRight - m2.actualBoundingBoxLeft) / 2;
  const y =
    H / 2 + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2;
  ctx.fillText(text, x, y);
  const px = ctx.getImageData(0, 0, W, H).data;

  const inside = new Float64Array(W * H);
  const outside = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const on = px[i * 4] > 127;
    inside[i] = on ? INF : 0; // distance from inside pixels to the nearest outside
    outside[i] = on ? 0 : INF;
  }
  edt2d(inside, W, H);
  edt2d(outside, W, H);
  const sd = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    sd[i] =
      inside[i] > 0
        ? -(Math.sqrt(inside[i]) - 0.5) / ppm
        : (Math.sqrt(outside[i]) - 0.5) / ppm;
  }

  return (mx: number, my: number) => {
    const u = mx * ppm + pad;
    const v = (bh - my) * ppm + pad;
    const cu = Math.max(0, Math.min(W - 1.001, u));
    const cv = Math.max(0, Math.min(H - 1.001, v));
    const extra = Math.hypot(u - cu, v - cv) / ppm;
    const i = Math.floor(cu);
    const j = Math.floor(cv);
    const fu = cu - i;
    const fv = cv - j;
    const a = sd[j * W + i];
    const b = sd[j * W + i + 1];
    const cc = sd[(j + 1) * W + i];
    const dd = sd[(j + 1) * W + i + 1];
    return (
      (a * (1 - fu) + b * fu) * (1 - fv) +
      (cc * (1 - fu) + dd * fu) * fv +
      extra
    );
  };
}
