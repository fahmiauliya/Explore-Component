import * as THREE from 'three';
import { makeStudio, type View } from '../dot/studio';
import { loadModel } from '../dot/model';
import type { ModelSubject } from '../dot/model';

/* The horse: the three.js example model (MIT), a morph-target gallop, in the shared three-quarter view. */
export const HORSE_VIEW: View = { from: new THREE.Vector3(-2.0, 2.0, 2.4), at: new THREE.Vector3(0, -.05, .05), fov: 26, width: 3.0 };
const LENGTH = 1.7;                                  // nose to tail, body units
export const HORSE_CLIP = 'horse_A_';                // the model's one clip: one gallop stride over 1.5 s

export function makeHorseSubject(): ModelSubject {
  const studio = makeStudio(HORSE_VIEW), model = loadModel('/models/Horse.glb', HORSE_CLIP, LENGTH);
  studio.scene.add(model.group);
  return { studio, get trackers() { return model.trackers; }, get ready() { return model.ready; }, stride: model.stride, dispose: model.dispose, strides: model.strides };
}
