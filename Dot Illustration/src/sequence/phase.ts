import { FLOOR } from '../dot/dissolve';

/*
 * Where the sequence's loop is. The timeline has a marker clip per animal and, before each, a group of two
 * dissolve markers, `toX › dissolveOut` and `toX › dissolveIn`, that switch the subject to X. The subject showing
 * is the one whose clip, or whose build-in, started latest, so the dock's order is the loop's order; the share of
 * its shape kept is all of it, a dissolve-out's falling share, a build-in's rising share after its empty updates,
 * or the floor through any gap between the two.
 */
export const ANIMALS = ['bird', 'butterfly', 'manta', 'horse', 'fox'] as const;
export type Animal = (typeof ANIMALS)[number];
export const NAMES: Record<Animal, string> = { bird: 'BIRD', butterfly: 'BUTTERFLY', manta: 'MANTA', horse: 'HORSE', fox: 'FOX' };
/** The group of dissolve clips that builds an animal in. */
export const transitionOf = (animal: Animal) => `to${animal[0].toUpperCase()}${animal.slice(1)}` as `to${Capitalize<Animal>}`;

export type Clip = { at: number; duration: number; started: boolean; active: boolean; done: boolean; progress: number };
export type Transport = { time: number; playing: boolean; duration: number; play: () => void; pause: () => void; seek: (seconds: number) => void };
export type Transition = { dissolveOut: Clip; dissolveIn: Clip };
export type SequenceTimeline = Transport & Record<Animal, Clip> & Record<ReturnType<typeof transitionOf>, Transition>;
export type Phase = { subject: Animal; kept: number; transition: number };  // transition: 0 outside one, else 1-based, for the dissolve's seed

export function phaseAt(tl: SequenceTimeline, emptyUpdates: number, rate: number): Phase {
  let subject: Animal = ANIMALS[0], latest = -Infinity;
  for (const animal of ANIMALS) for (const clip of [tl[animal], tl[transitionOf(animal)].dissolveIn]) if (clip.started && clip.at >= latest) { latest = clip.at; subject = animal; }
  const during = (clip: Clip) => clip.started && !clip.done;
  for (let k = 0; k < ANIMALS.length; k++) {
    const { dissolveOut: out, dissolveIn: build } = tl[transitionOf(ANIMALS[k])], transition = k + 1;
    if (during(build)) { const hold = Math.min(.9, emptyUpdates / Math.max(1e-6, build.duration * rate)); return { subject, kept: FLOOR + Math.max(0, (build.progress - hold) / (1 - hold)) * (1 - FLOOR), transition }; }
    if (during(out)) return { subject, kept: 1 - out.progress * (1 - FLOOR), transition };
    if (out.done && !build.started) return { subject, kept: FLOOR, transition };
  }
  return { subject, kept: 1, transition: 0 };
}

/** The animals in the order their clips sit on the timeline. */
export const orderOf = (tl: SequenceTimeline) => [...ANIMALS].sort((a, b) => tl[a].at - tl[b].at);

/** The next dissolve-out after a time (wrapping to the first), as the time to seek to. */
export function nextTransitionAt(tl: SequenceTimeline, time: number) {
  const starts = ANIMALS.map(animal => tl[transitionOf(animal)].dissolveOut.at).sort((a, b) => a - b);
  return starts.find(at => at > time + 1e-3) ?? starts[0];
}

/** Where to continue when the subject is excluded from the loop: the start of the next included animal's build-in,
 * in the dock's order, wrapping; null when nothing is included. */
export function nextIncludedAt(tl: SequenceTimeline, subject: Animal, included: Record<Animal, boolean>) {
  const order = orderOf(tl), from = order.indexOf(subject);
  for (let k = 1; k <= order.length; k++) { const animal = order[(from + k) % order.length]; if (included[animal]) return tl[transitionOf(animal)].dissolveIn.at; }
  return null;
}
