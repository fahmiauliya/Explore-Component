import * as THREE from 'three';
import type { Tracker } from '../tracking/points';
import { asym, lagged } from '../dot/wave';

/*
 * A manta ray built from code: one subdivided sheet for the body and the pectoral fins, a wide pointed diamond
 * thicker at its middle, two small cephalic lobes ahead of the mouth, and a thin tail of short rods. It faces −x
 * like the bird, +y is up, the fins reach along ±z. The sheet's points are placed every update, so the fins carry a
 * travelling wave out to the tips and front to back, the body bobs and banks, and the tail trails with a lag.
 */
export type MantaValues = { finSpan: number; waveDuration: number; waveAmplitude: number; bankAmount: number; tailSway: number; bodyBob: number };
export const MANTA = {
  thick: .1,                   // the body's rise at its middle (the length, nose to tail root, is the unit)
  across: 28, along: 12,       // the sheet's segments across the span and along the chord
  outward: 2.6, backward: 1.4, // the wave's lag toward the tips and toward the trailing edge, radians: the tips move last
  power: .45,                  // the downstroke's share of the cycle, a little quicker than the upstroke
  pitch: 2.5,                  // the body pitches this much with each stroke, degrees
  tailLag: 4,                  // updates the tail's root is behind the fins
  tipPower: 1.6,               // the wave grows as (distance from the body)^tipPower: the tips move most
  lobe: { length: .3, width: .1, at: .14 },                               // the cephalic fins
  tail: { segments: 9, length: .2, radius: .014, lag: .8, lift: .35 },    // the tail: rods, each well behind the one before
  rollPeriod: 1.6,             // the bank's period, × the wave's
};
const rad = (deg: number) => deg * Math.PI / 180;
// The planform: the leading edge sweeps back from the nose, the trailing edge forward from the tail root, and
// they meet at the pointed tip, so the fins are far wider than the body is long.
const leading = (a: number) => -.5 + .5 * a ** 1.2, trailing = (a: number) => .5 - .5 * a ** .8;

export type Manta = { group: THREE.Group; trackers: Tracker[]; pose: (u: number, v: MantaValues, amplitude: number) => void; dispose: () => void };

export function buildManta(): Manta {
  // Yellow, not white: the renderer reads brightness from red and keeps blue as its mark for always-navy parts.
  const skin = new THREE.MeshLambertMaterial({ color: 0xffff00, flatShading: true, side: THREE.DoubleSide });
  const navy = new THREE.MeshBasicMaterial({ color: 0x0000ff });   // the tail: too thin to cover a cell, so it is marked navy
  const group = new THREE.Group();
  const { across: nu, along: nv } = MANTA;

  // The body and fins: (nu + 1) × (nv + 1) points, placed by update().
  const positions = new Float32Array((nu + 1) * (nv + 1) * 3);
  const index: number[] = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; index.push(a, c, b, b, c, d); }
  const sheet = new THREE.BufferGeometry(), attribute = new THREE.BufferAttribute(positions, 3);
  attribute.setUsage(THREE.DynamicDrawUsage);
  sheet.setAttribute('position', attribute);
  sheet.setIndex(index);
  sheet.computeVertexNormals();
  const body = new THREE.Mesh(sheet, skin);
  body.frustumCulled = false;                                        // its bounds move every update

  // The cephalic lobes: small blades pointing forward from the head, drooping a little.
  const lobe = (side: number) => {
    const { length, width, at } = MANTA.lobe, z = side * at, w = side * width;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, z - w / 2, 0, 0, z + w / 2, -length, -.03, z + w / 4,
      0, 0, z - w / 2, -length, -.03, z + w / 4, -length, -.03, z - w / 4,
    ], 3));
    const mesh = new THREE.Mesh(geometry, skin);
    mesh.position.set(-.5, .01, 0);
    return mesh;
  };
  const lobes = [lobe(1), lobe(-1)];

  // The tail: a chain of joints from the tail root, each rod tapering toward the end.
  const tail = new THREE.Group();
  tail.position.set(.5, .01, 0);
  tail.rotation.z = -rad(12);                                        // it trails a little below the body's plane
  const joints: THREE.Group[] = [];
  let parent: THREE.Object3D = tail;
  for (let k = 0; k < MANTA.tail.segments; k++) {
    const joint = new THREE.Group(), taper = 1 - k / MANTA.tail.segments;
    joint.position.x = k ? MANTA.tail.length : 0;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(MANTA.tail.radius * (taper - 1 / MANTA.tail.segments), MANTA.tail.radius * taper, MANTA.tail.length, 5), navy);
    rod.rotation.z = -Math.PI / 2;                                   // the rod's axis along +x
    rod.position.x = MANTA.tail.length / 2;
    joint.add(rod);
    parent.add(joint);
    joints.push(joint);
    parent = joint;
  }
  group.add(body, ...lobes, tail);
  // Tracked points: sheet vertices by (across, along) index, the lobes' tips and the tail's joints; key ones first.
  const at = (i: number, j: number) => ({ object: body, vertex: { attribute, index: j * (nu + 1) + i } });
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const trackers: Tracker[] = [
    { ...at(nu / 2, 0), key: 'NOSE' }, { ...at(nu, 0), key: 'FIN R' }, { ...at(0, 0), key: 'FIN L' }, { object: joints[joints.length - 1], local: V(MANTA.tail.length, 0, 0), key: 'TAIL' }, { ...at(nu / 2, nv / 2), key: 'CENTRE' },
    { object: lobes[0], local: V(-MANTA.lobe.length, -.03, MANTA.lobe.at) }, { object: lobes[1], local: V(-MANTA.lobe.length, -.03, -MANTA.lobe.at) },
    at(nu / 4, 0), at(3 * nu / 4, 0), at(nu / 4, nv), at(3 * nu / 4, nv), at(nu / 2, nv), at(nu / 8, nv / 2), at(7 * nu / 8, nv / 2), at(nu / 4, nv / 2), at(3 * nu / 4, nv / 2),
    ...joints.filter((_, k) => k % 2 === 0).map(joint => ({ object: joint, local: V(0, 0, 0) })),
    at(3 * nu / 8, 0), at(5 * nu / 8, 0), at(3 * nu / 8, nv), at(5 * nu / 8, nv), at(nu / 2, nv / 4), at(nu / 2, 3 * nv / 4), at(1, nv / 4), at(nu - 1, nv / 4),
  ];

  return {
    group, trackers,
    // At a cycle position u (one per wave): the stroke's angle, quick down and slower up; the tail reads the cycle a few updates back.
    pose(u, v, amplitude) {
      const span = v.finSpan / 2, phase = asym(u, MANTA.power), tailPhase = asym(lagged(u, v.waveDuration, MANTA.tailLag), MANTA.power);
      let p = 0;
      for (let j = 0; j <= nv; j++) {
        const t = j / nv;                                            // 0 the leading edge, 1 the trailing
        for (let i = 0; i <= nu; i++) {
          const u = i / nu * 2 - 1, a = Math.abs(u);                 // −1 … 1 across the span, a its distance from the body
          positions[p++] = leading(a) + t * (trailing(a) - leading(a));
          positions[p++] = MANTA.thick * (1 - a) ** 2 * 4 * t * (1 - t) + v.waveAmplitude * amplitude * a ** MANTA.tipPower * Math.sin(phase - MANTA.outward * a - MANTA.backward * t);
          positions[p++] = u * span;
        }
      }
      attribute.needsUpdate = true;
      sheet.computeBoundingSphere();                                   // the ray test needs the sheet's current bounds
      // The tail follows the wave a little late, each joint later than the one before, sideways and up.
      joints.forEach((joint, k) => {
        const lag = tailPhase - MANTA.tail.lag * (k + 1), sway = rad(v.tailSway) / MANTA.tail.segments;
        joint.rotation.y = sway * Math.sin(lag);
        joint.rotation.z = sway * MANTA.tail.lift * Math.cos(lag);
      });
      group.position.y = -v.bodyBob * Math.cos(phase - MANTA.outward - MANTA.backward / 2);  // up as the tips come down
      group.rotation.x = rad(v.bankAmount) * Math.sin(2 * Math.PI * u / MANTA.rollPeriod);
      group.rotation.z = rad(MANTA.pitch) * Math.sin(phase - .8);                             // the body pitches gently with each stroke
    },
    dispose() { sheet.dispose(); lobes.forEach(l => l.geometry.dispose()); joints.forEach(j => (j.children[0] as THREE.Mesh).geometry.dispose()); skin.dispose(); navy.dispose(); },
  };
}
