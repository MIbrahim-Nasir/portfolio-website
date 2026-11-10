'use client';

import { BONUS, buildShape, PARTS, type PartMeta } from './shapes';
import { locate, PROFILE, slice, type Shape, type Toolpath } from './slicer';

/*
  One print job for the whole page. The reader's scroll position says which
  part is in view (`active`); the printer runs parts in order and waits when it
  catches up. Times are the slicer's real estimates played back faster, so
  infill still zips and outer walls still crawl.

  Interrupts (G28, a manual M600) are short keyframe scripts that park the
  head, do their thing and put it back exactly where it was.
*/

export type Phase =
  | 'heating'
  | 'printing'
  | 'switch'
  | 'm600'
  | 'waiting'
  | 'slicing'
  | 'done';
export type ViewMode = 'printed' | 'preview';
export type Fil = 'bone' | 'red' | 'orange' | 'teal' | 'yellow';

export const FIL_HEX: Record<Fil, string> = {
  bone: '#e9e2d0',
  red: '#d8241a',
  orange: '#ff7d38',
  teal: '#1fa392',
  yellow: '#f2c230',
};
export const FIL_NAME: Record<Fil, string> = {
  bone: 'PLA Bone',
  red: 'PLA Signal Red',
  orange: 'PLA Orange',
  teal: 'PETG Teal',
  yellow: 'PLA Yellow',
};
const SWAP_CYCLE: Fil[] = ['orange', 'teal', 'yellow', 'bone'];

type Seg = { from: number; fil: Fil };
export type Obj = {
  meta: PartMeta;
  shape: Shape | null;
  tp: Toolpath | null;
  t: number;
  done: boolean;
  /** filament per extrusion index: a colour change mid-part leaves a stripe */
  segs: Seg[];
  ver: number;
};
type V = { x: number; y: number; z: number };
type Key = { to: V; dur: number; fn?: () => void };

const PARK = { x: 12, y: 12 };

/*
  Screen time per layer goes with the square root of its print time, so a
  solid first layer doesn't eat the whole show and small top layers still read.
*/
const warp = new WeakMap<
  Toolpath,
  { T: Float64Array; Wl: Float64Array; W: number }
>();
function layerWarp(tp: Toolpath) {
  let w = warp.get(tp);
  if (!w) {
    const T = new Float64Array(tp.layers);
    for (let l = 0; l < tp.layers; l++) {
      const a = tp.layerStart[l];
      const b = tp.layerStart[l + 1] - 1;
      T[l] = tp.t[b] - (a > 0 ? tp.t[a - 1] : 0);
    }
    const Wl = T.map((x) => Math.sqrt(Math.max(x, 1e-3)));
    w = { T, Wl, W: Wl.reduce((s, x) => s + x, 0) };
    warp.set(tp, w);
  }
  return w;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerpV = (a: V, b: V, t: number): V => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
});

class PrintJob {
  objs: Obj[] = PARTS.map((meta) => ({
    meta,
    shape: null,
    tp: null,
    t: 0,
    done: false,
    segs: [],
    ver: 0,
  }));
  /** chapters only (the benchy is extra) */
  N = BONUS;
  active = 0;
  /** next part in sequence */
  printing = 0;
  /** object the head is travelling to or extruding, -1 for none */
  live = -1;
  phase: Phase = 'heating';
  phaseT = 0;
  nozzle = 27;
  bed = 26;
  nozzleTarget = PROFILE.nozzleT;
  bedTarget = PROFILE.bedT;
  fan = 0;
  head: V = { x: 125, y: 200, z: 12 };
  from: V = { x: 125, y: 200, z: 12 };
  move = 0;
  moveF = 0;
  speed = 0;
  mode: ViewMode = 'printed';
  scrub: number | null = null;
  reduced = false;
  mobile = false;
  filament: Fil = 'bone';
  started = false;
  lcd = '';
  /** where the overlay wants the subject: px centre and radius */
  frame = { cx: 0, cy: 0, r: 0, ok: false };

  /* interrupts */
  script: Key[] | null = null;
  scriptKind: 'g28' | 'm600' | null = null;
  private si = 0;
  private sT = 0;
  private sFrom: V = { x: 0, y: 0, z: 0 };

  /* the hidden benchy */
  bonus: 'none' | 'slicing' | 'queued' | 'printing' | 'done' = 'none';
  private display = 'sans-serif';

  /* the nozzle's little personality */
  buddy = {
    blink: 0,
    wave: 0,
    look: { x: 0, y: 0 },
    idle: 0,
    nextBlink: 2.5,
    waveT: -1,
    said: new Set<string>(),
  };

  private subs = new Set<() => void>();
  private sliceSubs = new Set<() => void>();
  private sayers = new Set<(t: string) => void>();
  private raf = 0;
  private last = 0;
  invalidate: () => void = () => {};

  subscribe(f: () => void) {
    this.subs.add(f);
    return () => void this.subs.delete(f);
  }
  onSliced(f: () => void) {
    this.sliceSubs.add(f);
    return () => void this.sliceSubs.delete(f);
  }
  onSay(f: (t: string) => void) {
    this.sayers.add(f);
    return () => void this.sayers.delete(f);
  }
  say(t: string, once?: string) {
    if (once) {
      if (this.buddy.said.has(once)) return;
      this.buddy.said.add(once);
    }
    this.sayers.forEach((f) => f(t));
  }

  async start(display: string) {
    this.display = display;
    cancelAnimationFrame(this.raf);
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      this.step(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    if (this.started) return;
    this.started = true;
    for (let i = 0; i < this.N; i++) {
      const o = this.objs[i];
      o.shape = buildShape(i, display);
      o.tp = await slice(o.shape);
      if (this.reduced && i <= this.active) this.finishUpTo(this.active);
      this.sliceSubs.forEach((f) => f());
    }
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  activity() {
    this.buddy.idle = 0;
  }

  setActive(i: number) {
    if (i === this.active) return;
    this.active = i;
    this.scrub = null;
    this.activity();
    if (this.reduced) this.finishUpTo(i);
    this.invalidate();
    this.subs.forEach((f) => f());
  }

  setReduced(v: boolean) {
    this.reduced = v;
    if (v) this.finishUpTo(this.active);
  }

  setMode(m: ViewMode) {
    this.mode = m;
    this.invalidate();
    this.subs.forEach((f) => f());
  }

  setScrub(l: number | null) {
    this.scrub = l;
    this.invalidate();
    this.subs.forEach((f) => f());
  }

  /** the part the camera frames */
  get focus() {
    if (
      this.live === BONUS &&
      (this.phase === 'printing' || this.phase === 'switch')
    )
      return BONUS;
    return Math.min(this.active, this.N - 1);
  }
  get wide() {
    return (
      this.phase === 'heating' ||
      (this.phase === 'slicing' && this.printing === 0) ||
      this.scriptKind === 'g28'
    );
  }

  /** highest Z printed on object i (mm), for pinning tags */
  printedZ(i: number) {
    const o = this.objs[i];
    if (!o?.tp) return -1;
    let z = -1;
    if (o.done) z = Infinity;
    else if (o.t > 0) {
      const [m] = locate(o.tp, o.t);
      z = o.tp.layerZ[o.tp.lay[m]];
    }
    if (this.scrub !== null && i === this.active)
      z = Math.min(z, o.tp.layerZ[Math.min(this.scrub, o.tp.layers - 1)]);
    return z;
  }

  /** reduced motion: parts appear finished, nothing travels */
  private finishUpTo(i: number) {
    for (let k = 0; k <= i; k++) {
      const o = this.objs[k];
      if (!o.tp) return;
      if (o.meta.color === 'red') this.filament = 'red';
      if (!o.done) {
        o.t = o.tp.time;
        o.done = true;
        o.segs = [{ from: 0, fil: this.filament }];
        o.ver++;
      }
      this.printing = Math.max(this.printing, k + 1);
    }
    this.live = -1;
    this.nozzle = this.nozzleTarget;
    this.bed = this.bedTarget;
    this.fan = 100;
    this.speed = 0;
    this.phase = this.printing >= this.N ? 'done' : 'waiting';
    this.head = this.parkAt(Math.min(i, this.N - 1));
    this.invalidate();
  }

  private parkAt(i: number): V {
    const p = this.objs[i].shape;
    if (!p) return { x: 125, y: 200, z: 12 };
    // behind the part and a little above it: peeking over what it just made
    return {
      x: Math.min(236, p.ox + p.w * 0.82),
      y: Math.min(244, p.oy + p.d + 16),
      z: p.h + 9,
    };
  }

  /** a Z that clears everything already on the bed */
  private safeZ() {
    let z = this.head.z + 4;
    for (const o of this.objs)
      if ((o.done || o.t > 0) && o.shape) z = Math.max(z, o.shape.h + 6);
    return z;
  }

  get current(): Obj | null {
    return this.live >= 0 ? this.objs[this.live] : null;
  }

  /** simulated seconds printed so far */
  get elapsed() {
    let s = 0;
    for (const o of this.objs) s += o.t;
    return s;
  }
  get total() {
    let s = 0;
    for (let i = 0; i < this.N; i++) s += this.objs[i].tp?.time ?? 0;
    return s + (this.bonus !== 'none' ? (this.objs[BONUS].tp?.time ?? 0) : 0);
  }

  private go(p: Phase) {
    this.phase = p;
    this.phaseT = 0;
    this.from = { ...this.head };
  }

  private posAt(o: Obj): V {
    const tp = o.tp!;
    if (o.t <= 0) return { x: tp.x1[0], y: tp.y1[0], z: tp.z[0] };
    const [m, f] = locate(tp, o.t);
    return {
      x: lerp(tp.x0[m], tp.x1[m], f),
      y: lerp(tp.y0[m], tp.y1[m], f),
      z: tp.z[m],
    };
  }

  /** decide what happens after a part, or while idle */
  private next() {
    if (this.bonus === 'queued') return this.startObj(BONUS);
    if (this.printing >= this.N) {
      if (this.phase !== 'done') {
        this.go('done');
        this.say('All parts printed.', 'done');
      }
      return;
    }
    const o = this.objs[this.printing];
    if (!o.tp) {
      if (this.phase !== 'slicing') this.go('slicing');
      return;
    }
    if (this.printing <= this.active) return this.startObj(this.printing);
    if (this.phase !== 'waiting') this.go('waiting');
  }

  private startObj(i: number) {
    this.live = i;
    if (i === BONUS) this.bonus = 'printing';
    const o = this.objs[i];
    if (o.meta.color === 'red' && this.filament !== 'red') {
      this.go('m600');
    } else this.go('switch');
  }

  private beginExtruding() {
    const o = this.current!;
    const at = o.t > 0 ? o.tp!.ext[locate(o.tp!, o.t)[0]] : 0;
    const last = o.segs[o.segs.length - 1];
    if (!last || last.fil !== this.filament) {
      o.segs.push({ from: at, fil: this.filament });
      o.ver++;
    }
    this.move = 0;
    this.moveF = 0;
    this.go('printing');
  }

  /* --------------------------------------------------------- commands */

  private busy() {
    return (
      this.phase === 'heating' ||
      this.phase === 'm600' ||
      this.script !== null ||
      this.reduced
    );
  }

  g28() {
    if (this.busy()) return false;
    const back = { ...this.head };
    const z = this.safeZ();
    this.runScript('g28', [
      { to: { ...back, z }, dur: 0.45 },
      { to: { x: 0, y: 0, z }, dur: 1.1 },
      { to: { x: 0, y: 0, z: 0.2 }, dur: 0.8 },
      { to: { x: 0, y: 0, z: 0.2 }, dur: 0.5 },
      { to: { x: 0, y: 0, z }, dur: 0.5 },
      { to: { ...back, z }, dur: 1.0 },
      { to: back, dur: 0.4 },
    ]);
    return true;
  }

  m600() {
    if (this.busy()) return false;
    const back = { ...this.head };
    const z = this.safeZ() + 10;
    const i = SWAP_CYCLE.indexOf(this.filament);
    const next = SWAP_CYCLE[(i + 1) % SWAP_CYCLE.length];
    this.runScript('m600', [
      { to: { ...back, z }, dur: 0.5 },
      { to: { ...PARK, z }, dur: 0.9 },
      {
        to: { ...PARK, z },
        dur: 0.7,
        fn: () => {
          this.filament = next;
          const o = this.current;
          if (o?.tp && this.phase === 'printing') {
            o.segs.push({ from: o.tp.ext[this.move] + 1, fil: next });
            o.ver++;
          }
          this.say(`Fresh spool: ${FIL_NAME[next]}.`);
        },
      },
      { to: { ...PARK, z }, dur: 0.8 },
      { to: { ...back, z }, dur: 0.9 },
      { to: back, dur: 0.4 },
    ]);
    return true;
  }

  async benchy() {
    if (this.bonus !== 'none') {
      this.say(
        this.bonus === 'done' ? 'One Benchy per plate.' : 'Working on it.'
      );
      return;
    }
    this.bonus = 'slicing';
    const o = this.objs[BONUS];
    o.shape = buildShape(BONUS, this.display);
    o.tp = await slice(o.shape);
    this.sliceSubs.forEach((f) => f());
    this.say('Everyone prints a Benchy. Here’s mine.');
    if (this.reduced) {
      o.t = o.tp.time;
      o.done = true;
      o.segs = [{ from: 0, fil: this.filament }];
      o.ver++;
      this.bonus = 'done';
      this.invalidate();
      return;
    }
    this.bonus = 'queued';
    if (this.phase === 'waiting' || this.phase === 'done') this.next();
  }

  setLcd(t: string) {
    this.lcd = t.slice(0, 40);
    this.subs.forEach((f) => f());
  }

  private runScript(kind: 'g28' | 'm600', keys: Key[]) {
    this.script = keys;
    this.scriptKind = kind;
    this.si = 0;
    this.sT = 0;
    this.sFrom = { ...this.head };
    this.invalidate();
  }

  private stepScript(dt: number) {
    const keys = this.script!;
    const k = keys[this.si];
    this.sT += dt;
    const f = Math.min(1, this.sT / k.dur);
    this.head = lerpV(this.sFrom, k.to, ease(f));
    if (f >= 1) {
      k.fn?.();
      this.si++;
      this.sT = 0;
      this.sFrom = { ...k.to };
      if (this.si >= keys.length) {
        this.script = null;
        this.scriptKind = null;
      }
    }
    this.invalidate();
  }

  /* -------------------------------------------------------------- step */

  private stepBuddy(dt: number) {
    const b = this.buddy;
    b.idle += dt;
    if (this.reduced) {
      b.blink = 0;
      b.wave = 0;
      return;
    }
    let anim = false;
    b.nextBlink -= dt;
    if (b.nextBlink < 0) {
      b.blink = Math.min(1, b.blink + dt * 9);
      if (b.nextBlink < -0.16) {
        b.nextBlink = 2.2 + Math.random() * 3.5;
        b.blink = 0;
      }
      anim = true;
    }
    // idle: a little wave every so often
    const parked = this.phase === 'waiting' || this.phase === 'done';
    if (parked && !this.script && b.idle > 4 && b.waveT < 0 && b.idle % 9 < dt)
      b.waveT = 0;
    if (b.waveT >= 0) {
      b.waveT += dt;
      b.wave = Math.sin(Math.min(1, b.waveT / 1.8) * Math.PI);
      if (b.waveT > 1.8) {
        b.waveT = -1;
        b.wave = 0;
      }
      anim = true;
      if (parked && this.printing < this.N)
        this.say('Scroll on. I’ll print the next one.', 'scroll');
    }
    if (anim) this.invalidate();
  }

  private step(dt: number) {
    this.phaseT += this.script ? 0 : dt;
    const kN = 1 - Math.exp(-dt / (this.phase === 'heating' ? 0.9 : 0.4));
    const kB = 1 - Math.exp(-dt / 0.6);
    this.nozzle += (this.nozzleTarget - this.nozzle) * kN;
    this.bed += (this.bedTarget - this.bed) * kB;
    this.stepBuddy(dt);

    if (this.script) {
      this.stepScript(dt);
      this.subs.forEach((f) => f());
      return;
    }

    const cur = this.current;

    if (this.reduced) {
      this.speed = 0;
    } else if (this.phase === 'heating') {
      this.speed = 0;
      if (
        this.nozzle > this.nozzleTarget - 1.5 &&
        this.bed > this.bedTarget - 1 &&
        this.phaseT > 1.2
      )
        this.next();
    } else if (this.phase === 'slicing' || this.phase === 'waiting') {
      this.speed = 0;
      if (this.phase === 'waiting' && this.phaseT < 1.4) {
        const k = ease(Math.min(1, this.phaseT / 1.2));
        this.head = lerpV(
          this.from,
          this.parkAt(
            Math.max(0, Math.min(this.active, this.printing - 1, this.N - 1))
          ),
          k
        );
        this.invalidate();
      }
      this.next();
    } else if (this.phase === 'switch' || this.phase === 'm600') {
      this.speed = 0;
      if (!cur || !cur.tp) {
        this.go('slicing');
      } else {
        const to = this.posAt(cur);
        if (this.phase === 'm600') {
          // park, swap, purge, return
          const t = this.phaseT;
          const up = this.safeZ() + 14;
          this.fan = 0;
          if (t < 0.8) {
            this.head = lerpV(this.from, { ...PARK, z: up }, ease(t / 0.8));
          } else if (t > 1.6 && this.filament !== 'red') {
            this.filament = 'red';
            this.say('Red, for the important bit.', 'red');
            this.invalidate();
          }
          if (t > 2.4)
            this.head = lerpV(
              { ...PARK, z: up },
              to,
              ease(Math.min(1, (t - 2.4) / 0.8))
            );
          if (t >= 3.2) this.beginExtruding();
        } else {
          const T =
            cur === this.objs[this.printing] && this.printing < this.active
              ? 0.25
              : 0.7;
          const k = ease(Math.min(1, this.phaseT / T));
          const lift =
            Math.sin(Math.PI * k) *
            Math.max(8, this.safeZ() - Math.max(this.from.z, to.z));
          const p = lerpV(this.from, to, k);
          this.head = { ...p, z: p.z + lift };
          if (this.phaseT >= T) this.beginExtruding();
        }
      }
    } else if (this.phase === 'printing' && cur && cur.tp) {
      const tp = cur.tp;
      const seq = this.live !== BONUS;
      if (seq && this.live > this.active) {
        // the reader went back up: pause this part where it is
        this.live = -1;
        this.go('waiting');
      } else {
        const D =
          this.live === BONUS
            ? 11
            : this.live < this.active
              ? 1.8
              : this.mobile
                ? 12
                : 14;
        const wp = layerWarp(tp);
        const l = tp.lay[this.move] ?? 0;
        this.speed = wp.T[l] / ((D * wp.Wl[l]) / wp.W);
        cur.t = Math.min(tp.time, cur.t + dt * this.speed);
        const [m, f] = locate(tp, cur.t);
        this.move = m;
        this.moveF = f;
        this.head = {
          x: lerp(tp.x0[m], tp.x1[m], f),
          y: lerp(tp.y0[m], tp.y1[m], f),
          z: tp.z[m],
        };
        this.fan = tp.lay[m] === 0 ? 0 : 100;
        if (cur.t >= tp.time) {
          cur.done = true;
          if (seq) this.printing++;
          else this.bonus = 'done';
          this.live = -1;
          this.head = { ...this.head };
          this.go('waiting');
          this.next();
        }
      }
    } else if (this.phase === 'done') {
      this.speed = 0;
      const k = ease(Math.min(1, this.phaseT / 1.2));
      if (this.phaseT < 1.4)
        this.head = lerpV(this.from, this.parkAt(this.focus), k);
      this.fan = 0;
    }

    if (this.phase !== 'waiting' && this.phase !== 'done') this.invalidate();
    else if (this.phaseT < 1.5) this.invalidate();
    this.subs.forEach((f) => f());
  }
}

export const job = new PrintJob();
export type { PrintJob };
