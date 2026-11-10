// Synthesized ambience. Nothing to download: a low two-voice drone,
// a soft blip on every cut, and a thump on click. Off until asked.

class Ambient {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private on = false;

  start() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.7;
      filter.connect(master);
      [55, 82.41, 110.3].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i === 1 ? 'triangle' : 'sine';
        o.frequency.value = f;
        o.detune.value = (i - 1) * 6;
        const g = ctx.createGain();
        g.gain.value = i === 2 ? 0.12 : 0.35;
        o.connect(g).connect(filter);
        o.start();
      });
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lg = ctx.createGain();
      lg.gain.value = 180;
      lfo.connect(lg).connect(filter.frequency);
      lfo.start();
      this.ctx = ctx;
      this.master = master;
      this.filter = filter;
    }
    this.ctx.resume();
    this.on = true;
    this.master!.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master!.gain.linearRampToValueAtTime(0.11, this.ctx.currentTime + 1.6);
  }

  stop() {
    if (!this.ctx || !this.master) return;
    this.on = false;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
  }

  private tone(
    freq: number,
    to: number,
    dur: number,
    vol: number,
    type: OscillatorType = 'sine'
  ) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.05);
  }

  blip(scene: number) {
    const base = [523, 587, 659, 698, 784, 880, 988][scene % 7];
    this.tone(base, base * 0.5, 0.5, 0.05);
    this.tone(base * 1.5, base * 0.75, 0.35, 0.02, 'triangle');
  }

  thump() {
    this.tone(140, 40, 0.45, 0.16);
  }
}

export const ambient = new Ambient();
