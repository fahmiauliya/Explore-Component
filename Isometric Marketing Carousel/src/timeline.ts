import { DialStore, type TimelineConfig } from 'dialkit';
import { computeClipState, computeStaticTimeline, parseTimelineConfig } from 'dialkit/timeline';
import { MOTION, STORAGE, TIMING } from './config';
import { withSavedTimeline } from './settings';

/*
 * One card's cycle as a DialKit timeline, each phase its own clip so the dock shows them as stacked rows. The
 * preview and the export both read it through `sample`, so the video is exactly what the dock is set to.
 */
export const TIMELINE_ID = STORAGE.timelineId;

const { cardIn, demo, pointerToNext, nextHover, nextPress, cardOut } = TIMING, slide = MOTION.slideDistance;

const BASE = {
  // the content block slides in from slideDistance as it fades up
  cardIn: { ...cardIn, from: { x: slide, opacity: 0 }, to: { x: 0, opacity: 1 }, transition: MOTION.cardSpring },
  // a marker: its progress runs the illustration's hover script
  demo: { ...demo },
  // the pointer leaves the illustration for the next button
  pointerToNext: { ...pointerToNext, from: { p: 0 }, to: { p: 1 }, transition: MOTION.pointerSpring },
  nextHover: { ...nextHover, from: { h: 0 }, to: { h: 1 }, transition: { type: 'easing', duration: nextHover.duration, ease: MOTION.hoverEase } },
  // down to pressScale and back; the card index moves on here
  nextPress: {
    at: nextPress.at, from: { s: 1 },
    steps: [{ duration: nextPress.down, to: { s: MOTION.pressScale }, transition: MOTION.pressSpring }, { duration: nextPress.up, to: { s: 1 }, transition: MOTION.pressSpring }],
  },
  cardOut: { ...cardOut, from: { x: 0, opacity: 1 }, to: { x: -slide, opacity: 0 }, transition: MOTION.cardSpring },
} satisfies TimelineConfig;

/** The timeline's defaults: config.ts's timing, with the saved settings over it. */
export const CARD_TIMELINE = withSavedTimeline(BASE);

const parsed = parseTimelineConfig(CARD_TIMELINE);

type Clip = { at: number; duration: number; started: boolean; active: boolean; done: boolean; progress: number; current?: Record<string, number> };
export type Sample = {
  duration: number;
  time: number;
  cardIn: Clip; demo: Clip; pointerToNext: Clip; nextHover: Clip; nextPress: Clip; cardOut: Clip;
};

/** The timeline as the dock has it now: its length and every clip's curves. */
export function timelineNow() {
  return computeStaticTimeline(parsed, DialStore.getValues(TIMELINE_ID) as never);
}
export type Static = ReturnType<typeof timelineNow>;

/** Every clip's state at time t: progress, and `current`, its values through its own curve. */
export function sample(st: Static, time: number): Sample {
  const out: Record<string, unknown> = { duration: st.duration, time };
  for (const clip of st.clips) out[clip.key] = computeClipState(clip, time);
  return out as Sample;
}
