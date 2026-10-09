// The ten illustrations, read unchanged from the Line Illustration project.
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

export type Target = { label: string; at: [number, number] };
export type Entry = {
  n: string;
  slug: string;
  name: string;
  topic: string;
  component: string;
  source: string;
  /** Hover targets in viewBox units, in demo order: the keyboard's stops and the video's script. */
  targets: Target[];
  /** Extra stops played after the targets in the video, so the loop comes back to where it started. */
  returnTo?: string;
  /** Video length: about 8 seconds, stretched where an idle motion needs a whole period to loop. */
  seconds?: number;
  /** The drawing's extent over every state (rest, each hover, the motion between), in viewBox units: [x0, y0, x1, y1]. */
  box: [number, number, number, number];
};

const t = (label: string, x: number, y: number): Target => ({ label, at: [x, y] });

// measured on each figure's own page: the union of its bounding box at rest, at every hover and on the way between
const BOX: Record<string, Entry['box']> = {
  funnel: [38.3, 64.6, 332.6, 279], megaphone: [58.9, 85.5, 341.9, 240], magnet: [66.4, 91.2, 333.6, 232.8],
  spotlight: [62.9, 65.4, 337.1, 259.9], 'connected-glasses': [62.4, 87.7, 337.6, 257.9], 'pigeonhole-cabinet': [87.4, 51, 290.4, 279.9],
  'rotating-tray': [70.2, 71.2, 329.8, 266.9], 'hot-air-balloon': [127.6, 26.9, 272.4, 305.6], 'tick-gauge': [69.7, 53.6, 330.3, 258.6],
  'folded-map': [66.7, 68.8, 333.3, 226.7],
};

export const ENTRIES: Entry[] = ([
  { n: '01', slug: 'funnel', name: 'Funnel', topic: 'Conversion', component: 'FunnelIllustration', source: funnel,
    targets: [t('stage 1', 208, 108), t('stage 2', 208, 168), t('stage 3', 208, 198), t('stage 4', 208, 248)] },
  { n: '02', slug: 'megaphone', name: 'Megaphone', topic: 'Awareness', component: 'MegaphoneIllustration', source: megaphone,
    targets: [t('ring 1', 193, 158), t('ring 2', 223, 163), t('ring 3', 258, 158), t('ring 4', 303, 163)] },
  { n: '03', slug: 'magnet', name: 'Magnet', topic: 'Lead generation', component: 'MagnetIllustration', source: magnet,
    targets: [t('cube 1', 93, 133), t('cube 2', 123, 153), t('cube 3', 208, 103), t('cube 4', 213, 188), t('cube 5', 258, 138), t('cube 6', 313, 153)] },
  { n: '04', slug: 'spotlight', name: 'Spotlight', topic: 'Target audience', component: 'SpotlightIllustration', source: target,
    targets: [t('segment 1', 128, 173), t('segment 2', 193, 213), t('segment 3', 268, 188), t('segment 4', 223, 158)] },
  { n: '05', slug: 'connected-glasses', name: 'Connected glasses', topic: 'ROI', component: 'ConnectedGlassesIllustration', source: roi,
    targets: [t('channel 1', 68, 183), t('channel 2', 158, 178), t('channel 3', 203, 178), t('channel 4', 313, 183)] },
  { n: '06', slug: 'pigeonhole-cabinet', name: 'Pigeonhole cabinet', topic: 'Email marketing', component: 'PigeonholeCabinetIllustration', source: email,
    targets: [t('slot 1·1', 128, 153), t('slot 2·1', 178, 133), t('slot 3·1', 218, 113), t('slot 4·1', 263, 88),
      t('slot 1·2', 133, 198), t('slot 2·2', 178, 173), t('slot 3·2', 218, 153), t('slot 4·2', 263, 128),
      t('slot 1·3', 128, 238), t('slot 2·3', 173, 213), t('slot 3·3', 218, 193), t('slot 4·3', 263, 168)] },
  { n: '07', slug: 'rotating-tray', name: 'Rotating tray', topic: 'Segmentation', component: 'RotatingTrayIllustration', source: segmentation,
    targets: [t('segment 1', 218, 168), t('segment 2', 118, 128), t('segment 3', 198, 93), t('segment 4', 278, 118)] },
  { n: '08', slug: 'hot-air-balloon', name: 'Hot air balloon', topic: 'Product launch', component: 'HotAirBalloonIllustration', source: launch,
    targets: [t('pre-launch', 188, 253), t('launch', 198, 258), t('scale', 213, 253)], seconds: 9 },
  { n: '09', slug: 'tick-gauge', name: 'Tick gauge', topic: 'Analytics', component: 'TickGaugeIllustration', source: analytics,
    targets: [t('segment 1', 118, 193), t('segment 2', 173, 113), t('segment 3', 238, 93), t('segment 4', 293, 143)] },
  { n: '10', slug: 'folded-map', name: 'Folded map', topic: 'Customer journey', component: 'FoldedMapIllustration', source: journey,
    targets: [t('discover', 118, 118), t('consider', 183, 118), t('buy', 198, 138), t('use', 258, 148), t('return', 128, 148)], returnTo: 'discover' },
] as Omit<Entry, 'box'>[]).map((e) => ({ ...e, box: BOX[e.slug] }));

export const bySlug = (slug: string) => ENTRIES.find((e) => e.slug === slug);
