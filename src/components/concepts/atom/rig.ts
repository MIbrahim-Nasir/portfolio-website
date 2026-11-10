// Geometry of the orbits and the camera keyframes in world space.
// Chapters that study an orbit give their camera in that orbit's own frame (elevation measured
// from the ring plane), so every shot reads the ring the same way however it is tilted.
// Fact anchors (stations) are then spread across the near arc of the ring, facing the camera.

import * as THREE from 'three';
import { chapters, rings, type Cam } from './data';

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export const ringQ = rings.map((r) =>
  new THREE.Quaternion().setFromEuler(
    new THREE.Euler(rad(r.incl), rad(r.node), 0, 'YXZ')
  )
);

// local ring lies in XZ: point(θ) = (r cosθ, 0, −r sinθ)
export function ringPoint(
  i: number,
  thDeg: number,
  target = new THREE.Vector3(),
  lift = 0
) {
  const th = rad(thDeg);
  const r = rings[i].r;
  return target
    .set(r * Math.cos(th), lift, -r * Math.sin(th))
    .applyQuaternion(ringQ[i]);
}

function build(narrow: boolean) {
  const keys: Cam[] = [];
  const near: number[] = [];
  let prevAz = 0;
  chapters.forEach((c, n) => {
    const base = narrow && c.camN ? { ...c.cam, ...c.camN } : { ...c.cam };
    let az = base.az;
    let el = base.el;
    let { tx, ty, tz } = base;
    let thNear = 0;
    if (c.frame === 'ring' && c.ring >= 0) {
      const d = new THREE.Vector3(
        Math.cos(rad(el)) * Math.sin(rad(az)),
        Math.sin(rad(el)),
        Math.cos(rad(el)) * Math.cos(rad(az))
      ).applyQuaternion(ringQ[c.ring]);
      // nearest point of the ring to the camera, in ring angle
      thNear = base.az - 90;
      az = deg(Math.atan2(d.x, d.z));
      el = deg(Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)));
      if (c.aim) {
        const p = ringPoint(c.ring, thNear);
        tx += p.x * c.aim;
        ty += p.y * c.aim;
        tz += p.z * c.aim;
      }
    }
    // keep the orbit turning one way: pick the turn closest to "a bit further on"
    if (n > 0) az += 360 * Math.round((prevAz + 50 - az) / 360);
    prevAz = az;
    keys.push({ ...base, az, el, tx, ty, tz });
    near.push(thNear);
  });
  return { keys, near };
}

export const KEYS = { wide: build(false), narrow: build(true) };

// station angles: given explicitly, or fanned across the near arc
export const stationTh: Record<string, number> = {};
chapters.forEach((c, n) => {
  const list = c.stations ?? [];
  const spread = c.spread ?? 150;
  list.forEach((s, k) => {
    const th =
      s.th ??
      KEYS.wide.near[n] +
        (list.length > 1 ? (k / (list.length - 1) - 0.5) * spread : 0);
    stationTh[`${c.id}:${s.k}`] = th;
  });
});
