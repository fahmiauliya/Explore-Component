// The Fintech illustrations: unchanged copies of the Line Illustration project's fintech figures (npm run sync-figures),
// whose files load per tab (src/sources/).
import type { Entry, Target } from './figures';

const t = (label: string, x: number, y: number): Target => ({ label, at: [x, y] });

// measured in the browser: the union of each drawing's bounding box at rest, at every hover and on the way between
// (the coin tube's from rendered frames, since its coins fade in and out through masks above the cap; the receipt's
// with its tallest receipt, a two-line name)
const BOX: Record<string, Entry['box']> = {
  'pneumatic-tube': [62.5, 78.1, 337.5, 249.9], 'coin-tube': [75.5, 38, 324, 263], 'jars-on-a-shelf': [68.3, 23.4, 331.7, 279.7],
  'growing-plant': [106, 34.5, 293.5, 289], 'safe-box': [88, 44, 311.5, 287.5], 'approval-stamp': [63.5, 20, 336, 267],
  bridge: [67.5, 68.5, 332, 259.5], 'receipt-printer': [81, 38, 318.5, 269.5], 'rate-board': [72.5, 63, 325, 267.5],
  'subscription-box': [86.5, 45.5, 313, 278],
};

/** Figures that were replaced: their old addresses lead to the new ones. */
// measured from rendered pixels: each drawing's extent at rest, settled. The gallery sizes every figure by this, so
// they all look the same size whatever their motion does (the balloon's flight, the box's flaps)
const REST: Record<string, Entry['rest']> = {
  'pneumatic-tube': [61, 76.5, 338.5, 251], 'coin-tube': [75.5, 41.5, 324, 263],
  'jars-on-a-shelf': [68.3, 71.9, 331.7, 279.7], 'growing-plant': [106, 120, 293.5, 289],
  'safe-box': [88, 44, 311.5, 287.5], 'approval-stamp': [63.5, 65, 336, 267], bridge: [67.5, 75.5, 332, 259.5],
  'receipt-printer': [81, 73.5, 318.5, 269.5], 'rate-board': [72.5, 63, 325, 267.5],
  'subscription-box': [86.5, 88, 313, 278],
};

export const REPLACED: Record<string, string> = {
  'vault-door': 'safe-box', ladder: 'approval-stamp', 'credit-card': 'approval-stamp', 'balance-scale': 'rate-board', 'coin-swap': 'rate-board', 'flip-coin': 'rate-board',
  'tear-off-calendar': 'subscription-box', 'loop-track': 'subscription-box',
};

export const FINTECH: Entry[] = ([
  { n: '01', slug: 'pneumatic-tube', name: 'Pneumatic tube', topic: 'Payments', component: 'PneumaticTube',
    targets: [t('terminal A', 113, 166), t('terminal B', 287, 124)] },
  // one coin per hover; the fifth hover empties it
  { n: '02', slug: 'coin-tube', name: 'Coin tube', topic: 'Savings', component: 'CoinTube',
    targets: [t('tube', 200, 137)], repeat: ['saving 1', 'saving 2', 'saving 3', 'goal'] },
  // three jars share one budget: the split sets their coins; hovering a jar moves a few coins into it
  { n: '03', slug: 'jars-on-a-shelf', name: 'Jars on a shelf', topic: 'Budgeting', component: 'BudgetJars',
    targets: [t('jar 1', 124, 202), t('jar 2', 200, 164), t('jar 3', 276, 126)], customHold: 1600,
    props: [
      { name: 'jars', label: 'Jars', type: '{ label, percent }[]', fallback: 'NEEDS:50|WANTS:30|SAVE:20', doc: 'three jars, each { label: up to 6 letters, digits or spaces, percent: 0–100 }, the percents summing to 100', max: 200, allow: '.', kind: 'jars' },
    ] },
  // one hover grows it all the way to the bloom; leaving shrinks it back to the sprout
  { n: '04', slug: 'growing-plant', name: 'Growing plant', topic: 'Investing', component: 'GrowingPlant',
    targets: [t('pot', 200, 230)], customHold: 3200,
    props: [
      { name: 'label', label: 'Label', type: 'string', fallback: '', doc: 'a garden marker in the pot, up to 6 letters, digits or spaces', max: 6, allow: '[A-Z0-9 ]', upper: true, optional: true, example: 'e.g. 2030' },
      { name: 'bloom', label: 'Bloom', type: 'string', fallback: 'daisy', doc: 'what it grows into: "daisy", "tulip" or "leaf"', max: 5, allow: '[a-z]', kind: 'segment', options: ['daisy', 'tulip', 'leaf'] },
    ] },
  { n: '05', slug: 'safe-box', name: 'Safe box', topic: 'Security', component: 'SafeBox',
    targets: [t('safe', 253, 193)], customHold: 3000,
    props: [
      { name: 'code', label: 'Code', type: 'string', fallback: '2580', doc: 'the code the dial enters, exactly 4 digits', max: 4, allow: '[0-9]', exact: true, inputMode: 'numeric', hint: 'Exactly 4 digits.' },
      { name: 'hideCode', label: 'Hide code', type: 'boolean', fallback: 'false', doc: 'show dots instead of digits', max: 5, allow: '.', kind: 'toggle', attr: 'hide-code' },
    ] },
  // the whole drawing starts it: the stamp lifts, presses and leaves its mark
  { n: '06', slug: 'approval-stamp', name: 'Approval stamp', topic: 'Credit score', component: 'ApprovalStamp',
    targets: [t('stamp', 250, 116)], customHold: 3000,
    props: [
      { name: 'mark', label: 'Mark', type: 'string', fallback: 'check', doc: 'what the stamp leaves: "check", "text" or "logo"', max: 5, allow: '[a-z]', kind: 'segment', options: ['check', 'text', 'logo'] },
      { name: 'text', label: 'Text', type: 'string', fallback: 'APPROVED', doc: 'the word in a text mark, up to 8 letters, digits or spaces', max: 8, allow: '[A-Z0-9 ]', upper: true, when: { prop: 'mark', is: 'text' } },
      { name: 'logo', label: 'Logo', type: 'string', fallback: '', doc: 'a logo mark, as line path data in a unit square (absolute M L C Q Z); empty shows the Compo "C"', max: 120000, allow: '.', optional: true, kind: 'svg', when: { prop: 'mark', is: 'logo' } },
    ] },
  // the whole drawing builds it: one target is enough
  { n: '07', slug: 'bridge', name: 'Bridge', topic: 'Loans', component: 'Bridge',
    targets: [t('bridge', 211, 130)], customHold: 2600, boxWith: { goal: [67.5, 68.5, 386, 259.5] },
    props: [
      { name: 'installments', label: 'Installments', type: 'number', fallback: '5', doc: 'how many planks pay the gap off, 3 to 12', max: 2, allow: '[0-9]', kind: 'stepper', range: [3, 12] },
      { name: 'goal', label: 'Goal', type: 'string', fallback: '', doc: 'a flag on the far cliff, up to 8 letters, digits or spaces', max: 8, allow: '[A-Z0-9 ]', upper: true, optional: true, example: 'e.g. HOME' },
    ] },
  { n: '08', slug: 'receipt-printer', name: 'Receipt printer', topic: 'Invoicing', component: 'ReceiptPrinter',
    targets: [t('printer', 200, 177)], customHold: 3200,
    props: [
      { name: 'logo', label: 'Logo', type: 'string', fallback: '', doc: 'the logo on the front, as line path data in a unit square (absolute M L C Q Z); empty shows the Compo "C"', max: 120000, allow: '.', optional: true, kind: 'svg' },
      { name: 'showLogo', label: 'Show logo', type: 'boolean', fallback: 'true', doc: 'whether the logo shows', max: 5, allow: '.', kind: 'toggle', attr: 'show-logo' },
      { name: 'name', label: 'Name', type: 'string', fallback: 'THANK YOU', doc: 'printed at the foot of the receipt, up to 20 characters, wrapping to 2 lines', max: 20, allow: '[A-Z0-9 $.,!&-]', upper: true },
      { name: 'total', label: 'Total', type: 'string', fallback: '', doc: 'printed on the right of the total row, up to 10 characters', max: 10, allow: '[A-Za-z0-9 $.,!&-]', optional: true, example: 'e.g. $24.00' },
    ] },
  // hover flips FROM to TO, tile by tile; leaving flips it back
  { n: '09', slug: 'rate-board', name: 'Rate board', topic: 'Currency exchange', component: 'ExchangeBoard',
    targets: [t('board', 227, 167)], customHold: 1400,
    props: [
      { name: 'from', label: 'From', type: 'string', fallback: 'USD', doc: 'the currency it shows at rest, 3 letters', max: 3, allow: '[A-Z]', upper: true },
      { name: 'to', label: 'To', type: 'string', fallback: 'IDR', doc: 'the currency it flips to on hover, 3 letters', max: 3, allow: '[A-Z]', upper: true },
    ] },
  { n: '10', slug: 'subscription-box', name: 'Subscription box', topic: 'Subscriptions', component: 'SubscriptionBox',
    targets: [t('box', 200, 131)],
    props: [{ name: 'mark', label: 'Letter', type: 'string', fallback: 'C', doc: 'the letter on the item, one character', max: 1, allow: '[A-Z0-9]', upper: true }] },
] as Omit<Entry, 'box' | 'rest' | 'category' | 'source'>[]).map((e) => ({ ...e, category: 'fintech' as const, source: '', box: BOX[e.slug], rest: REST[e.slug] }));
