import * as THREE from 'three';
import type { Tracker } from '../tracking/points';

/*
 * A low-poly swift built from primitives, no model file. The bird faces −x, +y is up, and the wings reach along ±z,
 * the +z wing nearest the camera. Lengths are in body units: the body is 1.3 long, each wing 1.4 from shoulder to
 * tip. Every joint is a Group, so `pose()` turns the wings at the shoulder and the elbow, sweeps them back, opens
 * the tail, and rolls, yaws, pitches and bobs the whole bird; nothing else ever touches the meshes.
 */
export type Pose = { shoulder: number; elbow: number; wrist: number; sweep: number; tail: number; bob: number; roll: number; yaw: number; pitch: number }; // degrees; bob in units
export type Bird = { group: THREE.Group; spark: THREE.Object3D; trackers: Tracker[]; pose: (pose: Pose) => void; dispose: () => void };

const rad = (deg: number) => deg * Math.PI / 180;
const SHOULDER = new THREE.Vector3(-.12, .12, .15);
const INNER = { root: .42, tip: .36, length: .55, sweep: .02 };   // shoulder to elbow
const OUTER = { root: .34, tip: .05, length: .85, sweep: .4 };    // elbow to the pointed tip, swept back
const DROOP = 14;                                                 // the trailing strip's tilt, degrees
const BODY = [[0, -.65], [.07, -.56], [.14, -.38], [.19, -.14], [.2, .1], [.17, .34], [.1, .52], [0, .63]]; // radius, along the body
const SEGMENTS = 9;                                               // around the body: faceted, not smooth
const HEAD_STEADY = .7;                                           // how much of the body's rise and pitch the head does not follow

/** A flat tapered blade along +z, its chord across x with the leading edge toward −x and the tip swept toward +x.
 * Two strips: the trailing one droops, so a flat-shaded wing reads as two tones, like a feathered surface. */
function blade({ root, tip, length, sweep }: typeof INNER) {
  const lead = (c: number) => -c * .45, mid = (c: number) => c * .05, trail = (c: number) => c * .55;
  const drop = Math.tan(rad(DROOP));
  const v: number[] = [];
  const quad = (...p: number[][]) => v.push(...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3]);
  quad([lead(root), 0, 0], [mid(root), 0, 0], [mid(tip) + sweep, 0, length], [lead(tip) + sweep, 0, length]);
  quad([mid(root), 0, 0], [trail(root), -(trail(root) - mid(root)) * drop, 0], [trail(tip) + sweep, -(trail(tip) - mid(tip)) * drop, length], [mid(tip) + sweep, 0, length]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** A thin tail feather from (x0, z0) to (x1, z1) in the body's plane, `width` wide at its root and half that at its end. */
function feather(x0: number, z0: number, x1: number, z1: number, width: number) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    x0, 0, z0 - width / 2, x0, 0, z0 + width / 2, x1, 0, z1 + width / 4,
    x0, 0, z0 - width / 2, x1, 0, z1 + width / 4, x1, 0, z1 - width / 4,
  ], 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function buildBird(): Bird {
  // Yellow, not white: the renderer reads brightness from red and keeps blue as its mark for always-navy parts.
  const skin = new THREE.MeshLambertMaterial({ color: 0xffff00, flatShading: true, side: THREE.DoubleSide });
  const geometries: THREE.BufferGeometry[] = [];
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material = skin) => { geometries.push(geometry); return new THREE.Mesh(geometry, material); };
  const group = new THREE.Group();

  // The body is a lathe along +y, turned so its head end points forward (−x); the head, beak and tail attach to it.
  const body = mesh(new THREE.LatheGeometry(BODY.map(([r, y]) => new THREE.Vector2(r, y)), SEGMENTS));
  body.rotation.z = Math.PI / 2;
  const head = mesh(new THREE.SphereGeometry(.16, 8, 6));
  head.position.set(-.68, .1, 0);
  const beak = mesh(new THREE.ConeGeometry(.04, .42, 6));
  beak.rotation.z = Math.PI / 2;
  beak.position.set(-1.0, .09, 0);
  // The floating dot ahead of the beak: a point the renderer puts on exactly one cell, so it never splits into two.
  const spark = new THREE.Object3D();
  spark.position.set(-1.36, .14, 0);
  // The tail's two feathers pivot at its root, so the fork opens and closes.
  const tail = new THREE.Group();
  tail.position.x = .58;
  const feathers = [new THREE.Group(), new THREE.Group()];
  feathers[0].add(mesh(feather(0, .03, .42, .2, .09)));
  feathers[1].add(mesh(feather(0, -.03, .42, -.2, .09)));
  tail.add(...feathers);
  // The head, beak and spark hang from a neck that takes back most of the body's rise and pitch: the head stays steadier.
  const neck = new THREE.Group();
  neck.add(head, beak, spark);
  group.add(body, neck, tail);

  // A wing: the shoulder joint holding the inner blade and the elbow joint, which holds the outer blade.
  const wing = () => {
    const shoulder = new THREE.Group(), elbow = new THREE.Group();
    shoulder.position.copy(SHOULDER);
    elbow.position.set(0, 0, INNER.length);
    shoulder.add(mesh(blade(INNER)), elbow);
    elbow.add(mesh(blade(OUTER)));
    return { shoulder, elbow };
  };
  const right = wing(), left = wing();
  const mirror = new THREE.Group();
  mirror.scale.z = -1;
  mirror.add(left.shoulder);
  group.add(right.shoulder, mirror);

  // Tracked points for the overlay, the key ones first: the beak, the head, the wing tips, the tail, then the rest.
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const trackers: Tracker[] = [
    { object: beak, local: V(0, .21, 0), key: 'BEAK' }, { object: head, local: V(0, .1, 0), key: 'HEAD' },
    { object: right.elbow, local: V(OUTER.sweep, 0, OUTER.length), key: 'WING TIP' }, { object: feathers[0], local: V(.42, 0, .2), key: 'TAIL' }, { object: left.elbow, local: V(OUTER.sweep, 0, OUTER.length), key: 'WING TIP' },
    { object: head, local: V(-.05, .05, .13) }, { object: right.shoulder, local: V(0, 0, 0) }, { object: left.shoulder, local: V(0, 0, 0) }, { object: right.elbow, local: V(0, 0, 0) }, { object: left.elbow, local: V(0, 0, 0) },
    { object: feathers[1], local: V(.42, 0, -.2) }, { object: body, local: V(.22, 0, 0) }, { object: body, local: V(0, .5, .1) }, { object: body, local: V(0, .2, .19) }, { object: body, local: V(0, -.2, .17) }, { object: body, local: V(0, -.5, .08) },
    { object: right.shoulder, local: V(0, 0, .3) }, { object: left.shoulder, local: V(0, 0, .3) }, { object: right.elbow, local: V(.15, 0, .45) }, { object: left.elbow, local: V(.15, 0, .45) },
    { object: right.shoulder, local: V(-.15, 0, .15) }, { object: right.elbow, local: V(.3, 0, .7) }, { object: body, local: V(-.2, .1, 0) }, { object: head, local: V(.05, .12, 0) },
  ];
  return {
    group, spark, trackers,
    pose(p) {
      for (const w of [right, left]) {
        w.shoulder.rotation.set(-rad(p.shoulder), rad(p.sweep), 0);
        w.elbow.rotation.set(-rad(p.elbow), rad(p.wrist), 0);
      }
      feathers[0].rotation.y = -rad(p.tail / 2);
      feathers[1].rotation.y = rad(p.tail / 2);
      group.rotation.set(rad(p.roll), rad(p.yaw), rad(p.pitch));
      group.position.y = p.bob;
      neck.position.y = -p.bob * HEAD_STEADY;
      neck.rotation.z = -rad(p.pitch) * HEAD_STEADY;
    },
    dispose() { geometries.forEach(g => g.dispose()); skin.dispose(); },
  };
}
