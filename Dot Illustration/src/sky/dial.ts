import type { DialConfig, ResolvedValues } from 'dialkit';
import { VARIANT_NAMES } from './variant';
import { withSavedSky } from '../bird/tuning';
export { SKY_ID } from '../bird/tuning';

/*
 * The "Sky" panel (persist: true, id dot-sky): the tab, the sky background, the Sky version's dots, its tracking
 * grid, its text and markers, and the optional extras. The Current version reads none of this; the Sky version reads all of it on top
 * of the shared Dot Bird grid, tone and motion dials.
 */
export const TABS = ['Current', 'Sky'] as const;
export type Tab = (typeof TABS)[number];

const BASE_PANEL = {
  View: { tab: { type: 'select', options: [...TABS], default: 'Current' } },
  Sky: {
    source: { type: 'select', options: ['dummy', 'image', 'video'], default: 'dummy' },
    path: '/sky.jpg',                   // the image or video, served from public/ (use /sky.mp4 for a video)
    color: '#2D36C8',                   // the dummy sky's base, lighter toward the top
    cloudSpeed: [1, 0, 3, .05],         // the clouds' drift, right to left
    cloudAmount: [.5, 0, 1, .01],       // how much of the sky the clouds cover
  },
  'Sky Dots': {                       // the same dots and pills as the Current version, white, the tones told apart by opacity (%)
    variant: { type: 'select', options: VARIANT_NAMES, default: 'Depth' },  // a preset of the three, or Custom
    light: [30, 1, 100, 1],             // the light tone's opacity (the Current version's light blue)
    mid: [65, 1, 100, 1],               // the mid tone's (bright blue)
    dark: [100, 1, 100, 1],             // the dark tone's (the navy pills)
    shimmerLow: [60, 1, 100, 1],        // the shimmer factor's dimmest, %: final opacity = tone × factor
    shimmerHigh: [100, 1, 100, 1],      // and brightest
    shimmerSpeed: [.3, .05, 2, .01],    // cycles a second of the shimmer's noise: at .3 a dot takes about 1.7 s from dim to bright
    shimmerClump: [5, 2, 12, .5],       // the patches of the shimmer, cells
    sparkles: false,                    // a few red and green dots instead of white ones
    sparkleAmount: [1.5, 0, 5, .1],     // % of the subject's cells, when on
    sparkleRed: '#FF5A4E',
    sparkleGreen: '#4EE07A',
  },
  Grid: {
    enabled: true,
    lineWidth: [1, 1, 4, 1],            // CSS px; drawn crisp at the device's pixels
    padding: [3, 0, 6, .5],             // cells between the subject's loop box and the lines
    return: [1.8, .5, 4, .1],           // seconds for a line pushed outward to settle back; a line never moves inward faster than 5% of the frame a second
    linkColors: true,                   // markers and marker labels take the line colour
    showLoopBox: false,                 // the subject's loop box, a faint dashed rectangle, to check the grid against
  },
  'Grid Current': { line: '#A9B0CC', marker: '#A9B0CC', label: '#6B7394' },          // solid colours: the Current tab animates no opacity
  'Grid Sky': { line: '#ffffff', marker: '#ffffff', label: '#ffffff', opacity: [.7, 0, 1, .01] },
  Text: {
    edge: 'OBJECT TRACKING · {grid} · {fps} FPS',  // up the top-left corner; {name} {seq} {grid} {fps} fill in live; empty draws nothing
    name: true,                         // the animal's name at the grid's top-left marker
    data: true,                         // the tracking data in the bottom-right corner, live from the grid
    baseLat: '-08.67052',               // the coordinates the grid's position moves around
    baseLon: '115.21264',
    baseAlt: '0412.6',
  },
  Markers: {
    enabled: true,                      // a small square where the grid's lines cross
    size: [6, 2, 20, 1],                // CSS px
    style: { type: 'select', options: ['filled', 'outline'], default: 'filled' },
  },
  Extras: {
    caption: false,                     // small italic text up the inside of the right line
    captionText: 'grow wings and fly',
    stars: false,                       // small white stars in the sky
  },
  Actions: { saveToFile: { type: 'action', label: 'Save to file' } },  // this panel's values into src/bird/dot-bird.tuning.json
} satisfies DialConfig;
export const SKY_PANEL = withSavedSky(BASE_PANEL);
export type SkyValues = ResolvedValues<typeof BASE_PANEL>;
