'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { emit, film } from './store';
import {
  dustFragment,
  dustVertex,
  particleFragment,
  particleVertex,
  skyFragment,
  skyVertex,
} from './particleShader';
import {
  GLOBE_FACE,
  armShape,
  cities,
  globeShape,
  graphNodes,
  graphShape,
  llToXYZ,
  mulberry,
  nameShape,
  pergolaShape,
  photoShape,
  portalShape,
  stackShape,
} from './shapes';
import { LABELS } from './labelAnchors';

// palette, sampled from the Ducon renders: basalt night, sand, ember sunset, lantern, trace mint
const C = {
  sand: '#efe3cf',
  dune: '#b89a76',
  ember: '#ff6b2c',
  lantern: '#ffb65c',
  clay: '#c4562a',
  mint: '#7fe6cf',
  sky: '#8fb7ff',
};

// per-shape look: [colA, colB, glow, size, alpha]
const LOOK: [string, string, string, number, number][] = [
  [C.sand, C.lantern, C.ember, 1.12, 1.0], // name
  [C.dune, C.sky, C.lantern, 0.85, 0.8], // globe
  [C.sand, C.clay, C.mint, 0.95, 0.85], // arm
  [C.dune, C.sand, C.ember, 0.9, 0.85], // stack
  ['#000', '#000', C.ember, 1.75, 0.78], // photo (uses its own colors)
  [C.lantern, C.ember, C.lantern, 0.95, 0.85], // pergola
  [C.sand, C.mint, C.mint, 0.95, 0.85], // graph
  [C.clay, C.ember, C.lantern, 0.85, 0.5], // portal
];

// where each shape sits: desktop text lives on the left, shapes on the right
const LAYOUT_DESK = [
  { x: 0, y: 0.4, s: 1 },
  { x: 2.05, y: 0.25, s: 0.88 },
  { x: 2.0, y: 0.45, s: 0.76 },
  { x: 1.95, y: 0.25, s: 0.84 },
  { x: 1.85, y: 0.3, s: 0.86 },
  { x: 1.85, y: 0.2, s: 0.86 },
  { x: 1.6, y: 0.25, s: 0.8 },
  { x: 0, y: 0.1, s: 1.45 },
];
const LAYOUT_MOB = [
  { x: 0, y: 0.75, s: 0.36 },
  { x: 0, y: 2.0, s: 0.43 },
  { x: 0.15, y: 2.1, s: 0.4 },
  { x: 0, y: 1.8, s: 0.48 },
  { x: 0, y: 1.85, s: 0.5 },
  { x: 0, y: 1.8, s: 0.47 },
  { x: 0, y: 1.85, s: 0.44 },
  { x: 0, y: 0.2, s: 0.6 },
];

const smooth = (t: number) => t * t * (3 - 2 * t);

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((res) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

function srgbToLinear(arr: Float32Array) {
  for (let i = 0; i < arr.length; i++) arr[i] = Math.pow(arr[i], 2.2);
  return arr;
}

function rotations(t: number, mx: number) {
  return [
    mx * 0.18, // name
    GLOBE_FACE + Math.sin(t * 0.12) * 0.45 + mx * 0.35, // globe
    Math.sin(t * 0.32) * 0.65 + mx * 0.4, // arm
    Math.sin(t * 0.2) * 0.3 + mx * 0.45, // stack
    mx * 0.12, // photo
    Math.sin(t * 0.22) * 0.38 + mx * 0.5, // pergola
    mx * 0.22 + Math.sin(t * 0.15) * 0.06, // graph
    t * 0.12 + mx * 0.3, // portal
  ];
}

function Particles({ count }: { count: number }) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const group = useRef<THREE.Group>(null);
  const graphLabels = useRef<THREE.Group>(null);
  const globeLabels = useRef<THREE.Group>(null);
  const cur = useRef(0);
  const firstFrame = useRef(false);
  const { camera, gl } = useThree();
  const ray = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uIntro: { value: 0 },
      uChaos: { value: 0.9 },
      uSize: { value: film.mobile ? 2.6 : 2.2 },
      uPixelRatio: { value: 1 },
      uRot: { value: new Array(8).fill(0) },
      uSizeK: { value: LOOK.map((l) => l[3]) },
      uAlphaK: { value: LOOK.map((l) => l[4]) },
      uColA: { value: LOOK.map((l) => new THREE.Color(l[0])) },
      uColB: { value: LOOK.map((l) => new THREE.Color(l[1])) },
      uGlowCol: { value: LOOK.map((l) => new THREE.Color(l[2])) },
      uMouse: { value: new THREE.Vector3(99, 99, 0) },
      uMouseK: { value: 0 },
      uShockPos: { value: new THREE.Vector3() },
      uShockT: { value: -10 },
    }),
    []
  );
  // created imperatively so the material holds these exact uniform objects
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  );
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    let dead = false;
    (async () => {
      const family =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--font-wordmark')
          .trim() || 'system-ui, sans-serif';
      try {
        await document.fonts.load(`900 120px ${family}`);
      } catch {}
      film.stage = 1;
      emit();
      const img = await loadImage('/images/work-ducon.jpg');
      film.stage = 2;
      emit();
      if (dead) return;
      const n = count;
      const name = nameShape(n, 'IBRAHIM', family);
      const photo = photoShape(n, img);
      const pergola = pergolaShape(n);
      const gr = graphShape(n);
      const st = stackShape(n);
      const arm = armShape(n);
      const globe = globeShape(n);
      const portal = portalShape(n);
      const g = new THREE.BufferGeometry();
      // film order: who → robotics → foundations → SAIF (photo, render) → graph → contact
      const shapes = [name, globe, arm, st, photo.cloud, pergola, gr, portal];
      shapes.forEach((s, i) =>
        g.setAttribute(`aS${i}`, new THREE.BufferAttribute(s.pos, 3))
      );
      g.setAttribute('position', new THREE.BufferAttribute(name.pos, 3));
      g.setAttribute(
        'aPhoto',
        new THREE.BufferAttribute(srgbToLinear(photo.color), 3)
      );
      const glow = new Float32Array(n * 4);
      const rand = new Float32Array(n * 4);
      const r = mulberry(7);
      for (let i = 0; i < n; i++) {
        glow[i * 4] = gr.glow[i];
        glow[i * 4 + 1] = st.glow[i];
        glow[i * 4 + 2] = globe.glow[i];
        glow[i * 4 + 3] = arm.glow[i];
        rand[i * 4] = r();
        rand[i * 4 + 1] = r();
        rand[i * 4 + 2] = r();
        rand[i * 4 + 3] = r();
      }
      g.setAttribute('aGlow', new THREE.BufferAttribute(glow, 4));
      g.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
      setGeo(g);
    })();
    return () => {
      dead = true;
    };
  }, [count]);

  useEffect(() => () => geo?.dispose(), [geo]);

  useFrame((state, dt) => {
    if (!geo) return;
    if (!firstFrame.current) {
      firstFrame.current = true;
      if (process.env.NODE_ENV !== 'production')
        Object.assign(window, { __three: { gl, geo, uniforms, group } });
      film.stage = 3;
      emit();
    }
    const t = state.clock.elapsedTime;
    const u = uniforms;
    const k = film.reduced ? 1 : Math.min(1, dt * 3.2);
    cur.current += (film.shape - cur.current) * k;
    const p = cur.current;
    u.uTime.value = t;
    u.uProgress.value = p;
    u.uIntro.value = film.intro;
    u.uPixelRatio.value = gl.getPixelRatio();
    u.uChaos.value = film.reduced
      ? 0
      : 0.85 + Math.min(1.2, Math.abs(film.velocity) * 0.02);
    const rot = rotations(film.reduced ? 0 : t, film.mx);
    for (let i = 0; i < 8; i++) u.uRot.value[i] = rot[i];

    // pointer on the z=0 plane
    ray
      .set(film.mx, film.my, 0.5)
      .unproject(camera)
      .sub(camera.position)
      .normalize();
    const d = -camera.position.z / ray.z;
    const mx = camera.position.x + ray.x * d;
    const my = camera.position.y + ray.y * d;
    u.uMouse.value.set(mx, my, 0);
    const targetK = film.pointer && !film.reduced ? 1 : 0;
    u.uMouseK.value += (targetK - u.uMouseK.value) * Math.min(1, dt * 4);
    if (film.shock > 0) {
      u.uShockT.value = t;
      u.uShockPos.value.set(mx, my, 0);
      film.shock = -1;
    }

    // layout blend
    const L = film.mobile ? LAYOUT_MOB : LAYOUT_DESK;
    const i0 = Math.min(7, Math.floor(p));
    const i1 = Math.min(7, i0 + 1);
    const f = smooth(Math.min(1, Math.max(0, p - i0)));
    const g = group.current!;
    g.position.x = L[i0].x + (L[i1].x - L[i0].x) * f;
    g.position.y = L[i0].y + (L[i1].y - L[i0].y) * f;
    const s = L[i0].s + (L[i1].s - L[i0].s) * f;
    g.scale.setScalar(s);
    g.rotation.x = film.reduced ? 0 : -film.my * 0.06;

    // labels follow the same rotation as their shape
    const wGraph = Math.max(0, 1 - Math.abs(p - 6) * 2.2);
    const wGlobe = Math.max(0, 1 - Math.abs(p - 1) * 2.2);
    if (graphLabels.current) graphLabels.current.rotation.y = rot[6];
    if (globeLabels.current) globeLabels.current.rotation.y = rot[1];
    g.updateMatrixWorld();
    const W = state.size.width,
      H = state.size.height;
    LABELS.forEach((l, i) => {
      const el = film.labels[i];
      if (!el) return;
      const parent =
        l.kind === 'graph' ? graphLabels.current : globeLabels.current;
      if (!parent) return;
      tmp.set(l.p[0], l.p[1], l.p[2]).applyMatrix4(parent.matrixWorld);
      let w = l.kind === 'graph' ? wGraph : wGlobe;
      if (l.kind === 'city') {
        // fade cities that turn to the back of the globe
        const zz = -l.p[0] * Math.sin(rot[1]) + l.p[2] * Math.cos(rot[1]);
        w *= Math.max(0, Math.min(1, zz * 2));
      }
      tmp.project(camera);
      el.style.transform = `translate3d(${((tmp.x + 1) / 2) * W}px, ${((1 - tmp.y) / 2) * H}px, 0) translate(-50%, -50%)`;
      el.style.opacity = String(w * film.intro);
    });
  });

  return (
    <group ref={group}>
      {geo && (
        <points geometry={geo} material={material} frustumCulled={false} />
      )}
      <group ref={graphLabels} />
      <group ref={globeLabels} />
    </group>
  );
}

// per-shape atmosphere: [top, bottom, glow], dark values (linear-ish) so text stays readable
const SKY: [string, string, string][] = [
  ['#060509', '#0e0907', '#1f0d05'], // name
  ['#04050c', '#080a18', '#0e1638'], // globe: indigo
  ['#080607', '#120a08', '#24110a'], // arm
  ['#07060a', '#0e0a08', '#1a1109'], // stack
  ['#07060a', '#170b06', '#2a1206'], // photo: dusk
  ['#07060a', '#170b06', '#2e1406'], // pergola: dusk
  ['#03070a', '#05100d', '#082a22'], // graph: teal night
  ['#090505', '#160805', '#2e0f05'], // portal
];

function Sky() {
  const cur = useRef(0);
  const cols = useMemo(
    () =>
      SKY.map(
        (c) =>
          c.map((h) => new THREE.Color(h)) as [
            THREE.Color,
            THREE.Color,
            THREE.Color,
          ]
      ),
    []
  );
  const { material, geo } = useMemo(() => {
    const u = {
      uTop: { value: new THREE.Color() },
      uBottom: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uGlowPos: { value: new THREE.Vector2(0.5, 0.5) },
      uAspect: { value: 1 },
      uTime: { value: 0 },
    };
    const m = new THREE.ShaderMaterial({
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      uniforms: u,
      depthTest: false,
      depthWrite: false,
    });
    return { material: m, geo: new THREE.PlaneGeometry(1, 1) };
  }, []);
  useFrame((state, dt) => {
    cur.current += (film.shape - cur.current) * Math.min(1, dt * 2.4);
    const p = cur.current;
    const i0 = Math.min(7, Math.floor(p));
    const i1 = Math.min(7, i0 + 1);
    const f = smooth(Math.min(1, Math.max(0, p - i0)));
    const u = material.uniforms;
    u.uTop.value.copy(cols[i0][0]).lerp(cols[i1][0], f);
    u.uBottom.value.copy(cols[i0][1]).lerp(cols[i1][1], f);
    u.uGlow.value.copy(cols[i0][2]).lerp(cols[i1][2], f);
    const L = film.mobile ? LAYOUT_MOB : LAYOUT_DESK;
    const gx = L[i0].x + (L[i1].x - L[i0].x) * f;
    const gy = L[i0].y + (L[i1].y - L[i0].y) * f;
    // world -> uv on the z=0 plane (visible height 6.3 units at the camera distance)
    const aspect = state.size.width / state.size.height;
    u.uGlowPos.value.set(0.5 + gx / (6.3 * aspect), 0.5 + gy / 6.3);
    u.uAspect.value = aspect;
    u.uTime.value = state.clock.elapsedTime % 100;
  });
  useEffect(
    () => () => {
      material.dispose();
      geo.dispose();
    },
    [material, geo]
  );
  return (
    <mesh
      geometry={geo}
      material={material}
      frustumCulled={false}
      renderOrder={-10}
    />
  );
}

function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geo, uniforms, material } = useMemo(() => {
    const r = mulberry(3);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * 40;
      pos[i * 3 + 1] = (r() - 0.5) * 24;
      pos[i * 3 + 2] = -4 - r() * 22;
      seed[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const u = {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uColor: { value: new THREE.Color('#d9b48a') },
    };
    const m = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo: g, uniforms: u, material: m };
  }, [count]);
  useFrame((s) => {
    uniforms.uTime.value = s.clock.elapsedTime;
    uniforms.uPixelRatio.value = s.gl.getPixelRatio();
    if (ref.current) {
      ref.current.rotation.y = film.progress * 0.6;
      ref.current.position.y = film.progress * 3;
    }
  });
  return <points ref={ref} geometry={geo} material={material} />;
}

function Rig() {
  useFrame((s, dt) => {
    const c = s.camera;
    const k = Math.min(1, dt * 2.5);
    const tx = film.reduced ? 0 : film.mx * 0.35;
    const ty = film.reduced ? 0 : film.my * 0.22;
    c.position.x += (tx - c.position.x) * k;
    c.position.y += (ty - c.position.y) * k;
    c.lookAt(0, 0, 0);
  });
  return null;
}

function Post() {
  const ca = useRef<{ offset: THREE.Vector2 } | null>(null);
  const off = useMemo(() => new THREE.Vector2(0.0004, 0.0004), []);
  useFrame(() => {
    if (!ca.current) return;
    // fringe spikes while the particles are mid-cut
    const f = film.shape - Math.floor(film.shape);
    const v =
      Math.sin(f * Math.PI) * 0.0022 +
      Math.min(0.002, Math.abs(film.velocity) * 0.00004);
    ca.current.offset.set(0.0003 + v, 0.0003 + v * 0.6);
  });
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.95}
        luminanceThreshold={0.16}
        luminanceSmoothing={0.35}
        mipmapBlur
        radius={0.72}
      />
      <ChromaticAberration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ca as any}
        offset={off}
        radialModulation={false}
        modulationOffset={0}
      />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.12} />
      <Vignette offset={0.28} darkness={0.78} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

export default function Scene() {
  const mobile = film.mobile;
  return (
    <Canvas
      className="!fixed inset-0"
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      camera={{ position: [0, 0, 10], fov: 35, near: 0.1, far: 80 }}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
      }}
      onCreated={({ gl }) => gl.setClearColor('#0a0807')}
    >
      <Sky />
      <Particles count={mobile ? 16384 : 32768} />
      <Dust count={mobile ? 500 : 1400} />
      <Rig />
      <Post />
    </Canvas>
  );
}
