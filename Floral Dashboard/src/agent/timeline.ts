import { DialStore, type TimelineConfig } from 'dialkit';
import { computeClipState, computeStaticTimeline, parseTimelineConfig } from 'dialkit/timeline';
import { AGENT_TIMELINE_ID, withSavedAgentTimeline } from '../bloom/tuning';

/*
 * The "Agent Icon" timeline: the one clock of the dashboard view. Every value the view draws, the camera's zoom,
 * the icon's sway and breath, the ease to stillness and the dot's pulse, is a clip's `current` at the playhead, so
 * the dock scrubs, retimes and recurves all of it live. One pass through is a demo of the agent finishing:
 * the camera closes in, the working sway runs, the agent completes while the camera rests, works again, and the
 * loop wraps with the sway mid-cycle, since its tracks run whole cycles per loop.
 */
const easing = (duration: number, ease: [number, number, number, number]) => ({ type: 'easing' as const, duration, ease });
const inOut = (duration: number) => easing(duration, [.45, 0, .55, 1]);   // sine-like ease-in-out, for swings
const camera = (duration: number) => easing(duration, [.65, 0, .35, 1]);  // the zoom
const easeOut = (duration: number) => easing(duration, [.22, 1, .36, 1]); // the dot's pulse growing

export const LOOP = 11.2;
// Swings as steps that end where they start, each track its own period: 2.8, 2.24 and 3.733 s, 4, 5 and 3 cycles per loop.
const swing = (amplitude: number, period: number, at = 0) => ({ from: at, steps: [
  { duration: period / 4, to: at + amplitude, transition: inOut(period / 4) },
  { duration: period / 2, to: at - amplitude, transition: inOut(period / 2) },
  { duration: period / 4, to: at, transition: inOut(period / 4) },
] });

const BASE = {
  duration: LOOP,
  camera: { at: 0, from: { closeness: 0 }, steps: [            // 0 wide → 1 the 489:2919 framing
    { duration: 1, to: { closeness: 0 }, transition: camera(1) },
    { duration: 2.6, to: { closeness: 1 }, transition: camera(2.6) },
    { duration: 4, to: { closeness: 1 }, transition: camera(4) },
    { duration: 2.6, to: { closeness: 0 }, transition: camera(2.6) },
    { duration: 1, to: { closeness: 0 }, transition: camera(1) },
  ] },
  working: { at: 0, loop: true, props: {                        // the sway, looping through the whole timeline
    rotate: swing(6, 2.8),                                      // degrees, the whole flower
    petalSway: swing(4.5, 2.24),                                // degrees, each petal (speed and phase vary per petal)
    breathing: swing(.04, LOOP / 3, 1),                         // scale of the whole flower
  } },
  settle: { at: 4.5, duration: .6, from: { amount: 1 }, to: { amount: 0 }, transition: inOut(.6) },   // the sway eases out
  donePulse: { at: 5.1, from: { scale: 1 }, steps: [                                                  // the dot, once, as the agent finishes
    { duration: .16, to: { scale: 1.4 }, transition: easeOut(.16) },
    { duration: .35, to: { scale: 1 }, transition: { type: 'spring' as const, visualDuration: .35, bounce: .2 } },
  ] },
  complete: { at: 5.7, duration: 2 },                            // marker: fully open, still
  resume: { at: 7.9, duration: .8, from: { amount: 0 }, to: { amount: 1 }, transition: inOut(.8) },     // the sway grows back
} satisfies TimelineConfig;

/** The timeline's defaults: the code's timing with the saved tuning over it. */
export const AGENT_TIMELINE = withSavedAgentTimeline(BASE);
const parsed = parseTimelineConfig(AGENT_TIMELINE);

/** The timeline as the dock has it now: its length and every clip's curves. */
export const timelineNow = () => computeStaticTimeline(parsed, DialStore.getValues(AGENT_TIMELINE_ID) as never);
export type Static = ReturnType<typeof timelineNow>;
export type Clip = Static['clips'][number];
export type ClipState = { at: number; duration: number; started: boolean; active: boolean; done: boolean; progress: number; current: Record<string, number> };
export const clipOf = (st: Static, key: string) => st.clips.find(clip => clip.key === key)!;
/** A clip's state at a time; `cycleTime` lets a looping clip fold against continuous time. */
export const stateAt = (clip: Clip, time: number, cycleTime = time) => computeClipState(clip, time, cycleTime) as ClipState;
