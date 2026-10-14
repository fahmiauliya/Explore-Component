// Copies the figure files, unchanged, from the Line Illustration project into src/vendor/figures, so the site builds
// on its own (on Vercel, the repo holds only this folder). Run after changing a figure: npm run sync-figures
//   Marketing: Line Illustration/figures/<name>/<name>.js → src/vendor/figures/<name>.js
//   Fintech:   Line Illustration/fintech/<name>/<name>.js → src/vendor/figures/fintech/<name>.js
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SETS = [
  { from: 'figures', to: '', names: ['funnel', 'megaphone', 'magnet', 'target', 'roi', 'email', 'segmentation', 'launch', 'analytics', 'journey'] },
  { from: 'fintech', to: 'fintech/', names: ['edc', 'moneyjar', 'jars', 'coinstacks', 'safe', 'stamp', 'bridge', 'receipt', 'board', 'box'] },
];
const path = (rel) => fileURLToPath(new URL(rel, import.meta.url));

const missing = SETS.flatMap((s) => s.names.filter((n) => !existsSync(path(`../../Line Illustration/${s.from}/${n}/${n}.js`))).map((n) => `${s.from}/${n}`));
if (missing.length) {
  console.error(`Line Illustration not found next to this project, or figures missing (${missing.join(', ')}); the vendored copies are unchanged.`);
  process.exit(1);
}
for (const s of SETS) {
  mkdirSync(path(`../src/vendor/figures/${s.to}`), { recursive: true });
  for (const n of s.names) copyFileSync(path(`../../Line Illustration/${s.from}/${n}/${n}.js`), path(`../src/vendor/figures/${s.to}${n}.js`));
}
console.log(`Copied ${SETS.reduce((t, s) => t + s.names.length, 0)} figures into src/vendor/figures.`);
