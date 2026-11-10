'use client';

// The atom as an instrument: a faceted core with a die inside, six engineered orbits with tick
// marks, data packets running the orbits, a polar reference grid and depth-of-field dust.
// The camera is choreographed per chapter (see data.ts); every frame the scene projects anchors
// and writes them into the DOM labels.

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { C, chapters, rings, travel, type Cam } from './data';
import { atom, now } from './store';
import * as S from './shaders';
import { KEYS, ringPoint, ringQ, stationTh } from './rig';

const TAU = Math.PI * 2;
const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const damp = (c: number, t: number, l: number, dt: number) =>
  c + (t - c) * (1 - Math.exp(-l * dt));
const io = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const out = (x: number) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

// shared uniforms: one write per frame reaches every material
const U = {
  uFocus: { value: 12 },
  uRange: { value: 6 },
  uExplode: { value: 0 },
  uTime: { value: 0 },
};

function camFor(i: number, narrow: boolean): Cam {
  const k = narrow ? KEYS.narrow.keys : KEYS.wide.keys;
  return k[clamp(i, 0, k.length - 1)];
}

function lineMat(opts: {
  color?: string;
  alpha: number;
  minA?: number;
  mode?: 0 | 1 | 2;
  explode?: boolean;
}) {
  return new THREE.ShaderMaterial({
    vertexShader: S.lineVert,
    fragmentShader: S.lineFrag,
    transparent: true,
    depthWrite: false,
    defines: {
      T_MODE: opts.mode ?? 0,
      ...(opts.explode ? { EXPLODE: '' } : {}),
    },
    uniforms: {
      uFocus: U.uFocus,
      uRange: U.uRange,
      uExplode: U.uExplode,
      uColor: { value: new THREE.Color(opts.color ?? C.ink) },
      uAlpha: { value: opts.alpha },
      uDraw: { value: opts.mode ? 0 : 1 },
      uMinA: { value: opts.minA ?? 0.22 },
    },
  });
}

// ---------------------------------------------------------------- camera

function Rig({ narrow }: { narrow: boolean }) {
  const { camera, size } = useThree();
  const cur = useRef<Cam | null>(null);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const frame = useRef(0);

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const T = now();
    const reduced = atom.reduced;
    const { i, t, active } = travel(atom.p);
    const A = camFor(i, narrow);
    const B = camFor(i + 1, narrow);
    const k = reduced ? (active === i ? 0 : 1) : t;
    const goal: Cam = {
      az: A.az + (B.az - A.az) * k,
      el: A.el + (B.el - A.el) * k,
      dist: A.dist + (B.dist - A.dist) * k,
      tx: A.tx + (B.tx - A.tx) * k,
      ty: A.ty + (B.ty - A.ty) * k,
      tz: A.tz + (B.tz - A.tz) * k,
      fov: A.fov + (B.fov - A.fov) * k,
    };
    // the dolly-in on arrival
    const s = T - atom.booted;
    const intro = reduced ? 1 : io(clamp(s / 3.2, 0, 1));
    goal.dist *= 1 + (1 - intro) * 1.1;
    goal.el += (1 - intro) * 28;
    goal.az -= (1 - intro) * 50;

    // drag springs back after a pause
    if (!atom.dragging && T - atom.releasedAt > 1.6) {
      atom.yaw = damp(atom.yaw, 0, 1.4, dt);
      atom.pitch = damp(atom.pitch, 0, 1.4, dt);
    }
    const par = reduced ? 0 : 1;
    goal.az += atom.yaw + atom.pointer.nx * 2.5 * par;
    goal.el = clamp(
      goal.el + atom.pitch - atom.pointer.ny * 1.6 * par,
      -88,
      88
    );

    if (!cur.current || reduced) cur.current = { ...goal };
    else {
      const c = cur.current;
      const l = atom.dragging ? 9 : 3.6;
      c.az = damp(c.az, goal.az, l, dt);
      c.el = damp(c.el, goal.el, l, dt);
      c.dist = damp(c.dist, goal.dist, 3.2, dt);
      c.tx = damp(c.tx, goal.tx, 3.2, dt);
      c.ty = damp(c.ty, goal.ty, 3.2, dt);
      c.tz = damp(c.tz, goal.tz, 3.2, dt);
      c.fov = damp(c.fov, goal.fov, 3.2, dt);
    }
    const c = cur.current;
    const az = rad(c.az);
    const el = rad(c.el);
    tgt.set(c.tx, c.ty, c.tz);
    cam.position.set(
      tgt.x + c.dist * Math.cos(el) * Math.sin(az),
      tgt.y + c.dist * Math.sin(el),
      tgt.z + c.dist * Math.cos(el) * Math.cos(az)
    );
    cam.lookAt(tgt);
    // portrait screens: widen the lens so the orbits keep most of their horizontal span,
    // and shift it so the atom sits above the readouts at the bottom
    const aspect = size.width / Math.max(1, size.height);
    const fov =
      aspect < 1
        ? 2 *
          Math.atan((Math.tan(rad(c.fov) / 2) / aspect) * 0.72) *
          (180 / Math.PI)
        : c.fov;
    const shift = narrow ? size.height * 0.13 : 0;
    const vo = cam.view;
    const shiftChanged = narrow
      ? !vo ||
        !vo.enabled ||
        Math.abs(vo.offsetY - shift) > 0.5 ||
        vo.fullWidth !== size.width
      : !!vo?.enabled;
    if (shiftChanged) {
      if (narrow)
        cam.setViewOffset(
          size.width,
          size.height,
          0,
          shift,
          size.width,
          size.height
        );
      else cam.clearViewOffset();
    }
    if (Math.abs(cam.fov - fov) > 0.01 || shiftChanged) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld();

    // focal plane sits on the target; depth of field opens up on close shots
    U.uFocus.value = c.dist;
    U.uRange.value = Math.max(2.2, c.dist * 0.6);
    if (!reduced) U.uTime.value += dt;

    atom.W = size.width;
    atom.H = size.height;
    // instrument readout
    if (atom.hud && frame.current++ % 4 === 0) {
      const a = (((c.az % 360) + 360) % 360).toFixed(1).padStart(5, '0');
      const e =
        (c.el >= 0 ? '+' : '−') + Math.abs(c.el).toFixed(1).padStart(4, '0');
      atom.hud.textContent = `AZ ${a}°  EL ${e}°  R ${c.dist.toFixed(2)}  FOV ${c.fov.toFixed(0)}`;
    }
  }, -2);
  return null;
}

// ---------------------------------------------------------------- orbits

const TICKS = 180; // every 2°

function Orbits() {
  const res = useMemo(() => {
    return rings.map((r, i) => {
      const torus = new THREE.TorusGeometry(r.r, 0.0065 + i * 0.0009, 6, 360);
      torus.rotateX(-Math.PI / 2);
      const ring = lineMat({ alpha: 0.5, mode: 1, minA: 0.32 });
      // tick marks: radial, in the ring plane, like a dial bezel
      const box = new THREE.BoxGeometry(1, 1, 1);
      box.translate(0.5, 0, 0);
      const ticks = new THREE.InstancedMesh(
        box,
        lineMat({ alpha: 0.3, mode: 2, minA: 0.35 }),
        TICKS
      );
      const aT = new Float32Array(TICKS);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const p = new THREE.Vector3();
      const sc = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      for (let j = 0; j < TICKS; j++) {
        const deg = j * 2;
        const th = rad(deg);
        const len = deg % 30 === 0 ? 0.2 : deg % 10 === 0 ? 0.1 : 0.045;
        const w = deg % 30 === 0 ? 0.013 : 0.009;
        q.setFromAxisAngle(up, th);
        p.set(r.r * Math.cos(th), 0, -r.r * Math.sin(th));
        p.addScaledVector(p.clone().normalize(), 0.02);
        sc.set(len, w, w);
        m.compose(p, q, sc);
        ticks.setMatrixAt(j, m);
        aT[j] = j / TICKS;
      }
      box.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 1));
      ticks.frustumCulled = false;
      return { torus, ring, ticks };
    });
  }, []);

  // stations: a short post through the ring at each fact, perpendicular to the ring plane
  const stations = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.009, 0.24, 0.009);
    const cap = new THREE.BoxGeometry(0.05, 0.01, 0.05);
    return chapters.flatMap((c) =>
      (c.stations ?? []).map((s) => {
        const key = `${c.id}:${s.k}`;
        const mat = new THREE.MeshBasicMaterial({
          color: C.ink,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        const th = rad(stationTh[key]);
        const r = rings[c.ring].r;
        return {
          key,
          ring: c.ring,
          geo,
          cap,
          mat,
          pos: new THREE.Vector3(r * Math.cos(th), 0, -r * Math.sin(th)),
        };
      })
    );
  }, []);

  const groups = useRef<(THREE.Group | null)[]>([]);
  const signal = useMemo(() => new THREE.Color(C.signal), []);
  const ink = useMemo(() => new THREE.Color(C.ink), []);

  useFrame((_, dt) => {
    const T = now() - atom.booted;
    const reduced = atom.reduced;
    const { active, settled } = travel(atom.p);
    const ch = chapters[active];
    const egg = now() - atom.eggAt;
    rings.forEach((r, i) => {
      const on = ch.ring === i;
      const hero = ch.ring < 0;
      const ringA = on ? 0.9 : hero ? 0.34 : 0.16;
      const tickA = on ? 0.7 : hero ? 0.2 : 0.07;
      const rm = res[i].ring;
      const tm = res[i].ticks.material as THREE.ShaderMaterial;
      rm.uniforms.uAlpha.value = damp(rm.uniforms.uAlpha.value, ringA, 4, dt);
      tm.uniforms.uAlpha.value = damp(tm.uniforms.uAlpha.value, tickA, 4, dt);
      // draw-in: staggered arcs on arrival
      const d = reduced ? 1 : out((T - 0.5 - i * 0.16) / 1.6);
      rm.uniforms.uDraw.value = d;
      tm.uniforms.uDraw.value = reduced ? 1 : out((T - 0.9 - i * 0.16) / 1.6);
      const g = groups.current[i];
      if (g && !reduced) {
        // egg: rings unlock and spin
        const spin = egg < 4 ? Math.sin((egg / 4) * Math.PI) * 1.4 : 0;
        g.rotation.y += dt * spin * (i % 2 ? -1 : 1);
        if (egg >= 4)
          g.rotation.y = damp(
            g.rotation.y,
            Math.round(g.rotation.y / TAU) * TAU,
            2,
            dt
          );
      }
    });
    for (const s of stations) {
      const on =
        settled &&
        chapters[active].stations &&
        ch.ring === s.ring &&
        s.key.startsWith(ch.id + ':');
      s.mat.opacity = damp(
        s.mat.opacity,
        on ? 1 : ch.ring === s.ring ? 0.25 : 0,
        5,
        dt
      );
      s.mat.color.lerp(on ? signal : ink, 1 - Math.exp(-6 * dt));
    }
  });

  return (
    <group>
      {rings.map((r, i) => (
        <group key={r.id} quaternion={ringQ[i]}>
          <group
            ref={(n) => {
              groups.current[i] = n;
            }}
          >
            <mesh
              geometry={res[i].torus}
              material={res[i].ring}
              frustumCulled={false}
            />
            <primitive object={res[i].ticks} />
          </group>
          {stations
            .filter((s) => s.ring === i)
            .map((s) => (
              <group key={s.key} position={s.pos}>
                <mesh geometry={s.geo} material={s.mat} />
                <mesh
                  geometry={s.cap}
                  material={s.mat}
                  position={[0, 0.12, 0]}
                />
              </group>
            ))}
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- packets (the electrons)

const TRAIN = 4;
function Packets() {
  const total = rings.reduce((a, r) => a + r.packets, 0) * TRAIN;
  const mesh = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      metalness: 0.3,
      roughness: 0.38,
    });
    const m = new THREE.InstancedMesh(geo, mat, total);
    m.frustumCulled = false;
    for (let i = 0; i < total; i++) m.setColorAt(i, new THREE.Color(C.ink));
    return m;
  }, [total]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Vector3(), []);
  const cols = useMemo(
    () => ({
      sig: new THREE.Color(C.signal),
      ink: new THREE.Color(C.ink),
      dim: new THREE.Color('#5b5b58'),
    }),
    []
  );
  const last = useRef(-1);
  const phase = useRef(0);

  useFrame((_, dt) => {
    const reduced = atom.reduced;
    const egg = now() - atom.eggAt;
    const boost = egg < 4 ? 1 + Math.sin((egg / 4) * Math.PI) * 6 : 1;
    if (!reduced) phase.current += dt * boost;
    const { active } = travel(atom.p);
    const ch = chapters[active];
    const T = now() - atom.booted;
    let n = 0;
    rings.forEach((r, i) => {
      const on = ch.ring === i;
      for (let k = 0; k < r.packets; k++) {
        const base = (k / r.packets) * 360 + i * 37;
        const th0 = base + phase.current * r.speed * 57.3 * (i % 2 ? -1 : 1);
        const appear = reduced ? 1 : out((T - 1.4 - i * 0.12) / 1.2);
        for (let j = 0; j < TRAIN; j++) {
          const lag = (j * 5.5) / (r.r * 0.6);
          const th = th0 - lag * (i % 2 ? -1 : 1);
          ringPoint(i, th, p);
          ringPoint(i, th + (i % 2 ? -1 : 1), q);
          dummy.position.copy(p);
          dummy.lookAt(q);
          const s = (j === 0 ? 1 : 0.7 - j * 0.12) * appear;
          dummy.scale.set(0.05 * s, 0.05 * s, (j === 0 ? 0.16 : 0.07) * s);
          dummy.updateMatrix();
          mesh.setMatrixAt(n, dummy.matrix);
          if (last.current !== active)
            mesh.setColorAt(
              n,
              on && j === 0 ? cols.sig : on ? cols.ink : cols.dim
            );
          n++;
        }
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (last.current !== active && mesh.instanceColor)
      mesh.instanceColor.needsUpdate = true;
    last.current = active;
  });
  return <primitive object={mesh} />;
}

// ---------------------------------------------------------------- the core

function chipTexture() {
  const s = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#0e0f10';
  g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(233,231,226,0.55)';
  g.lineWidth = 2;
  g.strokeRect(14, 14, s - 28, s - 28);
  // die floorplan: blocks of different density
  const cells: [number, number, number, number, number][] = [
    [48, 48, 196, 120, 0.16],
    [260, 48, 204, 120, 0.1],
    [48, 184, 120, 280, 0.08],
    [184, 184, 144, 144, 0.22],
    [344, 184, 120, 280, 0.12],
    [184, 344, 144, 120, 0.06],
  ];
  for (const [x, y, w, h, a] of cells) {
    g.fillStyle = `rgba(233,231,226,${a})`;
    g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(233,231,226,0.4)';
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // fine rows, like standard cells
    g.strokeStyle = `rgba(233,231,226,${a * 1.3})`;
    for (let yy = y + 6; yy < y + h; yy += 6) {
      g.beginPath();
      g.moveTo(x + 4, yy);
      g.lineTo(x + w - 4, yy);
      g.stroke();
    }
  }
  // the one hot block
  g.fillStyle = C.signal;
  g.fillRect(232, 232, 48, 48);
  // pads
  g.fillStyle = 'rgba(233,231,226,0.7)';
  for (let k = 0; k < 24; k++) {
    const o = 40 + k * 18;
    g.fillRect(o, 24, 8, 10);
    g.fillRect(o, s - 34, 8, 10);
    g.fillRect(24, o, 10, 8);
    g.fillRect(s - 34, o, 10, 8);
  }
  g.font = '500 18px monospace';
  g.fillStyle = 'rgba(233,231,226,0.8)';
  g.fillText('MIN-01', 260, 150);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function Core() {
  const group = useRef<THREE.Group>(null);
  const gimbal = useRef<THREE.Group>(null);
  const chip = useRef<THREE.Group>(null);
  const res = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(0.66, 1); // already non-indexed: one triangle per face
    const pos = ico.getAttribute('position') as THREE.BufferAttribute;
    const nTri = pos.count / 3;
    const center = new Float32Array(pos.count * 3);
    const rnd = new Float32Array(pos.count);
    const lp: number[] = [];
    const lc: number[] = [];
    const lr: number[] = [];
    const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    for (let t = 0; t < nTri; t++) {
      for (let j = 0; j < 3; j++) v[j].fromBufferAttribute(pos, t * 3 + j);
      const c = v[0].clone().add(v[1]).add(v[2]).divideScalar(3);
      const r = (((Math.sin(t * 91.7) * 43758.5) % 1) + 1) % 1;
      for (let j = 0; j < 3; j++) {
        center.set([c.x, c.y, c.z], (t * 3 + j) * 3);
        rnd[t * 3 + j] = r;
      }
      for (const [a, b] of [
        [0, 1],
        [1, 2],
        [2, 0],
      ]) {
        const A = v[a].clone().multiplyScalar(1.004);
        const B = v[b].clone().multiplyScalar(1.004);
        lp.push(A.x, A.y, A.z, B.x, B.y, B.z);
        lc.push(c.x, c.y, c.z, c.x, c.y, c.z);
        lr.push(r, r);
      }
    }
    ico.setAttribute('aCenter', new THREE.BufferAttribute(center, 3));
    ico.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
    ico.computeVertexNormals();
    const faceMat = new THREE.MeshStandardMaterial({
      color: '#1b1c1e',
      metalness: 0.9,
      roughness: 0.28,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    faceMat.onBeforeCompile = (sh) => {
      sh.uniforms.uExplode = U.uExplode;
      sh.vertexShader = sh.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nattribute vec3 aCenter;\nattribute float aRand;\nuniform float uExplode;'
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\ntransformed += normalize(aCenter) * uExplode * (0.22 + aRand * 0.38);'
        );
    };
    const edges = new THREE.BufferGeometry();
    edges.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    edges.setAttribute('aCenter', new THREE.Float32BufferAttribute(lc, 3));
    edges.setAttribute('aRand', new THREE.Float32BufferAttribute(lr, 1));
    const edgeMat = lineMat({ alpha: 0.55, explode: true, minA: 0.4 });

    // gimbal: a thin calibrated ring around the core
    const gTorus = new THREE.TorusGeometry(1.02, 0.004, 4, 240);
    const gMat = lineMat({ alpha: 0.5, minA: 0.3 });
    const gTicks: number[] = [];
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * TAU;
      const l = k % 6 === 0 ? 0.09 : 0.04;
      gTicks.push(
        Math.cos(a) * 1.02,
        Math.sin(a) * 1.02,
        0,
        Math.cos(a) * (1.02 - l),
        Math.sin(a) * (1.02 - l),
        0
      );
    }
    const gTickGeo = new THREE.BufferGeometry();
    gTickGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(gTicks, 3)
    );

    // the die inside
    const tex = chipTexture();
    const dark = new THREE.MeshStandardMaterial({
      color: '#141516',
      metalness: 0.7,
      roughness: 0.4,
    });
    const top = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.55,
      metalness: 0.2,
      roughness: 0.5,
    });
    const chipGeo = new THREE.BoxGeometry(0.66, 0.04, 0.66);
    const pinGeo = new THREE.BoxGeometry(0.014, 0.012, 0.06);
    const pinMat = new THREE.MeshStandardMaterial({
      color: '#b9b7b0',
      metalness: 1,
      roughness: 0.3,
    });
    const pins = new THREE.InstancedMesh(pinGeo, pinMat, 64);
    const d = new THREE.Object3D();
    let n = 0;
    for (let side = 0; side < 4; side++) {
      for (let k = 0; k < 16; k++) {
        const o = -0.3 + (k / 15) * 0.6;
        d.position.set(0, -0.012, 0);
        d.rotation.set(0, (side * Math.PI) / 2, 0);
        d.position.x =
          Math.sin((side * Math.PI) / 2) * 0.36 +
          Math.cos((side * Math.PI) / 2) * o;
        d.position.z =
          Math.cos((side * Math.PI) / 2) * 0.36 -
          Math.sin((side * Math.PI) / 2) * o;
        d.updateMatrix();
        pins.setMatrixAt(n++, d.matrix);
      }
    }
    return {
      ico,
      faceMat,
      edges,
      edgeMat,
      gTorus,
      gMat,
      gTickGeo,
      chipGeo,
      chipMats: [dark, dark, top, dark, dark, dark],
      pins,
    };
  }, []);

  useFrame((_, dt) => {
    const reduced = atom.reduced;
    const { i, t, active } = travel(atom.p);
    const a = chapters[i].explode ?? 0;
    const b = chapters[Math.min(chapters.length - 1, i + 1)].explode ?? 0;
    let ex = reduced ? (chapters[active].explode ?? 0) : a + (b - a) * t;
    const T = now() - atom.booted;
    if (!reduced) ex += (1 - out((T - 0.2) / 2.4)) * 3.2; // assembles on arrival
    const egg = now() - atom.eggAt;
    if (egg < 4.2)
      ex +=
        (egg < 0.6
          ? out(egg / 0.6)
          : egg < 2.6
            ? 1
            : 1 - io((egg - 2.6) / 1.6)) * 2.2;
    // clicks nudge it open a little, like testing a lid
    const kick = now() - atom.clickAt;
    if (kick < 0.5)
      ex += Math.sin((kick / 0.5) * Math.PI) * 0.12 * Math.min(atom.clicks, 6);
    U.uExplode.value = reduced ? ex : damp(U.uExplode.value, ex, 8, dt);
    if (!reduced && group.current) group.current.rotation.y += dt * 0.12;
    if (!reduced && gimbal.current) {
      gimbal.current.rotation.x += dt * 0.18;
      gimbal.current.rotation.z += dt * 0.05;
    }
    if (chip.current) chip.current.visible = U.uExplode.value > 0.04;
  });

  return (
    <group>
      <group ref={group}>
        <mesh geometry={res.ico} material={res.faceMat} />
        <lineSegments geometry={res.edges} material={res.edgeMat} />
        <group ref={chip} rotation={[0.18, 0.6, 0.08]}>
          <mesh geometry={res.chipGeo} material={res.chipMats} />
          <primitive object={res.pins} />
        </group>
      </group>
      <group ref={gimbal}>
        <mesh geometry={res.gTorus} material={res.gMat} />
        <lineSegments geometry={res.gTickGeo} material={res.gMat} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------- reference: polar grid, axis

function Reference() {
  const res = useMemo(() => {
    const p: number[] = [];
    for (let r = 1; r <= 7.5; r += 0.5) {
      const seg = 128;
      for (let k = 0; k < seg; k++) {
        const a0 = (k / seg) * TAU;
        const a1 = ((k + 1) / seg) * TAU;
        if (r % 1 !== 0 && k % 2) continue; // half rings dashed
        p.push(
          r * Math.cos(a0),
          0,
          r * Math.sin(a0),
          r * Math.cos(a1),
          0,
          r * Math.sin(a1)
        );
      }
    }
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * TAU;
      const r0 = k % 6 === 0 ? 0.9 : 1.6;
      p.push(
        r0 * Math.cos(a),
        0,
        r0 * Math.sin(a),
        7.5 * Math.cos(a),
        0,
        7.5 * Math.sin(a)
      );
    }
    const grid = new THREE.BufferGeometry();
    grid.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    const gridMat = lineMat({ alpha: 0.05, minA: 0.3 });
    const ax: number[] = [0, -7, 0, 0, 7, 0];
    for (let y = -6; y <= 6; y += 0.5) {
      if (Math.abs(y) < 1.1) continue;
      const l = y % 2 === 0 ? 0.14 : 0.06;
      ax.push(-l, y, 0, l, y, 0);
    }
    const axis = new THREE.BufferGeometry();
    axis.setAttribute('position', new THREE.Float32BufferAttribute(ax, 3));
    const axisMat = lineMat({ alpha: 0.16, minA: 0.3 });
    return { grid, gridMat, axis, axisMat };
  }, []);
  useFrame((_, dt) => {
    const { active } = travel(atom.p);
    const plan = chapters[active].id === 'ts';
    res.gridMat.uniforms.uAlpha.value = damp(
      res.gridMat.uniforms.uAlpha.value,
      plan ? 0.16 : 0.06,
      3,
      dt
    );
  });
  return (
    <group>
      <lineSegments
        geometry={res.grid}
        material={res.gridMat}
        frustumCulled={false}
      />
      <lineSegments
        geometry={res.axis}
        material={res.axisMat}
        frustumCulled={false}
      />
    </group>
  );
}

function Dust({ count }: { count: number }) {
  const { gl } = useThree();
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // a loose shell around the atom, some close enough to fly past the lens
      const r = 2.5 + Math.pow(Math.random(), 0.7) * 26;
      const u = Math.random() * 2 - 1;
      const a = Math.random() * TAU;
      const s = Math.sqrt(1 - u * u);
      p.set([r * s * Math.cos(a), r * u * 0.6, r * s * Math.sin(a)], i * 3);
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: S.dustVert,
      fragmentShader: S.dustFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uFocus: U.uFocus,
        uRange: U.uRange,
        uTime: U.uTime,
        uPx: { value: 1.5 },
        uColor: { value: new THREE.Color(C.ink) },
      },
    });
    return { geo: g, mat: m };
  }, [count]);
  useFrame(() => {
    mat.uniforms.uPx.value = gl.getPixelRatio();
  });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

// ---------------------------------------------------------------- lights

function Lights() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.45;
    return () => {
      env.dispose();
      pm.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 8, 6]} intensity={2.4} />
      <directionalLight
        position={[-7, -2, -6]}
        intensity={1.1}
        color="#dfe6ee"
      />
    </>
  );
}

// ---------------------------------------------------------------- DOM projection

function Projector() {
  const { camera } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const w = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const tagPos = useRef(rings.map(() => ({ x: -999, y: -999, init: false })));
  const stations = useMemo(
    () =>
      chapters.flatMap((c) =>
        (c.stations ?? []).map((s) => ({
          key: `${c.id}:${s.k}`,
          ch: chapters.indexOf(c),
          world: ringPoint(
            c.ring,
            stationTh[`${c.id}:${s.k}`],
            new THREE.Vector3(),
            0.12
          ),
        }))
      ),
    []
  );
  const samples = useMemo(
    () =>
      rings.map((_, i) =>
        Array.from({ length: 72 }, (_, k) =>
          ringPoint(i, k * 5, new THREE.Vector3())
        )
      ),
    []
  );

  const labelW = useMemo(() => new WeakMap<HTMLElement, number>(), []);

  useFrame((_, dt) => {
    const W = atom.W;
    const H = atom.H;
    const cam = camera as THREE.PerspectiveCamera;
    const toScreen = (p: THREE.Vector3) => {
      v.copy(p).project(cam);
      return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, z: v.z };
    };
    // core
    const c = toScreen(w.set(0, 0, 0));
    const dist = cam.position.length();
    const rPx = (0.8 / (dist * Math.tan(rad(cam.fov) / 2))) * (H / 2);
    atom.core.x = c.x;
    atom.core.y = c.y;
    atom.core.r = rPx;
    if (atom.coreEl) {
      atom.coreEl.style.setProperty('--cx', `${c.x.toFixed(1)}px`);
      atom.coreEl.style.setProperty('--cy', `${c.y.toFixed(1)}px`);
      atom.coreEl.style.setProperty('--cr', `${rPx.toFixed(1)}px`);
    }
    if (atom.coreBtn) {
      atom.coreBtn.style.transform = `translate(${(c.x - rPx).toFixed(1)}px, ${(c.y - rPx).toFixed(1)}px)`;
      atom.coreBtn.style.width =
        atom.coreBtn.style.height = `${(rPx * 2).toFixed(0)}px`;
    }

    const { active } = travel(atom.p);
    camDir.copy(cam.position).normalize();
    const camDist = cam.position.length();
    // stations of the chapter in view
    for (const s of stations) {
      const el = atom.stations[s.key];
      if (!el) continue;
      if (Math.abs(s.ch - active) > 1) continue;
      const p = toScreen(s.world);
      const off = p.z > 1 || p.x < 8 || p.x > W - 8 || p.y < 56 || p.y > H - 40;
      // behind the core?
      const depth = s.world.dot(camDir);
      const hid =
        depth < 0 &&
        Math.hypot(p.x - c.x, p.y - c.y) < rPx * 1.25 &&
        camDist > 0;
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      // labels point away from the core, unless that would push them off screen
      let bw = labelW.get(el);
      if (bw === undefined) {
        bw =
          (el.querySelector<HTMLElement>('[class*="sBody"]')?.offsetWidth ??
            160) + 30;
        labelW.set(el, bw);
      }
      let side = p.x > W * 0.5 ? 'r' : 'l';
      if (side === 'l' && p.x - bw < 12) side = 'r';
      else if (side === 'r' && p.x + bw > W - 12) side = 'l';
      if (el.dataset.side !== side) el.dataset.side = side;
      const vis = off || hid ? '0' : '1';
      if (el.dataset.vis !== vis) el.dataset.vis = vis;
    }
    // hero: each orbit's tag takes the point of its ring nearest a legend slot on the right
    const activeRing = chapters[active].ring;
    const farTh = (atom.narrow ? KEYS.narrow : KEYS.wide).near[active] + 180;
    const taken: { x: number; y: number }[] = [];
    rings.forEach((_, i) => {
      const el = atom.tags[i];
      if (!el) return;
      let bx = 0;
      let by = 0;
      let off = false;
      if (activeRing >= 0) {
        // in an orbit's chapter only its own name shows, on the far arc, clear of the stations
        if (i !== activeRing) {
          if (el.dataset.vis !== '0') el.dataset.vis = '0';
          return;
        }
        const p = toScreen(ringPoint(i, farTh, w));
        bx = p.x;
        by = p.y;
        off = p.z > 1 || bx < 60 || bx > W - 60 || by < 90 || by > H - 40;
      } else {
        const sx = W * 0.8;
        const sy = H * (0.2 + (i / (rings.length - 1)) * 0.56);
        let best = 1e9;
        for (const pt of samples[i]) {
          const p = toScreen(pt);
          if (p.z > 1 || p.x > W - 190 || p.y < 64 || p.y > H - 64) continue;
          if (Math.hypot(p.x - c.x, p.y - c.y) < rPx * 1.5) continue;
          if (
            taken.some(
              (q) => Math.abs(q.x - p.x) < 150 && Math.abs(q.y - p.y) < 34
            )
          )
            continue;
          const d = (p.x - sx) ** 2 + (p.y - sy) ** 2;
          if (d < best) {
            best = d;
            bx = p.x;
            by = p.y;
          }
        }
        off = best === 1e9;
        if (!off) taken.push({ x: bx, y: by });
      }
      const tp = tagPos.current[i];
      if (!tp.init || atom.reduced) {
        tp.x = bx;
        tp.y = by;
        tp.init = true;
      } else {
        tp.x = damp(tp.x, bx, 14, dt);
        tp.y = damp(tp.y, by, 14, dt);
      }
      el.style.transform = `translate3d(${tp.x.toFixed(1)}px, ${tp.y.toFixed(1)}px, 0)`;
      const vis = off ? '0' : '1';
      if (el.dataset.vis !== vis) el.dataset.vis = vis;
    });

    for (const h of atom.hooks) h(now(), dt);
  });
  return null;
}

// ---------------------------------------------------------------- canvas

export default function Scene({ narrow }: { narrow: boolean }) {
  return (
    <Canvas
      dpr={narrow ? [1, 1.5] : [1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 2, 14], fov: 34, near: 0.05, far: 120 }}
      onCreated={() => {
        atom.booted = now();
      }}
    >
      <color attach="background" args={[C.void]} />
      <Lights />
      <Rig narrow={narrow} />
      <Reference />
      <Orbits />
      <Packets />
      <Core />
      <Dust count={narrow ? 500 : 1100} />
      <Projector />
    </Canvas>
  );
}
