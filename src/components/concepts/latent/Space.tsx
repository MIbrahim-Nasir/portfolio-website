'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { T_RERANK, T_RETRIEVE, type Bridge } from './bridge';
import { CLUSTERS, FACTS, CLUSTER_INDEX } from './corpus';
import {
  buildCloud,
  CLUSTER_RGB,
  clusterCentroid,
  drift,
  driftAmp,
  driftSpeed,
  FACT_POS,
  FACT_SEED,
  type V3,
} from './layout';

const MAX_LINES = 8;
const SEG = 28;
const LIME = new THREE.Color('#d6ff5c');

const DRIFT_GLSL = /* glsl */ `
  vec3 drift(vec3 s, float ph, float amp) {
    return amp * vec3(
      sin(ph * (0.6 + 0.8 * s.x) + s.x * 6.2831),
      sin(ph * (0.6 + 0.8 * s.y) + s.y * 6.2831 + 1.7),
      sin(ph * (0.6 + 0.8 * s.z) + s.z * 6.2831 + 3.4)
    );
  }
`;

function pointsMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPhase: { value: 0 },
      uAmp: { value: 0.05 },
      uScale: { value: 400 },
      uWild: { value: 0 },
      uTime: { value: 0 },
      uHi: { value: new Float32Array(64) },
      uCl: { value: new Float32Array(8).fill(0.85) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 color;
      attribute vec3 aSeed;
      attribute float aSize;
      attribute float aKind;
      attribute float aFact;
      attribute float aCluster;
      uniform float uPhase, uAmp, uScale, uWild, uTime;
      uniform float uHi[64];
      uniform float uCl[8];
      varying vec3 vCol;
      varying float vA;
      varying float vKind;
      varying float vHi;
      ${DRIFT_GLSL}
      void main() {
        float hi = aFact > -0.5 ? uHi[int(aFact + 0.5)] : 0.0;
        float cl = aCluster > -0.5 ? uCl[int(aCluster + 0.5)] : 0.6;
        float amp = uAmp * (aKind < 0.5 ? 1.6 : 1.0);
        vec3 p = position + drift(aSeed, uPhase, amp);
        // heat: at high temperature tokens boil off their facts
        p += uWild * 0.9 * vec3(sin(uTime * 3.1 + aSeed.y * 40.0), cos(uTime * 2.7 + aSeed.z * 40.0), sin(uTime * 2.3 + aSeed.x * 40.0)) * (aKind > 1.5 ? 0.25 : 1.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float base = aKind > 1.5 ? 0.2 : 0.15;
        float s = aSize * base * (1.0 + hi * (aKind > 1.5 ? 0.7 : 0.9));
        gl_PointSize = clamp(s * uScale / max(-mv.z, 0.1), 1.0, 72.0);
        vec3 c = mix(color, vec3(1.0), clamp(hi, 0.0, 1.0) * 0.28);
        c = mix(c, vec3(1.0, 0.42, 0.33), clamp(uWild, 0.0, 1.0) * 0.55 * aSeed.x);
        vCol = c;
        float a = aKind > 1.5 ? 0.62 + 0.5 * hi : (aKind > 0.5 ? 0.34 + 0.75 * hi : 0.2);
        vA = a * cl;
        vKind = aKind;
        vHi = hi;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vCol;
      varying float vA;
      varying float vKind;
      varying float vHi;
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float d = length(uv);
        if (d > 1.0) discard;
        float a = exp(-d * d * 5.0);
        if (vKind > 1.5) {
          float ring = smoothstep(0.1, 0.0, abs(d - 0.74)) * (0.3 + 0.7 * clamp(vHi, 0.0, 1.0));
          a = max(exp(-d * d * 16.0), ring);
        }
        a *= vA;
        // additive: colour * alpha once (not squared), so small far points still read
        gl_FragColor = vec4(vCol, min(a, 1.0));
      }
    `,
  });
}

function haloMaterial(color: V3) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOp: { value: 0.05 },
      uCol: { value: new THREE.Color(...color) },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv; uniform float uOp; uniform vec3 uCol;
      void main(){ vec2 p = vUv * 2.0 - 1.0; float d = dot(p, p); float a = exp(-d * 3.4) * (1.0 - smoothstep(0.85, 1.0, d)) * uOp; gl_FragColor = vec4(uCol * a, a); }
    `,
  });
}

function linesMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uProg: { value: new Float32Array(MAX_LINES) },
      uStr: { value: new Float32Array(MAX_LINES) },
      uPulse: { value: new Float32Array(MAX_LINES).fill(-1) },
      uCol: {
        value: Array.from({ length: MAX_LINES }, () => new THREE.Color()),
      },
      uLime: { value: LIME.clone() },
    },
    vertexShader: /* glsl */ `
      attribute float aT;
      attribute float aLine;
      uniform float uProg[${MAX_LINES}];
      uniform float uStr[${MAX_LINES}];
      uniform float uPulse[${MAX_LINES}];
      uniform vec3 uCol[${MAX_LINES}];
      varying float vT, vProg, vStr, vPulse;
      varying vec3 vCol;
      void main() {
        int i = int(aLine + 0.5);
        vT = aT; vProg = uProg[i]; vStr = uStr[i]; vPulse = uPulse[i]; vCol = uCol[i];
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLime;
      varying float vT, vProg, vStr, vPulse;
      varying vec3 vCol;
      void main() {
        if (vT > vProg || vStr < 0.01) discard;
        float a = vStr * (0.32 + 0.5 * vT);
        float glow = 0.0;
        if (vPulse >= 0.0) { float x = (vT - vPulse) * 10.0; glow = exp(-x * x); }
        vec3 c = mix(uLime, vCol, vT * 0.85);
        a += glow * 1.4;
        gl_FragColor = vec4(c * a, a);
      }
    `,
  });
}

function queryMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 400 },
      uOp: { value: 0 },
      uCol: { value: LIME.clone() },
    },
    vertexShader: /* glsl */ `
      uniform float uScale;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(0.95 * uScale / max(-mv.z, 0.1), 8.0, 120.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uOp; uniform vec3 uCol;
      void main(){
        vec2 uv = gl_PointCoord * 2.0 - 1.0; float d = length(uv); if (d > 1.0) discard;
        float core = exp(-d * d * 40.0);
        float r = fract(uTime * 0.6);
        float ring = smoothstep(0.05, 0.0, abs(d - (0.25 + r * 0.7))) * (1.0 - r);
        float ring2 = smoothstep(0.04, 0.0, abs(d - 0.32)) * 0.8;
        float a = (core + ring * 0.7 + ring2) * uOp;
        gl_FragColor = vec4(uCol * a, a);
      }
    `,
  });
}

type CamState = {
  yaw: number;
  pitch: number;
  dist: number;
  target: THREE.Vector3;
};

const CENTROIDS = CLUSTERS.map(
  (c) => new THREE.Vector3(...clusterCentroid(c.id))
);
const angleLerp = (a: number, b: number, t: number) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

function World({ bridge }: { bridge: Bridge }) {
  const { camera, size, gl } = useThree();
  const mobile = bridge.mobile;

  const cloud = useMemo(() => buildCloud(mobile), [mobile]);
  const pts = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(cloud.position, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cloud.color, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(cloud.seed, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(cloud.size, 1));
    g.setAttribute('aKind', new THREE.BufferAttribute(cloud.kind, 1));
    g.setAttribute('aFact', new THREE.BufferAttribute(cloud.fact, 1));
    g.setAttribute('aCluster', new THREE.BufferAttribute(cloud.cluster, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    const m = pointsMaterial();
    const p = new THREE.Points(g, m);
    p.frustumCulled = false;
    return p;
  }, [cloud]);

  const halos = useMemo(() => {
    const grp = new THREE.Group();
    const geo = new THREE.PlaneGeometry(1, 1);
    CLUSTERS.forEach((c, i) => {
      const mesh = new THREE.Mesh(geo, haloMaterial(CLUSTER_RGB[i]));
      mesh.position.copy(CENTROIDS[i]);
      const s = c.id === 'ai' ? 8.6 : c.id === 'robotics' ? 7.4 : 6.4;
      mesh.scale.setScalar(s);
      mesh.renderOrder = -1;
      grp.add(mesh);
    });
    return grp;
  }, []);

  const lines = useMemo(() => {
    const n = MAX_LINES * SEG * 2;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const aT = new Float32Array(n);
    const aLine = new Float32Array(n);
    for (let l = 0; l < MAX_LINES; l++)
      for (let s = 0; s < SEG; s++) {
        const o = (l * SEG + s) * 2;
        aT[o] = s / SEG;
        aT[o + 1] = (s + 1) / SEG;
        aLine[o] = aLine[o + 1] = l;
      }
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)
    );
    g.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
    g.setAttribute('aLine', new THREE.BufferAttribute(aLine, 1));
    const ls = new THREE.LineSegments(g, linesMaterial());
    ls.frustumCulled = false;
    return ls;
  }, []);

  const query = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(3), 3)
    );
    const p = new THREE.Points(g, queryMaterial());
    p.frustumCulled = false;
    return p;
  }, []);

  const grid = useMemo(() => {
    const grp = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({
      color: '#9aa79c',
      transparent: true,
      opacity: 0.075,
      depthWrite: false,
    });
    for (const r of [5.5, 9.5, 13.5]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      grp.add(
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)
      );
    }
    const ticks: THREE.Vector3[] = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r0 = i % 6 === 0 ? 4.4 : 12.8;
      ticks.push(
        new THREE.Vector3(Math.cos(a) * r0, 0, Math.sin(a) * r0),
        new THREE.Vector3(Math.cos(a) * 14, 0, Math.sin(a) * 14)
      );
    }
    grp.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(ticks),
        mat
      )
    );
    grp.position.y = -6.2;
    return grp;
  }, []);

  useEffect(
    () => () => {
      pts.geometry.dispose();
      (pts.material as THREE.Material).dispose();
    },
    [pts]
  );

  const st = useRef({
    phase: 0,
    time: 0,
    T: 0.7,
    hi: new Float32Array(64),
    cl: new Float32Array(8).fill(0.85),
    q: new THREE.Vector3(),
    qOp: 0,
    cam: {
      yaw: 0.35,
      pitch: 0.22,
      dist: 15,
      target: new THREE.Vector3(),
    } as CamState,
    view: [0, 0, 0, 0],
    fp: FACT_POS.map(() => new THREE.Vector3()),
    tmp: [0, 0, 0] as V3,
    hiT: new Float32Array(64),
    op: new Float32Array(FACTS.length),
    dy: new Float32Array(FACTS.length),
    wc: new Float32Array(FACTS.length),
    side: new Uint8Array(FACTS.length),
    tx: new Float32Array(FACTS.length),
    order: FACTS.map((_, i) => i),
    frame: 0,
    avoid: [] as number[],
    first: true,
  });

  useFrame((state, rawDt) => {
    const s = st.current;
    const dt = Math.min(rawDt, 0.05);
    const reduced = bridge.reduced;
    const cam = camera as THREE.PerspectiveCamera;
    const W = size.width;
    const H = size.height;
    const snap = reduced || s.first;
    const k = (rate: number) => (snap ? 1 : 1 - Math.exp(-rate * dt));

    s.time += reduced ? 0 : dt;
    s.T += (bridge.temp - s.T) * k(2.5);
    const amp = reduced ? 0.0 : driftAmp(s.T);
    if (!reduced) s.phase += dt * driftSpeed(s.T);
    const wild = Math.max(0, Math.min(1, (s.T - 1.1) / 0.9));

    // run clock
    const run = bridge.run;
    const el = run ? (reduced ? 1e9 : performance.now() - run.t0) : 0;

    // highlight targets
    s.hiT.fill(0);
    if (run) {
      for (const h of run.hits) {
        const start = T_RETRIEVE + h.rank * 70;
        let v = 0;
        if (el > start)
          v =
            el < T_RERANK && !run.system
              ? 0.3 + 0.7 * (h.score / (run.top || 1))
              : h.kept
                ? 1
                : 0.1;
        s.hiT[h.fact] = v;
      }
    }
    if (bridge.streamFact >= 0)
      s.hiT[bridge.streamFact] = Math.max(s.hiT[bridge.streamFact], 1.45);
    if (bridge.hover >= 0)
      s.hiT[bridge.hover] = Math.max(s.hiT[bridge.hover], 1.3);
    for (let i = 0; i < 64; i++) s.hi[i] += (s.hiT[i] - s.hi[i]) * k(7);

    for (let c = 0; c < CLUSTERS.length; c++) {
      const target =
        bridge.focus < 0
          ? 0.85
          : bridge.focus === c
            ? 1.05
            : run?.system
              ? 0.62
              : 0.34;
      s.cl[c] += (target - s.cl[c]) * k(3);
    }

    // fact positions this frame (same drift as the shader)
    for (let i = 0; i < FACTS.length; i++) {
      drift(FACT_SEED[i], s.phase, amp, s.tmp);
      s.fp[i].set(
        FACT_POS[i][0] + s.tmp[0],
        FACT_POS[i][1] + s.tmp[1],
        FACT_POS[i][2] + s.tmp[2]
      );
    }

    // camera
    const focus = bridge.focus;
    const tgt =
      focus >= 0
        ? CENTROIDS[focus]
        : CENTROIDS[CLUSTER_INDEX.identity].clone().multiplyScalar(0.3);
    let baseYaw = 0.35;
    if (focus >= 0) {
      const c = CENTROIDS[focus];
      baseYaw = Math.hypot(c.x, c.z) < 0.6 ? 0.0 : Math.atan2(c.x, c.z) * 0.55;
    }
    const wide = focus < 0;
    const dist = wide
      ? mobile
        ? 23
        : 18
      : run?.system
        ? mobile
          ? 14
          : 11
        : mobile
          ? 14
          : 10.5;
    s.cam.yaw = angleLerp(
      s.cam.yaw,
      baseYaw + bridge.yaw + (reduced ? 0 : Math.sin(s.time * 0.05) * 0.18),
      k(1.6)
    );
    s.cam.pitch +=
      (0.2 +
        bridge.pitch +
        (focus >= 0 ? CENTROIDS[focus].y * 0.05 : 0) -
        s.cam.pitch) *
      k(1.6);
    s.cam.dist += (dist - s.cam.dist) * k(1.4);
    s.cam.target.lerp(tgt, k(1.8));
    const cp = Math.cos(s.cam.pitch);
    cam.position.set(
      s.cam.target.x + s.cam.dist * Math.sin(s.cam.yaw) * cp,
      s.cam.target.y + s.cam.dist * Math.sin(s.cam.pitch),
      s.cam.target.z + s.cam.dist * Math.cos(s.cam.yaw) * cp
    );
    cam.lookAt(s.cam.target);

    // put the subject where the overlay leaves room
    let cx = W / 2,
      cy = H / 2;
    if (mobile) {
      const top = bridge.sheet?.getBoundingClientRect().top ?? H * 0.6;
      cy = Math.max(120, (top + 52) / 2);
    } else if (W >= 1024) {
      cx = W * 0.545;
      cy = H * 0.47;
    }
    const ox = Math.round(W / 2 - cx),
      oy = Math.round(H / 2 - cy);
    if (
      s.view[0] !== ox ||
      s.view[1] !== oy ||
      s.view[2] !== W ||
      s.view[3] !== H
    ) {
      cam.setViewOffset(W, H, ox, oy, W, H);
      cam.updateProjectionMatrix();
      s.view = [ox, oy, W, H];
    }
    cam.updateMatrixWorld();

    const dpr = gl.getPixelRatio();
    const scale =
      ((H * dpr * 0.5) / Math.tan((cam.fov * Math.PI) / 360)) *
      (mobile ? 1.35 : 1);
    const pm = pts.material as THREE.ShaderMaterial;
    pm.uniforms.uPhase.value = s.phase;
    pm.uniforms.uAmp.value = amp;
    pm.uniforms.uScale.value = scale;
    pm.uniforms.uWild.value = wild;
    pm.uniforms.uTime.value = s.time;
    pm.uniforms.uHi.value = s.hi;
    pm.uniforms.uCl.value = s.cl;

    halos.children.forEach((m, i) => {
      m.quaternion.copy(cam.quaternion);
      const mat = (m as THREE.Mesh).material as THREE.ShaderMaterial;
      const on = focus === i ? 0.2 : focus < 0 ? 0.085 : 0.03;
      mat.uniforms.uOp.value +=
        (on + wild * 0.1 - mat.uniforms.uOp.value) * k(2.5);
      (m as THREE.Mesh).scale.setScalar(
        (i === 1 ? 8.6 : i === 2 ? 7.4 : 6.4) * (1 + wild * 0.6)
      );
    });

    // query point
    const qm = query.material as THREE.ShaderMaterial;
    qm.uniforms.uTime.value = s.time;
    qm.uniforms.uScale.value = scale * 0.2;
    if (run) {
      let wsum = 0;
      const qt = new THREE.Vector3();
      for (const h of run.hits) {
        if (!h.kept) continue;
        qt.addScaledVector(s.fp[h.fact], h.score);
        wsum += h.score;
      }
      if (wsum > 0) qt.multiplyScalar(1 / wsum);
      else qt.copy(tgt);
      // sit a little in front of the cluster, toward the camera
      const toCam = cam.position.clone().sub(qt).normalize();
      qt.addScaledVector(toCam, 1.1).add(new THREE.Vector3(0, 0.35, 0));
      if (el < 650) {
        const t = Math.min(1, el / 650);
        const e = 1 - Math.pow(1 - t, 3);
        const from = cam.position
          .clone()
          .add(new THREE.Vector3(0, -2.2, 0))
          .addScaledVector(toCam, -2.5);
        s.q.copy(from).lerp(qt, e);
      } else s.q.lerp(qt, k(4));
      s.qOp += (1 - s.qOp) * k(6);
    } else s.qOp += (0 - s.qOp) * k(6);
    qm.uniforms.uOp.value = s.qOp;
    (query.geometry.attributes.position as THREE.BufferAttribute).setXYZ(
      0,
      s.q.x,
      s.q.y,
      s.q.z
    );
    query.geometry.attributes.position.needsUpdate = true;

    // attention lines: query -> each candidate
    const lm = lines.material as THREE.ShaderMaterial;
    const prog = lm.uniforms.uProg.value as Float32Array;
    const str = lm.uniforms.uStr.value as Float32Array;
    const pulse = lm.uniforms.uPulse.value as Float32Array;
    const cols = lm.uniforms.uCol.value as THREE.Color[];
    const pos = lines.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let l = 0; l < MAX_LINES; l++) {
      const h = run?.hits[l];
      if (!run || !h) {
        str[l] += (0 - str[l]) * k(8);
        continue;
      }
      const start = T_RETRIEVE + h.rank * 70;
      prog[l] = Math.max(0, Math.min(1.001, (el - start) / 420));
      const want =
        el < T_RERANK && !run.system
          ? 0.25 + 0.6 * (h.score / (run.top || 1))
          : h.kept
            ? 0.95
            : 0.07;
      str[l] += (want - str[l]) * k(6);
      pulse[l] =
        h.fact === bridge.streamFact && !reduced
          ? 1 - ((s.time * 0.85) % 1)
          : -1;
      const ci = CLUSTER_INDEX[FACTS[h.fact].cluster];
      cols[l].setRGB(...CLUSTER_RGB[ci]);
      const a = s.q,
        b = s.fp[h.fact];
      const mx = (a.x + b.x) / 2,
        my = (a.y + b.y) / 2 + a.distanceTo(b) * 0.18,
        mz = (a.z + b.z) / 2;
      for (let sg = 0; sg < SEG; sg++) {
        for (let e = 0; e < 2; e++) {
          const t = (sg + e) / SEG;
          const u = 1 - t;
          const o = ((l * SEG + sg) * 2 + e) * 3;
          arr[o] = u * u * a.x + 2 * u * t * mx + t * t * b.x;
          arr[o + 1] = u * u * a.y + 2 * u * t * my + t * t * b.y;
          arr[o + 2] = u * u * a.z + 2 * u * t * mz + t * t * b.z;
        }
      }
    }
    pos.needsUpdate = true;

    // project facts for the DOM overlay
    const v = new THREE.Vector3();
    const scr = bridge.screen;
    const op = s.op;
    for (let i = 0; i < FACTS.length; i++) {
      v.copy(s.fp[i]).project(cam);
      const vis = v.z < 1 && v.z > -1 ? 1 : 0;
      scr[i * 3] = (v.x * 0.5 + 0.5) * W;
      scr[i * 3 + 1] = (-v.y * 0.5 + 0.5) * H;
      scr[i * 3 + 2] = vis;
      const ci = CLUSTER_INDEX[FACTS[i].cluster];
      let o = Math.min(1, s.hi[i]);
      if (!mobile && focus === ci && o < 0.5) o = Math.max(o, 0.5);
      if (mobile && o < 0.6) o = 0;
      op[i] = o * vis;
    }
    // declutter: lit labels first, then the rest; nudge up/down, else hide
    s.frame++;
    const order = s.order;
    order.sort((a, b) => s.hi[b] - s.hi[a] || a - b);
    if (s.frame % 20 === 1 || s.avoid.length === 0) {
      s.avoid = [];
      document.querySelectorAll('[data-avoid]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0)
          s.avoid.push(r.left, r.top, r.right, r.bottom);
      });
    }
    const placed: number[] = [...s.avoid];
    for (const i of order) {
      const lab = bridge.factLabels[i];
      if (!lab || op[i] < 0.02) continue;
      if (!s.wc[i] || s.frame % 45 === i % 45)
        s.wc[i] =
          (lab.firstElementChild as HTMLElement | null)?.offsetWidth ?? 120;
      const px = scr[i * 3];
      const fitR = px + 9 + s.wc[i] <= W - 8;
      const fitL = px - 9 - s.wc[i] >= 8;
      const flip = !fitR && fitL;
      s.side[i] = flip ? 1 : 0;
      s.tx[i] = fitR || fitL ? px : Math.max(-1, W - 17 - s.wc[i]);
      const x0 = flip ? px - 9 - s.wc[i] : s.tx[i] + 9,
        x1 = x0 + s.wc[i],
        y = scr[i * 3 + 1];
      let ok = false;
      for (const dy of [0, -20, 20, -40, 40]) {
        const y0 = y + dy - 10,
          y1 = y + dy + 10;
        let hit = false;
        for (let p = 0; p < placed.length; p += 4)
          if (
            x0 < placed[p + 2] &&
            x1 > placed[p] &&
            y0 < placed[p + 3] &&
            y1 > placed[p + 1]
          ) {
            hit = true;
            break;
          }
        if (!hit) {
          placed.push(x0, y0, x1, y1);
          s.dy[i] += (dy - s.dy[i]) * (snap ? 1 : 0.25);
          ok = true;
          break;
        }
      }
      if (!ok) op[i] = s.hi[i] > 0.6 ? op[i] : 0;
      else if (s.hi[i] <= 0.6) op[i] = Math.min(op[i], 0.42);
    }
    for (let i = 0; i < FACTS.length; i++) {
      const lab = bridge.factLabels[i];
      if (!lab) continue;
      const o = op[i];
      const prev = lab.dataset.o;
      const os = o.toFixed(2);
      if (o > 0.01 || prev !== os) {
        lab.style.transform = `translate3d(${s.tx[i].toFixed(1)}px, ${(scr[i * 3 + 1] + s.dy[i]).toFixed(1)}px, 0)`;
        if (prev !== os) {
          lab.style.opacity = os;
          lab.dataset.o = os;
        }
        lab.dataset.lit = s.hi[i] > 0.6 ? '1' : '0';
        const side = s.side[i] ? 'l' : 'r';
        if (lab.dataset.side !== side) lab.dataset.side = side;
      }
    }
    const cPlaced: number[] = [...s.avoid];
    const cOrder = CLUSTERS.map((_, i) => i).sort(
      (a, b) => (b === focus ? 1 : 0) - (a === focus ? 1 : 0)
    );
    const topEdge = mobile ? 108 : 78;
    for (const i of cOrder) {
      const lab = bridge.clusterLabels[i];
      if (!lab) continue;
      v.copy(CENTROIDS[i])
        .add(new THREE.Vector3(0, i === 0 ? -2.5 : 2.4, 0))
        .project(cam);
      const x = (v.x * 0.5 + 0.5) * W;
      let y = (-v.y * 0.5 + 0.5) * H;
      let o =
        (v.z < 1 ? 1 : 0) *
        (focus < 0 ? 0.9 : focus === i ? 1 : mobile ? 0 : 0.4);
      if (o > 0 && i === focus) {
        // the title card must stay visible: lift it clear of the panels
        const hw = CLUSTERS[i].name.length * 6.5 + 14;
        for (const dy of [0, -50, -100, -150, -200]) {
          const yy = y + dy;
          let hit = false;
          for (let p = 0; p < cPlaced.length && !hit; p += 4)
            if (
              x - hw < cPlaced[p + 2] &&
              x + hw > cPlaced[p] &&
              yy - 15 < cPlaced[p + 3] &&
              yy + 15 > cPlaced[p + 1]
            )
              hit = true;
          if (!hit) {
            y = yy;
            break;
          }
        }
        cPlaced.push(x - hw, y - 15, x + hw, y + 15);
      } else if (o > 0) {
        const hw = CLUSTERS[i].name.length * 6.5 + 14;
        let ok = false;
        for (const dy of [0, 30, -30]) {
          const yy = y + dy;
          let hit = yy < topEdge;
          for (let p = 0; p < cPlaced.length && !hit; p += 4)
            if (
              x - hw < cPlaced[p + 2] &&
              x + hw > cPlaced[p] &&
              yy - 15 < cPlaced[p + 3] &&
              yy + 15 > cPlaced[p + 1]
            )
              hit = true;
          if (!hit) {
            y = yy;
            ok = true;
            break;
          }
        }
        if (!ok) o = 0;
        else cPlaced.push(x - hw, y - 15, x + hw, y + 15);
      }
      lab.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      lab.style.opacity = String(o);
    }
    if (bridge.queryLabel) {
      v.copy(s.q).project(cam);
      bridge.queryLabel.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * H).toFixed(1)}px, 0)`;
      bridge.queryLabel.style.opacity = String(s.qOp * (v.z < 1 ? 1 : 0));
    }

    // leader lines: answer claim -> its source vector
    const sheetTop = mobile
      ? (bridge.sheet?.getBoundingClientRect().top ?? H)
      : 0;
    for (let i = 0; i < bridge.leaders.length; i++) {
      const path = bridge.leaders[i];
      if (!path) continue;
      const an = bridge.anchors[i];
      if (!an || !an.el || an.fact < 0 || !scr[an.fact * 3 + 2]) {
        path.style.opacity = '0';
        continue;
      }
      const r = an.el.getBoundingClientRect();
      if (r.width === 0) {
        path.style.opacity = '0';
        continue;
      }
      const ex = scr[an.fact * 3],
        ey = scr[an.fact * 3 + 1];
      let d: string;
      if (mobile) {
        const sx = r.left + r.width / 2,
          sy = sheetTop;
        d = `M${sx.toFixed(1)} ${sy.toFixed(1)} C${sx.toFixed(1)} ${(sy - (sy - ey) * 0.5).toFixed(1)} ${ex.toFixed(1)} ${(ey + (sy - ey) * 0.5).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      } else {
        const sx = r.right + 8,
          sy = r.top + r.height / 2;
        const mx = sx + (ex - sx) * 0.5;
        d = `M${sx.toFixed(1)} ${sy.toFixed(1)} C${mx.toFixed(1)} ${sy.toFixed(1)} ${mx.toFixed(1)} ${ey.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      }
      path.setAttribute('d', d);
      const hot = bridge.streamFact === an.fact || bridge.hover === an.fact;
      path.style.opacity =
        an.el.dataset.shown === '1' ? (hot ? '0.95' : '0.42') : '0';
    }

    // the background glow follows the attention
    if (bridge.root) {
      const fi = focus >= 0 ? focus : 0;
      v.copy(focus >= 0 ? CENTROIDS[fi] : new THREE.Vector3()).project(cam);
      bridge.root.style.setProperty(
        '--gx',
        `${((v.x * 0.5 + 0.5) * 100).toFixed(1)}%`
      );
      bridge.root.style.setProperty(
        '--gy',
        `${((-v.y * 0.5 + 0.5) * 100).toFixed(1)}%`
      );
    }

    s.first = false;
  });

  return (
    <>
      <primitive object={grid} />
      <primitive object={halos} />
      <primitive object={pts} />
      <primitive object={lines} />
      <primitive object={query} />
    </>
  );
}

export default function Space({ bridge }: { bridge: Bridge }) {
  return (
    <Canvas
      dpr={bridge.mobile ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: 40, near: 0.1, far: 90, position: [0, 3, 16] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'none' }}
    >
      <World bridge={bridge} />
    </Canvas>
  );
}
