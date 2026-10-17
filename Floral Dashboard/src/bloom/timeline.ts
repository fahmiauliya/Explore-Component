import { DialStore, type TimelineConfig } from 'dialkit';
import { computeClipState, computeStaticTimeline, parseTimelineConfig } from 'dialkit/timeline';
import { TIMELINE_ID, withSavedTimeline } from './tuning';

/*
 * The bloom as a DialKit timeline, one clip per phase, so the dock is the loop's one clock: the flower is drawn
 * from the clips' values at the playhead, playing, paused or scrubbed. Times are the loop's as it was tuned in
 * code; the dock moves and resizes them, and the save file keeps the result. t = 0 is the resting bud.
 *
 * The petal clips carry one petal's motion; the spiral stagger and the per-petal variation are offsets added on
 * top in FlowerMotion.ts. Bloom tracks are in real units (degrees, scale); close tracks are the amount of the bud
 * fold reached, 0 → 1, so the loop's last state is the bud exactly as its first, whatever the dock sets.
 */
const easing = (duration: number, ease: [number, number, number, number]) => ({ type: 'easing' as const, duration, ease });
const unfold = (duration: number) => easing(duration, [.22, 1, .36, 1]);   // slow start, fast middle, long soft settle
const calm = (duration: number) => easing(duration, [.45, 0, .55, 1]);     // closing and settles
const soft = (duration: number) => easing(duration, [.33, 1, .68, 1]);     // light and ripples

// Fold: the petal stands this far toward the viewer, passes flat by 1.5° at 79% and settles; twist is the spiral.
const petalsOpen = (at: number, fold: number) => ({ at, props: {
  fold: { from: fold, steps: [{ duration: .75, to: -1.5, transition: unfold(.75) }, { duration: .2, to: 0, transition: calm(.2) }] },
  twist: { from: -18, to: 0, duration: .95, transition: unfold(.95) },
  scale: { from: .92, to: 1, duration: .8, delay: .05, transition: soft(.8) },
} });
const petalsClose = (at: number) => ({ at, props: {
  fold: { from: 0, to: 1, duration: .6, transition: calm(.6) },
  twist: { from: 0, to: 1, duration: .6, transition: calm(.6) },
  scale: { from: 0, to: 1, duration: .55, delay: .05, transition: calm(.55) },
} });
const ripple = (at: number, duration: number) => ({ at, duration, from: { scale: .3 }, to: { scale: 1 }, transition: soft(duration) });
const pullIn = (delay: number) => ({ from: 0, to: 1, duration: .6, delay, transition: calm(.6) });

const BASE = {
  budHold: { at: 0, duration: 1 },                   // marker: light leaking, soft pulse
  pressure: { at: 1, duration: .6, from: { glow: .32, glowBright: 1.15, stars: .22, starsBright: 1.15 }, to: { glow: .36, glowBright: 1.3, stars: .25, starsBright: 1.45 }, transition: soft(.6) },
  bloom: { outerPetals: petalsOpen(1.6, 62), innerPetals: petalsOpen(2.2, 74) },
  lightSpill: { at: 1.95, from: { glow: .36, glowBright: 1.3, stars: .25, starsBright: 1.45 }, steps: [
    { duration: 1.3, to: { glow: 1.12, glowBright: 1.05, stars: 1, starsBright: 1.05 }, transition: unfold(1.3) },   // spreads past its size
    { duration: .8, to: { glow: 1, glowBright: 1.15, starsBright: 1.15 }, transition: calm(.8) },                     // settles, soft peak
    { duration: .7, to: { glowBright: 1, starsBright: 1 }, transition: calm(.7) },                                     // relaxes, then steady
  ] },
  ripples: { r0: ripple(2.5, 1), r1: ripple(2.75, 1.15), r2: ripple(3, 1.3), r3: ripple(3.25, 1.45) },
  openHold: { at: 3.5, duration: 12 },               // marker: petal sway
  lightPullback: { at: 15.5, props: { light: pullIn(0), r0: pullIn(0), r1: pullIn(.12), r2: pullIn(.24), r3: pullIn(.36) } },
  close: { innerPetals: petalsClose(16), outerPetals: petalsClose(16.4) },
} satisfies TimelineConfig;

/** The timeline's defaults: the code's timing with the saved tuning over it, and room after the last petal's
 * fold for the stagger, so the loop's length follows the timing wherever it is saved. */
const tuned = withSavedTimeline(BASE);
const lastFold = Math.max(tuned.close.innerPetals.at, tuned.close.outerPetals.at) + Math.max(...Object.values(tuned.close.outerPetals.props).map(track => ('delay' in track ? track.delay : 0) + track.duration));
export const BLOOM_TIMELINE = { duration: Math.ceil((lastFold + .6) * 10) / 10, ...tuned } satisfies TimelineConfig;
const parsed = parseTimelineConfig(BLOOM_TIMELINE);

/** The timeline as the dock has it now: its length and every clip's curves. */
export const timelineNow = () => computeStaticTimeline(parsed, DialStore.getValues(TIMELINE_ID) as never);
export type Static = ReturnType<typeof timelineNow>;
export type Clip = Static['clips'][number];
export type ClipState = { at: number; duration: number; started: boolean; active: boolean; done: boolean; progress: number; current: Record<string, number> };

export const clipOf = (st: Static, key: string) => st.clips.find(clip => clip.key === key)!;
/** A clip's state at a time: `current` holds its `from` before it starts and its `to` after it ends. */
export const stateAt = (clip: Clip, time: number) => computeClipState(clip, time) as ClipState;
/** A clip's resting start values. */
export const startOf = (clip: Clip) => stateAt(clip, clip.at - 1).current;
