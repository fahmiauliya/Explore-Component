import * as THREE from 'three';
import { makeStudio, type View } from '../dot/studio';
import type { Subject } from '../dot/renderer';
import { buildButterfly } from './geometry';

/* The butterfly as a subject: the shared three-quarter view from ahead and above, closer, since it is small. */
export const BUTTERFLY_VIEW: View = { from: new THREE.Vector3(-2.0, 2.0, 2.4), at: new THREE.Vector3(0, .04, .05), fov: 26, width: 2.6 };

export type ButterflySubject = Subject & { update: (time: number) => void; dispose: () => void };

export function makeButterflySubject(): ButterflySubject {
  const studio = makeStudio(BUTTERFLY_VIEW), butterfly = buildButterfly();
  studio.scene.add(butterfly.group);
  return { studio, trackers: butterfly.trackers, update: butterfly.update, dispose: butterfly.dispose };
}
