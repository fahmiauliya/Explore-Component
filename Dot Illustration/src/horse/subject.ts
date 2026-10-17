import * as THREE from 'three';
import { makeStudio, type View } from '../dot/studio';
import { loadModel, type ModelSubject } from '../dot/model';
import { CycleClock } from '../dot/wave';

/* The horse: the three.js example model (MIT), its one-stride morph-target gallop, in the shared three-quarter view, on a stride clock. */
export const HORSE_VIEW: View = { from: new THREE.Vector3(-2.0, 2.0, 2.4), at: new THREE.Vector3(0, -.05, .05), fov: 26, width: 3.0 };
const LENGTH = 1.7;                                  // nose to tail, body units
export const HORSE_CLIP = 'horse_A_';                // the model's one clip: one gallop stride over 1.5 s

export function makeHorseSubject(): ModelSubject {
  const studio = makeStudio(HORSE_VIEW), model = loadModel('/models/Horse.glb', HORSE_CLIP, LENGTH), clock = new CycleClock(.9, .05, 31);
  studio.scene.add(model.group);
  return {
    studio, get trackers() { return model.trackers; }, get ready() { return model.ready; }, span: .9,
    seek(time, stride) { clock.period = stride; clock.seek(time); model.stride(clock.u); },
    update(time, step, stride) { clock.period = stride; if (step >= 0 && step < .5) clock.advance(step); else clock.seek(time); model.stride(clock.u); },
    dispose: model.dispose, strides: model.strides,
  };
}
