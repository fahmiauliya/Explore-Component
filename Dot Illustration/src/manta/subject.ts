import * as THREE from 'three';
import { makeStudio, type View } from '../dot/studio';
import type { Subject } from '../dot/renderer';
import { buildManta, type MantaValues } from './geometry';

/* The manta as a subject: its own scene in the shared studio, the same three-quarter view from ahead and above as the bird. */
export const MANTA_VIEW: View = { from: new THREE.Vector3(-2.0, 2.0, 2.4), at: new THREE.Vector3(.05, -.02, .1), fov: 26, width: 3.4 };

export type MantaSubject = Subject & { update: (time: number, v: MantaValues) => void; dispose: () => void };

export function makeMantaSubject(): MantaSubject {
  const studio = makeStudio(MANTA_VIEW), manta = buildManta();
  studio.scene.add(manta.group);
  return { studio, trackers: manta.trackers, update: manta.update, dispose: manta.dispose };
}
