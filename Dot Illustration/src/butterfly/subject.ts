import * as THREE from 'three';
import { makeStudio, type View } from '../dot/studio';
import type { Subject } from '../dot/renderer';
import { CycleClock } from '../dot/wave';
import { BUTTERFLY, buildButterfly } from './geometry';

/* The butterfly as a subject: the shared three-quarter view from ahead and above, closer, since it is small; its flaps vary in strength and pace from one to the next. */
export const BUTTERFLY_VIEW: View = { from: new THREE.Vector3(-2.0, 2.0, 2.4), at: new THREE.Vector3(0, .04, .05), fov: 26, width: 2.6 };

export type ButterflySubject = Subject & { span: number; seek: (time: number) => void; update: (time: number, step: number) => void; dispose: () => void };

export function makeButterflySubject(): ButterflySubject {
  const studio = makeStudio(BUTTERFLY_VIEW), butterfly = buildButterfly(), clock = new CycleClock(BUTTERFLY.flap, .15, 23);
  studio.scene.add(butterfly.group);
  return {
    studio, trackers: butterfly.trackers, span: BUTTERFLY.flap * 2,   // the flap, and the next's lift and heading
    seek(time) { clock.seek(time); butterfly.pose(clock.u, 1); },
    update(time, step) { if (step >= 0 && step < .5) clock.advance(step); else clock.seek(time); butterfly.pose(clock.u, clock.amplitude()); },
    dispose: butterfly.dispose,
  };
}
