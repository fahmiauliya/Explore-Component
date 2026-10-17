import * as THREE from 'three';
import { makeStudio, type View } from '../dot/studio';
import { loadModel } from '../dot/model';
import type { ModelSubject } from '../dot/model';

/* The fox: the Khronos glTF sample model (PixelMannen, tomkranis, AsoboStudio & scurest), its skinned "Run" clip, in the shared view. */
export const FOX_VIEW: View = { from: new THREE.Vector3(-2.0, 2.0, 2.4), at: new THREE.Vector3(0, -.05, .05), fov: 26, width: 3.0 };
const LENGTH = 1.6;                                  // nose to tail, body units
export const FOX_CLIP = 'Run';                       // one running stride over 1.16 s

export function makeFoxSubject(): ModelSubject {
  const studio = makeStudio(FOX_VIEW), model = loadModel('/models/Fox.glb', FOX_CLIP, LENGTH);
  studio.scene.add(model.group);
  return { studio, get trackers() { return model.trackers; }, get ready() { return model.ready; }, stride: model.stride, dispose: model.dispose, strides: model.strides };
}
