// Rivet: the bench assistant. A palm-sized quad with one camera eye, a whip antenna
// and prop guards. It follows the module being seated, looks at your cursor,
// dodges when you get close, and talks in the dialogue strip.

import * as THREE from 'three';
import { Kit } from './suit';

export type DroneParts = {
  /** world placement (position, scale) */
  root: THREE.Group;
  /** bank + flip */
  tilt: THREE.Group;
  /** faces the look target */
  head: THREE.Group;
  rotors: THREE.Object3D[];
  eye: THREE.Mesh;
  eyeMat: THREE.MeshBasicMaterial;
  bodyMats: THREE.Material[];
  hit: THREE.Mesh;
  dispose(): void;
};

const HUBS: [number, number][] = [
  [0.07, 0.055],
  [-0.07, 0.055],
  [0.07, -0.055],
  [-0.07, -0.055],
];

export function buildDrone(
  fill: THREE.Material,
  edge: THREE.LineBasicMaterial
): DroneParts {
  const trash: { dispose(): void }[] = [];
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  const head = new THREE.Group();
  root.add(tilt);
  tilt.add(head);

  const mesh = (k: Kit, at: [number, number, number] = [0, 0, 0]) => {
    const p = k.piece(at, [0, 0, 0]);
    const g = new THREE.Group();
    g.position.copy(p.origin);
    g.add(new THREE.Mesh(p.fill, fill));
    if (p.edges) g.add(new THREE.LineSegments(p.edges, edge));
    trash.push(p.fill);
    if (p.edges) trash.push(p.edges);
    return g;
  };

  // body: a rounded pod, top cap, four arms, landing skids
  const k = new Kit();
  k.box(0.07, 0.03, 0.06, [0, 0, 0]);
  k.cyl(0.026, 0.016, [0, 0.022, -0.004], 'y', 20);
  for (const [x, z] of HUBS) {
    k.rod([0, 0, 0], [x, 0.004, z], 0.0045, 8);
    k.cyl(0.008, 0.014, [x, 0.008, z], 'y', 10);
  }
  for (const x of [-0.024, 0.024]) {
    k.rod([x, -0.015, 0.012], [x * 1.5, -0.04, 0.02], 0.0025, 6);
    k.rod([x * 1.5, -0.04, -0.03], [x * 1.5, -0.04, 0.03], 0.0025, 6);
  }
  // whip antenna with a ball tip
  k.rod([-0.02, 0.028, -0.02], [-0.03, 0.085, -0.03], 0.002, 6);
  k.cyl(0.005, 0.008, [-0.03, 0.088, -0.03], 'y', 10);
  // eye housing (faces +z)
  k.cyl(0.02, 0.014, [0, 0.002, 0.034], 'z', 22);
  head.add(mesh(k));

  // prop guards + rotors
  const rotors: THREE.Object3D[] = [];
  for (const [x, z] of HUBS) {
    const g = new Kit();
    g.torus(0.034, 0.0025, [x, 0.016, z]);
    head.add(mesh(g));
    const r = new Kit();
    r.box(0.056, 0.002, 0.008, [x, 0.017, z], [0.12, 0, 0]);
    const rotor = mesh(r, [x, 0.017, z]);
    head.add(rotor);
    rotors.push(rotor);
  }

  // the eye: a lit lens that blinks and pulses when Rivet talks
  const eyeGeo = new THREE.CircleGeometry(0.012, 24);
  const eyeMat = new THREE.MeshBasicMaterial({
    color: '#ffc061',
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const eye = new THREE.Mesh(eyeGeo, eyeMat);
  eye.position.set(0, 0.002, 0.0415);
  head.add(eye);
  trash.push(eyeGeo, eyeMat);

  // generous invisible hit sphere so a thumb can find it
  const hitGeo = new THREE.SphereGeometry(0.11, 12, 8);
  const hitMat = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: false,
    transparent: true,
    opacity: 0,
  });
  const hit = new THREE.Mesh(hitGeo, hitMat);
  root.add(hit);
  trash.push(hitGeo, hitMat);

  return {
    root,
    tilt,
    head,
    rotors,
    eye,
    eyeMat,
    bodyMats: [fill, edge],
    hit,
    dispose: () => trash.forEach((t) => t.dispose()),
  };
}
