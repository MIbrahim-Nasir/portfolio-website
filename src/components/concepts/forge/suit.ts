// Procedural exoframe: an open engineering prototype, not armour.
// Aluminium extrusion spine, printed panels, linear actuators, servos, hex fasteners,
// cable runs, a sensor mast with stereo camera + lidar, ducted fans on the calves,
// all hung in a Core XY gantry. Units: 1 = roughly 0.85 m. +z faces the viewer.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type V3 = [number, number, number];

export type Tone = 'frame' | 'hot' | 'beam';
export type Motion = 'lidar' | 'rotor' | 'bar' | 'carriage' | 'elbow';

export type Piece = {
  fill: THREE.BufferGeometry;
  edges: THREE.BufferGeometry | null;
  origin: THREE.Vector3;
  explode: THREE.Vector3;
  tone: Tone;
  motion?: Motion;
  /** enlarged invisible hit box for small parts */
  pick?: THREE.BufferGeometry;
};

export type SuitModule = {
  pieces: Piece[];
  /** callout anchor at the installed position */
  anchor: THREE.Vector3;
  /** which piece's explode vector moves the anchor */
  anchorPiece: number;
};

const vec = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
const UP = new THREE.Vector3(0, 1, 0);
const ONE = new THREE.Vector3(1, 1, 1);
const PI = Math.PI;

function mat(pos: V3, rot: V3 = [0, 0, 0]) {
  return new THREE.Matrix4().compose(
    vec(pos),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rot[0], rot[1], rot[2])
    ),
    ONE
  );
}

function along(a: V3, b: V3) {
  const A = vec(a);
  const B = vec(b);
  const d = B.clone().sub(A);
  const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.normalize());
  return {
    m: new THREE.Matrix4().compose(A.add(B).multiplyScalar(0.5), q, ONE),
    len,
  };
}

export class Kit {
  private fills: THREE.BufferGeometry[] = [];
  private lines: THREE.BufferGeometry[] = [];

  private add(
    g: THREE.BufferGeometry,
    m: THREE.Matrix4,
    edgeAngle: number | null = 24
  ) {
    g.applyMatrix4(m);
    // merged geometries must share attributes; drop groups so merge is plain
    g.clearGroups();
    this.fills.push(g);
    if (edgeAngle !== null)
      this.lines.push(new THREE.EdgesGeometry(g, edgeAngle));
    return this;
  }

  box(w: number, h: number, d: number, pos: V3, rot?: V3) {
    return this.add(new THREE.BoxGeometry(w, h, d), mat(pos, rot));
  }

  cyl(
    r: number,
    len: number,
    pos: V3,
    axis: 'x' | 'y' | 'z' = 'y',
    seg = 18,
    edge: number | null = 24
  ) {
    const rot: V3 =
      axis === 'x' ? [0, 0, PI / 2] : axis === 'z' ? [PI / 2, 0, 0] : [0, 0, 0];
    return this.add(
      new THREE.CylinderGeometry(r, r, len, seg),
      mat(pos, rot),
      edge
    );
  }

  shell(r: number, len: number, pos: V3) {
    return this.add(
      new THREE.CylinderGeometry(r, r, len, 24, 1, true),
      mat(pos),
      24
    );
  }

  rod(a: V3, b: V3, r: number, seg = 12) {
    const { m, len } = along(a, b);
    return this.add(new THREE.CylinderGeometry(r, r, len, seg), m, 35);
  }

  bar(a: V3, b: V3, w: number, d: number) {
    const { m, len } = along(a, b);
    return this.add(new THREE.BoxGeometry(w, len, d), m);
  }

  /** linear actuator: body + piston rod + two clevis ends */
  actuator(a: V3, b: V3, r: number, split = 0.55) {
    const A = vec(a);
    const B = vec(b);
    const mid = A.clone().lerp(B, split);
    const m: V3 = [mid.x, mid.y, mid.z];
    this.rod(a, m, r, 14);
    this.rod(m, b, r * 0.42, 10);
    this.nut(a, 'x', r * 0.8);
    this.nut(b, 'x', r * 0.7);
    return this;
  }

  nut(pos: V3, axis: 'x' | 'y' | 'z' = 'z', r = 0.011) {
    return this.cyl(r, r * 0.8, pos, axis, 6, 20);
  }

  torus(R: number, r: number, pos: V3, rot: V3 = [PI / 2, 0, 0], arc = PI * 2) {
    return this.add(
      new THREE.TorusGeometry(R, r, 8, 56, arc),
      mat(pos, rot),
      null
    );
  }

  tube(points: V3[], r: number) {
    const curve = new THREE.CatmullRomCurve3(points.map(vec));
    return this.add(
      new THREE.TubeGeometry(
        curve,
        Math.max(24, points.length * 12),
        r,
        6,
        false
      ),
      new THREE.Matrix4(),
      null
    );
  }

  cone(rTop: number, rBot: number, len: number, pos: V3) {
    return this.add(
      new THREE.CylinderGeometry(rTop, rBot, len, 28, 1, true),
      mat(pos),
      null
    );
  }

  piece(
    origin: V3,
    explode: V3,
    tone: Tone = 'frame',
    motion?: Motion,
    pickPad = 0
  ): Piece {
    const fill = mergeGeometries(this.fills, false);
    const edges = this.lines.length ? mergeGeometries(this.lines, false) : null;
    if (!fill) throw new Error('suit: merge failed');
    const o = vec(origin);
    fill.translate(-o.x, -o.y, -o.z);
    edges?.translate(-o.x, -o.y, -o.z);
    fill.computeBoundingBox();
    fill.computeBoundingSphere();
    let pick: THREE.BufferGeometry | undefined;
    if (pickPad > 0 && fill.boundingBox) {
      const s = new THREE.Vector3();
      const c = new THREE.Vector3();
      fill.boundingBox.getSize(s);
      fill.boundingBox.getCenter(c);
      pick = new THREE.BoxGeometry(s.x + pickPad, s.y + pickPad, s.z + pickPad);
      pick.translate(c.x, c.y, c.z);
    }
    this.fills = [];
    this.lines = [];
    return {
      fill,
      edges,
      origin: o,
      explode: vec(explode),
      tone,
      motion,
      pick,
    };
  }
}

// ---------------------------------------------------------------- M01 core
function core(): SuitModule {
  const k = new Kit();
  const c: V3 = [0, 1.42, 0.06];
  // cage: top/bottom plates, four corner posts, side mounting tabs
  k.box(0.23, 0.016, 0.11, [0, 1.555, 0.06]);
  k.box(0.23, 0.016, 0.11, [0, 1.285, 0.06]);
  for (const x of [-0.108, 0.108])
    for (const z of [0.012, 0.108]) k.rod([x, 1.29, z], [x, 1.55, z], 0.006);
  k.box(0.03, 0.05, 0.05, [-0.132, 1.48, 0.03]);
  k.box(0.03, 0.05, 0.05, [0.132, 1.48, 0.03]);
  k.box(0.03, 0.05, 0.05, [-0.132, 1.36, 0.03]);
  k.box(0.03, 0.05, 0.05, [0.132, 1.36, 0.03]);
  // bus bars across the cell tops and bottoms
  k.box(0.19, 0.012, 0.014, [0, 1.535, 0.1]);
  k.box(0.19, 0.012, 0.014, [0, 1.305, 0.1]);
  for (const x of [-0.108, 0.108])
    for (const y of [1.555, 1.285]) k.nut([x, y + 0.012, 0.06], 'y', 0.01);
  const cage = k.piece(c, [0, 0.12, 0.95], 'frame', undefined, 0.06);

  // four cells, read as four domains
  for (const x of [-0.069, -0.023, 0.023, 0.069]) {
    k.cyl(0.019, 0.2, [x, 1.42, 0.06], 'y', 20);
    k.cyl(0.008, 0.012, [x, 1.526, 0.06], 'y', 12);
  }
  const cells = k.piece(c, [0, 0.12, 0.95], 'hot');
  return {
    pieces: [cage, cells],
    anchor: vec([0.1, 1.48, 0.1]),
    anchorPiece: 0,
  };
}

// -------------------------------------------------------------- M02 sensor
function sensor(): SuitModule {
  const k = new Kit();
  const o: V3 = [0, 1.9, 0];
  k.rod([0, 1.72, -0.08], [0, 1.85, -0.05], 0.018);
  k.cyl(0.032, 0.024, [0, 1.85, -0.05], 'y', 6, 20); // collar, hex
  k.torus(0.155, 0.007, [0, 1.93, 0]);
  k.torus(0.155, 0.005, [0, 1.93, 0], [0, 0, 0], PI); // half hoop, vertical
  for (const a of [PI * 0.5, PI * 1.17, PI * 1.83]) {
    k.rod(
      [0, 1.855, -0.05],
      [Math.cos(a) * 0.155, 1.93, Math.sin(a) * 0.155],
      0.005
    );
  }
  // stereo camera bar, two lenses, 120 mm-ish baseline
  k.box(0.21, 0.036, 0.042, [0, 1.9, 0.135]);
  k.cyl(0.015, 0.024, [-0.068, 1.9, 0.165], 'z', 20);
  k.cyl(0.015, 0.024, [0.068, 1.9, 0.165], 'z', 20);
  k.box(0.03, 0.012, 0.01, [0, 1.9, 0.16]);
  k.rod([0, 1.93, 0.155], [0, 1.9, 0.135], 0.004);
  // IMU board + antenna
  k.box(0.05, 0.012, 0.05, [0, 1.87, -0.0]);
  k.rod([0.11, 1.93, -0.09], [0.14, 2.17, -0.11], 0.0035);
  k.nut([0.14, 2.17, -0.11], 'y', 0.008);
  // lidar base
  k.cyl(0.05, 0.022, [0, 2.035, -0.01], 'y', 24);
  k.rod([0, 1.93, -0.01], [0, 2.024, -0.01], 0.01);
  const frame = k.piece(o, [0, 0.6, 0.1], 'frame', undefined, 0.06);

  // spinning lidar head (own pivot)
  k.cyl(0.042, 0.034, [0, 2.065, -0.01], 'y', 24);
  k.box(0.03, 0.014, 0.012, [0, 2.065, 0.033]);
  const head = k.piece([0, 2.065, -0.01], [0, 0.6, 0.1], 'hot', 'lidar');
  return {
    pieces: [frame, head],
    anchor: vec([0.07, 1.91, 0.15]),
    anchorPiece: 0,
  };
}

// --------------------------------------------------------------- M03 spine
function spine(): SuitModule {
  const k = new Kit();
  const z = -0.12;
  k.box(0.045, 0.76, 0.045, [0, 1.35, z]); // 20×20 extrusion
  for (let i = 0; i < 7; i++) {
    const y = 1.05 + i * 0.1;
    k.box(0.17, 0.038, 0.075, [0, y, z]);
    k.nut([-0.062, y, z + 0.04], 'z', 0.009);
    k.nut([0.062, y, z + 0.04], 'z', 0.009);
  }
  // shoulder yoke with bearing housings
  k.box(0.74, 0.045, 0.07, [0, 1.71, -0.1]);
  k.cyl(0.038, 0.05, [-0.37, 1.71, -0.08], 'x');
  k.cyl(0.038, 0.05, [0.37, 1.71, -0.08], 'x');
  // hip plate
  k.box(0.42, 0.06, 0.15, [0, 0.98, -0.06]);
  k.cyl(0.03, 0.04, [-0.2, 0.98, -0.04], 'x');
  k.cyl(0.03, 0.04, [0.2, 0.98, -0.04], 'x');
  // harness straps over the shoulders to the chest
  for (const s of [-1, 1]) {
    k.tube(
      [
        [s * 0.16, 1.7, -0.13],
        [s * 0.17, 1.765, -0.01],
        [s * 0.155, 1.63, 0.115],
        [s * 0.13, 1.32, 0.12],
        [s * 0.15, 1.06, 0.07],
      ],
      0.012
    );
  }
  // waist belt, open at the front
  const belt: V3[] = [];
  for (let i = 0; i <= 14; i++) {
    const a = 0.45 + (i / 14) * (PI * 2 - 0.9);
    belt.push([Math.sin(a) * 0.22, 1.06, Math.cos(a) * 0.15 - 0.02]);
  }
  k.tube(belt, 0.01);
  // cable runs from the core down the spine
  k.tube(
    [
      [-0.06, 1.33, 0.04],
      [-0.1, 1.28, -0.04],
      [-0.035, 1.22, -0.15],
      [-0.03, 1.0, -0.15],
    ],
    0.007
  );
  k.tube(
    [
      [0.06, 1.55, 0.04],
      [0.1, 1.62, -0.04],
      [0.035, 1.66, -0.15],
      [0.25, 1.73, -0.13],
    ],
    0.007
  );
  const p = k.piece([0, 1.35, z], [0, 0, -0.85]);
  return { pieces: [p], anchor: vec([0, 1.45, z - 0.04]), anchorPiece: 0 };
}

// ---------------------------------------------------------------- M04 arms
// Two pieces per side: the upper arm (fixed to the yoke) and the forearm, pivoting on the elbow servo,
// so the grip test can actually flex. Piece order: upper L, fore L, upper R, fore R.
function arm(s: number): Piece[] {
  const k = new Kit();
  const x = (v: number) => s * v;
  const ex: V3 = [s * 0.6, 0.06, 0.18];
  k.cyl(0.052, 0.07, [x(0.43), 1.69, -0.07], 'x', 20); // shoulder actuator
  k.cyl(0.03, 0.02, [x(0.475), 1.69, -0.07], 'x', 6, 20);
  k.rod([x(0.435), 1.645, -0.1], [x(0.455), 1.36, -0.055], 0.011);
  k.rod([x(0.435), 1.645, -0.02], [x(0.455), 1.36, 0.005], 0.011);
  k.bar([x(0.47), 1.62, -0.04], [x(0.475), 1.4, -0.02], 0.012, 0.07); // printed panel
  k.box(0.065, 0.075, 0.085, [x(0.455), 1.33, -0.025]); // elbow servo
  k.cyl(0.03, 0.012, [x(0.494), 1.33, -0.025], 'x', 20);
  k.nut([x(0.5), 1.33, -0.025], 'x', 0.009);
  k.tube(
    [
      [x(0.4), 1.72, -0.11],
      [x(0.49), 1.52, -0.08],
      [x(0.5), 1.36, -0.03],
    ],
    0.006
  );
  const upper = k.piece([x(0.45), 1.3, 0.0], ex, 'frame', undefined, 0.03);

  k.actuator([x(0.45), 1.3, 0.0], [x(0.462), 1.07, 0.105], 0.022);
  k.rod([x(0.485), 1.3, -0.01], [x(0.49), 1.08, 0.095], 0.006);
  k.bar([x(0.43), 1.27, 0.03], [x(0.44), 1.1, 0.1], 0.012, 0.055); // inner printed panel
  k.cyl(0.03, 0.02, [x(0.465), 1.055, 0.11], 'y', 20); // wrist
  k.box(0.07, 0.045, 0.045, [x(0.465), 1.015, 0.12]); // palm
  for (const dx of [-0.02, 0.02]) {
    k.bar(
      [x(0.465 + dx), 0.995, 0.135],
      [x(0.465 + dx), 0.94, 0.15],
      0.013,
      0.013
    );
    k.bar(
      [x(0.465 + dx), 0.94, 0.15],
      [x(0.465 + dx), 0.9, 0.132],
      0.012,
      0.012
    );
  }
  k.bar([x(0.465), 0.995, 0.1], [x(0.465), 0.945, 0.088], 0.014, 0.013); // opposing finger
  k.bar([x(0.465), 0.945, 0.088], [x(0.465), 0.91, 0.105], 0.012, 0.012);
  k.tube(
    [
      [x(0.5), 1.3, -0.01],
      [x(0.49), 1.18, 0.05],
      [x(0.48), 1.06, 0.1],
    ],
    0.006
  );
  const fore = k.piece([x(0.455), 1.33, -0.025], ex, 'frame', 'elbow', 0.03);
  return [upper, fore];
}

function arms(): SuitModule {
  return {
    pieces: [...arm(-1), ...arm(1)],
    anchor: vec([0.46, 1.17, 0.07]),
    anchorPiece: 3,
  };
}

// ------------------------------------------------------------ M05 gantry
const RAIL_Y = 2.38;
const GX = 0.82;
const ZF = 0.35;
const ZB = -0.55;
export const GANTRY = { y: RAIL_Y, x: GX, zf: ZF, zb: ZB };

function gantry(): SuitModule {
  const k = new Kit();
  for (const s of [-1, 1]) {
    for (const z of [ZF, ZB]) {
      k.box(0.045, RAIL_Y, 0.045, [s * GX, RAIL_Y / 2, z]);
      k.box(0.12, 0.012, 0.12, [s * GX, 0.006, z]);
    }
    k.box(0.04, 0.03, ZF - ZB, [s * GX, 0.02, (ZF + ZB) / 2]); // floor rail
    k.box(0.035, 0.035, ZF - ZB + 0.05, [s * GX, RAIL_Y, (ZF + ZB) / 2]); // Y rail
    k.box(0.008, 0.012, ZF - ZB - 0.06, [
      s * (GX - 0.035),
      RAIL_Y + 0.012,
      (ZF + ZB) / 2,
    ]); // belt run
    k.box(0.008, 0.012, ZF - ZB - 0.06, [
      s * (GX + 0.035),
      RAIL_Y + 0.012,
      (ZF + ZB) / 2,
    ]);
    k.box(0.07, 0.07, 0.07, [s * GX, RAIL_Y + 0.07, ZB - 0.01]); // stepper
    k.cyl(0.02, 0.03, [s * GX, RAIL_Y + 0.12, ZB - 0.01], 'y', 20); // drive pulley
    k.cyl(0.018, 0.03, [s * GX, RAIL_Y + 0.03, ZF], 'y', 20); // idler
    // cradle arm from the rear post to the yoke
    k.bar([s * GX, 1.71, ZB], [s * 0.42, 1.71, -0.1], 0.03, 0.03);
    k.nut([s * 0.42, 1.735, -0.1], 'y', 0.012);
  }
  k.box(GX * 2 + 0.05, 0.035, 0.035, [0, RAIL_Y, ZF]);
  k.box(GX * 2 + 0.05, 0.035, 0.035, [0, RAIL_Y, ZB]);
  const frame = k.piece([0, 1.2, (ZF + ZB) / 2], [0, 0.55, -0.25]);

  // X beam, slides in y (scene z)
  k.box(GX * 2 - 0.04, 0.03, 0.036, [0, RAIL_Y - 0.02, 0]);
  k.box(GX * 2 - 0.1, 0.01, 0.006, [0, RAIL_Y - 0.002, 0.024]);
  k.box(GX * 2 - 0.1, 0.01, 0.006, [0, RAIL_Y - 0.002, -0.024]);
  for (const s of [-1, 1])
    k.box(0.06, 0.05, 0.07, [s * (GX - 0.02), RAIL_Y - 0.02, 0]);
  const beam = k.piece([0, RAIL_Y - 0.02, 0], [0, 0.55, -0.25], 'frame', 'bar');

  // carriage + scan head, slides in x along the beam
  k.box(0.09, 0.05, 0.08, [0, RAIL_Y - 0.06, 0]);
  k.cyl(0.018, 0.05, [0, RAIL_Y - 0.11, 0], 'y', 20);
  const carriage = k.piece(
    [0, RAIL_Y - 0.06, 0],
    [0, 0.55, -0.25],
    'hot',
    'carriage'
  );

  // scan beam cone under the head
  k.cone(0.006, 0.2, 0.62, [0, RAIL_Y - 0.44, 0]);
  const beamCone = k.piece(
    [0, RAIL_Y - 0.06, 0],
    [0, 0.55, -0.25],
    'beam',
    'carriage'
  );

  return {
    pieces: [frame, beam, carriage, beamCone],
    anchor: vec([GX, 1.95, ZF]),
    anchorPiece: 0,
  };
}

// --------------------------------------------------------------- M06 boots
function leg(s: number): Piece[] {
  const k = new Kit();
  const x = (v: number) => s * v;
  k.cyl(0.048, 0.07, [x(0.235), 0.96, -0.04], 'x', 20); // hip actuator
  k.rod([x(0.205), 0.93, -0.075], [x(0.18), 0.57, -0.01], 0.012);
  k.rod([x(0.205), 0.93, 0.0], [x(0.18), 0.57, 0.06], 0.012);
  k.bar([x(0.2), 0.9, 0.045], [x(0.18), 0.63, 0.085], 0.085, 0.012); // thigh panel
  k.cyl(0.05, 0.085, [x(0.175), 0.54, 0.025], 'x', 22); // knee actuator
  k.cyl(0.026, 0.02, [x(0.225), 0.54, 0.025], 'x', 6, 20);
  k.actuator([x(0.17), 0.5, -0.03], [x(0.162), 0.17, -0.06], 0.02, 0.6);
  k.rod([x(0.175), 0.5, 0.055], [x(0.162), 0.14, 0.025], 0.011);
  k.bar([x(0.172), 0.47, 0.075], [x(0.164), 0.2, 0.05], 0.08, 0.012); // shin panel
  // EDF duct on the calf, thrust axis down
  k.shell(0.05, 0.085, [x(0.17), 0.33, -0.125]);
  k.torus(0.05, 0.006, [x(0.17), 0.373, -0.125]);
  k.cyl(0.016, 0.06, [x(0.17), 0.33, -0.125], 'y', 16);
  k.bar([x(0.17), 0.33, -0.075], [x(0.17), 0.33, -0.04], 0.012, 0.03);
  k.cyl(0.03, 0.045, [x(0.162), 0.11, -0.02], 'x', 20); // ankle
  k.box(0.115, 0.034, 0.27, [x(0.162), 0.03, 0.045]); // foot plate
  k.box(0.1, 0.05, 0.06, [x(0.162), 0.065, -0.06]); // heel block
  k.bar([x(0.11), 0.05, 0.1], [x(0.214), 0.05, 0.1], 0.016, 0.016); // strap
  k.nut([x(0.1), 0.05, 0.1], 'x', 0.009);
  k.tube(
    [
      [x(0.12), 0.98, -0.1],
      [x(0.15), 0.72, -0.08],
      [x(0.15), 0.42, -0.1],
      [x(0.17), 0.38, -0.12],
    ],
    0.006
  );
  const ex: V3 = [s * 0.2, -0.32, 0.4];
  const limb = k.piece([x(0.17), 0.5, 0.0], ex, 'frame', undefined, 0.02);
  // rotor: five blades
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2;
    k.box(
      0.036,
      0.006,
      0.012,
      [x(0.17) + Math.cos(a) * 0.026, 0.335, -0.125 + Math.sin(a) * 0.026],
      [0.5, -a, 0]
    );
  }
  const rotor = k.piece([x(0.17), 0.335, -0.125], ex, 'hot', 'rotor');
  return [limb, rotor];
}

function boots(): SuitModule {
  return {
    pieces: [...leg(-1), ...leg(1)],
    anchor: vec([0.2, 0.54, 0.05]),
    anchorPiece: 2,
  };
}

export function buildSuit(): SuitModule[] {
  return [core(), sensor(), spine(), arms(), gantry(), boots()];
}
