import * as THREE from 'three';
import type { Tracker } from '../tracking/points';
import { asym, lagged, unit } from '../dot/wave';

/*
 * A butterfly built from code: a segmented body with a small round head, two thin curved antennae with tips, and
 * two pairs of wings, large triangular forewings with a rounded outer edge and smaller rounded hindwings with a
 * short tail point, each a subdivided sheet placed every update so it can bend. Dark bands along the outer edges
 * and a few spots, in the renderer's navy mark, give the wings tone. It faces −x, +y is up, the right wings +z
 * nearest the camera, and it flutters in place: the wings fold up almost touching, then spread wide, the
 * hindwings a little behind, the body bobs on each downstroke and drifts. Lengths are in body lengths.
 */
export const BUTTERFLY = {
  flap: .3,                    // seconds per flap
  fold: 88,                    // the forewings' angle when clapped up, degrees; 0 is spread wide
  power: .35,                  // the fling open's share of the cycle: fast; the close takes the rest
  hindLag: .7,                 // the hindwings' lag, radians
  curl: .1,                    // the wing tips' bend, body lengths, lagging the stroke
  bob: .05,                    // the body's dip on each downstroke
  stroke: 8,                   // the body pitches up this much through the downstroke, degrees
  erratic: { lift: .14, heading: 16 },   // the sudden lifts and drops each cycle, body lengths, and the heading's wobble, degrees
  antennaeLag: 3,              // updates the antennae are behind
  drift: { amount: .08, period: 2.3 }, pitch: { amount: 5, period: 3.1 }, roll: { amount: 3, period: 2.7 },
  fore: { span: .85, along: 8, across: 5 }, hind: { span: .55, along: 7, across: 4 },
};
const rad = (deg: number) => deg * Math.PI / 180;
// The wings' planforms: the leading edge and the chord along the span (s 0 at the root, 1 at the tip).
const FORE = { leading: (s: number) => -.1 - .2 * s, chord: (s: number) => .3 * Math.sqrt(Math.max(0, 1 - s ** 3)) };
const HIND = { leading: (s: number) => .06 + .04 * s, chord: (s: number) => .24 * Math.sqrt(Math.max(0, 1 - s * s)) + .14 * Math.exp(-(((s - .4) / .1) ** 2)) };  // with a tail point
const SPOTS = [[.55, .5], [.72, .3], [.4, .72]];   // on the forewing, (span, chord)

export type Butterfly = { group: THREE.Group; trackers: Tracker[]; pose: (u: number, amplitude: number) => void; dispose: () => void };

export function buildButterfly(): Butterfly {
  const skin = new THREE.MeshLambertMaterial({ color: 0xffff00, flatShading: true, side: THREE.DoubleSide });  // brightness in red; see the renderer
  const mark = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide });                       // always navy
  const geometries: THREE.BufferGeometry[] = [];
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material = skin) => { geometries.push(geometry); return new THREE.Mesh(geometry, material); };
  const group = new THREE.Group();

  // The body: a round head and a run of segments shrinking toward the tail.
  const head = mesh(new THREE.SphereGeometry(.05, 8, 6));
  head.position.x = -.32;
  const segments = [[-.16, .075, 1.3], [.03, .06, 1.2], [.16, .05, 1.2], [.28, .038, 1.3], [.37, .025, 1.2]].map(([x, r, stretch]) => { const s = mesh(new THREE.SphereGeometry(r, 7, 5)); s.position.x = x; s.scale.x = stretch; return s; });
  // The antennae: thin tubes along a curve forward, up and out, with a small tip.
  const tips: THREE.Mesh[] = [], feelers = new THREE.Group();    // the antennae on one pivot at the head, so they can trail
  feelers.position.set(-.34, .04, 0);
  const antennae = [1, -1].map(side => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, side * .015), new THREE.Vector3(-.21, .18, side * .12), new THREE.Vector3(-.28, .24, side * .2));
    const antenna = mesh(new THREE.TubeGeometry(curve, 8, .006, 4)), tip = mesh(new THREE.SphereGeometry(.014, 5, 4));
    tip.position.copy(curve.getPoint(1));
    tips.push(tip);
    feelers.add(antenna, tip);
    return antenna;
  });
  group.add(head, ...segments, feelers);

  // A wing: a sheet of along × across points placed by `place()`, a band along the outer edge, and spots, placed too.
  const sheet = (along: number, across: number) => {
    const positions = new Float32Array((along + 1) * (across + 1) * 3), index: number[] = [];
    for (let j = 0; j < across; j++) for (let i = 0; i < along; i++) { const a = j * (along + 1) + i, b = a + 1, c = a + along + 1, d = c + 1; index.push(a, c, b, b, c, d); }
    const geometry = new THREE.BufferGeometry(), attribute = new THREE.BufferAttribute(positions, 3);
    attribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', attribute);
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    return { geometry, attribute, positions, along, across };
  };
  type Sheet = ReturnType<typeof sheet>;
  const wing = (plan: typeof FORE, spec: { span: number; along: number; across: number }, spots: number[][]) => {
    const body = sheet(spec.along, spec.across), band = sheet(spec.along, 1), discs = spots.map(() => sheet(6, 1));
    const piece = new THREE.Group();
    piece.add(mesh(body.geometry), mesh(band.geometry, mark), ...discs.map(d => mesh(d.geometry, mark)));
    const place = (s: number, v: number, curl: number, out: Float32Array | number[], at: number) => { out[at] = plan.leading(s) + v * plan.chord(s); out[at + 1] = curl * s * s; out[at + 2] = s * spec.span; };
    const fill = (sh: Sheet, from: number, to: number, curl: number, lift: number) => { let p = 0; for (let j = 0; j <= sh.across; j++) for (let i = 0; i <= sh.along; i++) { place(i / sh.along, from + (to - from) * j / sh.across, curl, sh.positions, p); sh.positions[p + 1] += lift; p += 3; } sh.attribute.needsUpdate = true; sh.geometry.computeBoundingSphere(); };
    return {
      piece,
      update(curl: number) {
        fill(body, 0, 1, curl, 0);
        fill(band, .86, 1, curl, .004);
        discs.forEach((disc, k) => {
          const [s0, v0] = spots[k], p = disc.positions, r = .035;
          for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2; place(s0 + Math.cos(a) * r / spec.span, v0 + Math.sin(a) * r / plan.chord(s0), curl, p, i * 3); p[i * 3 + 1] += .004; place(s0, v0, curl, p, (7 + i) * 3); p[(7 + i) * 3 + 1] += .004; }
          disc.attribute.needsUpdate = true;
        });
      },
      at: (s: number, v: number) => { const out = [0, 0, 0]; place(s, v, 0, out, 0); return new THREE.Vector3(out[0], out[1], out[2]); },
    };
  };
  // Each side: the forewing and the hindwing on their own hinges along the body; the left side is the right mirrored.
  const sides = [1, -1].map(side => {
    const mirror = new THREE.Group();
    mirror.scale.z = side;
    const fore = new THREE.Group(), hind = new THREE.Group(), foreWing = wing(FORE, BUTTERFLY.fore, SPOTS), hindWing = wing(HIND, BUTTERFLY.hind, [[.45, .45]]);
    fore.position.set(-.1, .02, .04);
    hind.position.set(.06, .015, .04);
    fore.add(foreWing.piece);
    hind.add(hindWing.piece);
    mirror.add(fore, hind);
    group.add(mirror);
    return { fore, hind, foreWing, hindWing };
  });
  const [right, left] = sides;
  const trackers: Tracker[] = [
    { object: head, local: new THREE.Vector3(0, .03, 0), key: 'HEAD' }, { object: right.fore, local: right.foreWing.at(1, .5), key: 'WING' }, { object: left.fore, local: left.foreWing.at(1, .5), key: 'WING' },
    { object: segments[4], local: new THREE.Vector3(0, 0, 0), key: 'TAIL' }, { object: tips[0], local: new THREE.Vector3(0, 0, 0), key: 'ANTENNA' },
    { object: tips[1], local: new THREE.Vector3(0, 0, 0) }, { object: right.hind, local: right.hindWing.at(.4, 1) }, { object: left.hind, local: left.hindWing.at(.4, 1) },
    { object: right.fore, local: right.foreWing.at(.5, .5) }, { object: left.fore, local: left.foreWing.at(.5, .5) }, { object: right.hind, local: right.hindWing.at(.5, .4) }, { object: left.hind, local: left.hindWing.at(.5, .4) },
    { object: right.fore, local: right.foreWing.at(.75, .2) }, { object: left.fore, local: left.foreWing.at(.75, .2) }, { object: right.fore, local: right.foreWing.at(.3, .9) }, { object: left.fore, local: left.foreWing.at(.3, .9) },
    { object: segments[1], local: new THREE.Vector3(0, .05, 0) }, { object: segments[0], local: new THREE.Vector3(0, .07, 0) }, { object: right.hind, local: right.hindWing.at(.9, .5) }, { object: left.hind, local: left.hindWing.at(.9, .5) },
  ];

  return {
    group, trackers,
    // At a cycle position u (one per flap), with this cycle's strength: clapped at the top of the cycle, flung open fast
    // through its first third, closed again more slowly; the flight wanders between cycles.
    pose(u, amplitude) {
      const phase = asym(u, BUTTERFLY.power), s = Math.sin(phase), fold = rad(BUTTERFLY.fold) * amplitude;
      const fore = fold * (.5 + .5 * Math.cos(phase)), hind = fold * .9 * (.5 + .5 * Math.cos(phase - BUTTERFLY.hindLag));
      const curl = BUTTERFLY.curl * Math.sin(phase - .9);
      for (const side of sides) { side.fore.rotation.x = -fore; side.hind.rotation.x = -hind; side.foreWing.update(curl); side.hindWing.update(curl * .7); }
      // Each cycle picks a new lift or drop and a new heading, reached smoothly within the cycle: erratic, not jittery.
      const cycle = Math.floor(u), f = u - cycle, smooth = f * f * (3 - 2 * f);
      const lift = (c: number) => (unit(c * 13 + 5) - .5) * BUTTERFLY.erratic.lift, heading = (c: number) => (unit(c * 17 + 9) - .5) * BUTTERFLY.erratic.heading;
      const time = u * BUTTERFLY.flap, w = 2 * Math.PI * time;
      group.position.y = BUTTERFLY.drift.amount * Math.sin(w / BUTTERFLY.drift.period) + lift(cycle) + (lift(cycle + 1) - lift(cycle)) * smooth - BUTTERFLY.bob * Math.max(0, -s);
      group.rotation.y = rad(heading(cycle) + (heading(cycle + 1) - heading(cycle)) * smooth);
      group.rotation.z = rad(BUTTERFLY.pitch.amount) * Math.sin(w / BUTTERFLY.pitch.period) - rad(BUTTERFLY.stroke) * Math.max(0, s);   // nose up as the wings drive down
      group.rotation.x = rad(BUTTERFLY.roll.amount) * Math.sin(w / BUTTERFLY.roll.period);
      feelers.rotation.z = rad(10) * Math.sin(asym(lagged(u, BUTTERFLY.flap, BUTTERFLY.antennaeLag), BUTTERFLY.power));              // the antennae trail the stroke
    },
    dispose() { geometries.forEach(g => g.dispose()); skin.dispose(); mark.dispose(); },
  };
}
