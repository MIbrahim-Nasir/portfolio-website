'use client';

// Small clay scenes, one per claim. Each one acts out the fact printed beside it.

import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';
import { COL, Rig, Shadow, Spring, clock, glowMat, live, mat } from './kit';

type P = { wrap: RefObject<HTMLDivElement | null> };
const ease = (x: number) => 1 - Math.pow(1 - THREE.MathUtils.clamp(x, 0, 1), 3);

/* ───────── SAIF agent graph: photo → planner → RAG → render ⇄ evaluate → out ───────── */
const NODES = [-3, -1.8, -0.6, 0.6, 1.8, 3];
// pulse path: node indices, with one regenerate loop from evaluate back to render
const PATH = [0, 1, 2, 3, 4, 3, 4, 5];
export function Graph({ wrap }: P) {
  const mats = useMemo(
    () => NODES.map((_, i) => glowMat(i === 4 ? COL.graphite : COL.clay)),
    []
  );
  const pulse = useRef<THREE.Mesh>(null);
  const boxes = useRef<(THREE.Mesh | null)[]>([]);
  const arc = useMemo(() => {
    const g = new THREE.TorusGeometry(0.6, 0.035, 8, 48, Math.PI);
    return g;
  }, []);
  useFrame((state) => {
    const T = clock(state);
    const seg = PATH.length - 1;
    const u = ((T * 1.4) % (seg + 1.2)) / 1; // a beat of rest at the end
    const i = Math.min(Math.floor(u), seg - 1);
    const f = ease(Math.min(u - i, 1));
    const a = PATH[i];
    const b = PATH[Math.min(i + 1, seg)];
    const back = b < a; // the regenerate hop rides over the arc
    const x = THREE.MathUtils.lerp(NODES[a], NODES[b], f);
    const y = back ? Math.sin(f * Math.PI) * 0.6 + 0.0 : 0;
    if (pulse.current) {
      pulse.current.position.set(
        back ? NODES[a] - 0.6 + 0.6 * Math.cos(f * Math.PI) : x,
        back ? Math.sin(f * Math.PI) * 0.6 : y,
        0
      );
      pulse.current.visible = u < seg + 0.2;
    }
    NODES.forEach((nx, k) => {
      const near = pulse.current
        ? Math.max(0, 1 - Math.abs(pulse.current.position.x - nx) / 0.5)
        : 0;
      mats[k].emissiveIntensity = THREE.MathUtils.lerp(
        mats[k].emissiveIntensity,
        near * 0.9,
        0.2
      );
      const m = boxes.current[k];
      if (m) m.position.y = near * 0.12;
    });
  });
  return (
    <Rig
      wrap={wrap}
      dir={[0, 0.55, 1]}
      look={[0, 0.1, 0]}
      fov={24}
      fit={[7.0, 2.0]}
    >
      {NODES.map((x, i) =>
        i < NODES.length - 1 ? (
          <mesh
            key={`e${i}`}
            position={[x + 0.6, 0, 0]}
            rotation-z={Math.PI / 2}
            material={mat.graphite}
          >
            <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
          </mesh>
        ) : null
      )}
      {/* generate, evaluate, regenerate */}
      <mesh geometry={arc} position={[1.2, 0, 0]} material={mat.amber} />
      {NODES.map((x, i) => (
        <RoundedBox
          key={i}
          ref={(m) => {
            boxes.current[i] = m;
          }}
          args={[0.6, 0.6, 0.6]}
          radius={0.14}
          smoothness={4}
          position={[x, 0, 0]}
          material={mats[i]}
        />
      ))}
      <mesh ref={pulse} material={mat.hot}>
        <sphereGeometry args={[0.13, 24, 24]} />
      </mesh>
      <group position-y={-0.32}>
        <Shadow w={8} d={1.6} opacity={0.35} />
      </group>
    </Rig>
  );
}

/* ───────── 20+ min → 5–7 min ───────── */
export function Bars({ wrap }: P) {
  const fast = useRef<THREE.Group>(null);
  const sp = useMemo(() => new Spring(3), []);
  useFrame((state, dt) => {
    const T = clock(state);
    const phase = T % 5;
    const h = sp.step(phase < 1.2 ? 3 : 0.9, Math.min(dt, 1 / 30), 60, 7);
    if (fast.current) {
      fast.current.scale.y = Math.max(0.05, h / 3);
    }
  });
  return (
    <Rig
      wrap={wrap}
      dir={[0.5, 0.45, 1]}
      look={[0, 1.3, 0]}
      fov={26}
      fit={[2.8, 3.3]}
    >
      <RoundedBox
        args={[0.9, 3, 0.9]}
        radius={0.14}
        smoothness={4}
        position={[-0.65, 1.5, 0]}
        material={mat.graphite}
      />
      <group ref={fast} position={[0.65, 0, 0]}>
        <RoundedBox
          args={[0.9, 3, 0.9]}
          radius={0.14}
          smoothness={4}
          position={[0, 1.5, 0]}
          material={mat.amber}
        />
      </group>
      <Shadow w={3.6} d={2.4} opacity={0.4} />
    </Rig>
  );
}

/* ───────── catalogue RAG: one product card pulled from the drawer ───────── */
export function Tiles({ wrap }: P) {
  const N = 8;
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(
    () => Array.from({ length: N }, () => glowMat(COL.clay)),
    []
  );
  const sp = useMemo(() => Array.from({ length: N }, () => new Spring(0)), []);
  useFrame((state, dt) => {
    const T = clock(state);
    const pick = [5, 2, 6, 3][Math.floor(T / 2.2) % 4];
    const up = T % 2.2 > 0.35 && T % 2.2 < 1.9;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const y = sp[i].step(
        i === pick && up ? 0.75 : 0,
        Math.min(dt, 1 / 30),
        80,
        11
      );
      m.position.y = 0.6 + y;
      mats[i].emissiveIntensity = THREE.MathUtils.clamp(y / 0.75, 0, 1) * 0.55;
      mats[i].color.set(y > 0.3 ? COL.amber : COL.clay);
    });
  });
  return (
    <Rig
      wrap={wrap}
      dir={[1, 0.6, 0.9]}
      look={[0, 0.75, 0]}
      fov={26}
      fit={[2.6, 2.2]}
    >
      <RoundedBox
        args={[1.25, 0.5, 2.4]}
        radius={0.08}
        smoothness={3}
        position={[0, 0.2, 0]}
        material={mat.graphite}
      />
      {Array.from({ length: N }, (_, i) => (
        <RoundedBox
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          args={[1.0, 1.0, 0.07]}
          radius={0.03}
          smoothness={3}
          position={[0, 0.6, -0.95 + i * 0.27]}
          material={mats[i]}
        />
      ))}
      <Shadow w={2.4} d={3.4} opacity={0.4} />
    </Rig>
  );
}

/* ───────── eval set: ticks fill as cases pass, then the check ───────── */
export function Dial({ wrap }: P) {
  const N = 24;
  const ticks = useRef<(THREE.Mesh | null)[]>([]);
  const check = useRef<THREE.Group>(null);
  const sp = useMemo(() => new Spring(0), []);
  useFrame((state, dt) => {
    const T = clock(state);
    const phase = T % 5.5;
    const n = Math.floor(ease(phase / 3) * N);
    ticks.current.forEach((m, i) => {
      if (m) m.material = i < n ? mat.amber : mat.graphite;
    });
    const s = sp.step(
      phase > 3.1 && phase < 5.1 ? 1 : 0,
      Math.min(dt, 1 / 30),
      120,
      10
    );
    if (check.current) check.current.scale.setScalar(Math.max(0.001, s));
  });
  return (
    <Rig
      wrap={wrap}
      dir={[0, 0.25, 1]}
      look={[0, 0, 0]}
      fov={26}
      fit={[2.8, 2.8]}
    >
      {Array.from({ length: N }, (_, i) => {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        return (
          <RoundedBox
            key={i}
            ref={(m) => {
              ticks.current[i] = m;
            }}
            args={[0.12, 0.34, 0.16]}
            radius={0.05}
            smoothness={2}
            position={[Math.cos(-a) * 1.2, Math.sin(-a) * 1.2, 0]}
            rotation-z={-a - Math.PI / 2}
            material={mat.graphite}
          />
        );
      })}
      <group ref={check} position={[0, 0, 0.1]}>
        <group rotation-z={-0.1}>
          <RoundedBox
            args={[0.22, 0.6, 0.22]}
            radius={0.1}
            smoothness={3}
            position={[-0.27, -0.12, 0]}
            rotation-z={0.8}
            material={mat.clay}
          />
          <RoundedBox
            args={[0.22, 1.05, 0.22]}
            radius={0.1}
            smoothness={3}
            position={[0.18, 0.08, 0]}
            rotation-z={-0.62}
            material={mat.clay}
          />
        </group>
      </group>
    </Rig>
  );
}

/* ───────── deploy stack: Railway, VPS, R2, with data moving up ───────── */
export function Rack({ wrap }: P) {
  const leds = useMemo(() => [0, 1, 2].map(() => glowMat(COL.ink)), []);
  const pkt = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const T = clock(state);
    leds.forEach(
      (m, i) =>
        (m.emissiveIntensity = Math.sin(T * 3 - i * 1.1) > 0.4 ? 1.4 : 0.05)
    );
    if (pkt.current) {
      const u = (T * 0.7) % 1;
      pkt.current.position.set(1.0, 0.25 + u * 1.5, 0.75);
      pkt.current.scale.setScalar(Math.sin(u * Math.PI) * 1 + 0.001);
    }
  });
  return (
    <Rig
      wrap={wrap}
      dir={[0.8, 0.55, 1]}
      look={[0, 0.85, 0]}
      fov={26}
      fit={[2.7, 2.7]}
    >
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.25 + i * 0.68, 0]}>
          <RoundedBox
            args={[2.1, 0.5, 1.4]}
            radius={0.1}
            smoothness={3}
            material={i === 1 ? mat.clay2 : mat.clay}
          />
          <mesh position={[-0.75, 0, 0.71]} material={leds[i]}>
            <sphereGeometry args={[0.06, 16, 16]} />
          </mesh>
          {[0, 1, 2, 3].map((k) => (
            <mesh
              key={k}
              position={[-0.3 + k * 0.22, 0, 0.705]}
              material={mat.graphite}
            >
              <boxGeometry args={[0.12, 0.26, 0.01]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh ref={pkt} material={mat.hot}>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
      </mesh>
      <Shadow w={3} d={2.2} opacity={0.4} />
    </Rig>
  );
}

/* ───────── Core XY: two steppers, one belt path, any point on the grid ───────── */
export function CoreXY({ wrap }: P) {
  const gantry = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const trail = useMemo(() => {
    const n = 90;
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(n * 3), 3)
    );
    const line = new THREE.Line(
      g,
      new THREE.LineBasicMaterial({ color: '#cc9532' })
    );
    return { n, g, line };
  }, []);
  useFrame((state) => {
    const T = clock(state);
    const xy = (t: number) =>
      [Math.sin(t * 1.1) * 1.05, Math.sin(t * 0.8 + 0.6) * 1.05] as const;
    const [x, z] = xy(T);
    if (gantry.current) gantry.current.position.z = z;
    if (head.current) head.current.position.x = x;
    const arr = trail.g.attributes.position.array as Float32Array;
    for (let i = 0; i < trail.n; i++) {
      const [tx, tz] = xy(T - i * 0.03);
      arr[i * 3] = tx;
      arr[i * 3 + 1] = 0.02;
      arr[i * 3 + 2] = tz;
    }
    trail.g.attributes.position.needsUpdate = true;
  });
  const rail = (
    args: [number, number, number],
    pos: [number, number, number]
  ) => (
    <RoundedBox
      args={args}
      radius={0.05}
      smoothness={2}
      position={pos}
      material={mat.graphite}
    />
  );
  return (
    <Rig
      wrap={wrap}
      dir={[0.2, 1, 0.9]}
      look={[0, 0.1, 0]}
      fov={26}
      fit={[3.4, 3]}
    >
      <RoundedBox
        args={[3, 0.06, 3]}
        radius={0.03}
        smoothness={2}
        position={[0, -0.03, 0]}
        material={mat.bench}
      />
      {rail([0.14, 0.18, 3], [-1.5, 0.3, 0])}
      {rail([0.14, 0.18, 3], [1.5, 0.3, 0])}
      {rail([3.14, 0.18, 0.14], [0, 0.3, -1.5])}
      {rail([3.14, 0.18, 0.14], [0, 0.3, 1.5])}
      {/* the two steppers and the idler pulleys */}
      {[
        [-1.5, -1.5],
        [1.5, -1.5],
        [-1.5, 1.5],
        [1.5, 1.5],
      ].map(([x, z], i) => (
        <mesh
          key={i}
          position={[x, 0.45, z]}
          material={i < 2 ? mat.amber : mat.clay}
        >
          <cylinderGeometry args={[0.16, 0.16, 0.14, 24]} />
        </mesh>
      ))}
      <group ref={gantry}>
        <RoundedBox
          args={[3, 0.12, 0.16]}
          radius={0.05}
          smoothness={2}
          position={[0, 0.45, 0]}
          material={mat.clay}
        />
        <group ref={head}>
          <RoundedBox
            args={[0.42, 0.26, 0.42]}
            radius={0.08}
            smoothness={3}
            position={[0, 0.5, 0]}
            material={mat.clay2}
          />
          <mesh position={[0, 0.25, 0]} material={mat.hot}>
            <coneGeometry args={[0.07, 0.2, 16]} />
          </mesh>
        </group>
      </group>
      <primitive object={trail.line} />
    </Rig>
  );
}

/* ───────── mecanum car: strafes and drifts diagonally without turning ───────── */
export function Mecanum({ wrap }: P) {
  const car = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const last = useRef(new THREE.Vector2());
  useFrame((state) => {
    const T = clock(state);
    // a figure eight: forward, sideways and diagonal, never yawing
    const x = Math.sin(T * 0.7) * 1.0;
    const z = Math.sin(T * 1.4) * 0.5;
    const dx = x - last.current.x;
    const dz = z - last.current.y;
    last.current.set(x, z);
    if (car.current) car.current.position.set(x, 0, z);
    // mecanum kinematics: each wheel spins by forward ± strafe
    const sgn = [1, -1, -1, 1];
    wheels.current.forEach((w, i) => {
      if (w) w.rotation.x += (dz + sgn[i] * dx) * 4;
    });
  });
  const pos: [number, number, number][] = [
    [-0.78, 0.32, -0.62],
    [0.78, 0.32, -0.62],
    [-0.78, 0.32, 0.62],
    [0.78, 0.32, 0.62],
  ];
  return (
    <Rig
      wrap={wrap}
      dir={[0.7, 0.75, 1]}
      look={[0, 0.3, 0]}
      fov={26}
      fit={[3.6, 2.4]}
    >
      <RoundedBox
        args={[4.4, 0.06, 2.8]}
        radius={0.03}
        smoothness={2}
        position={[0, -0.03, 0]}
        material={mat.bench}
      />
      <group ref={car}>
        <RoundedBox
          args={[1.25, 0.26, 1.6]}
          radius={0.08}
          smoothness={3}
          position={[0, 0.42, 0]}
          material={mat.clay}
        />
        <RoundedBox
          args={[0.8, 0.14, 0.6]}
          radius={0.05}
          smoothness={3}
          position={[0, 0.62, 0.15]}
          material={mat.graphite}
        />
        <mesh position={[0.25, 0.7, -0.4]} material={mat.amber}>
          <boxGeometry args={[0.22, 0.06, 0.3]} />
        </mesh>
        {pos.map((p, i) => (
          <group
            key={i}
            position={p}
            ref={(g) => {
              wheels.current[i] = g;
            }}
          >
            <MecanumWheel hand={i === 0 || i === 3 ? 1 : -1} />
          </group>
        ))}
        <Shadow w={2.2} d={2.4} y={0.01} opacity={0.5} />
      </group>
    </Rig>
  );
}

function MecanumWheel({ hand }: { hand: number }) {
  const n = 9;
  return (
    <group>
      <mesh rotation-z={Math.PI / 2} material={mat.graphite}>
        <cylinderGeometry args={[0.22, 0.22, 0.24, 24]} />
      </mesh>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <group key={i} rotation-x={a}>
            <mesh
              position={[0, 0.28, 0]}
              rotation={[0, hand * 0.785, Math.PI / 2]}
              material={mat.amber}
            >
              <capsuleGeometry args={[0.05, 0.16, 4, 8]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ───────── printer: a vase, one layer at a time ───────── */
export function Printer({ wrap }: P) {
  const L = 26;
  const layers = useRef<(THREE.Mesh | null)[]>([]);
  const head = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Group>(null);
  const radius = (i: number) => 0.42 + Math.sin(i * 0.16) * 0.22;
  useFrame((state) => {
    const T = clock(state);
    const cyc = (T * 4) % (L + 10);
    const n = Math.min(Math.floor(cyc), L);
    layers.current.forEach((m, i) => {
      if (!m) return;
      m.visible = i < n;
      m.material = i === n - 1 && n < L ? mat.hot : mat.clay;
    });
    const y = 0.12 + n * 0.07;
    const a = T * 7;
    const r = radius(n);
    if (beam.current) beam.current.position.y = y + 0.45;
    if (head.current)
      head.current.position.set(Math.cos(a) * r, y + 0.25, Math.sin(a) * r);
  });
  return (
    <Rig
      wrap={wrap}
      dir={[0.6, 0.45, 1]}
      look={[0, 1.15, 0]}
      fov={26}
      fit={[3.6, 3.4]}
    >
      <RoundedBox
        args={[2.8, 0.12, 2.2]}
        radius={0.04}
        smoothness={2}
        position={[0, 0.06, 0]}
        material={mat.graphite}
      />
      {[-1.4, 1.4].map((x) => (
        <RoundedBox
          key={x}
          args={[0.14, 3, 0.14]}
          radius={0.05}
          smoothness={2}
          position={[x, 1.5, -0.6]}
          material={mat.graphite}
        />
      ))}
      <RoundedBox
        args={[3, 0.14, 0.14]}
        radius={0.05}
        smoothness={2}
        position={[0, 3, -0.6]}
        material={mat.graphite}
      />
      <group ref={beam}>
        <RoundedBox
          args={[2.8, 0.1, 0.12]}
          radius={0.04}
          smoothness={2}
          position={[0, 0, -0.6]}
          material={mat.clay2}
        />
      </group>
      <group ref={head}>
        <RoundedBox
          args={[0.42, 0.32, 0.42]}
          radius={0.08}
          smoothness={3}
          position={[0, 0.22, 0]}
          material={mat.clay}
        />
        <mesh
          position={[0, -0.02, 0]}
          rotation-x={Math.PI}
          material={mat.amber}
        >
          <coneGeometry args={[0.07, 0.16, 16]} />
        </mesh>
      </group>
      {Array.from({ length: L }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            layers.current[i] = m;
          }}
          position={[0, 0.15 + i * 0.07, 0]}
          material={mat.clay}
        >
          <cylinderGeometry args={[radius(i + 1), radius(i), 0.064, 40]} />
        </mesh>
      ))}
    </Rig>
  );
}

/* ───────── EMG hand: a muscle burst, then the fingers close ───────── */
export function Hand({ wrap }: P) {
  const fingers = useRef<(THREE.Group | null)[][]>([[], [], [], []]);
  const thumb = useRef<THREE.Group>(null);
  const wave = useMemo(() => {
    const n = 140;
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(n * 3), 3)
    );
    return {
      n,
      g,
      line: new THREE.Line(
        g,
        new THREE.LineBasicMaterial({ color: '#cc9532' })
      ),
    };
  }, []);
  const env = (t: number) => {
    const p = ((t % 3.2) + 3.2) % 3.2;
    return p < 0.4
      ? ease(p / 0.4)
      : p < 1.6
        ? 1
        : p < 2.1
          ? 1 - ease((p - 1.6) / 0.5)
          : 0;
  };
  useFrame((state) => {
    const T = clock(state);
    fingers.current.forEach((segs, f) => {
      const c = env(T - f * 0.08) * 1.25;
      segs.forEach((s) => s && (s.rotation.x = c));
    });
    if (thumb.current) thumb.current.rotation.y = -0.2 - env(T) * 0.7;
    const arr = wave.g.attributes.position.array as Float32Array;
    for (let i = 0; i < wave.n; i++) {
      const t = T - (wave.n - i) * 0.012;
      const amp = 0.06 + env(t + 0.25) * 0.38;
      const noise = Math.sin(t * 93.1) * 0.6 + Math.sin(t * 57.7 + 1.3) * 0.4;
      arr[i * 3] = -1.7 + (i / wave.n) * 3.4;
      arr[i * 3 + 1] = -1.25 + noise * amp;
      arr[i * 3 + 2] = 0.3;
    }
    wave.g.attributes.position.needsUpdate = true;
  });
  const fx = [-0.33, -0.11, 0.11, 0.33];
  const len = [0.42, 0.48, 0.45, 0.36];
  return (
    <Rig
      wrap={wrap}
      dir={[0.35, 0.2, 1]}
      look={[0, 0.1, 0]}
      fov={26}
      fit={[3, 3]}
    >
      <group position={[0, -0.3, 0]}>
        <RoundedBox
          args={[0.6, 0.6, 0.3]}
          radius={0.12}
          smoothness={3}
          position={[0, -0.75, 0]}
          material={mat.graphite}
        />
        <RoundedBox
          args={[0.95, 1.0, 0.3]}
          radius={0.14}
          smoothness={3}
          position={[0, 0, 0]}
          material={mat.clay}
        />
        {fx.map((x, f) => (
          <group key={f} position={[x, 0.5, 0]}>
            <Phalanx len={len[f]} put={(g, k) => (fingers.current[f][k] = g)} />
          </group>
        ))}
        <group ref={thumb} position={[-0.48, -0.15, 0.05]} rotation-z={0.9}>
          <RoundedBox
            args={[0.2, 0.42, 0.22]}
            radius={0.09}
            smoothness={3}
            position={[0, 0.21, 0]}
            material={mat.clay}
          />
          <mesh position={[0, 0, 0]} material={mat.amber}>
            <sphereGeometry args={[0.08, 16, 16]} />
          </mesh>
        </group>
      </group>
      <primitive object={wave.line} />
    </Rig>
  );
}

function Phalanx({
  len,
  put,
}: {
  len: number;
  put: (g: THREE.Group | null, k: number) => void;
}) {
  // three segments, each hinged at its base, nested so the curl compounds
  const seg = (k: number, l: number, child?: ReactNode) => (
    <group ref={(g) => put(g, k)}>
      <mesh material={mat.amber}>
        <sphereGeometry args={[0.07, 12, 12]} />
      </mesh>
      <RoundedBox
        args={[0.18, l, 0.2]}
        radius={0.08}
        smoothness={3}
        position={[0, l / 2, 0]}
        material={mat.clay}
      />
      <group position-y={l + 0.02}>{child}</group>
    </group>
  );
  return seg(0, len, seg(1, len * 0.7, seg(2, len * 0.55)));
}
