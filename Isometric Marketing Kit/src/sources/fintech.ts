// The Fintech figures' files as raw text, in their own chunk: loaded when the Fintech tab or one of its pages opens.
import edc from '../vendor/figures/fintech/edc.js?raw';
import moneyjar from '../vendor/figures/fintech/moneyjar.js?raw';
import jars from '../vendor/figures/fintech/jars.js?raw';
import coinstacks from '../vendor/figures/fintech/coinstacks.js?raw';
import safe from '../vendor/figures/fintech/safe.js?raw';
import stamp from '../vendor/figures/fintech/stamp.js?raw';
import bridge from '../vendor/figures/fintech/bridge.js?raw';
import receipt from '../vendor/figures/fintech/receipt.js?raw';
import board from '../vendor/figures/fintech/board.js?raw';
import box from '../vendor/figures/fintech/box.js?raw';

/** Each figure's file, unchanged, by slug. */
const SOURCES: Record<string, string> = {
  'edc-payment': edc,
  'money-jar': moneyjar,
  'jars-on-a-shelf': jars,
  'coin-stacks': coinstacks,
  'safe-box': safe,
  'approval-stamp': stamp,
  'bridge': bridge,
  'receipt-printer': receipt,
  'rate-board': board,
  'subscription-box': box,
};
export default SOURCES;
