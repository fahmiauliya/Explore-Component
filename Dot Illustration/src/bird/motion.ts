import type { Pose } from './geometry';
import { asym, lagged } from '../dot/wave';

/*
 * The bird's pose at a moment: the flap is a wave of the flap's own time, its downstroke quick and strong and its
 * upstroke slower, with the wrist bending and the outer wing folding in, and the "Dot Bird" timeline's clips say
 * how much of it shows (power), how far the wings are held out in a glide (spread) and how far the bird banks.
 * The outer wing follows the inner one a little late; the body lifts through the downstroke and the head stays
 * steadier than the body; the tail answers a few updates late. A glide is never still: the body drifts, the bird
 * rolls a little, the wing tips flex and the tail works.
 */
export const FLAP = {
  up: 58, down: 34,       // shoulder angle at the top and the bottom of the stroke, degrees
  power: .4,              // the downstroke's share of the cycle: quick and strong; the upstroke takes the rest
  wrist: 35,              // the outer wing folds back this far through the upstroke, degrees
  sweepBack: 14,          // and the wings sweep back this far
  lift: .06,              // the body rises this much through the downstroke, units
  pitch: 3,               // the nose dips a little as the wings drive down
  head: .7,               // how much of the body's rise and pitch the head does not follow
  tail: 7,                // the tail dips this much after each downstroke, degrees
  tailLag: 3,             // updates behind the wings
  dihedral: 12,           // the wings' angle when held out in a glide
  glideSweep: 8,          // and how far back they are held
  slow: .6,               // the flap runs this much slower at full spread: it slows into a glide and picks up out of it
  bankYaw: 18,            // turning into the bank, degrees at full bank
  variation: .16,         // the stroke's amplitude varies by up to ± half of this between passes
};
export const GLIDE = {    // the life in a glide, all scaled by the spread
  drift: .15, driftPeriod: 1.2,   // the body rises and falls this much (2.5 cells), once over a .6 s glide
  roll: 4, rollRate: 1.25,        // degrees, and cycles a second
  flex: 6, flexRate: 3,           // the outer wing bends up and down this much, degrees
  tail: 10, tailRate: 2,          // the fork opens this wide and closes again
};

/** The still, wings-up pose for reduced motion. */
export const STILL: Pose = { shoulder: 50, elbow: -8, wrist: 0, sweep: 4, tail: 4, bob: 0, roll: 0, yaw: 0, pitch: 0 };

export type Story = { power: number; spread: number; bank: number; glideAt: number };
export type ClipState = { key: string; at: number; started: boolean; current: Record<string, number> };

/** The story at the playhead: each value belongs to the latest clip that has started and names it (a clip's
 * `current` holds its end values after it ends). `skipGlide` leaves the glide out of this pass of the loop. */
export function storyAt(clips: ClipState[], skipGlide: boolean): Story {
  const value = (name: 'power' | 'spread' | 'bank', fallback: number) => {
    let best: ClipState | undefined;
    for (const clip of clips) if (clip.started && name in clip.current && !(skipGlide && clip.key === 'glide') && (!best || clip.at >= best.at)) best = clip;
    return best ? best.current[name] : fallback;
  };
  return { power: value('power', 1), spread: value('spread', 0), bank: value('bank', 0), glideAt: clips.find(clip => clip.key === 'glide')?.at ?? 0 };
}

export type MotionValues = { flapDuration: number; wingBend: number; bankAmount: number };

/** The flap's rate at a spread: 1 while flapping, 1 − slow at full spread. The component integrates it into the flap's own time. */
export const flapRate = (story: Story) => 1 - FLAP.slow * story.spread;

/** The pose at a time of the timeline, with the flap's own time `flapTime`; `variation` is this pass's amplitude offset. */
export function poseAt(time: number, flapTime: number, story: Story, motion: MotionValues, variation: number): Pose {
  const u = flapTime / motion.flapDuration, theta = asym(u, FLAP.power), s = Math.sin(theta), c = Math.cos(theta);
  const tail = asym(lagged(u, motion.flapDuration, FLAP.tailLag), FLAP.power);
  const flapping = story.power * (1 - story.spread) * (1 + variation), glide = story.spread, w = 2 * Math.PI * time;
  return {
    shoulder: ((FLAP.up + FLAP.down) / 2 * c + (FLAP.up - FLAP.down) / 2) * flapping + FLAP.dihedral * glide,   // up at the top of the cycle, down at the bottom
    elbow: motion.wingBend * s * flapping + GLIDE.flex * Math.sin(w * GLIDE.flexRate) * glide,                   // the outer wing trails: up through the downstroke, down through the upstroke
    wrist: FLAP.wrist * Math.max(0, -s) * flapping,                                                               // and folds in through the upstroke
    sweep: FLAP.sweepBack * Math.max(0, -s) * flapping + FLAP.glideSweep * glide,
    tail: FLAP.tail * Math.max(0, Math.sin(tail)) * flapping + GLIDE.tail * (.5 + .5 * Math.sin(w * GLIDE.tailRate)) * glide,
    bob: FLAP.lift * Math.max(0, s) * flapping + GLIDE.drift * Math.sin(2 * Math.PI * (time - story.glideAt) / GLIDE.driftPeriod) * glide,
    pitch: -FLAP.pitch * s * flapping,
    roll: motion.bankAmount * story.bank + GLIDE.roll * Math.sin(w * GLIDE.rollRate) * glide,
    yaw: FLAP.bankYaw * story.bank,
  };
}
