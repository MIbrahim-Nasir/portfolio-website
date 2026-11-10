// The whole holographic bench as one imperative object: exoframe modules, projector pad,
// dust in the light, Rivet the drone, the camera, and every DOM overlay that is pinned to
// a point in 3D (the module's holo-panel, its projector cone, part tags, Rivet's bubble).
// React only feeds inputs; all per-frame mutation happens here.

import * as THREE from 'three';
import { buildDrone, type DroneParts } from './drone';
import { STEPS, tagsFor, type Pin } from './script';
import { buildSuit, type Motion } from './suit';

export type OverlayEls = {
  panel: HTMLElement | null;
  lead: SVGPolylineElement | null;
  dot: SVGCircleElement | null;
  cone: SVGPolygonElement | null;
  grad: SVGLinearGradientElement | null;
  tags: (HTMLElement | null)[];
  tagLines: SVGPathElement | null;
  tagDots: SVGPathElement | null;
  bubble: HTMLDivElement | null;
  voice: HTMLDivElement | null;
  xy: HTMLElement | null;
  grip: HTMLElement | null;
  dialogue: HTMLElement | null;
  board: HTMLElement | null;
};

export type RigInputs = {
  step: number;
  exploded: boolean;
  reduced: boolean;
  overclock: boolean;
  talking: boolean;
  compact: boolean;
};

const GHOST = new THREE.Color('#2a7aa3');
const SEATED = new THREE.Color('#6fcdf7');
const HOT = new THREE.Color('#e9fbff');
const WARM = new THREE.Color('#fff0d2');
const EDGE_GHOST = new THREE.Color('#3d97c4');
const EDGE_SEATED = new THREE.Color('#a6e8ff');
const AMBER = new THREE.Color('#ffb02e');
const EYE = new THREE.Color('#ffc061');

const HOLO_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const HOLO_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uScan;
uniform float uHot;
uniform float uLive;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float f = 1.0 - abs(dot(normalize(vN), V));
  f = f * f;
  float band = 0.5 + 0.5 * sin(vW.y * 220.0 - uTime * 2.0);
  float lines = mix(1.0, 0.7 + 0.3 * band, uLive);
  float scan = 1.0 - smoothstep(0.0, 0.045, abs(vW.y - uScan));
  vec3 col = uColor * (0.09 + 1.2 * f) * lines;
  col += uColor * uHot * (0.1 + 0.45 * f);
  col += vec3(0.78, 0.94, 1.0) * scan * 0.85;
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <colorspace_fragment>
}`;

// soft light volume: bright at one end, falling off along the length, rim-weighted
const BEAM_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uDir;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
void main() {
  float h = mix(1.0 - vUv.y, vUv.y, uDir);
  vec3 V = normalize(cameraPosition - vW);
  float rim = 1.0 - abs(dot(normalize(vN), V));
  float a = h * h * h * (0.3 + 0.7 * rim * rim);
  gl_FragColor = vec4(uColor * a * uOpacity, 1.0);
  #include <colorspace_fragment>
}`;

type Shared = { uTime: { value: number }; uScan: { value: number } };

function holoMaterial(shared: Shared, color = GHOST) {
  return new THREE.ShaderMaterial({
    vertexShader: HOLO_VERT,
    fragmentShader: HOLO_FRAG,
    uniforms: {
      uTime: shared.uTime,
      uScan: shared.uScan,
      uColor: { value: color.clone() },
      uOpacity: { value: 0.3 },
      uHot: { value: 0 },
      uLive: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

function beamMaterial(color: THREE.Color, dir: number, opacity: number) {
  return new THREE.ShaderMaterial({
    vertexShader: HOLO_VERT,
    fragmentShader: BEAM_FRAG,
    uniforms: {
      uColor: { value: color.clone() },
      uOpacity: { value: opacity },
      uDir: { value: dir },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

const ease = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const fmt = (v: number) =>
  `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1).padStart(5, '0')}`;
const px = (v: number) => v.toFixed(1);
const GRIP = ['GRAB', 'SHIFT', 'PLACE'];

type PieceState = {
  holder: THREE.Object3D;
  base: THREE.Vector3;
  explode: THREE.Vector3;
  motion?: Motion;
};
type ModState = {
  pieces: PieceState[];
  fill: THREE.ShaderMaterial;
  hot: THREE.ShaderMaterial;
  beam: THREE.ShaderMaterial;
  edge: THREE.LineBasicMaterial;
  dash: THREE.LineDashedMaterial;
  anchor: THREE.Vector3;
  anchorPiece: number;
  pos: number;
  lit: number;
  heat: number;
};

export class Rig {
  readonly root = new THREE.Group();
  private mods: ModState[] = [];
  private shared: Shared = { uTime: { value: 0 }, uScan: { value: -10 } };
  private pickables: THREE.Object3D[] = [];
  private raycaster = new THREE.Raycaster();
  private v = new THREE.Vector3();
  private w = new THREE.Vector3();
  private tmp = new THREE.Vector3();
  private dust: THREE.Points;
  private volume!: THREE.ShaderMaterial;
  private trash: { dispose(): void }[] = [];

  private inp: RigInputs = {
    step: 0,
    exploded: false,
    reduced: false,
    overclock: false,
    talking: false,
    compact: false,
  };

  private target = new THREE.Vector3(...STEPS[0].cam.t);
  private dist = STEPS[0].cam.d;
  private yaw = STEPS[0].cam.yaw;
  private pitch = STEPS[0].cam.pitch;
  private spin = 0;
  private user = { yaw: 0, pitch: 0 };
  private userReset = false;
  private drag: {
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    moved: number;
  } | null = null;

  private hovered = -1;
  private hoverNdc: THREE.Vector2 | null = null;
  private hoverDirty = false;
  private hoverEl: HTMLElement | null = null;

  private t = 0;
  private scanT = 9;
  private xyT = 0;
  private xc = 0;
  private zc = -0.1;
  private gripT = 0;
  private lastXY = '';
  private lastGrip = '';
  private oc = 0;
  private viewKey = '';
  private offX = 0;
  private offY = 0;
  private band = { top: 0, bottom: 0 };

  // panel smoothing
  private panelEl: HTMLElement | null = null;
  private pX = 0;
  private pY = 0;

  // Rivet
  private drone: DroneParts;
  private dPos = new THREE.Vector3(0.6, 1.0, 0.8);
  private dPrev = new THREE.Vector3(0.6, 1.0, 0.8);
  private dVel = new THREE.Vector3();
  private dLook = new THREE.Quaternion();
  private dDummy = new THREE.Object3D();
  private dDodge = new THREE.Vector2();
  private dStartle = 0;
  private dHop = 9;
  private dFlip = 9;
  private dBlink = 3;
  private dScale = 1;
  private dScreen = { x: -999, y: -999, ok: false };
  private beam: THREE.Mesh;
  private beamMat: THREE.ShaderMaterial;
  private mouse = { x: -9999, y: -9999, on: false };

  constructor() {
    const modules = buildSuit();
    modules.forEach((mod, mi) => {
      const group = new THREE.Group();
      const fill = holoMaterial(this.shared);
      const hot = holoMaterial(this.shared);
      const beam = beamMaterial(SEATED, 1, 0);
      const edge = new THREE.LineBasicMaterial({
        color: EDGE_GHOST.clone(),
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const dash = new THREE.LineDashedMaterial({
        color: AMBER,
        dashSize: 0.035,
        gapSize: 0.025,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const pickMat = new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
        transparent: true,
        opacity: 0,
      });
      this.trash.push(fill, hot, beam, edge, dash, pickMat);

      const pieces: PieceState[] = [];
      mod.pieces.forEach((p) => {
        const holder = new THREE.Group();
        holder.position.copy(p.origin).add(p.explode);
        const mesh = new THREE.Mesh(
          p.fill,
          p.tone === 'hot' ? hot : p.tone === 'beam' ? beam : fill
        );
        mesh.userData.mi = mi;
        holder.add(mesh);
        this.trash.push(p.fill);
        if (p.edges) {
          holder.add(new THREE.LineSegments(p.edges, edge));
          this.trash.push(p.edges);
        }
        if (p.tone !== 'beam') {
          if (p.pick) {
            const pm = new THREE.Mesh(p.pick, pickMat);
            pm.userData.mi = mi;
            holder.add(pm);
            this.pickables.push(pm);
            this.trash.push(p.pick);
          } else {
            this.pickables.push(mesh);
          }
        }
        group.add(holder);
        pieces.push({
          holder,
          base: p.origin.clone(),
          explode: p.explode.clone(),
          motion: p.motion,
        });

        // amber dashed assembly path from the bench position to the seat
        if (!p.motion && p.tone !== 'hot') {
          const g = new THREE.BufferGeometry().setFromPoints([
            p.origin,
            p.origin.clone().add(p.explode),
          ]);
          const line = new THREE.Line(g, dash);
          line.computeLineDistances();
          this.root.add(line);
          this.trash.push(g);
        }
      });
      this.root.add(group);
      this.mods.push({
        pieces,
        fill,
        hot,
        beam,
        edge,
        dash,
        anchor: mod.anchor.clone(),
        anchorPiece: mod.anchorPiece,
        pos: 0,
        lit: 0,
        heat: 0,
      });
    });

    this.buildPad();
    this.dust = this.buildDust(260);

    // Rivet + its inspection light
    const dFill = holoMaterial(this.shared, new THREE.Color('#cfefff'));
    dFill.uniforms.uOpacity.value = 0.5;
    dFill.uniforms.uHot.value = 0.15;
    const dEdge = new THREE.LineBasicMaterial({
      color: '#ffd391',
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.trash.push(dFill, dEdge);
    this.drone = buildDrone(dFill, dEdge);
    this.drone.root.position.copy(this.dPos);
    this.root.add(this.drone.root);

    const bg = new THREE.CylinderGeometry(0.075, 0.004, 1, 24, 1, true);
    bg.translate(0, 0.5, 0);
    this.beamMat = beamMaterial(new THREE.Color('#ffd391'), 0, 0);
    this.beam = new THREE.Mesh(bg, this.beamMat);
    this.beam.frustumCulled = false;
    this.root.add(this.beam);
    this.trash.push(bg, this.beamMat);
  }

  private buildPad() {
    const ring = new THREE.LineBasicMaterial({
      color: '#3d97c4',
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const amber = new THREE.LineBasicMaterial({
      color: AMBER,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.trash.push(ring, amber);
    for (const r of [0.55, 0.8, 1.12]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0.002, Math.sin(a) * r));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      this.trash.push(g);
      this.root.add(new THREE.LineLoop(g, ring));
    }
    // degree ticks every 5°, long ticks every 30°, amber at the cardinals
    const ticks: number[] = [];
    const warn: number[] = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r0 = 1.12;
      const r1 = i % 6 === 0 ? 1.2 : 1.15;
      const seg = [
        Math.cos(a) * r0,
        0.002,
        Math.sin(a) * r0,
        Math.cos(a) * r1,
        0.002,
        Math.sin(a) * r1,
      ];
      if (i % 18 === 0) warn.push(...seg);
      else ticks.push(...seg);
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.Float32BufferAttribute(ticks, 3));
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(warn, 3));
    this.trash.push(tg, wg);
    this.root.add(
      new THREE.LineSegments(tg, ring),
      new THREE.LineSegments(wg, amber)
    );

    const grid = new THREE.GridHelper(7, 28, '#1c4d66', '#10303f');
    const gm = grid.material as THREE.Material;
    gm.transparent = true;
    gm.opacity = 0.55;
    gm.depthWrite = false;
    this.trash.push(grid.geometry, gm);
    this.root.add(grid);

    // projector light volume rising off the pad
    const vol = new THREE.CylinderGeometry(1.2, 0.98, 2.7, 48, 1, true);
    vol.translate(0, 1.35, 0);
    this.volume = beamMaterial(SEATED, 0, 0.075);
    this.trash.push(vol, this.volume);
    this.root.add(new THREE.Mesh(vol, this.volume));
  }

  private buildDust(n: number) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.2 + Math.sqrt(Math.random()) * 1.4;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * 2.7;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      color: '#9fe2ff',
      size: 0.013,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.trash.push(g, m);
    const pts = new THREE.Points(g, m);
    this.root.add(pts);
    return pts;
  }

  setInputs(next: RigInputs) {
    const prev = this.inp;
    if (next.step !== prev.step) {
      if (next.step > prev.step) this.scanT = 0;
      this.userReset = true;
    }
    if (next.overclock && !prev.overclock && !next.reduced) this.dFlip = 0;
    this.inp = next;
    const live = next.reduced ? 0 : 1;
    for (const m of this.mods) {
      m.fill.uniforms.uLive.value = live;
      m.hot.uniforms.uLive.value = live;
    }
  }

  /** Rivet was tapped: a little hop */
  poke() {
    if (!this.inp.reduced) this.dHop = 0;
    this.dStartle = 1;
  }

  // ---- pointer: horizontal drag turns the bench, a still tap picks a module (or Rivet)
  pointerDown(x: number, y: number) {
    this.drag = { x, y, yaw: this.user.yaw, pitch: this.user.pitch, moved: 0 };
  }

  pointerMove(x: number, y: number) {
    const d = this.drag;
    if (!d) return false;
    const dx = x - d.x;
    const dy = y - d.y;
    d.moved = Math.max(d.moved, Math.hypot(dx, dy));
    if (d.moved < 5) return false;
    this.user.yaw = d.yaw - dx * 0.009;
    this.user.pitch = clamp(d.pitch + dy * 0.004, -0.3, 0.45);
    this.userReset = false;
    return true;
  }

  pointerUp() {
    const moved = this.drag?.moved ?? 99;
    this.drag = null;
    return moved;
  }

  hover(ndc: THREE.Vector2 | null, el: HTMLElement, cx = -9999, cy = -9999) {
    this.hoverNdc = ndc;
    this.hoverDirty = true;
    this.hoverEl = el;
    this.mouse.x = cx;
    this.mouse.y = cy;
    this.mouse.on = !!ndc;
  }

  /** module index, −2 for Rivet, −1 for nothing */
  pick(ndc: THREE.Vector2, camera: THREE.Camera) {
    this.raycaster.setFromCamera(ndc, camera);
    if (this.raycaster.intersectObject(this.drone.hit, false).length) return -2;
    const hit = this.raycaster.intersectObjects(this.pickables, false)[0];
    return hit ? (hit.object.userData.mi as number) : -1;
  }

  /** world position of a pinned point right now (follows explode + motion) */
  private pinNow(pin: Pin, out: THREE.Vector3) {
    out.set(pin.p[0], pin.p[1], pin.p[2]);
    if (pin.mi < 0) return out;
    const ps = this.mods[pin.mi].pieces[pin.piece];
    out.sub(ps.base);
    return ps.holder.localToWorld(out);
  }

  private moduleNow(mi: number, out: THREE.Vector3) {
    const m = this.mods[mi];
    return this.pinNow(
      { mi, piece: m.anchorPiece, p: [m.anchor.x, m.anchor.y, m.anchor.z] },
      out
    );
  }

  private project(
    p: THREE.Vector3,
    camera: THREE.Camera,
    w: number,
    h: number
  ) {
    this.w.copy(p).project(camera);
    return {
      x: (this.w.x * 0.5 + 0.5) * w,
      y: (-this.w.y * 0.5 + 0.5) * h,
      ok: this.w.z < 1,
    };
  }

  update(
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number,
    rawDt: number,
    ov: OverlayEls
  ) {
    const dt = Math.min(rawDt, 0.05);
    const { step, exploded, reduced: r, compact, talking } = this.inp;
    if (!r) this.t += dt;
    this.shared.uTime.value = this.t;

    const k = r ? 1 : 1 - Math.exp(-dt * 3);
    const kl = r ? 1 : 1 - Math.exp(-dt * 4);
    this.oc +=
      ((this.inp.overclock ? 1 : 0) - this.oc) *
      (r ? 1 : 1 - Math.exp(-dt * 2.5));
    const oc = this.oc;
    const boost = 1 + 2 * oc;

    if (this.scanT < 2 && !r) {
      this.scanT += dt;
      this.shared.uScan.value = -0.2 + (this.scanT / 1.4) * 2.9;
    } else this.shared.uScan.value = -10;

    const focus = step === 0 ? -1 : step <= 6 ? step - 1 : -1;

    // Core XY carriage traces a Lissajous path once the gantry is seated
    const gantry = this.mods[4];
    if (gantry.lit > 0.5 && !r) {
      this.xyT += dt * boost;
      this.xc = 0.42 * Math.sin(this.xyT * 0.7);
      this.zc = -0.1 + 0.27 * Math.sin(this.xyT * 1.13 + 0.6);
    }

    // grip test on the forearms: grab · shift · place
    const armsOn = this.mods[3].lit > 0.5;
    if (armsOn && !r) this.gripT += dt * (focus === 3 ? 1.5 : 0.8) * boost;
    const flex = r ? 0.3 : 0.12 + 0.5 * (0.5 - 0.5 * Math.cos(this.gripT));

    this.mods.forEach((m, mi) => {
      const seated = step >= mi + 1;
      m.pos += ((seated && !exploded ? 1 : 0) - m.pos) * k;
      m.lit += ((seated ? 1 : 0) - m.lit) * kl;
      let heat = mi === this.hovered ? 1 : 0;
      if (mi === focus) heat += 0.4 + (r ? 0 : 0.2 * Math.sin(this.t * 3.2));
      heat += oc * 0.9 * m.lit;
      m.heat += (heat - m.heat) * kl;

      const off = 1 - ease(clamp(m.pos, 0, 1));
      for (const p of m.pieces) {
        p.holder.position.copy(p.base).addScaledVector(p.explode, off);
        if (p.motion === 'bar') p.holder.position.z += this.zc;
        else if (p.motion === 'carriage') {
          p.holder.position.x += this.xc;
          p.holder.position.z += this.zc;
        } else if (p.motion === 'elbow') p.holder.rotation.x = -flex * m.lit;
        else if (!r && p.motion === 'lidar')
          p.holder.rotation.y += dt * 4 * boost;
        else if (!r && p.motion === 'rotor')
          p.holder.rotation.y += dt * (3 + 14 * m.lit) * boost;
      }

      const flick = r
        ? 1
        : 1 - oc * 0.18 * (0.5 + 0.5 * Math.sin(this.t * 47 + mi));
      const fu = m.fill.uniforms;
      fu.uColor.value
        .lerpColors(GHOST, SEATED, m.lit)
        .lerp(WARM, oc * 0.55 * m.lit);
      fu.uOpacity.value = (0.22 + 0.42 * m.lit) * flick;
      fu.uHot.value = m.heat;
      const hu = m.hot.uniforms;
      hu.uColor.value.lerpColors(GHOST, HOT, m.lit);
      hu.uOpacity.value = 0.4 + 0.45 * m.lit;
      hu.uHot.value = m.heat + 0.3 * m.lit;
      m.beam.uniforms.uOpacity.value = m.lit * (0.55 + 0.4 * oc);
      m.edge.color
        .lerpColors(EDGE_GHOST, EDGE_SEATED, m.lit)
        .lerp(WARM, oc * 0.5 * m.lit);
      m.edge.opacity = Math.min(1, 0.2 + 0.42 * m.lit + 0.3 * m.heat);
      m.dash.opacity = off * 0.6;
    });

    this.volume.uniforms.uOpacity.value = 0.075 + 0.07 * oc;
    if (!r) this.dust.rotation.y += dt * (0.025 + 0.4 * oc);

    // ---- layout: where the model sits on screen
    // desktop: shifted right so the panel has the left of the frame
    // phone: centred in the band between the panel and the dialogue strip
    let wantX = 0;
    let wantY = 0;
    let fit = 1;
    if (compact) {
      const top = ov.panel
        ? ov.panel.offsetTop + ov.panel.offsetHeight
        : height * 0.35;
      const bottom = ov.dialogue ? ov.dialogue.offsetTop : height * 0.82;
      this.band.top = top;
      this.band.bottom = Math.max(bottom, top + 80);
      wantY = -((this.band.top + this.band.bottom) / 2 - height / 2);
      fit = clamp((height * 0.5) / (this.band.bottom - this.band.top), 1, 1.6);
    } else {
      wantX = -Math.min(width * 0.12, 190);
      this.band.top = 64;
      this.band.bottom = ov.dialogue ? ov.dialogue.offsetTop : height - 150;
    }
    this.offX += (wantX - this.offX) * (r ? 1 : 1 - Math.exp(-dt * 5));
    this.offY += (wantY - this.offY) * (r ? 1 : 1 - Math.exp(-dt * 5));

    // ---- camera
    const c = STEPS[step].cam;
    let tx = c.t[0];
    let ty = c.t[1];
    let tz = c.t[2];
    let d = c.d;
    if (exploded) {
      tx *= 0.4;
      ty = ty * 0.45 + 0.65;
      tz *= 0.4;
      d = c.d * 0.6 + 3.4;
    }
    const aspect = width / Math.max(1, height);
    if (compact) {
      d *= (exploded ? 1.8 : c.md) * fit;
      tx *= 0.5;
    } else if (aspect < 1.05) d *= Math.pow(1.05 / aspect, 0.9);
    this.target.lerp(this.v.set(tx, ty, tz), k * 0.9);
    if (oc > 0.05 && !r) this.target.y += Math.sin(this.t * 61) * 0.003 * oc;
    this.dist += (d - this.dist) * k;
    this.yaw += (c.yaw - this.yaw) * k;
    this.pitch += (c.pitch - this.pitch) * k;
    if (!this.drag && this.userReset) {
      this.user.yaw *= 1 - k * 0.7;
      this.user.pitch *= 1 - k * 0.7;
      if (Math.abs(this.user.yaw) + Math.abs(this.user.pitch) < 0.002)
        this.userReset = false;
    }
    if (step === 7 && !r && !this.drag) this.spin += dt * 0.16;
    else if (step !== 7) {
      const rest = Math.round(this.spin / (Math.PI * 2)) * Math.PI * 2;
      this.spin += (rest - this.spin) * k;
    }
    const sway = r ? 0 : Math.sin(this.t * 0.23) * 0.13;
    const yaw = this.yaw + this.user.yaw + this.spin + sway;
    const pitch = clamp(this.pitch + this.user.pitch, -0.25, 0.8);
    camera.position.set(
      this.target.x + Math.sin(yaw) * Math.cos(pitch) * this.dist,
      this.target.y + Math.sin(pitch) * this.dist,
      this.target.z + Math.cos(yaw) * Math.cos(pitch) * this.dist
    );
    camera.lookAt(this.target);
    const key = `${width}x${height}:${this.offX.toFixed(1)},${this.offY.toFixed(1)}`;
    if (key !== this.viewKey) {
      this.viewKey = key;
      if (Math.abs(this.offX) + Math.abs(this.offY) > 0.5)
        camera.setViewOffset(
          width,
          height,
          this.offX,
          this.offY,
          width,
          height
        );
      else camera.clearViewOffset();
    }
    camera.updateMatrixWorld();

    // ---- Rivet
    this.updateDrone(camera, width, height, dt, focus, talking);
    this.root.updateMatrixWorld();

    // ---- hover (mouse only)
    if (this.hoverDirty) {
      this.hoverDirty = false;
      const hit = this.hoverNdc ? this.pick(this.hoverNdc, camera) : -1;
      this.hovered = hit;
      if (this.hoverEl)
        this.hoverEl.style.cursor = hit !== -1 ? 'pointer' : 'grab';
    }

    this.placePanel(camera, width, height, dt, ov);
    this.placeTags(camera, width, height, ov);
    this.placeBubble(width, height, ov);

    // ---- live readouts
    if (ov.xy) {
      let s = '—';
      if (gantry.lit > 0.5) {
        const X = this.xc * 500;
        const Y = (this.zc + 0.1) * 500;
        s = `x ${fmt(X)}  y ${fmt(Y)}  →  A ${fmt(X + Y)}  B ${fmt(X - Y)} mm`;
      }
      if (s !== this.lastXY) {
        ov.xy.textContent = s;
        this.lastXY = s;
      }
    }
    if (ov.grip) {
      const ph = r
        ? 0
        : Math.floor(((this.gripT % (Math.PI * 2)) / (Math.PI * 2)) * 3) % 3;
      const s = `${GRIP.map((g, i) => (i === ph ? `▸${g}` : g.toLowerCase())).join(' · ')}   θ ${(flex * 57.3).toFixed(0).padStart(2, '0')}°`;
      if (s !== this.lastGrip) {
        ov.grip.textContent = s;
        this.lastGrip = s;
      }
    }
  }

  private updateDrone(
    camera: THREE.PerspectiveCamera,
    w: number,
    h: number,
    dt: number,
    focus: number,
    talking: boolean
  ) {
    const { reduced: r, step, exploded, compact } = this.inp;
    const D = this.drone;
    const s = this.dist / 2.4;
    this.dScale +=
      ((compact ? 0.8 : 0.66) * clamp(s, 0.8, 1.7) - this.dScale) *
      (r ? 1 : 1 - Math.exp(-dt * 3));

    // what Rivet is looking at
    const look = this.tmp;
    const insp = STEPS[step].inspect;
    if (focus >= 0 && !exploded && insp) this.pinNow(insp, look);
    else if (focus >= 0 && !exploded) this.moduleNow(focus, look);
    else if (step === 7) look.set(0, 1.9, 0);
    else look.set(0, 0.9, 0.2);

    // camera basis
    const fwd = this.v.copy(look).sub(camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();

    // hover beside and a little in front of the module, on the side away from the panel
    const sc = this.dScale;
    const goal = look
      .clone()
      .addScaledVector(right, (compact ? 0.17 : 0.1) * sc)
      .addScaledVector(up, (compact ? 0.08 : 0.42) * sc)
      .addScaledVector(fwd, -0.25 * sc);

    // dodge the cursor when it gets close
    let near = 0;
    if (this.mouse.on && this.dScreen.ok) {
      const dx = this.dScreen.x - this.mouse.x;
      const dy = this.dScreen.y - this.mouse.y;
      const dd = Math.hypot(dx, dy);
      if (dd < 90) {
        near = 1 - dd / 90;
        this.dDodge.set(dx / (dd || 1), dy / (dd || 1));
      }
    }
    if (near > 0) {
      goal
        .addScaledVector(right, this.dDodge.x * 0.28 * sc * near)
        .addScaledVector(up, -this.dDodge.y * 0.28 * sc * near);
      this.dStartle = Math.max(this.dStartle, near);
    }
    if (!r) goal.addScaledVector(up, Math.sin(this.t * 2.1) * 0.012 * sc);

    if (this.dHop < 1) {
      this.dHop += dt / 0.45;
      goal.addScaledVector(
        up,
        Math.sin(Math.PI * Math.min(1, this.dHop)) * 0.08 * sc
      );
    }

    this.dPrev.copy(this.dPos);
    this.dPos.lerp(
      goal,
      r ? 1 : 1 - Math.exp(-dt * (near > 0 || this.dHop < 1 ? 7 : 1.8))
    );
    this.dVel.copy(this.dPos).sub(this.dPrev).divideScalar(Math.max(dt, 1e-3));
    D.root.position.copy(this.dPos);
    D.root.scale.setScalar(sc);

    // face: the cursor if there is one, else the module
    const lt = new THREE.Vector3();
    if (this.mouse.on && this.hoverNdc) {
      lt.set(this.hoverNdc.x, this.hoverNdc.y, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize();
      lt.multiplyScalar(camera.position.distanceTo(this.dPos)).add(
        camera.position
      );
    } else lt.copy(focus >= 0 || step === 7 ? this.tmp : camera.position);
    this.dDummy.position.copy(this.dPos);
    this.dDummy.lookAt(lt);
    this.dLook.slerp(this.dDummy.quaternion, r ? 1 : 1 - Math.exp(-dt * 5));
    D.head.quaternion.copy(this.dLook);

    // bank into motion, flip on overclock
    const vr = this.dVel.dot(right);
    D.tilt.rotation.z = clamp(-vr * 0.9, -0.5, 0.5);
    if (this.dFlip < 1) {
      this.dFlip += dt / 0.9;
      D.tilt.rotation.x = ease(Math.min(1, this.dFlip)) * Math.PI * 2;
    } else D.tilt.rotation.x = 0;

    // rotors, blink, startle, voice
    if (!r)
      for (const rt of D.rotors) rt.rotation.y += dt * (38 + 60 * this.oc);
    this.dBlink -= dt;
    let lid = 1;
    if (!r && this.dBlink < 0.12) lid = 0.15;
    if (this.dBlink < 0) this.dBlink = 2.5 + Math.random() * 3.5;
    this.dStartle = Math.max(0, this.dStartle - dt * 1.5);
    const eyeS = 1 + this.dStartle * 0.45;
    D.eye.scale.set(eyeS, eyeS * lid, 1);
    D.eyeMat.color.copy(EYE).lerp(HOT, this.oc * 0.7);
    D.eyeMat.opacity =
      talking && !r ? 0.65 + 0.35 * Math.sin(this.t * 22) : 0.95;

    // inspection light from the eye to the module
    const showBeam = focus >= 0 && !exploded;
    const eyeW = D.eye.getWorldPosition(new THREE.Vector3());
    const tgt = this.tmp;
    const dir = new THREE.Vector3().copy(tgt).sub(eyeW);
    const len = dir.length();
    this.beam.position.copy(eyeW);
    this.beam.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize()
    );
    this.beam.scale.set(sc, len, sc);
    const pulse = r ? 1 : 0.75 + 0.25 * Math.sin(this.t * 3);
    const bo = this.beamMat.uniforms.uOpacity;
    bo.value +=
      ((showBeam ? 0.55 * pulse : 0) - bo.value) *
      (r ? 1 : 1 - Math.exp(-dt * 4));

    // screen position, for the bubble and for dodging
    this.dScreen = this.project(this.dPos, camera, w, h);
  }

  private placePanel(
    camera: THREE.Camera,
    w: number,
    h: number,
    dt: number,
    ov: OverlayEls
  ) {
    const { panel, lead, dot, cone, grad } = ov;
    if (!panel || !lead || !dot || !cone || !grad) return;
    const { step, compact, reduced: r } = this.inp;
    const a = this.project(
      this.pinNow(STEPS[step].anchor, this.v),
      camera,
      w,
      h
    );
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    let x0: number;
    let y0: number;
    if (compact) {
      // CSS pins the panel to the top; the leader drops from its bottom edge
      x0 = panel.offsetLeft;
      y0 = panel.offsetTop;
    } else {
      const tx = clamp(a.x - 80 - pw, 28, Math.max(28, w - pw - 28));
      const ty = clamp(
        a.y - ph * 0.42,
        70,
        Math.max(70, this.band.bottom - ph - 14)
      );
      const fresh = panel !== this.panelEl;
      this.panelEl = panel;
      const kk = fresh || r ? 1 : 1 - Math.exp(-dt * 6);
      this.pX += (tx - this.pX) * kk;
      this.pY += (ty - this.pY) * kk;
      x0 = this.pX;
      y0 = this.pY;
      panel.style.transform = `translate3d(${px(x0)}px, ${px(y0)}px, 0)`;
    }
    const o = a.ok ? '1' : '0';
    lead.style.opacity = o;
    dot.style.opacity = o;
    cone.style.opacity = o;
    dot.setAttribute('cx', px(a.x));
    dot.setAttribute('cy', px(a.y));
    let ex: number;
    let ey: number;
    if (compact) {
      ex = clamp(a.x, x0 + 18, x0 + pw - 18);
      ey = y0 + ph;
      lead.setAttribute(
        'points',
        `${px(a.x)},${px(a.y)} ${px(ex)},${px(ey + 14)} ${px(ex)},${px(ey)}`
      );
      const sp = Math.min(70, pw / 2 - 8);
      const cx = clamp(ex, x0 + sp, x0 + pw - sp);
      cone.setAttribute(
        'points',
        `${px(a.x)},${px(a.y)} ${px(cx - sp)},${px(ey)} ${px(cx + sp)},${px(ey)}`
      );
    } else {
      ex = x0 + pw;
      ey = clamp(a.y, y0 + 24, y0 + ph - 24);
      lead.setAttribute(
        'points',
        `${px(a.x)},${px(a.y)} ${px(ex + 26)},${px(ey)} ${px(ex)},${px(ey)}`
      );
      cone.setAttribute(
        'points',
        `${px(a.x)},${px(a.y)} ${px(ex)},${px(y0 + 6)} ${px(ex)},${px(y0 + ph - 6)}`
      );
    }
    grad.setAttribute('x1', px(a.x));
    grad.setAttribute('y1', px(a.y));
    grad.setAttribute('x2', px(ex));
    grad.setAttribute('y2', px(ey));
  }

  private placeTags(
    camera: THREE.Camera,
    w: number,
    h: number,
    ov: OverlayEls
  ) {
    const { step, exploded, compact } = this.inp;
    const defs = tagsFor(step, exploded, compact);
    const s = compact ? 0.55 : 1;
    // keep tags off the status board (desktop: it sits top-right)
    const bd = !compact && ov.board ? ov.board : null;
    const bL = bd ? bd.offsetLeft - 10 : w;
    const bB = bd ? bd.offsetTop + bd.offsetHeight + 6 : 0;
    let lines = '';
    let dots = '';
    defs.forEach((t, i) => {
      const el = ov.tags[i];
      if (!el) return;
      const a = this.project(this.pinNow(t, this.v), camera, w, h);
      if (!a.ok) {
        el.style.opacity = '0';
        return;
      }
      el.style.opacity = '';
      const tw = el.offsetWidth;
      const th = el.offsetHeight;
      const left = t.dx < 0;
      let tx = a.x + t.dx * s;
      const ty = clamp(
        a.y + t.dy * s,
        this.band.top + th / 2 + 4,
        this.band.bottom - th / 2 - 4
      );
      let bx = left ? tx - tw : tx;
      const maxX = ty - th / 2 < bB ? Math.min(w - 8, bL) : w - 8;
      bx = clamp(bx, 8, maxX - tw);
      tx = left ? bx + tw : bx;
      el.style.transform = `translate3d(${px(bx)}px, ${px(ty - th / 2)}px, 0)`;
      lines += `M${px(a.x)} ${px(a.y)}L${px(tx)} ${px(ty)}`;
      dots += `M${px(a.x - 2.5)} ${px(a.y)}a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0`;
    });
    ov.tagLines?.setAttribute('d', lines || 'M0 0');
    ov.tagDots?.setAttribute('d', dots || 'M0 0');
  }

  private placeBubble(w: number, h: number, ov: OverlayEls) {
    const d = this.dScreen;
    const lift = 26 * this.dScale;
    if (ov.voice) {
      ov.voice.style.transform = `translate3d(${px(d.x)}px, ${px(d.y)}px, 0)`;
      ov.voice.style.opacity = d.ok && d.x > -500 ? '1' : '0';
    }
    const b = ov.bubble;
    if (!b) return;
    const bw = b.offsetWidth;
    const bh = b.offsetHeight;
    const x = clamp(d.x - bw / 2, 8, w - bw - 8);
    const y = clamp(d.y - lift - bh, 60, h - bh - 8);
    b.style.transform = `translate3d(${px(x)}px, ${px(y)}px, 0)`;
  }

  dispose() {
    this.drone.dispose();
    this.trash.forEach((t) => t.dispose());
    this.trash = [];
  }
}
