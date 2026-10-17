import * as THREE from 'three';
import { makeStudio, type View } from '../dot/studio';
import { loadModel, type ModelSubject } from '../dot/model';
import { CycleClock } from '../dot/wave';

/* The fox: the Khronos glTF sample model (PixelMannen, tomkranis, AsoboStudio & scurest), its one-stride skinned "Run", in the shared view, on a stride clock. */
export const FOX_VIEW: View = { from: new THREE.Vector3(-2.0, 2.0, 2.4), at: new THREE.Vector3(0, -.05, .05), fov: 26, width: 3.0 };
const LENGTH = 1.6;                                  // nose to tail, body units
export const FOX_CLIP = 'Run';                       // one running stride over 1.16 s

export function makeFoxSubject(): ModelSubject {
  const studio = makeStudio(FOX_VIEW), model = loadModel('/models/Fox.glb', FOX_CLIP, LENGTH), clock = new CycleClock(.75, .05, 47);
  studio.scene.add(model.group);
  return {
    studio, get trackers() { return model.trackers; }, get ready() { return model.ready; }, span: .75,
    seek(time, stride) { clock.period = stride; clock.seek(time); model.stride(clock.u); },
    update(time, step, stride) { clock.period = stride; if (step >= 0 && step < .5) clock.advance(step); else clock.seek(time); model.stride(clock.u); },
    dispose: model.dispose, strides: model.strides,
  };
}
