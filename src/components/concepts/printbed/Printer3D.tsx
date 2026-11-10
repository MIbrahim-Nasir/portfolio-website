'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FIL_HEX, job, type Fil } from './job';
import { locate, F, FEAT, type Toolpath } from './slicer';
import { bus, C } from './bus';
import { BONUS } from './shapes';

/*
  A Core XY printer, in millimetres. The head only moves in X and Y; the bed
  drops one layer at a time. Every extrusion is one instance of a rounded bead
  (width x layer height), so walls, infill, skin and layer lines are geometry,
  not texture.
*/

const FIL = Object.fromEntries(
  Object.entries(FIL_HEX).map(([k, v]) => [k, new THREE.Color(v)])
) as Record<Fil, THREE.Color>;
const WHITE = new THREE.Color('#ffffff');

/* how the camera looks at each part: lettering on top wants a high angle, the tower's embossed fronts a low one */
const VIEW: { el: number; az: number }[] = [
  { el: 0.86, az: 0.36 },
  { el: 0.8, az: 0.4 },
  { el: 0.84, az: 0.36 },
  { el: 0.62, az: 0.5 },
  { el: 0.7, az: 0.42 },
  { el: 0.9, az: 0.36 },
  { el: 0.3, az: 0.26 },
  { el: 0.86, az: 0.36 },
  { el: 0.6, az: 0.62 },
];

/* -------------------------------------------------------------- geometry */

function beadGeometry() {
  const S = 8;
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  for (let k = 0; k < S; k++) {
    const a = (k / S) * Math.PI * 2 + Math.PI / S;
    const s = Math.sin(a);
    const c = Math.cos(a);
    const y = 0.5 * Math.sign(s) * Math.abs(s) ** 0.55;
    const z = 0.5 * Math.sign(c) * Math.abs(c) ** 0.55;
    pos.push(-0.5, y, z, 0.5, y, z);
    nor.push(0, s, c, 0, s, c);
  }
  for (let k = 0; k < S; k++) {
    const a = 2 * k;
    const b = 2 * ((k + 1) % S);
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/** column-major matrix for a bead from (x0,y0) along angle th, length len */
function bead(
  out: Float32Array,
  o: number,
  x0: number,
  y0: number,
  dx: number,
  dy: number,
  len: number,
  z: number,
  w: number,
  h: number
) {
  const L = Math.hypot(dx, dy) || 1;
  const c = dx / L;
  const s = dy / L;
  const sx = len + w * 0.85;
  const mx = x0 + c * (len / 2);
  const my = y0 + s * (len / 2);
  out[o] = c * sx;
  out[o + 1] = 0;
  out[o + 2] = -s * sx;
  out[o + 3] = 0;
  out[o + 4] = 0;
  out[o + 5] = h;
  out[o + 6] = 0;
  out[o + 7] = 0;
  out[o + 8] = s * w;
  out[o + 9] = 0;
  out[o + 10] = c * w;
  out[o + 11] = 0;
  out[o + 12] = mx - C;
  out[o + 13] = z - h / 2;
  out[o + 14] = C - my;
  out[o + 15] = 1;
}

/* ----------------------------------------------------------------- parts */

const featColor = FEAT.map((f) => new THREE.Color(f.color));

function PartMesh({
  index,
  tp,
  geo,
}: {
  index: number;
  tp: Toolpath;
  geo: THREE.BufferGeometry;
}) {
  const o = job.objs[index];
  const built = useMemo(() => {
    const n = tp.nExt;
    const full = new Float32Array(n * 16);
    const feat = new Float32Array(n * 3);
    const fil = new Float32Array(n * 3).fill(1);
    let k = 0;
    for (let i = 0; i < tp.n; i++) {
      if (tp.f[i] === F.TRAVEL) continue;
      const dx = tp.x1[i] - tp.x0[i];
      const dy = tp.y1[i] - tp.y0[i];
      bead(
        full,
        k * 16,
        tp.x0[i],
        tp.y0[i],
        dx,
        dy,
        Math.hypot(dx, dy),
        tp.z[i],
        tp.w[i],
        tp.h[i]
      );
      const col = featColor[tp.f[i]];
      feat[k * 3] = col.r;
      feat[k * 3 + 1] = col.g;
      feat[k * 3 + 2] = col.b;
      k++;
    }
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.62,
      metalness: 0,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    mesh.instanceMatrix.array.set(full);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(fil.slice(), 3);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // ghost: outer walls of every third layer, the way a slicer previews the rest of the part
    const gp: number[] = [];
    for (let i = 0; i < tp.n; i++) {
      if (tp.f[i] !== F.OUTER) continue;
      const l = tp.lay[i];
      if (l % 3 !== 0 && l !== tp.layers - 1) continue;
      const y = tp.z[i] - tp.h[i] / 2;
      gp.push(tp.x0[i] - C, y, C - tp.y0[i], tp.x1[i] - C, y, C - tp.y1[i]);
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    const ghost = new THREE.LineSegments(
      gg,
      new THREE.LineBasicMaterial({
        color: '#9aa3b2',
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      })
    );
    ghost.frustumCulled = false;
    return { mesh, ghost, full, feat, fil, mat };
  }, [tp, geo]);

  useEffect(
    () => () => {
      built.mat.dispose();
      built.ghost.geometry.dispose();
      (built.ghost.material as THREE.Material).dispose();
      built.mesh.dispose();
    },
    [built]
  );

  const st = useRef({ partial: -1, mode: '' as string, ver: -1 });

  useFrame(() => {
    const { mesh, ghost, full, feat, fil, mat } = built;
    const s = st.current;
    const im = mesh.instanceMatrix;
    const arr = im.array as Float32Array;

    // which instances are on the bed
    let count = 0;
    let partial = -1;
    let pf = 1;
    if (o.done) count = tp.nExt;
    else if (job.live === index && job.phase === 'printing') {
      const m = job.move;
      count = tp.ext[m];
      if (tp.f[m] !== F.TRAVEL) {
        partial = count;
        pf = job.moveF;
        count++;
      }
    } else if (o.t > 0) count = tp.ext[locate(tp, o.t)[0]];
    if (job.scrub !== null && job.active === index) {
      const l = Math.min(job.scrub, tp.layers - 1);
      const end = tp.layerStart[l + 1];
      const lim = end >= tp.n ? tp.nExt : tp.ext[end];
      if (lim < count) {
        count = lim;
        partial = -1;
      }
    }

    if (s.partial !== partial) {
      if (s.partial >= 0) {
        arr.set(
          full.subarray(s.partial * 16, s.partial * 16 + 16),
          s.partial * 16
        );
        im.addUpdateRange(s.partial * 16, 16);
        im.needsUpdate = true;
      }
      s.partial = partial;
    }
    if (partial >= 0) {
      const m = job.move;
      const dx = tp.x1[m] - tp.x0[m];
      const dy = tp.y1[m] - tp.y0[m];
      bead(
        arr,
        partial * 16,
        tp.x0[m],
        tp.y0[m],
        dx,
        dy,
        Math.hypot(dx, dy) * pf,
        tp.z[m],
        tp.w[m],
        tp.h[m]
      );
      im.addUpdateRange(partial * 16, 16);
      im.needsUpdate = true;
    }
    mesh.count = count;
    ghost.visible = !o.done;

    if (s.mode !== job.mode || s.ver !== o.ver) {
      s.mode = job.mode;
      s.ver = o.ver;
      // filament per stretch of extrusions: a mid-part M600 leaves a stripe
      const segs = o.segs.length ? o.segs : [{ from: 0, fil: job.filament }];
      for (let k = 0; k < segs.length; k++) {
        const c = FIL[segs[k].fil];
        const end = Math.min(
          tp.nExt,
          k + 1 < segs.length ? segs[k + 1].from : tp.nExt
        );
        for (let j = Math.max(0, segs[k].from); j < end; j++) {
          fil[j * 3] = c.r;
          fil[j * 3 + 1] = c.g;
          fil[j * 3 + 2] = c.b;
        }
      }
      const ic = mesh.instanceColor!;
      (ic.array as Float32Array).set(job.mode === 'preview' ? feat : fil);
      ic.needsUpdate = true;
      mat.color.copy(WHITE);
      mat.roughness = job.mode === 'preview' ? 0.8 : 0.62;
    }
  });

  return (
    <>
      <primitive object={built.mesh} />
      <primitive object={built.ghost} />
    </>
  );
}

function Parts() {
  const geo = useMemo(beadGeometry, []);
  const [, setV] = useState(0);
  useEffect(() => job.onSliced(() => setV((v) => v + 1)), []);
  return (
    <>
      {job.objs.map((o, i) =>
        o.tp ? <PartMesh key={o.meta.id} index={i} tp={o.tp} geo={geo} /> : null
      )}
    </>
  );
}

/* --------------------------------------------------------------- machine */

const M = {
  black: new THREE.MeshStandardMaterial({
    color: '#16171a',
    roughness: 0.55,
    metalness: 0.4,
  }),
  frame: new THREE.MeshStandardMaterial({
    color: '#202226',
    roughness: 0.5,
    metalness: 0.55,
  }),
  alu: new THREE.MeshStandardMaterial({
    color: '#9a9ea6',
    roughness: 0.4,
    metalness: 0.75,
  }),
  rail: new THREE.MeshStandardMaterial({
    color: '#c9ccd2',
    roughness: 0.25,
    metalness: 0.9,
  }),
  brass: new THREE.MeshStandardMaterial({
    color: '#c99a3c',
    roughness: 0.3,
    metalness: 1,
  }),
  sock: new THREE.MeshStandardMaterial({
    color: '#b5301d',
    roughness: 0.85,
    metalness: 0,
  }),
  sink: new THREE.MeshStandardMaterial({
    color: '#8d9198',
    roughness: 0.35,
    metalness: 0.85,
  }),
  belt: new THREE.MeshStandardMaterial({
    color: '#0f0f10',
    roughness: 0.9,
    metalness: 0,
  }),
};

function peiTexture() {
  const n = 256;
  const d = new Uint8Array(n * n * 4);
  let s = 1234567;
  for (let i = 0; i < n * n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const v = 120 + ((s >> 8) % 90);
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    d[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(d, n, n);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  t.needsUpdate = true;
  return t;
}

function Bed() {
  const pei = useMemo(() => {
    const tex = peiTexture();
    return new THREE.MeshStandardMaterial({
      color: '#2a2724',
      roughness: 0.92,
      metalness: 0.15,
      bumpMap: tex,
      bumpScale: 0.6,
    });
  }, []);
  return (
    <group>
      <mesh material={pei} position={[0, -0.3, 0]} receiveShadow>
        <boxGeometry args={[250, 0.6, 250]} />
      </mesh>
      {/* sheet tab */}
      <mesh material={pei} position={[0, -0.3, 131]}>
        <boxGeometry args={[40, 0.6, 12]} />
      </mesh>
      <mesh material={M.alu} position={[0, -5, 0]}>
        <boxGeometry args={[262, 8.6, 262]} />
      </mesh>
      <mesh material={M.black} position={[0, -14, 0]}>
        <boxGeometry args={[240, 8, 240]} />
      </mesh>
    </group>
  );
}

function Frame() {
  // back half only: the camera sits where the front of the frame would be
  const posts: [number, number][] = [
    [-200, -170],
    [200, -170],
  ];
  return (
    <group>
      {posts.map(([x, z]) => (
        <mesh key={`${x}${z}`} material={M.frame} position={[x, -170, z]}>
          <boxGeometry args={[20, 600, 20]} />
        </mesh>
      ))}
      {[-170].map((z) => (
        <mesh key={`tx${z}`} material={M.frame} position={[0, 120, z]}>
          <boxGeometry args={[420, 20, 20]} />
        </mesh>
      ))}
      {[-200, 200].map((x) => (
        <group key={`y${x}`}>
          <mesh material={M.frame} position={[x, 120, 0]}>
            <boxGeometry args={[20, 20, 320]} />
          </mesh>
          <mesh material={M.rail} position={[x * 0.94, 112, 0]}>
            <boxGeometry args={[12, 8, 320]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const EYE = {
  white: new THREE.MeshBasicMaterial({ color: '#f4efe4' }),
  pupil: new THREE.MeshBasicMaterial({ color: '#111214' }),
};

/** the buddy: two eyes and a grin on the silicone sock */
function Face() {
  const eyes = useRef<THREE.Group>(null);
  const pupils = useRef<THREE.Group>(null);
  useFrame(() => {
    const b = job.buddy;
    if (eyes.current) eyes.current.scale.y = 1 - 0.9 * b.blink;
    if (pupils.current)
      pupils.current.position.set(b.look.x * 0.75, b.look.y * 0.6, 0);
  });
  return (
    <group position={[0, 12.4, 5.56]}>
      <group ref={eyes}>
        {[-3.7, 3.7].map((x) => (
          <mesh
            key={x}
            material={EYE.white}
            position={[x, 0, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[2.25, 2.25, 0.3, 24]} />
          </mesh>
        ))}
        <group ref={pupils}>
          {[-3.7, 3.7].map((x) => (
            <mesh
              key={x}
              material={EYE.pupil}
              position={[x, -0.15, 0.2]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[1.1, 1.1, 0.3, 18]} />
            </mesh>
          ))}
        </group>
      </group>
      <mesh
        material={EYE.pupil}
        position={[0, -2.6, 0.05]}
        rotation={[0, 0, Math.PI]}
      >
        <torusGeometry args={[1.5, 0.3, 6, 18, Math.PI]} />
      </mesh>
    </group>
  );
}

function Head({ glow }: { glow: RefObject<THREE.PointLight | null> }) {
  // a compact hotend hung low on a long mount, so the part stays in view
  const fins = [24, 26.6, 29.2, 31.8, 34.4, 37, 39.6];
  return (
    <group>
      <mesh material={M.brass} position={[0, 2.25, 0]}>
        <cylinderGeometry args={[3.2, 0.45, 4.5, 20]} />
      </mesh>
      <mesh material={M.brass} position={[0, 5.6, 0]}>
        <cylinderGeometry args={[4.4, 4.4, 2.4, 6]} />
      </mesh>
      <mesh material={M.sock} position={[0, 11.5, -1]}>
        <boxGeometry args={[16, 9, 13]} />
      </mesh>
      <Face />
      <mesh material={M.alu} position={[0, 19, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 6, 12]} />
      </mesh>
      {fins.map((y) => (
        <mesh key={y} material={M.sink} position={[0, y, 0]}>
          <cylinderGeometry args={[8.5, 8.5, 1, 28]} />
        </mesh>
      ))}
      <mesh material={M.sink} position={[0, 32, 0]}>
        <cylinderGeometry args={[4.5, 4.5, 18, 16]} />
      </mesh>
      {/* part-cooling duct ring */}
      <mesh
        material={M.black}
        position={[0, 4.5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[11, 1.6, 8, 32]} />
      </mesh>
      {/* mount plate up to the carriage */}
      <mesh material={M.black} position={[0, 72, -12]}>
        <boxGeometry args={[22, 64, 4]} />
      </mesh>
      <mesh material={M.black} position={[0, 112, -6]}>
        <boxGeometry args={[52, 22, 36]} />
      </mesh>
      <pointLight
        ref={glow}
        color="#ff7a3a"
        intensity={0}
        distance={40}
        decay={2}
        position={[0, 5, 6]}
      />
    </group>
  );
}

function Gantry() {
  const head = useRef<THREE.Group>(null);
  const hot = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Group>(null);
  const beltL = useRef<THREE.Group>(null);
  const beltR = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);
  useEffect(() => {
    head.current?.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
  }, []);
  useFrame((state) => {
    const hx = job.head.x - C;
    const hz = C - job.head.y;
    if (head.current) {
      head.current.position.set(hx, 0, hz);
      head.current.visible = job.mode === 'printed';
    }
    // idle wave: the hot end sways on its mount
    if (hot.current) {
      const w = job.buddy.wave;
      hot.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 10) * 0.16 * w;
      hot.current.position.y = w * 3;
    }
    if (beam.current) beam.current.position.z = hz;
    const span = 188;
    if (beltL.current) {
      const l = Math.max(1, hx - 29 + span);
      beltL.current.scale.x = l;
      beltL.current.position.x = -span + l / 2;
    }
    if (beltR.current) {
      const l = Math.max(1, span - (hx + 29));
      beltR.current.scale.x = l;
      beltR.current.position.x = hx + 29 + l / 2;
    }
    if (glow.current) glow.current.intensity = job.nozzle > 150 ? 60 : 0;
  });
  return (
    <group>
      <group ref={beam}>
        <mesh material={M.frame} position={[0, 112, -34]}>
          <boxGeometry args={[400, 20, 20]} />
        </mesh>
        <mesh material={M.rail} position={[0, 112, -23]}>
          <boxGeometry args={[380, 12, 4]} />
        </mesh>
        {/* two belts, two planes: that is Core XY */}
        <group ref={beltL} position={[0, 124, -30]}>
          <mesh material={M.belt}>
            <boxGeometry args={[1, 6, 1.4]} />
          </mesh>
        </group>
        <group ref={beltR} position={[0, 131, -30]}>
          <mesh material={M.belt}>
            <boxGeometry args={[1, 6, 1.4]} />
          </mesh>
        </group>
      </group>
      <group
        ref={head}
        onClick={(e) => {
          e.stopPropagation();
          bus.poke?.();
        }}
        onPointerOver={() => bus.hover?.(true)}
        onPointerOut={() => bus.hover?.(false)}
      >
        <group ref={hot}>
          <Head glow={glow} />
        </group>
      </group>
    </group>
  );
}

function BedStage() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.position.y = -job.head.z;
  });
  return (
    <group ref={g}>
      <Bed />
      <Parts />
    </group>
  );
}

/* ------------------------------------------------------------------ rig */

const keyLight: { current: THREE.DirectionalLight | null } = { current: null };

function Rig() {
  const { camera, size, invalidate } = useThree();
  const st = useRef({
    tx: 0,
    ty: 0,
    tz: 0,
    d: 560,
    az: 0.5,
    el: 0.62,
    cx: 0,
    cy: 0,
    init: false,
    px: 0,
    py: 0,
  });
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!mq.matches) return;
    const mv = (e: PointerEvent) => {
      st.current.px = (e.clientX / window.innerWidth) * 2 - 1;
      st.current.py = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    window.addEventListener('pointermove', mv, { passive: true });
    return () => window.removeEventListener('pointermove', mv);
  }, [invalidate]);

  useFrame((state, dt) => {
    const s = st.current;
    const pc = camera as THREE.PerspectiveCamera;
    const W = size.width;
    const H = size.height;
    const fr = job.frame;
    const wide = job.wide;
    const i = job.focus;
    const sh = job.objs[i]?.shape;
    const t = Math.tan((pc.fov * Math.PI) / 360);
    let tx = 0;
    let ty = -job.head.z;
    let tz = 0;
    let R = 170;
    let rpx = Math.min(W, H) * 0.5;
    let cx = W / 2;
    let cy = H / 2;
    let el = 0.7;
    let az = 0.4;
    if (fr.ok) {
      cx = fr.cx;
      cy = fr.cy;
      rpx = Math.max(140, fr.r * 1.25);
    }
    if (!wide && sh) {
      tx = sh.ox + sh.w / 2 - C;
      tz = C - (sh.oy + sh.d / 2);
      ty = -job.head.z + sh.h * 0.35;
      // small parts get some room, so the hot end doesn't fill the frame
      R =
        Math.max(30, 0.5 * Math.hypot(sh.w, sh.d, sh.h * 0.8)) *
        (i === BONUS ? 1.5 : 1);
      if (fr.ok) rpx = fr.r;
      const v = VIEW[i] ?? VIEW[0];
      el = v.el;
      az =
        v.az +
        (job.phase === 'printing' && !job.reduced
          ? Math.sin(state.clock.elapsedTime * 0.08) * 0.05
          : 0);
    }
    const d = (R * H) / (2 * t * Math.max(60, rpx));
    az += s.px * 0.12;
    el += s.py * 0.05;
    const k = job.reduced || !s.init ? 1 : 1 - Math.exp(-dt * 2.4);
    s.init = true;
    const before = s.tx + s.ty + s.tz + s.d + s.az + s.el + s.cx + s.cy;
    s.tx += (tx - s.tx) * k;
    s.ty += (ty - s.ty) * k;
    s.tz += (tz - s.tz) * k;
    s.d += (d - s.d) * k;
    s.az += (az - s.az) * k;
    s.el += (el - s.el) * k;
    s.cx += (cx - s.cx) * k;
    s.cy += (cy - s.cy) * k;
    const after = s.tx + s.ty + s.tz + s.d + s.az + s.el + s.cx + s.cy;
    pc.position.set(
      s.tx + Math.sin(s.az) * Math.cos(s.el) * s.d,
      s.ty + Math.sin(s.el) * s.d,
      s.tz + Math.cos(s.az) * Math.cos(s.el) * s.d
    );
    pc.lookAt(s.tx, s.ty, s.tz);
    // put the subject where the overlay left room for it
    pc.setViewOffset(W, H, W / 2 - s.cx, H / 2 - s.cy, W, H);
    pc.updateMatrixWorld();
    const L = keyLight.current;
    if (L) {
      L.position.set(s.tx - 190, s.ty + 170, s.tz + 120);
      L.target.position.set(s.tx, s.ty, s.tz);
      L.target.updateMatrixWorld();
      const half = wide
        ? 180
        : Math.max(40, (sh ? Math.hypot(sh.w, sh.d) : 60) * 0.9);
      const cam = L.shadow.camera;
      if (cam.right !== half) {
        cam.left = -half;
        cam.right = half;
        cam.top = half;
        cam.bottom = -half;
        cam.updateProjectionMatrix();
      }
    }
    bus.project?.(pc, W, H);
    if (
      Math.abs(after - before) > 1e-3 ||
      (!wide && sh && !job.reduced && job.phase === 'printing')
    )
      invalidate();
  });
  return null;
}

function Env() {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.22;
    job.invalidate = invalidate;
    invalidate();
    return () => {
      env.dispose();
      pm.dispose();
      job.invalidate = () => {};
    };
  }, [gl, scene, invalidate]);
  return null;
}

export default function Printer3D() {
  const [mobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 900px)').matches
  );
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={mobile ? [1, 1.5] : [1, 2]}
      camera={{ fov: 26, near: 2, far: 3000, position: [200, 300, 400] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ touchAction: 'pan-y' }}
      aria-hidden="true"
    >
      <Env />
      <hemisphereLight args={['#e3e6ee', '#2b2622', 0.45]} />
      <directionalLight
        ref={(l) => {
          keyLight.current = l;
        }}
        position={[-160, 320, 260]}
        intensity={2.4}
        color="#fff4e6"
        castShadow
        shadow-mapSize={[mobile ? 1024 : 2048, mobile ? 1024 : 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.25}
        shadow-camera-near={1}
        shadow-camera-far={900}
      />
      <directionalLight
        position={[220, 140, -220]}
        intensity={0.9}
        color="#b9c8ff"
      />
      <Frame />
      <BedStage />
      <Gantry />
      <Rig />
    </Canvas>
  );
}
