// The ten illustrations, read unchanged from the Line Illustration project, with each one's demo; the copy is in config.ts.
import { CONTENT } from './config';
import funnel from '../../Line Illustration/figures/funnel/funnel.js?raw';
import megaphone from '../../Line Illustration/figures/megaphone/megaphone.js?raw';
import magnet from '../../Line Illustration/figures/magnet/magnet.js?raw';
import target from '../../Line Illustration/figures/target/target.js?raw';
import roi from '../../Line Illustration/figures/roi/roi.js?raw';
import email from '../../Line Illustration/figures/email/email.js?raw';
import segmentation from '../../Line Illustration/figures/segmentation/segmentation.js?raw';
import launch from '../../Line Illustration/figures/launch/launch.js?raw';
import analytics from '../../Line Illustration/figures/analytics/analytics.js?raw';
import journey from '../../Line Illustration/figures/journey/journey.js?raw';

type Figure = {
  name: string;
  source: string;
  /** The demo: hover targets in viewBox units, in order. */
  stops: [number, number][];
  /** The drawing's extent over every state (rest, each hover, the motion between), in viewBox units. */
  box: [number, number, number, number];
  /** An idle spin's pace in rad/s, where it must come round a whole number of times per loop. */
  spin?: number;
};
export type Card = Figure & (typeof CONTENT)[number] & { n: string };

const FIGURES: Figure[] = [
  { name: 'Funnel', source: funnel, box: [38.3, 64.6, 332.6, 279],
    stops: [[208, 108], [208, 168], [208, 198], [208, 248]],
    // the gears turn at 0.32 rad/s; the funnel's clock is nudged so they make a whole number of turns per loop
    spin: 0.32 },
  { name: 'Megaphone', source: megaphone, box: [58.9, 85.5, 341.9, 240],
    stops: [[193, 158], [223, 163], [258, 158], [303, 163]] },
  { name: 'Magnet', source: magnet, box: [66.4, 91.2, 333.6, 232.8],
    stops: [[93, 133], [123, 153], [208, 103], [213, 188], [258, 138], [313, 153]] },
  { name: 'Spotlight', source: target, box: [62.9, 65.4, 337.1, 259.9],
    stops: [[128, 173], [193, 213], [268, 188], [223, 158]] },
  { name: 'Connected glasses', source: roi, box: [62.4, 87.7, 337.6, 257.9],
    stops: [[68, 183], [158, 178], [203, 178], [313, 183]] },
  { name: 'Pigeonhole cabinet', source: email, box: [87.4, 51, 290.4, 279.9],
    stops: [[128, 153], [178, 173], [218, 193], [263, 128]] },
  { name: 'Rotating tray', source: segmentation, box: [70.2, 71.2, 329.8, 266.9],
    stops: [[218, 168], [118, 128], [198, 93], [278, 118]] },
  { name: 'Hot air balloon', source: launch, box: [127.6, 26.9, 272.4, 305.6],
    stops: [[188, 253], [198, 258], [213, 253]] },
  { name: 'Tick gauge', source: analytics, box: [69.7, 53.6, 330.3, 258.6],
    stops: [[118, 193], [173, 113], [238, 93], [293, 143]] },
  { name: 'Folded map', source: journey, box: [66.7, 68.8, 333.3, 226.7],
    // consider, use, return, and back to discover, so the pin ends where it started
    stops: [[183, 118], [258, 148], [128, 148], [118, 118]] },
];

/** The cards: each figure with its copy, in order. */
export const CARDS: Card[] = FIGURES.map((f, i) => ({ ...f, ...CONTENT[i], n: String(i + 1).padStart(2, '0') }));
