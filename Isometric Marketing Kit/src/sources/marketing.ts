// The Marketing figures' files as raw text, in their own chunk: loaded when the Marketing tab or one of its pages opens.
import funnel from '../vendor/figures/funnel.js?raw';
import megaphone from '../vendor/figures/megaphone.js?raw';
import magnet from '../vendor/figures/magnet.js?raw';
import target from '../vendor/figures/target.js?raw';
import roi from '../vendor/figures/roi.js?raw';
import email from '../vendor/figures/email.js?raw';
import segmentation from '../vendor/figures/segmentation.js?raw';
import launch from '../vendor/figures/launch.js?raw';
import analytics from '../vendor/figures/analytics.js?raw';
import journey from '../vendor/figures/journey.js?raw';

/** Each figure's file, unchanged, by slug. */
const SOURCES: Record<string, string> = {
  'funnel': funnel,
  'megaphone': megaphone,
  'magnet': magnet,
  'spotlight': target,
  'connected-glasses': roi,
  'pigeonhole-cabinet': email,
  'rotating-tray': segmentation,
  'hot-air-balloon': launch,
  'tick-gauge': analytics,
  'folded-map': journey,
};
export default SOURCES;
