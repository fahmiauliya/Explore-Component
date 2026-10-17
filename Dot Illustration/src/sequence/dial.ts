import type { DialConfig, ResolvedValues, TimelineConfig } from 'dialkit';
import { SEQUENCE_TIMELINE_ID, healStoredTimeline, withSavedSequence, withSavedSequenceTimeline } from '../bird/tuning';
import { ANIMALS } from './phase';

/*
 * The "Dot Sequence" panel and timeline. The panel holds the animals' toggles, the manta, each animal's size, the
 * models' stride times and credits, the transition and the actions; the density, tone and colours come from the shared "Dot Bird" panel, so every animal matches. The
 * timeline is the loop: five animals, about four seconds each, with a dissolve out and a build-in between every
 * pair, each a marker clip whose progress is the dissolve's; the dock moves and resizes them, and the order of the
 * animal clips is the loop's order.
 */
const BASE_PANEL = {
  Animals: { bird: true, butterfly: true, manta: true, horse: true, fox: true },  // in or out of the loop
  Manta: {
    finSpan: [2.6, 1.8, 3.4, .05],      // tip to tip, in body lengths
    waveDuration: [2.8, 1.5, 5, .05],   // seconds per full fin wave
    waveAmplitude: [.45, 0, .8, .01],   // the fin tips' rise and fall, body lengths
    bankAmount: [5, 0, 20, .5],         // the slow roll, degrees
    tailSway: [14, 0, 40, 1],           // the tail's swing, degrees at its end
    bodyBob: [.09, 0, .3, .005],        // the body's rise on the downstroke, body lengths (1.5 cells)
  },
  Size: { bird: [0, -30, 30, 1], butterfly: [0, -30, 30, 1], manta: [0, -30, 30, 1], horse: [0, -30, 30, 1], fox: [0, -30, 30, 1] },  // % on the calibrated size
  Stride: {
    horse: [.9, .5, 1.4, .01],          // seconds per stride: the clip's one gallop stride, played this fast
    fox: [.75, .4, 1.2, .01],           // seconds per stride: the clip's one running stride
  },
  Credits: {
    fox: 'Fox model by PixelMannen (CC0), rigging & animation by tomkranis (CC BY 4.0), glTF conversion by AsoboStudio & scurest (CC BY 4.0).',
    horse: 'Horse model from the three.js examples (MIT).',
  },
  Transition: {
    outDuration: [.3, .1, 1.5, .01],    // written into every dissolveOut clip
    inDuration: [.3, .1, 1.5, .01],     // written into every dissolveIn clip
    clumpSize: [5, 2, 12, .5],          // the noise's blotches, cells
    edgePriority: [.3, 0, 1, .01],      // how much the outline and navy outweigh the noise
    emptyUpdates: [2, 0, 6, 1],         // updates with only a few scattered dots in the middle
    newSeed: { type: 'action', label: 'New seed' },
  },
  Actions: {
    pause: { type: 'action', label: 'Pause' },
    step: { type: 'action', label: 'Step one frame' },
    skip: { type: 'action', label: 'Skip to next subject' },
    saveToFile: { type: 'action', label: 'Save to file' },
  },
} satisfies DialConfig;
export const SEQUENCE_PANEL = withSavedSequence(BASE_PANEL);
export type SequenceValues = ResolvedValues<typeof BASE_PANEL>;

// Each animal 4 s, each dissolve .3 s out and .3 s in: 23 s round.
const ANIMAL = 4, OUT = .3, IN = .3;
const clips: Record<string, unknown> = {};
let at = 0;
for (const animal of ANIMALS) {
  clips[animal] = { at, duration: ANIMAL };
  at += ANIMAL;
  const next = ANIMALS[(ANIMALS.indexOf(animal) + 1) % ANIMALS.length], group = `to${next[0].toUpperCase()}${next.slice(1)}`;
  clips[group] = { dissolveOut: { at, duration: OUT }, dissolveIn: { at: at + OUT, duration: IN } };
  at += OUT + IN;
}
const BASE_TIMELINE = { duration: at, ...clips } as TimelineConfig;
healStoredTimeline(SEQUENCE_TIMELINE_ID, ANIMALS.map(animal => `${animal}.at`));
export const SEQUENCE_TIMELINE = withSavedSequenceTimeline(BASE_TIMELINE);
/** The flat paths of every dissolve clip's duration, for the Transition panel to write into. */
export const DISSOLVE_PATHS = (kind: 'dissolveOut' | 'dissolveIn') => ANIMALS.map(animal => `to${animal[0].toUpperCase()}${animal.slice(1)}.${kind}.duration`);
