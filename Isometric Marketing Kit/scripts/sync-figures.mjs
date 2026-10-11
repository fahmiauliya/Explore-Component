// Copies the ten figure files, unchanged, from the Line Illustration project into src/vendor/figures, so the site
// builds on its own (on Vercel, the repo holds only this folder). Run after changing a figure: npm run sync-figures
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const NAMES = ['funnel', 'megaphone', 'magnet', 'target', 'roi', 'email', 'segmentation', 'launch', 'analytics', 'journey'];
const from = (n) => fileURLToPath(new URL(`../../Line Illustration/figures/${n}/${n}.js`, import.meta.url));
const to = (n) => fileURLToPath(new URL(`../src/vendor/figures/${n}.js`, import.meta.url));

const missing = NAMES.filter((n) => !existsSync(from(n)));
if (missing.length) {
  console.error(`Line Illustration not found next to this project (missing: ${missing.join(', ')}); the vendored copies are unchanged.`);
  process.exit(1);
}
for (const n of NAMES) copyFileSync(from(n), to(n));
console.log(`Copied ${NAMES.length} figures into src/vendor/figures.`);
