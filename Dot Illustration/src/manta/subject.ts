import * as THREE from 'three';
import { makeStudio, type View } from '../dot/studio';
import type { Subject } from '../dot/renderer';
import { CycleClock } from '../dot/wave';
import { buildManta, type MantaValues } from './geometry';

/*
 * The manta as a subject: its own scene in the shared studio, the same three-quarter view from ahead and above
 * as the bird, swimming on a wave clock that varies a little from stroke to stroke and, every fourth stroke, takes
 * one long slow one, as if gliding through the water.
 */
export const MANTA_VIEW: View = { from: new THREE.Vector3(-2.0, 2.0, 2.4), at: new THREE.Vector3(.05, -.02, .1), fov: 26, width: 3.4 };
const LONG_STROKE = { every: 4, stretch: 1.6 };

export type MantaSubject = Subject & { span: number; seek: (time: number, v: MantaValues) => void; update: (time: number, step: number, v: MantaValues) => void; dispose: () => void };

export function makeMantaSubject(): MantaSubject {
  const studio = makeStudio(MANTA_VIEW), manta = buildManta(), clock = new CycleClock(2.8, .05, 11, cycle => cycle % LONG_STROKE.every === LONG_STROKE.every - 1 ? LONG_STROKE.stretch : 1);
  studio.scene.add(manta.group);
  return {
    studio, trackers: manta.trackers, span: 5.6,
    seek(time, v) { clock.period = v.waveDuration; clock.seek(time); manta.pose(clock.u, v, 1); },
    update(time, step, v) { clock.period = v.waveDuration; if (step >= 0 && step < .5) clock.advance(step); else clock.seek(time); manta.pose(clock.u, v, clock.amplitude()); },
    dispose: manta.dispose,
  };
}
