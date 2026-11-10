'use client';

// His 4 DOF arm: base yaw, shoulder, elbow, wrist, plus a gripper and the camera that fed Gemini.
// Real two link inverse kinematics. It aims its camera at the cursor, closes the gripper over
// anything marked [data-grab], and on a bench click runs the hackathon routine: grab, shift, place.

import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { COL, INK, Rig, Shadow, Spring, etchMat, live, mat } from './kit';

const L1 = 1.6; // upper arm
const L2 = 1.4; // forearm
const L3 = 0.62; // wrist to fingertips
const SH = 0.8; // shoulder height above the bench
const REACH = L1 + L2 - 0.03;
const CUBE = 0.32;
const SPOTS = [-0.55, 0.55].map(
  (yaw) =>
    new THREE.Vector3(Math.sin(yaw) * 2.05, CUBE / 2, Math.cos(yaw) * 2.05)
);

const FRAME = {
  look: [0, 2.0, 0.5] as [number, number, number],
  fit: [1, 4.5] as [number, number],
};

type Hud = { angles?: string; target?: string; log?: string };

type Props = {
  wrap: RefObject<HTMLDivElement | null>;
  /** id of a DOM element to point at when the pointer is idle */
  aimId?: string;
  /** full bench with a cube and the pick routine */
  bench?: boolean;
  /** the full size pegboard (and its cube) without the routine, for a second, quieter arm */
  wide?: boolean;
  /** ids of DOM nodes to write live readouts into */
  hud?: Hud;
};

// the routine, in seconds. tip targets are filled in per run (cube can be on either side)
const ROUTINE = [
  { at: 0.0, step: 'above-a', grip: 1, log: 'cam      frame captured' },
  { at: 0.8, step: 'at-a', grip: 1, log: 'gemini   decides: grab' },
  { at: 1.35, step: 'at-a', grip: 0.45, log: 'serial   pyserial → arduino' },
  { at: 1.75, step: 'lift-a', grip: 0.45, log: 'motor    servos · ik' },
  { at: 2.35, step: 'above-b', grip: 0.45, log: 'gemini   decides: shift' },
  { at: 3.15, step: 'at-b', grip: 0.45, log: 'gemini   decides: place' },
  { at: 3.6, step: 'at-b', grip: 1, log: 'motor    gripper open' },
  {
    at: 3.95,
    step: 'lift-b',
    grip: 1,
    log: 'result   3rd place, national hackathon',
  },
  { at: 4.6, step: 'done', grip: 1, log: '' },
] as const;

export default function Arm({
  wrap,
  aimId,
  bench = false,
  wide = false,
  hud,
}: Props) {
  const big = bench || wide;
  const yawG = useRef<THREE.Group>(null);
  const j1 = useRef<THREE.Group>(null);
  const j2 = useRef<THREE.Group>(null);
  const j3 = useRef<THREE.Group>(null);
  const fL = useRef<THREE.Mesh>(null);
  const fR = useRef<THREE.Mesh>(null);
  const tip = useRef<THREE.Object3D>(null);
  const cube = useRef<THREE.Mesh>(null);
  const root = useRef<THREE.Group>(null);

  const st = useMemo(
    () => ({
      yaw: new Spring(0),
      a1: new Spring(1.2),
      e: new Spring(1.6),
      w: new Spring(-0.4),
      g: new Spring(1),
      lens: new Spring(0),
      ray: new THREE.Raycaster(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.4),
      ndc: new THREE.Vector2(),
      hit: new THREE.Vector3(),
      tipT: new THREE.Vector3(),
      tmp: new THREE.Vector3(),
      cubeAt: 0, // which spot the cube rests on
      from: 0, // where this run picks it up
      held: false,
      run: -1, // routine start time, -1 when idle
      picks: live.picks,
      hudAt: 0,
      lastLog: '',
      els: null as null | {
        joints: HTMLElement[];
        angles?: HTMLElement | null;
        target?: HTMLElement | null;
        log?: HTMLElement | null;
      },
      lensMat: etchMat(
        new THREE.MeshStandardMaterial({
          color: COL.amber,
          emissive: COL.amber,
          emissiveIntensity: 0.4,
          roughness: 0.3,
        }),
        INK.amber
      ),
    }),
    []
  );

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const el = wrap.current;
    if (!el || !yawG.current || !j1.current || !j2.current || !j3.current)
      return;
    const r = el.getBoundingClientRect();
    const now = performance.now();
    const T = state.clock.elapsedTime;

    if (!st.els && hud) {
      const angles = hud.angles ? document.getElementById(hud.angles) : null;
      st.els = {
        // a container with one [data-joint] cell per joint, or a single line of text
        joints: angles
          ? Array.from(angles.querySelectorAll<HTMLElement>('[data-joint]'))
          : [],
        angles,
        target: hud.target ? document.getElementById(hud.target) : null,
        log: hud.log ? document.getElementById(hud.log) : null,
      };
    }

    // ── choose a goal: routine > pointer > DOM target > idle scan ──
    let phi = 0; // tool angle in the arm plane (rad, 0 = horizontal, −π/2 = straight down)
    let grip = 1;
    let label = '';
    let log = '';
    const pointerOn = now - live.t < 4500 && live.x > -9000;

    if (bench && live.picks !== st.picks) {
      st.picks = live.picks;
      if (st.run < 0) {
        st.run = T;
        st.from = st.cubeAt;
      }
    }

    if (st.run >= 0) {
      const t = T - st.run;
      let k: (typeof ROUTINE)[number] = ROUTINE[0];
      for (const step of ROUTINE) if (t >= step.at) k = step;
      const a = SPOTS[st.from];
      const b = SPOTS[1 - st.from];
      const p = k.step;
      if (p === 'above-a') st.tipT.copy(a).add(st.tmp.set(0, 0.95, 0));
      else if (p === 'at-a') st.tipT.copy(a).add(st.tmp.set(0, 0.02, 0));
      else if (p === 'lift-a') st.tipT.copy(a).add(st.tmp.set(0, 1.1, 0));
      else if (p === 'above-b') st.tipT.copy(b).add(st.tmp.set(0, 1.0, 0));
      else if (p === 'at-b') st.tipT.copy(b).add(st.tmp.set(0, 0.04, 0));
      else st.tipT.copy(b).add(st.tmp.set(0, 1.1, 0));
      phi = -Math.PI / 2;
      grip = k.grip;
      log = k.log;
      label = 'pick routine';
      // attach when the fingers have closed, release when they open
      if (!st.held && k.grip < 1 && t > 1.55) st.held = true;
      if (st.held && t > 3.7) {
        st.held = false;
        st.cubeAt = 1 - st.from;
      }
      if (p === 'done') st.run = -1;
    } else {
      let aimX = 0;
      let aimY = 0;
      let haveAim = false;
      let fromDom = false;
      if (pointerOn) {
        aimX = live.x;
        aimY = live.y;
        haveAim = true;
        label = live.label || 'your cursor';
        if (live.grab) grip = 0.1;
      } else if (aimId) {
        const target = document.getElementById(aimId);
        if (target) {
          const tr = target.getBoundingClientRect();
          aimX = tr.left + tr.width / 2;
          aimY = tr.top + tr.height / 2;
          haveAim = true;
          fromDom = true;
          label = target.dataset.aim || 'button';
        }
      }

      const aim = st.hit;
      if (haveAim) {
        st.ndc.set(
          ((aimX - r.left) / r.width) * 2 - 1,
          -(((aimY - r.top) / r.height) * 2 - 1)
        );
        st.ndc.x = THREE.MathUtils.clamp(st.ndc.x, -2.5, 2.5);
        st.ndc.y = THREE.MathUtils.clamp(st.ndc.y, -2.5, 3.5);
        // aim plane faces the camera (in plan), a little in front of the base
        st.tmp.copy(state.camera.position).setY(0).normalize();
        st.plane.setFromNormalAndCoplanarPoint(
          st.tmp,
          st.tmp.clone().multiplyScalar(2.4)
        );
        st.ray.setFromCamera(st.ndc, state.camera);
        if (!st.ray.ray.intersectPlane(st.plane, aim)) aim.set(0, 2.5, 2.4);
      } else {
        // idle: slow scan, like a camera looking for something to pick up
        const s = live.reduced ? 0 : T;
        aim.set(
          Math.sin(s * 0.45) * 2.6 + 0.8,
          2.3 + Math.sin(s * 0.7) * 0.8,
          2.4
        );
        label = 'idle scan';
      }
      aim.y = Math.max(aim.y, 0.7);

      // stretch toward the aim point, keep a little standoff, point the camera at it
      const yaw = Math.atan2(aim.x, aim.z);
      const rr = Math.hypot(aim.x, aim.z);
      const hh = aim.y - SH;
      const dist = Math.hypot(rr, hh);
      phi = Math.atan2(hh, rr);
      // keep a bend in the elbow even at full stretch; a straight arm reads as a pole
      const reach = THREE.MathUtils.clamp(dist - 0.45, 1.4, REACH * 0.8 + L3);
      if (fromDom && big) {
        // a page element far off to the side: stand tall and look at it rather than lunge across
        // the copy. Yaw and the wrist camera still track it.
        const r0 = Math.min(rr, 1.5);
        const y0 = SH + 1.9;
        phi = THREE.MathUtils.clamp(Math.atan2(aim.y - y0, rr - r0), -1.1, 0.4);
        st.tipT.set(Math.sin(yaw) * r0, y0, Math.cos(yaw) * r0);
      } else {
        st.tipT.set(
          Math.sin(yaw) * Math.cos(phi) * reach,
          SH + Math.sin(phi) * reach,
          Math.cos(yaw) * Math.cos(phi) * reach
        );
      }
    }

    // ── inverse kinematics on the tip target ──
    const yawT = Math.atan2(st.tipT.x, st.tipT.z);
    const rT = Math.hypot(st.tipT.x, st.tipT.z);
    const hT = st.tipT.y - SH;
    let wx = rT - L3 * Math.cos(phi);
    let wy = hT - L3 * Math.sin(phi);
    let d = Math.hypot(wx, wy);
    if (d > REACH) {
      wx *= REACH / d;
      wy *= REACH / d;
      d = REACH;
    }
    if (d < 0.5) d = 0.5;
    const cosE = THREE.MathUtils.clamp(
      (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2),
      -1,
      1
    );
    const e = Math.acos(cosE);
    const a1 =
      Math.atan2(wy, wx) + Math.atan2(L2 * Math.sin(e), L1 + L2 * Math.cos(e));
    const a2 = a1 - e;

    const k = st.run >= 0 ? 120 : 70;
    const dmp = st.run >= 0 ? 18 : 12;
    const yaw = st.yaw.step(THREE.MathUtils.clamp(yawT, -1.5, 1.5), dt, k, dmp);
    const A1 = st.a1.step(THREE.MathUtils.clamp(a1, 0.05, 2.9), dt, k, dmp);
    const E = st.e.step(e, dt, k, dmp);
    const W = st.w.step(phi - a2, dt, k * 1.2, dmp);
    const G = st.g.step(grip, dt, 160, 20);

    yawG.current.rotation.y = yaw;
    j1.current.rotation.x = -A1;
    j2.current.rotation.x = E;
    j3.current.rotation.x = -W;
    const fx = 0.1 + 0.2 * Math.max(0, G);
    if (fL.current) fL.current.position.x = -fx;
    if (fR.current) fR.current.position.x = fx;

    // lens brightens while it has something to look at
    st.lensMat.emissiveIntensity =
      0.35 + st.lens.step(pointerOn || st.run >= 0 ? 1 : 0, dt, 40, 10) * 1.4;

    // the cube rides in the gripper while held
    if (bench && cube.current && root.current && tip.current) {
      if (st.held) {
        tip.current.getWorldPosition(st.tmp);
        root.current.worldToLocal(st.tmp);
        cube.current.position.copy(st.tmp);
        cube.current.rotation.y = yaw;
      } else {
        cube.current.position.lerp(SPOTS[st.cubeAt], 1 - Math.exp(-dt * 18));
        cube.current.position.y = CUBE / 2;
      }
    }

    // ── HUD, ~12 times a second ──
    if (st.els && now - st.hudAt > 80) {
      st.hudAt = now;
      const deg = (x: number) => `${Math.round(THREE.MathUtils.radToDeg(x))}°`;
      const js = [yaw, A1, -E, W];
      if (st.els.joints.length === 4)
        st.els.joints.forEach((j, i) => (j.textContent = deg(js[i])));
      else if (st.els.angles)
        st.els.angles.textContent = `θ1 ${deg(yaw)}  θ2 ${deg(A1)}  θ3 ${deg(-E)}  θ4 ${deg(W)}`;
      if (st.els.target && st.els.target.textContent !== label)
        st.els.target.textContent = label;
      if (st.els.log && log !== st.lastLog && log) {
        st.lastLog = log;
        st.els.log.textContent = log;
        st.els.log.dataset.flash = String(Math.random());
      }
    }
  });

  return (
    <Rig
      wrap={wrap}
      dir={[0.55, 0.36, 1]}
      // the big bench is framed by height only, so every box (hero, final band, phone bands) shows the
      // base at the same spot, about three quarters down, with the board running out past the left edge
      look={big ? FRAME.look : [0, 1.35, 0.5]}
      fov={30}
      fit={big ? FRAME.fit : [4, 4]}
      parallax={0}
      pop
    >
      <group ref={root}>
        {/* bench: a pegboard plate */}
        <Board big={big} />

        <group ref={yawG} position-y={0.18}>
          <mesh position-y={0.11} material={mat.clay}>
            <cylinderGeometry args={[0.72, 0.76, 0.22, 48]} />
          </mesh>
          <RoundedBox
            args={[0.62, 0.4, 0.5]}
            radius={0.06}
            smoothness={3}
            position={[0, 0.4, 0]}
            material={mat.graphite}
          />
          {/* shoulder */}
          <group position-y={SH - 0.18}>
            <mesh rotation-z={Math.PI / 2} material={mat.amber}>
              <cylinderGeometry args={[0.22, 0.22, 0.66, 32]} />
            </mesh>
            <group ref={j1}>
              {/* twin printed plates, like the real bracket */}
              {[-0.21, 0.21].map((x) => (
                <RoundedBox
                  key={x}
                  args={[0.08, 0.34, L1 + 0.28]}
                  radius={0.035}
                  smoothness={3}
                  position={[x, 0, L1 / 2]}
                  material={mat.clay}
                />
              ))}
              <RoundedBox
                args={[0.3, 0.16, 0.5]}
                radius={0.05}
                smoothness={3}
                position={[0, 0, L1 * 0.5]}
                material={mat.graphite}
              />
              {/* elbow */}
              <group ref={j2} position-z={L1}>
                <mesh rotation-z={Math.PI / 2} material={mat.amber}>
                  <cylinderGeometry args={[0.19, 0.19, 0.36, 32]} />
                </mesh>
                <RoundedBox
                  args={[0.26, 0.26, L2 + 0.2]}
                  radius={0.08}
                  smoothness={3}
                  position={[0, 0, L2 / 2]}
                  material={mat.clay}
                />
                {/* wrist */}
                <group ref={j3} position-z={L2}>
                  <mesh rotation-z={Math.PI / 2} material={mat.amber}>
                    <cylinderGeometry args={[0.14, 0.14, 0.34, 24]} />
                  </mesh>
                  <RoundedBox
                    args={[0.3, 0.26, 0.3]}
                    radius={0.06}
                    smoothness={3}
                    position={[0, 0, 0.16]}
                    material={mat.graphite}
                  />
                  {/* the camera that fed Gemini */}
                  <RoundedBox
                    args={[0.24, 0.16, 0.16]}
                    radius={0.04}
                    smoothness={3}
                    position={[0, 0.22, 0.2]}
                    material={mat.ink}
                  />
                  <mesh
                    position={[0, 0.22, 0.29]}
                    rotation-x={Math.PI / 2}
                    material={mat.ink}
                  >
                    <cylinderGeometry args={[0.055, 0.055, 0.04, 24]} />
                  </mesh>
                  <mesh position={[0, 0.22, 0.31]} material={st.lensMat}>
                    <torusGeometry args={[0.055, 0.014, 8, 32]} />
                  </mesh>
                  {/* gripper */}
                  <RoundedBox
                    args={[0.72, 0.1, 0.12]}
                    radius={0.04}
                    smoothness={3}
                    position={[0, 0, 0.36]}
                    material={mat.graphite}
                  />
                  <RoundedBox
                    ref={fL}
                    args={[0.06, 0.12, 0.3]}
                    radius={0.025}
                    smoothness={3}
                    position={[-0.3, 0, 0.5]}
                    material={mat.clay}
                  />
                  <RoundedBox
                    ref={fR}
                    args={[0.06, 0.12, 0.3]}
                    radius={0.025}
                    smoothness={3}
                    position={[0.3, 0, 0.5]}
                    material={mat.clay}
                  />
                  <object3D ref={tip} position-z={L3 - 0.12} />
                </group>
              </group>
            </group>
          </group>
        </group>

        {big && (
          <RoundedBox
            ref={cube}
            args={[CUBE, CUBE, CUBE]}
            radius={0.05}
            smoothness={3}
            position={SPOTS[0].toArray()}
            material={mat.amber}
          />
        )}
        <Shadow w={3.2} d={3.2} y={0.002} opacity={0.6} />
      </group>
    </Rig>
  );
}

/** The pegboard and the arm's fixed base ring. */
function Board({ big }: { big: boolean }) {
  return (
    <>
      <RoundedBox
        args={big ? [6.6, 0.2, 3.8] : [3.4, 0.2, 3]}
        radius={0.08}
        smoothness={3}
        position={[0, -0.1, big ? 0.6 : 0.2]}
        material={mat.bench}
      />
      <Pegs w={big ? 6.2 : 3} d={big ? 3.4 : 2.6} z={big ? 0.6 : 0.2} />
      <mesh position-y={0.09} material={mat.graphite}>
        <cylinderGeometry args={[0.95, 1.05, 0.18, 48]} />
      </mesh>
      <mesh position-y={0.185} rotation-x={Math.PI / 2} material={mat.amber}>
        <torusGeometry args={[0.86, 0.025, 8, 64]} />
      </mesh>
    </>
  );
}

/** The bench on its own, seen low and wide: the board, the turntable, the stub of the arm and the
 *  cube. A backdrop for a full bleed band, so it has no IK and only a faint lean. */
export function Bench({ wrap }: { wrap: RefObject<HTMLDivElement | null> }) {
  return (
    <Rig
      wrap={wrap}
      dir={[0.32, 0.5, 1]}
      look={[0, 0.25, 0.9]}
      fov={30}
      fit={[5.2, 2.0]}
      parallax={0.06}
      pop={false}
    >
      <Board big />
      <group position-y={0.18}>
        <mesh position-y={0.11} material={mat.clay}>
          <cylinderGeometry args={[0.72, 0.76, 0.22, 48]} />
        </mesh>
        <RoundedBox
          args={[0.62, 0.4, 0.5]}
          radius={0.06}
          smoothness={3}
          position={[0, 0.4, 0]}
          material={mat.graphite}
        />
        <mesh
          position-y={SH - 0.18}
          rotation-z={Math.PI / 2}
          material={mat.amber}
        >
          <cylinderGeometry args={[0.22, 0.22, 0.66, 32]} />
        </mesh>
        {[-0.21, 0.21].map((x) => (
          <RoundedBox
            key={x}
            args={[0.08, 0.34, 1.3]}
            radius={0.035}
            smoothness={3}
            position={[x, SH + 0.3, 0.1]}
            rotation-x={-1.2}
            material={mat.clay}
          />
        ))}
      </group>
      <RoundedBox
        args={[CUBE, CUBE, CUBE]}
        radius={0.05}
        smoothness={3}
        position={SPOTS[0].toArray()}
        material={mat.amber}
      />
      <Shadow w={3.2} d={3.2} y={0.002} opacity={0.6} />
    </Rig>
  );
}

/** Instanced dimples on the bench, like a pegboard. */
function Pegs({ w, d, z }: { w: number; d: number; z: number }) {
  const geo = useMemo(
    () => new THREE.CylinderGeometry(0.03, 0.03, 0.01, 10),
    []
  );
  const count = useMemo(() => {
    const pts: [number, number][] = [];
    for (let x = -w / 2; x <= w / 2 + 1e-6; x += 0.4)
      for (let y = -d / 2; y <= d / 2 + 1e-6; y += 0.4)
        if (Math.hypot(x, y + z) > 1.2) pts.push([x, y + z]);
    return pts;
  }, [w, d, z]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    count.forEach(([x, zz], i) => {
      o.position.set(x, 0.002, zz);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [count]);
  return <instancedMesh ref={ref} args={[geo, mat.ink, count.length]} />;
}
