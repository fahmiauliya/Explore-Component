// The Fintech illustrations: unchanged copies of the Line Illustration project's fintech figures (npm run sync-figures),
// whose files load per tab (src/sources/).
import type { Entry, Target } from './figures';

const t = (label: string, x: number, y: number): Target => ({ label, at: [x, y] });

// measured in the browser: the union of each drawing's bounding box at rest, at every hover and on the way between
// (the coin tube's from rendered frames, since its coins fade in and out through masks above the cap; the receipt's
// with its tallest receipt, a two-line name)
const BOX: Record<string, Entry['box']> = {
  'edc-payment': [68.7, 49.9, 331.3, 282.5], 'money-jar': [132.6, 49.7, 267.4, 284.6], 'jars-on-a-shelf': [58.6, 72, 341.4, 280],
  'coin-stacks': [56.8, 45, 343.2, 287.9], 'safe-box': [16, 62.3, 308.6, 270.8], 'approval-stamp': [63.5, 20, 336, 267],
  bridge: [74.9, 73.3, 325, 246.7], 'receipt-printer': [81, 38, 318.5, 269.5], 'rate-board': [72.5, 63, 325, 267.5],
  'subscription-box': [86.5, 45.5, 313, 278],
};

/** Figures that were replaced: their old addresses lead to the new ones. */
// measured from rendered pixels: each drawing's extent at rest, settled. The gallery sizes every figure by this, so
// they all look the same size whatever their motion does (the balloon's flight, the box's flaps)
const REST: Record<string, Entry['rest']> = {
  'edc-payment': [68.7, 69.2, 331.3, 282.5], 'money-jar': [132.6, 49.7, 267.4, 284.6],
  'jars-on-a-shelf': [58.6, 79.4, 341.4, 280], 'coin-stacks': [56.8, 116.4, 343.2, 287.9],
  'safe-box': [117, 62.3, 308.6, 267.2], 'approval-stamp': [63.5, 65, 336, 267], bridge: [74.9, 73.3, 325, 246.7],
  'receipt-printer': [81, 73.5, 318.5, 269.5], 'rate-board': [72.5, 63, 325, 267.5],
  'subscription-box': [86.5, 88, 313, 278],
};

export const REPLACED: Record<string, string> = {
  'pneumatic-tube': 'edc-payment', 'growing-plant': 'coin-stacks', 'money-plant': 'coin-stacks', 'coin-tube': 'money-jar',
  'vault-door': 'safe-box', ladder: 'approval-stamp', 'credit-card': 'approval-stamp', 'balance-scale': 'rate-board', 'coin-swap': 'rate-board', 'flip-coin': 'rate-board',
  'tear-off-calendar': 'subscription-box', 'loop-track': 'subscription-box',
};

export const FINTECH: Entry[] = ([
  // the card taps the terminal, the amount and a check show on its screen, and a receipt prints
  { n: '01', slug: 'edc-payment', name: 'EDC payment', topic: 'Payments', component: 'EdcPayment',
    targets: [t('terminal', 195, 178)], customHold: 3400,
    props: [
      { name: 'amount', label: 'Amount', type: 'string', fallback: '$24.00', doc: 'shown on the screen once paid, up to 10 characters', max: 10, allow: '[A-Za-z0-9.,$ ]' },
      { name: 'logo', label: 'Logo', type: 'string', fallback: '', doc: 'a small logo on the front of the printer hump, as line path data in a unit square (absolute M L C Q Z)', max: 120000, allow: '.', optional: true, kind: 'svg', blank: true },
    ] },
  // one hover drops coins and the odd banknote through the lid; they pile up in a loose heap, and settle back on leave
  { n: '02', slug: 'money-jar', name: 'Money jar', topic: 'Savings', component: 'MoneyJar',
    targets: [t('jar', 200, 165)], customHold: 7400,
    props: [
      { name: 'fill', label: 'Fill', type: 'number', fallback: '3', doc: 'how full it gets on hover: 1 a quarter, 5 nearly to the shoulder', max: 1, allow: '[0-9]', kind: 'stepper', range: [1, 5] },
      { name: 'label', label: 'Label', type: 'string', fallback: '', doc: 'a paper label round the jar, up to 8 letters, digits or spaces', max: 8, allow: '[A-Z0-9 ]', upper: true, optional: true, example: 'e.g. BALI' },
    ] },
  // three jars share one budget: the split sets their coins; hovering a jar moves one or two coins into it, in a low arc
  { n: '03', slug: 'jars-on-a-shelf', name: 'Jars on a shelf', topic: 'Budgeting', component: 'BudgetJars',
    targets: [t('jar 1', 114, 209), t('jar 2', 200, 166), t('jar 3', 286, 122)], customHold: 1600,
    props: [
      { name: 'jars', label: 'Jars', type: '{ label, percent }[]', fallback: 'NEEDS:50|WANTS:30|SAVE:20', doc: 'three jars, each { label: up to 6 letters, digits or spaces, percent: 0–100 }, the percents summing to 100', max: 200, allow: '.', kind: 'jars' },
    ] },
  // one hover drops coins onto six stacks, left to right, until they rise like compound growth; leaving lifts them away
  { n: '04', slug: 'coin-stacks', name: 'Coin stacks', topic: 'Investing', component: 'CoinStacks',
    targets: [t('tray', 200, 208)], customHold: 4600,
    props: [
      { name: 'years', label: 'Years', type: 'number', fallback: '5', doc: 'how long it compounds: more years, taller final stacks (the last from about 8 coins at 1 year to 20 at 10)', max: 2, allow: '[0-9]', kind: 'stepper', range: [1, 10] },
      { name: 'mark', label: 'Coin mark', type: 'string', fallback: '$', doc: 'on each stack\'s top coin: one letter, digit or $ € £ ¥, or "Rp"', max: 2, allow: '[A-Za-z0-9$€£¥]', hint: 'A letter, a digit, $ € £ ¥, or “Rp”.',
        shape: (s) => (/^rp$/i.test(s) ? 'Rp' : Array.from(s).slice(-1).join('').toUpperCase()) },
    ] },
  // the code fills in digit by digit on the door's display, the handle turns, and the door swings open on what's inside
  { n: '05', slug: 'safe-box', name: 'Safe box', topic: 'Security', component: 'SafeBox',
    targets: [t('safe', 215, 165)], customHold: 3200,
    props: [
      { name: 'code', label: 'Code', type: 'string', fallback: '2580', doc: 'the code the display fills in, exactly 4 digits', max: 4, allow: '[0-9]', exact: true, inputMode: 'numeric', hint: 'Exactly 4 digits.' },
      { name: 'hideCode', label: 'Hide code', type: 'boolean', fallback: 'false', doc: 'show dots instead of digits', max: 5, allow: '.', kind: 'toggle', attr: 'hide-code' },
      { name: 'inside', label: 'Inside', type: 'string', fallback: 'box', doc: 'what the open door shows: "box", "coin" or "letter"', max: 6, allow: '[a-z]', kind: 'segment', options: ['box', 'coin', 'letter'] },
      { name: 'mark', label: 'Letter', type: 'string', fallback: 'C', doc: 'the letter on the cube\'s top face, one character (inside="letter" only)', max: 1, allow: '[A-Z0-9]', upper: true, when: { prop: 'inside', is: 'letter' } },
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
    targets: [t('bridge', 200, 136)], customHold: 2600, boxWith: { goal: [74.9, 73.3, 387.4, 246.7] },
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
