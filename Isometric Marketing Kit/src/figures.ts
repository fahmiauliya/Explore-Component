// The Marketing illustrations: unchanged copies of the Line Illustration project's figures (npm run sync-figures),
// whose files load per tab (src/sources/).
// The Fintech ones are in fintech.ts; both lists come together as the gallery's tabs below.
import { FINTECH } from './fintech';

export type Target = { label: string; at: [number, number] };
export type CustomProp = {
  name: string; label: string; type: string; doc: string;
  /** Used when the field is empty; '' for an optional one. */
  fallback: string;
  /** The most characters it takes. */
  max: number;
  /** A regular expression character class of what it accepts, after `upper`. */
  allow: string;
  /** Typed letters become capitals. */
  upper?: boolean;
  optional?: boolean;
  /** 'svg': an uploaded SVG, converted to line path data in the browser (src/logo.ts), instead of typed text;
   *  'toggle': on or off ("true" / "false"), a boolean prop in the React download;
   *  'stepper': a whole number in `range`, set with – / + or the arrow keys, a number prop in the React download;
   *  'segment': one of `options`, as a segmented control;
   *  'jars': three { label, percent } rows summing to 100, kept as "NEEDS:50|WANTS:30|SAVE:20" (the jars' budget). */
  kind?: 'svg' | 'toggle' | 'stepper' | 'segment' | 'jars';
  /** 'segment': the choices, in order (the stamp's mark: check, text, logo). */
  options?: string[];
  /** Shown (and used in the snippet) only while another prop has this value: { prop: 'mark', is: 'text' }. */
  when?: { prop: string; is: string };
  /** 'stepper': the whole numbers it steps through, [min, max]. */
  range?: [number, number];
  /** The data attribute's name when it isn't the prop's own (HTML lowercases attribute names): showLogo → show-logo. */
  attr?: string;
  /** The field's own hint under it; '' shows none (the block's note covers it). */
  hint?: string;
  /** An example shown in the empty field. */
  example?: string;
  /** The value only counts when it has exactly `max` characters; until then the last full one stays (the safe's code). */
  exact?: boolean;
  /** Tidies the typed value after `allow` and `max` (the coin's mark: one character, or "Rp"). */
  shape?: (typed: string) => string;
  /** 'svg': empty means no logo at all (the EDC card), rather than the Compo "C". */
  blank?: boolean;
  /** The on-screen keyboard to offer: 'numeric' for digits. */
  inputMode?: 'numeric' | 'text';
};

/** The drawing's extent with these data attribute values: its own, grown by any `boxWith` whose attribute is set. */
export function boxOf(e: Entry, attrs: Record<string, string> = {}): Entry['box'] {
  let [x0, y0, x1, y1] = e.box;
  for (const [k, b] of Object.entries(e.boxWith ?? {})) if (attrs[k]) { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
  return [x0, y0, x1, y1];
}

/** A figure's custom values as its host's data attributes (name → data-name, showLogo → data-show-logo). */
export const dataOf = (props: CustomProp[] | undefined, values: Record<string, string>) =>
  Object.fromEntries((props ?? []).map((p) => [p.attr ?? p.name, values[p.name] ?? p.fallback]));
export type Category = 'marketing' | 'fintech';
export type Entry = {
  /** The gallery tab it belongs to; numbering restarts per category. */
  category: Category;
  n: string;
  slug: string;
  name: string;
  topic: string;
  component: string;
  /** The figure file, unchanged: empty until its tab's sources have loaded (loadCategory). */
  source: string;
  /** Hover targets in viewBox units, in demo order: the keyboard's stops and the video's script. */
  targets: Target[];
  /** Extra stops played after the targets in the video, so the loop comes back to where it started. */
  returnTo?: string;
  /** For a figure that moves one step per hover of its single target: the state each successive hover reaches, in
   *  order. The demo hovers, leaves and hovers again (plus one more hover that resets it), and the SVG states follow. */
  repeat?: string[];
  /** Video length: about 8 seconds, stretched where an idle motion needs a whole period to loop. */
  seconds?: number;
  /** The drawing's extent over every state (rest, each hover, the motion between), in viewBox units: [x0, y0, x1, y1]. */
  box: [number, number, number, number];
  /** The drawing's extent at rest, in viewBox units: what its size in the gallery and detail view is judged by. */
  rest: [number, number, number, number];
  /** Props beyond theme, interactive and className that the figure reads from its host's data attributes (the
   *  subscription box's letter: mark → data-mark). The detail page's Customize block edits them; the React download,
   *  the USE IT snippet and the props list show them. */
  props?: CustomProp[];
  /** How long the Customize block holds the illustration open after a change, so the change is seen (ms). */
  customHold?: number;
  /** A note under the Customize block's fields. */
  customNote?: string;
  /** The extent when a custom value is set, by data attribute (the bridge's goal flag reaches past its right edge):
   *  the drawing is fitted to it only then, so the default stays as large as the others. */
  boxWith?: Record<string, [number, number, number, number]>;
};

const t = (label: string, x: number, y: number): Target => ({ label, at: [x, y] });

// measured on each figure's own page: the union of its bounding box at rest, at every hover and on the way between
const BOX: Record<string, Entry['box']> = {
  funnel: [38.3, 64.6, 332.6, 279], megaphone: [58.9, 85.5, 341.9, 240], magnet: [66.4, 91.2, 333.6, 232.8],
  spotlight: [62.9, 65.4, 337.1, 259.9], 'connected-glasses': [62.4, 87.7, 337.6, 257.9], 'pigeonhole-cabinet': [87.4, 51, 290.4, 279.9],
  'rotating-tray': [70.2, 71.2, 329.8, 266.9], 'hot-air-balloon': [127.6, 26.9, 272.4, 305.6], 'tick-gauge': [69.7, 53.6, 330.3, 258.6],
  'folded-map': [66.7, 68.8, 333.3, 226.7],
};

// measured from rendered pixels: each drawing's extent at rest, settled. The gallery sizes every figure by this, so
// they all look the same size whatever their motion does (the balloon's flight, the box's flaps)
const REST: Record<string, Entry['rest']> = {
  funnel: [36.5, 71, 317.5, 280], megaphone: [57.5, 84, 327.5, 237.5], magnet: [64.5, 89.5, 335, 234],
  spotlight: [61, 64, 338.5, 261], 'connected-glasses': [60.5, 86, 338.5, 259],
  'pigeonhole-cabinet': [86, 49.5, 291.5, 281], 'rotating-tray': [68.5, 70.5, 331, 268],
  'hot-air-balloon': [126, 125, 273.5, 306.5], 'tick-gauge': [68, 52, 331.5, 260],
  'folded-map': [65, 67.5, 334.5, 228],
};

export const ENTRIES: Entry[] = ([
  { n: '01', slug: 'funnel', name: 'Funnel', topic: 'Conversion', component: 'Funnel',
    targets: [t('stage 1', 208, 108), t('stage 2', 208, 168), t('stage 3', 208, 198), t('stage 4', 208, 248)] },
  { n: '02', slug: 'megaphone', name: 'Megaphone', topic: 'Awareness', component: 'Megaphone',
    targets: [t('ring 1', 193, 158), t('ring 2', 223, 163), t('ring 3', 258, 158), t('ring 4', 303, 163)] },
  { n: '03', slug: 'magnet', name: 'Magnet', topic: 'Lead generation', component: 'Magnet',
    targets: [t('cube 1', 93, 133), t('cube 2', 123, 153), t('cube 3', 208, 103), t('cube 4', 213, 188), t('cube 5', 258, 138), t('cube 6', 313, 153)] },
  { n: '04', slug: 'spotlight', name: 'Spotlight', topic: 'Target audience', component: 'Spotlight',
    targets: [t('segment 1', 128, 173), t('segment 2', 193, 213), t('segment 3', 268, 188), t('segment 4', 223, 158)] },
  { n: '05', slug: 'connected-glasses', name: 'Connected glasses', topic: 'ROI', component: 'ConnectedGlasses',
    targets: [t('channel 1', 68, 183), t('channel 2', 158, 178), t('channel 3', 203, 178), t('channel 4', 313, 183)] },
  { n: '06', slug: 'pigeonhole-cabinet', name: 'Pigeonhole cabinet', topic: 'Email marketing', component: 'PigeonholeCabinet',
    targets: [t('slot 1·1', 128, 153), t('slot 2·1', 178, 133), t('slot 3·1', 218, 113), t('slot 4·1', 263, 88),
      t('slot 1·2', 133, 198), t('slot 2·2', 178, 173), t('slot 3·2', 218, 153), t('slot 4·2', 263, 128),
      t('slot 1·3', 128, 238), t('slot 2·3', 173, 213), t('slot 3·3', 218, 193), t('slot 4·3', 263, 168)] },
  { n: '07', slug: 'rotating-tray', name: 'Rotating tray', topic: 'Segmentation', component: 'RotatingTray',
    targets: [t('segment 1', 218, 168), t('segment 2', 118, 128), t('segment 3', 198, 93), t('segment 4', 278, 118)] },
  { n: '08', slug: 'hot-air-balloon', name: 'Hot air balloon', topic: 'Product launch', component: 'HotAirBalloon',
    targets: [t('pre-launch', 188, 253), t('launch', 198, 258), t('scale', 213, 253)], seconds: 9 },
  { n: '09', slug: 'tick-gauge', name: 'Tick gauge', topic: 'Analytics', component: 'TickGauge',
    targets: [t('segment 1', 118, 193), t('segment 2', 173, 113), t('segment 3', 238, 93), t('segment 4', 293, 143)] },
  { n: '10', slug: 'folded-map', name: 'Folded map', topic: 'Customer journey', component: 'FoldedMap',
    targets: [t('discover', 118, 118), t('consider', 183, 118), t('buy', 198, 138), t('use', 258, 148), t('return', 128, 148)], returnTo: 'discover' },
] as Omit<Entry, 'box' | 'rest' | 'category' | 'source'>[]).map((e) => ({ ...e, category: 'marketing' as const, source: '', box: BOX[e.slug], rest: REST[e.slug] }));

/** The gallery tabs, in order: the first is the default (the site's root opens it). */
export const CATEGORIES: { key: Category; label: string; entries: Entry[] }[] = [
  { key: 'marketing', label: 'Marketing', entries: ENTRIES },
  { key: 'fintech', label: 'Fintech', entries: FINTECH },
];
export const ALL = CATEGORIES.flatMap((c) => c.entries);
export const categoryOf = (key: string) => CATEGORIES.find((c) => c.key === key);
/** An illustration by its category and slug, as in /fintech/edc-payment. */
export const find = (category: string, slug: string) => categoryOf(category)?.entries.find((e) => e.slug === slug);

/** Each tab's figure files, in a chunk of their own. */
const SOURCES: Record<Category, () => Promise<{ default: Record<string, string> }>> = {
  marketing: () => import('./sources/marketing'),
  fintech: () => import('./sources/fintech'),
};
const loading = new Map<Category, Promise<void>>();
/** Loads a tab's figure files once (later calls share the first); safe to call ahead of time, as a prefetch. */
export function loadCategory(key: Category) {
  let p = loading.get(key);
  if (!p) {
    p = SOURCES[key]().then((m) => { for (const e of categoryOf(key)!.entries) e.source = m.default[e.slug]; });
    p.catch(() => loading.delete(key));
    loading.set(key, p);
  }
  return p;
}
export const isLoaded = (key: Category) => categoryOf(key)!.entries.every((e) => e.source);
