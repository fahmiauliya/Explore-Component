import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { worldOf, type Tracker } from '../tracking/points';
import type { Subject } from './renderer';

/*
 * A glTF model as a subject's body: loaded from public/models, every mesh given the shared lit material (morph
 * targets and skinning keep working, since the mesh carries them), turned to face −x like the code-built animals,
 * centred and scaled from its bounding box to a length in body units, and animated by an AnimationMixer whose
 * time the dot updates set. Tracked points are vertices picked from the rest pose by where they are: the nose,
 * the ears, the hooves, the tail, the back; their current positions come from the posed mesh, morphs and skin
 * included.
 */
export type Model = { group: THREE.Group; ready: boolean; duration: number; trackers: Tracker[]; setTime: (seconds: number) => void; stride: (u: number) => void; dispose: () => void; strides: () => { duration: number; footfalls: number[]; periods: number[]; strides: number } | null };
/** A loaded model as a subject: ready once its file has arrived; before that it renders nothing. */
export type ModelSubject = Subject & { readonly ready: boolean; span: number; seek: (time: number, stride: number) => void; update: (time: number, step: number, stride: number) => void; dispose: () => void; strides: Model['strides'] };

export function loadModel(url: string, clipName: string, length: number): Model {
  const group = new THREE.Group();
  // Yellow, not white: the renderer reads brightness from red and keeps blue as its mark for always-navy parts.
  const skin = new THREE.MeshLambertMaterial({ color: 0xffff00, flatShading: true, side: THREE.DoubleSide });
  let mixer: THREE.AnimationMixer | null = null;
  const model: Model = { group, ready: false, duration: 1, trackers: [], setTime: () => {}, stride: () => {}, dispose: () => { skin.dispose(); mixer?.stopAllAction(); }, strides: () => null };
  const body = new THREE.Group();
  group.add(body);
  // How many strides the clip holds: sample it and count each hoof's footfalls, the local minima of its height near the ground.
  model.strides = () => {
    if (!model.ready) return null;
    const hooves = model.trackers.filter(t => t.key === 'HOOF' || model.trackers.indexOf(t) >= 6 && model.trackers.indexOf(t) <= 8), v = new THREE.Vector3(), steps = 120;
    const heights = hooves.map(() => [] as number[]);
    for (let k = 0; k < steps; k++) { model.setTime(k / steps * model.duration); group.updateMatrixWorld(true); hooves.forEach((t, i) => { worldOf(t, v); heights[i].push(v.y); }); }
    const footfalls = heights.map(h => { const lo = Math.min(...h), hi = Math.max(...h), floor = lo + (hi - lo) * .2; let n = 0; for (let k = 0; k < steps; k++) { const a = h[(k + steps - 1) % steps], b = h[k], c = h[(k + 1) % steps]; if (b < floor && b <= a && b < c) n++; } return n; });
    // The stride period from each hoof's autocorrelation: the lag (a sixth to all of the clip) that matches the series best.
    const periods = heights.map(h => { const mean = h.reduce((s, y) => s + y, 0) / steps, d = h.map(y => y - mean), norm = d.reduce((s, y) => s + y * y, 0) || 1; let best = 0, bestLag = steps; for (let lag = Math.round(steps / 6); lag <= steps; lag++) { let c = 0; for (let k = 0; k < steps; k++) c += d[k] * d[(k + lag) % steps]; if (c / norm > best) { best = c / norm; bestLag = lag; } } return bestLag / steps * model.duration; });
    const period = periods.slice().sort((a, b) => a - b)[Math.floor(periods.length / 2)];
    return { duration: model.duration, footfalls, periods: periods.map(p => +p.toFixed(3)), strides: Math.round(model.duration / period) };
  };
  new GLTFLoader().load(url, gltf => {
    const scene = gltf.scene, meshes: THREE.Mesh[] = [];
    scene.traverse(object => { const mesh = object as THREE.Mesh; if (mesh.isMesh) { mesh.material = skin; mesh.frustumCulled = false; meshes.push(mesh); } });
    scene.rotation.y = -Math.PI / 2;                             // the models face +z; the animals here face −x
    scene.updateMatrixWorld(true);
    // The box from the rest vertices themselves: a geometry's own box also spans its morph targets, far beyond the body.
    const box = new THREE.Box3().setFromObject(scene, true), size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
    const scale = length / size.x, pivot = new THREE.Group();
    pivot.add(scene);
    pivot.scale.setScalar(scale);
    pivot.position.set(-centre.x * scale, -centre.y * scale, -centre.z * scale);
    body.add(pivot);
    group.updateMatrixWorld(true);
    model.trackers = pickTrackers(meshes, new THREE.Box3().setFromObject(group, true));   // the box in the frame the vertices are read in
    const clip = gltf.animations.find(c => c.name === clipName) ?? gltf.animations[0];
    mixer = new THREE.AnimationMixer(scene);
    if (clip) { mixer.clipAction(clip).play(); model.duration = clip.duration; }
    model.setTime = seconds => { mixer!.setTime(((seconds % model.duration) + model.duration) % model.duration); };
    // A stride's position u: the clip at that point. The animal stays in place; only its own animation moves.
    model.stride = u => { model.setTime(((u % 1) + 1) % 1 * model.duration); };
    model.ready = true;
  });
  return model;
}

/** Tracked vertices from the rest pose, by where they are in the model's box (facing −x): the key ones first. */
function pickTrackers(meshes: THREE.Mesh[], box: THREE.Box3): Tracker[] {
  const v = new THREE.Vector3(), min = box.min, size = box.getSize(new THREE.Vector3());
  const all: { mesh: THREE.Mesh; index: number; x: number; y: number; z: number }[] = [];
  for (const mesh of meshes) for (let i = 0; i < mesh.geometry.attributes.position.count; i++) { mesh.getVertexPosition(i, v); mesh.localToWorld(v); all.push({ mesh, index: i, x: (v.x - min.x) / size.x, y: (v.y - min.y) / size.y, z: (v.z - min.z) / size.z - .5 }); }
  type P = (typeof all)[number];
  const pick = (score: (p: P) => number, where: (p: P) => boolean, key?: string): Tracker | null => {
    let best: P | null = null, bestScore = -Infinity;
    for (const p of all) if (where(p)) { const s = score(p); if (s > bestScore) { bestScore = s; best = p; } }
    return best ? { mesh: best.mesh, index: best.index, key } : null;
  };
  const near = (x: number, y: number, z: number) => (p: P) => -Math.hypot(p.x - x, p.y - y, p.z - z);
  // A key point just inside an extreme, so it lands on a filled cell rather than the thin tip of the silhouette.
  const inward = (score: (p: P) => number, where: (p: P) => boolean, dx: number, dy: number, key: string) => {
    let tip: P | null = null, best = -Infinity;
    for (const p of all) if (where(p)) { const s = score(p); if (s > best) { best = s; tip = p; } }
    return tip ? pick(near(tip.x + dx, tip.y + dy, tip.z), () => true, key) : null;
  };
  const picks = [
    inward(p => -p.x, p => p.y > .25 && p.z >= 0, .05, 0, 'NOSE'),              // most forward, above the legs, on the camera's side
    inward(p => p.y, p => p.x < .3 && p.z > 0, 0, -.05, 'EAR'),                  // highest in the front, near side
    inward(p => -p.y, p => p.x < .5 && p.z > 0, 0, .06, 'HOOF'),                 // lowest in the front, near side
    inward(p => p.x, p => p.y > .25 && p.z >= 0, -.05, 0, 'TAIL'),               // most rearward, above the legs, on the camera's side
    pick(p => p.y, p => p.x > .35 && p.x < .65 && p.z >= 0, 'BACK'),             // highest in the middle, on the camera's side
    pick(p => p.y, p => p.x < .3 && p.z < 0),                                   // the other ear
    pick(p => -p.y, p => p.x < .5 && p.z < 0), pick(p => -p.y, p => p.x > .5 && p.z > 0), pick(p => -p.y, p => p.x > .5 && p.z < 0),  // the other hooves
    pick(p => p.y, p => p.x > .25 && p.x < .4), pick(p => p.y, p => p.x > .65 && p.x < .85),                                            // withers, rump
    pick(p => p.z, p => p.x > .35 && p.x < .65),                                 // the near flank
    pick(near(.25, .4, .25), () => true), pick(near(.25, .4, -.25), () => true), pick(near(.75, .4, .25), () => true), pick(near(.75, .4, -.25), () => true),  // the knees
    pick(near(.1, .55, .2), () => true), pick(near(.5, .3, .3), () => true), pick(near(.85, .55, .2), () => true), pick(near(.4, .85, .15), () => true),       // the throat, belly side, hip, neck
  ];
  return picks.filter((t): t is Tracker => !!t);
}
