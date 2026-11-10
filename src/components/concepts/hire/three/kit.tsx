'use client';

// Shared 3D kit for the Hire concept: one clay material family, a shared environment map,
// a camera rig that fits its content to whatever box the DOM gives it, and a little spring.

import { PerspectiveCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const COL = {
  clay: '#ece7db',
  clay2: '#d6cfbf',
  graphite: '#4a4842',
  ink: '#191815',
  bench: '#cfc7b5',
  amber: '#e8b04a',
};

/** Pointer + page state shared by DOM listeners (Stage) and every scene. */
export const live = {
  x: -9999,
  y: -9999,
  t: -1e9, // last pointer move, performance.now()
  label: '', // data-aim of whatever is under the pointer
  grab: false, // pointer is over a [data-grab] element
  picks: 0, // bench clicks, each one runs the pick routine
  reduced: false,
};

/* ───────── etching ─────────
   Every lit surface is redrawn as a blue-ink engraving on the page's paper: the shaded colour's
   luminance picks how thick the hatch lines are, darker tones add a cross hatch and then a third
   pass. Bare paper is transparent, so the cream page itself is the paper. Emissive light turns the
   ink amber, which keeps the "live" parts (lens, cube, pulses) in the one accent colour. */

// The etch writes its colour after three's colour-space step, so these hold raw sRGB values.
const raw = (hex: string) =>
  new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
export const INK = {
  blue: raw('#1e3a8a'),
  deep: raw('#0f1b3d'),
  amber: raw('#cc9532'),
  glow: raw('#e8b04a'),
};

/** CSS px → device px, set once per frame by every Rig */
export const etchU = { uDpr: { value: 1 } };

const HATCH = /* glsl */ `
uniform float uDpr;
uniform vec3 uInk;
uniform vec3 uGlowInk;
float etchLine(vec2 p, float ang, float spacing, float w) {
  vec2 d = vec2(cos(ang), sin(ang));
  float t = dot(p, d) / spacing;
  t += 0.18 * sin(dot(p, vec2(-d.y, d.x)) * 0.045); // a slight hand-cut waver
  float f = abs(fract(t) - 0.5) * 2.0;             // 0 on the line's centre, 1 between lines
  float aa = fwidth(t) * 1.5;
  return (1.0 - smoothstep(w - aa, w + aa, f)) * smoothstep(0.0, aa, w);
}
float etchCover(float lum, vec2 px) {
  float c = etchLine(px, 0.55, 5.0, clamp((1.02 - lum) / 0.9, 0.0, 1.0) * 0.55);
  c = max(c, etchLine(px, -0.55, 5.0, clamp((0.5 - lum) / 0.5, 0.0, 1.0) * 0.5));
  c = max(c, etchLine(px, 1.5708, 3.5, clamp((0.2 - lum) / 0.2, 0.0, 1.0) * 0.6));
  return c;
}
`;

/** Patch a standard material so it renders as an engraving. */
function etch<M extends THREE.MeshStandardMaterial>(
  m: M,
  ink: THREE.Color = INK.blue
): M {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDpr = etchU.uDpr;
    sh.uniforms.uInk = { value: ink };
    sh.uniforms.uGlowInk = { value: INK.glow };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${HATCH}`)
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        {
          float glow = clamp(max(totalEmissiveRadiance.r, max(totalEmissiveRadiance.g, totalEmissiveRadiance.b)) * 1.1, 0.0, 1.0);
          float lum = dot(clamp(gl_FragColor.rgb, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
          float cover = etchCover(lum, gl_FragCoord.xy / uDpr);
          cover = max(cover, smoothstep(0.35, 0.9, glow) * 0.92);
          vec3 inkCol = mix(uInk, uGlowInk, smoothstep(0.15, 0.6, glow));
          gl_FragColor = vec4(inkCol * cover, cover);
        }`
      );
  };
  m.customProgramCacheKey = () => `etch-${ink.getHexString()}`;
  return m;
}

export const mat = {
  clay: etch(
    new THREE.MeshStandardMaterial({
      color: COL.clay,
      roughness: 0.55,
      metalness: 0,
    })
  ),
  clay2: etch(
    new THREE.MeshStandardMaterial({
      color: COL.clay2,
      roughness: 0.6,
      metalness: 0,
    })
  ),
  graphite: etch(
    new THREE.MeshStandardMaterial({
      color: COL.graphite,
      roughness: 0.45,
      metalness: 0.25,
    })
  ),
  ink: etch(
    new THREE.MeshStandardMaterial({
      color: COL.ink,
      roughness: 0.25,
      metalness: 0.4,
    })
  ),
  bench: etch(
    new THREE.MeshStandardMaterial({
      color: COL.bench,
      roughness: 0.8,
      metalness: 0,
    })
  ),
  amber: etch(
    new THREE.MeshStandardMaterial({
      color: COL.amber,
      roughness: 0.35,
      metalness: 0.1,
      emissive: COL.amber,
      emissiveIntensity: 0.12,
    }),
    INK.amber
  ),
  hot: etch(
    new THREE.MeshStandardMaterial({
      color: COL.amber,
      roughness: 0.3,
      emissive: COL.amber,
      emissiveIntensity: 0.9,
    }),
    INK.amber
  ),
};

/** A per instance copy, for parts whose glow animates on their own. */
export const glowMat = (base = COL.clay) =>
  etch(
    new THREE.MeshStandardMaterial({
      color: base,
      roughness: 0.5,
      emissive: COL.amber,
      emissiveIntensity: 0,
    })
  );

export const etchMat = (m: THREE.MeshStandardMaterial, ink?: THREE.Color) =>
  etch(m, ink);

/** Inverted hull: the back faces pushed out along their normals by a constant number of screen
 *  pixels, drawn in deep ink. One material per Rig, because the px → world scale depends on the
 *  height of the View it draws into. */
function hullMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { uPx: { value: 0.002 }, uCol: { value: INK.deep } },
    vertexShader: /* glsl */ `
      uniform float uPx;
      void main() {
        vec4 v = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        v.xyz += n * uPx * -v.z;
        gl_Position = projectionMatrix * v;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCol;
      void main() { gl_FragColor = vec4(uCol, 1.0); }`,
  });
}

/** Give every plain mesh under `root` an outline once. Cheap enough to run every few frames,
 *  which also catches meshes that mount later. */
function addHulls(root: THREE.Object3D, hull: THREE.ShaderMaterial) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (
      !m.isMesh ||
      (m as THREE.InstancedMesh).isInstancedMesh ||
      m.userData.hull ||
      m.userData.noHull
    )
      return;
    const mt = m.material as THREE.Material;
    if (!mt || mt.transparent || (mt as THREE.ShaderMaterial).isShaderMaterial)
      return;
    m.userData.hull = true;
    const h = new THREE.Mesh(m.geometry, hull);
    h.userData.noHull = true;
    h.raycast = () => {};
    m.add(h);
  });
}

let envTex: THREE.Texture | null = null;
function Env() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    if (!envTex) {
      const pm = new THREE.PMREMGenerator(gl);
      envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      pm.dispose();
    }
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;
  }, [gl, scene]);
  return null;
}

/** Critically-ish damped spring. Slight overshoot reads as weight, not wobble. */
export class Spring {
  c: number;
  v = 0;
  constructor(c = 0) {
    this.c = c;
  }
  step(target: number, dt: number, k = 90, d = 14) {
    const a = (target - this.c) * k - this.v * d;
    this.v += a * dt;
    this.c += this.v * dt;
    return this.c;
  }
}

export const clock = (state: { clock: THREE.Clock }) =>
  live.reduced ? 2.6 : state.clock.elapsedTime;

type RigProps = {
  wrap: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  /** direction from the look target to the camera */
  dir?: [number, number, number];
  look?: [number, number, number];
  fov?: number;
  /** world width and height that must stay in frame */
  fit?: [number, number];
  /** how far the model turns toward the pointer, radians */
  parallax?: number;
  /** pop in when the slot first scrolls into view */
  pop?: boolean;
};

/** Camera, light and a group that fits, pops in and leans toward the pointer. */
export function Rig({
  wrap,
  children,
  dir = [0, 0.4, 1],
  look = [0, 0, 0],
  fov = 28,
  fit = [4, 3],
  parallax = 0.22,
  pop = true,
}: RigProps) {
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const grp = useRef<THREE.Group>(null);
  const v = useMemo(
    () => ({
      dir: new THREE.Vector3(...dir).normalize(),
      look: new THREE.Vector3(...look),
      seen: false,
      s: new Spring(pop ? 0.55 : 1),
      ry: new Spring(),
      rx: new Spring(),
      hull: hullMaterial(),
      tick: 0,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((state, rawDt) => {
    const el = wrap.current;
    const c = cam.current;
    const g = grp.current;
    if (!el || !c || !g) return;
    const dt = Math.min(rawDt, 1 / 30);
    const r = el.getBoundingClientRect();
    etchU.uDpr.value = state.gl.getPixelRatio();
    // outline width in CSS px, a touch heavier on the big hero bench
    const linePx = r.height > 400 ? 1.6 : 1.25;
    v.hull.uniforms.uPx.value =
      (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * linePx) /
      Math.max(1, r.height);
    if (v.tick++ % 30 === 0) addHulls(g, v.hull);
    const aspect = r.width / Math.max(1, r.height);
    const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const dist = Math.max(fit[1] / 2 / t, fit[0] / 2 / (t * aspect)) * 1.06;
    c.position.copy(v.dir).multiplyScalar(dist).add(v.look);
    c.lookAt(v.look);

    // pop in with the card that holds it (its scroll reveal sets data-in), or on first sight
    if (!v.seen) {
      const host = el.closest<HTMLElement>('[data-rv]');
      v.seen = host
        ? host.dataset.in === 'true'
        : r.top < window.innerHeight * 0.92 && r.bottom > 0;
    }
    const sc = v.s.step(v.seen ? 1 : 0.55, dt, 70, 11);
    g.scale.setScalar(live.reduced ? 1 : sc);

    if (parallax && !live.reduced) {
      const px = (live.x - (r.left + r.width / 2)) / window.innerWidth;
      const py = (live.y - (r.top + r.height / 2)) / window.innerHeight;
      const on = performance.now() - live.t < 4000;
      g.rotation.y = v.ry.step(
        on ? THREE.MathUtils.clamp(px, -1, 1) * parallax : 0,
        dt,
        20,
        8
      );
      g.rotation.x = v.rx.step(
        on ? THREE.MathUtils.clamp(py, -1, 1) * parallax * 0.4 : 0,
        dt,
        20,
        8
      );
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault ref={cam} fov={fov} near={0.1} far={200} />
      <Env />
      <hemisphereLight args={['#fff6e5', '#1a1814', 0.9]} />
      <directionalLight position={[4, 7, 5]} intensity={1.8} color="#fff3dc" />
      <directionalLight
        position={[-6, 2, -4]}
        intensity={0.6}
        color="#9fb4ff"
      />
      <group ref={grp}>{children}</group>
    </>
  );
}

let blob: THREE.CanvasTexture | null = null;
/** Soft contact blob under an object. Cheap, and it grounds things on a dark page. */
export function Shadow({
  w = 2,
  d = 2,
  y = 0.005,
  opacity = 0.5,
}: {
  w?: number;
  d?: number;
  y?: number;
  opacity?: number;
}) {
  const tex = useMemo(() => {
    if (blob) return blob;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const ctx = cv.getContext('2d')!;
    const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,1)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);
    blob = new THREE.CanvasTexture(cv);
    return blob;
  }, []);
  // the contact shadow is engraved too: its darkness drives the same hatch as the solids
  const m = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        uniforms: {
          map: { value: tex },
          uOpacity: { value: opacity },
          uDpr: etchU.uDpr,
          uInk: { value: INK.blue },
          uGlowInk: { value: INK.glow },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          ${HATCH}
          uniform sampler2D map;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            float a = texture2D(map, vUv).a * uOpacity;
            float cover = etchCover(1.0 - a * 0.9, gl_FragCoord.xy / uDpr);
            gl_FragColor = vec4(uInk * cover, cover);
          }`,
      }),
    [tex, opacity]
  );
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position-y={y}
      renderOrder={-1}
      material={m}
    >
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}
