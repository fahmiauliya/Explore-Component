import * as THREE from 'three';
import { makeStudio, type View } from '../dot/studio';
import type { Subject } from '../dot/renderer';
import { buildBird, type Pose } from './geometry';

/*
 * The bird as a subject: its own scene in the shared studio, posed by the caller before each render. The view is a
 * three-quarter from ahead and above, centred on the whole flight, wings up, spread or banked, inside the frame.
 */
export const BIRD_VIEW: View = { from: new THREE.Vector3(-2.0, 2.0, 2.4), at: new THREE.Vector3(.08, .14, .12), fov: 26, width: 3.6 }; // the wingspan is 3.1, foreshortened; the 6:4 frame needs room above for the wings

export type BirdSubject = Subject & { pose: (pose: Pose) => void; dispose: () => void };

export function makeBirdSubject(): BirdSubject {
  const studio = makeStudio(BIRD_VIEW), bird = buildBird();
  studio.scene.add(bird.group);
  return { studio, highlights: [bird.spark], trackers: bird.trackers, pose: bird.pose, dispose: bird.dispose };
}
