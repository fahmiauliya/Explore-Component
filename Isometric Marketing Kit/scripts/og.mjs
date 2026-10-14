// Writes the share images and favicon PNGs: public/og/site.png, public/og/<slug>.png (1200 × 630), public/favicon-32.png
// and public/apple-touch-icon.png. Run after a figure changes: npm run og. It starts the dev server on its own and
// draws in Google Chrome (playwright-core drives it; no browser download).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = (rel) => fileURLToPath(new URL(`../public/${rel}`, import.meta.url));
const png = (dataUrl) => Buffer.from(dataUrl.split(',')[1], 'base64');

const server = await createServer({ root, logLevel: 'error', server: { port: 5299 } });
await server.listen();
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(`${server.resolvedUrls.local[0]}illustrations`);
  const slugs = await page.evaluate(async () => (await import('/src/figures.ts')).ALL.map((e) => e.slug));
  writeFileSync(out('og/site.png'), png(await page.evaluate(async () => (await import('/src/og.ts')).siteImage())));
  for (const slug of slugs) writeFileSync(out(`og/${slug}.png`), png(await page.evaluate(async (s) => (await import('/src/og.ts')).illustrationImage(s), slug)));
  writeFileSync(out('favicon-32.png'), png(await page.evaluate(async () => (await import('/src/og.ts')).iconImage(32, false))));
  writeFileSync(out('apple-touch-icon.png'), png(await page.evaluate(async () => (await import('/src/og.ts')).iconImage(180, true))));
  console.log(`Wrote ${slugs.length + 1} share images and 2 icons into public/.`);
} finally {
  await browser.close();
  await server.close();
}
