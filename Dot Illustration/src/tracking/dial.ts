import type { DialConfig, ResolvedValues } from 'dialkit';
import { withSavedTracking } from '../bird/tuning';
export { TRACKING_ID } from '../bird/tuning';

/*
 * The "Tracking" panel (persist: true, id dot-tracking): the object-tracking overlay of the Sky version, pins on
 * the animal's tracked points, locked to its dots, with coordinate labels. It is on by default on the Sky tab;
 * on the Current tab only when asked, and then in solid colours, since the Current version animates no opacity.
 */
const BASE_PANEL = {
  Overlay: {
    tracking: true,                     // the whole overlay
    labels: true,                       // the coordinate labels at the key points
    targetBox: true,                    // the small square on the first key point
    showOnCurrent: true,                // the overlay on the Current tab too, in solid colours
  },
  Points: {
    count: [20, 5, 40, 1],              // tracked points on the animal, the first of each animal's list
    nodeSize: [2.5, 1, 6, .25],         // a pin's dot, CSS px across; its ring is about 6 px at the default
  },
  Labels: {
    count: [5, 1, 6, 1],                // key points labelled, the first of each animal's key points
    color: '#C8F04A',
  },
  Actions: { saveToFile: { type: 'action', label: 'Save to file' } },  // this panel's values into src/bird/dot-bird.tuning.json
} satisfies DialConfig;
export const TRACKING_PANEL = withSavedTracking(BASE_PANEL);
export type TrackingValues = ResolvedValues<typeof BASE_PANEL>;
