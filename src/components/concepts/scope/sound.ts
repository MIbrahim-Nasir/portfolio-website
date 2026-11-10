// A short mechanical tick, synthesised: filtered noise with a fast decay.
let ctx: AudioContext | null = null;
let buf: AudioBuffer | null = null;

function ensure() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const len = Math.floor(ctx.sampleRate * 0.018);
    buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const k = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.exp(-k * 9) * (i < 6 ? i / 6 : 1);
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function tick(kind: 'detent' | 'button' | 'switch' = 'detent') {
  const c = ensure();
  if (!c || !buf) return;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value =
    kind === 'detent'
      ? 1.0 + Math.random() * 0.08
      : kind === 'switch'
        ? 0.55
        : 0.75;
  const hp = c.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.value =
    kind === 'detent' ? 3200 : kind === 'switch' ? 1400 : 2000;
  hp.Q.value = 1.2;
  const g = c.createGain();
  g.gain.value = kind === 'switch' ? 0.5 : 0.32;
  src.connect(hp).connect(g).connect(c.destination);
  src.start();
}
