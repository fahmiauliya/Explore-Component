import type { DialConfig, ResolvedValues, TimelineConfig } from 'dialkit';
import { TIMELINE_ID, healStoredTimeline, withSavedPanel, withSavedTimeline } from './tuning';
import { DENSITY_NAMES } from './density';

/*
 * The "Dot Bird" panel and timeline. Sliders are [default, min, max, step]. The timeline is one pass of the
 * flight: flapping builds, a glide with the wings held wide, a bank with half-held wings, then flapping again;
 * it loops, the clips meet end to start, and the dock moves and resizes them.
 */
const BASE_PANEL = {
  Density: {                          // shared by both tabs and both animals
    preset: { type: 'select', options: DENSITY_NAMES, default: 'Default' },  // Chunky 30, Default 54, Fine 80, Ultra 110 columns, or Custom
    columns: [54, 24, 120, 1],          // cells across; rows fill the frame at the same spacing, and everything else follows the cell
    dotSize: [.8, .4, 1, .01],          // a dot's diameter, × cell: the gaps between dots
    navyWidth: [.55, .2, 1, .01],       // a navy pill's width, × cell
  },
  Tone: {                             // tones are dealt per animal by brightness percentile, so every animal shows all three
    emptyLight: [.12, 0, 1, .01],       // a cell covered less than this draws nothing
    light: [30, 0, 100, 1],             // % of the animal's cells, its brightest, as light dots (and all silhouette cells)
    mid: [40, 0, 100, 1],               // the middle %, bright dots: the body's main colour
    dark: [30, 0, 100, 1],              // the darkest %, navy pills; the three are taken in proportion if they do not sum to 100
    lightAngle: [-35, -90, 90, 1],      // where the key light comes from: 0 the top, negative the left
  },
  Colors: { background: '#DEDFE4', light: '#9DB4FB', bright: '#004EFD', navy: '#0F1548' },
  Motion: {
    flapDuration: [.4, .2, 1.2, .01],   // seconds per full flap
    wingBend: [35, 0, 80, 1],           // how far the outer wing lags behind the inner, degrees
    glideEvery: [1, 1, 4, 1],           // the glide happens on every Nth pass of the loop
    bankAmount: [25, 0, 60, 1],         // the roll at full bank, degrees
    updateRate: [24, 12, 60, 1],        // dot updates per second; the dots hold still in between
  },
  Actions: {
    pause: { type: 'action', label: 'Pause' },               // and resume
    step: { type: 'action', label: 'Step one frame' },       // one dot update forward, paused
    saveToFile: { type: 'action', label: 'Save to file' },
  },
} satisfies DialConfig;
export const PANEL = withSavedPanel(BASE_PANEL);
export type Values = ResolvedValues<typeof BASE_PANEL>;

const easing = (duration: number, ease: [number, number, number, number]) => ({ type: 'easing' as const, duration, ease });
const soft = (duration: number) => easing(duration, [.45, 0, .55, 1]);    // sine-like, for the wings settling
const build = (duration: number) => easing(duration, [.22, 1, .36, 1]);   // ease-out, for the flapping building

const BASE_TIMELINE = {
  duration: 8.4,                                                                        // 21 flaps of .4 s
  flap: { at: 0, duration: 2.8, from: { power: .6 }, to: { power: 1 }, transition: build(2.8) },
  glide: { at: 2.8, from: { spread: 0 }, transition: soft(.6), steps: [                 // in over the last flap and a half
    { duration: .6, to: { spread: 1 }, transition: soft(.6) },
    { duration: .6, to: { spread: 1 }, transition: soft(.6) },                          // the glide itself, alive
    { duration: .5, to: { spread: 0 }, transition: soft(.5) },                          // out, the flap growing back
  ] },
  bank: { at: 4.5, from: { bank: 0, spread: 0 }, transition: soft(.7), steps: [
    { duration: .7, to: { bank: 1, spread: .5 }, transition: soft(.7) },
    { duration: .8, to: { bank: 1, spread: .5 }, transition: soft(.8) },
    { duration: .7, to: { bank: 0, spread: 0 }, transition: soft(.7) },
  ] },
  flapAgain: { at: 6.7, duration: 1.7, from: { power: .5 }, to: { power: 1 }, transition: build(1.7) },
} satisfies TimelineConfig;
healStoredTimeline(TIMELINE_ID, ['flap.at', 'glide.at', 'bank.at', 'flapAgain.at']);
export const TIMELINE = withSavedTimeline(BASE_TIMELINE);
export const CLIPS = ['flap', 'glide', 'bank', 'flapAgain'] as const;
