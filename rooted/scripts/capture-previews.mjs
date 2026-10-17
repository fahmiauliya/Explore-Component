// Takes a screenshot of every site in src/data/references.js and saves it as
// public/previews/<slug>.webp (640 x 400). Re-running only captures new links.
//
//   npm run previews                      capture missing ones
//   npm run previews:force                capture everything again
//   npm run previews -- --only lapa-ninja,saaspo-com   only these slugs (implies --force)
//   npm run previews -- --headed          use your installed Google Chrome in a visible
//                                         window; many bot checks (Cloudflare) pass this way
//
// Needs Chromium once: npx playwright install chromium

import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { tabs } from '../src/data/references.js';
import { getSlug } from '../src/lib/references.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/previews');
const HEADED = process.argv.includes('--headed');
const onlyArg = process.argv.find((a) => a.startsWith('--only'));
const ONLY = onlyArg ? (onlyArg.includes('=') ? onlyArg.split('=')[1] : process.argv[process.argv.indexOf(onlyArg) + 1] || '').split(',').filter(Boolean) : null;
const FORCE = process.argv.includes('--force') || Boolean(ONLY);

// Ad and tracker hosts are blocked so banners don't end up in the screenshots.
const AD_HOSTS = /doubleclick|googlesyndication|adsystem|adservice|googleads|adnxs|taboola|outbrain|carbonads|buysellads|ethicalads|pagead|criteo|rubiconproject|pubmatic|openx|adroll|media\.net/i;
// Text that means we are looking at a bot check instead of the site.
const CHALLENGE = /just a moment|security verification|not a bot|checking your browser|verifying/i;

const CONCURRENCY = 3;
const SITE_TIMEOUT = HEADED ? 60_000 : 30_000;
const VIEWPORT = { width: 1280, height: 800 };
const OUTPUT = { width: 640, height: 400 };
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

// Every unique URL across all tabs.
const items = [];
const seen = new Set();
for (const tab of tabs) {
  for (const section of tab.sections) {
    for (const item of section.items) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      if (ONLY && !ONLY.includes(getSlug(item.url))) continue;
      items.push(item);
    }
  }
}

mkdirSync(OUT_DIR, { recursive: true });

const stats = { captured: 0, skipped: 0, failed: 0 };

async function capture(browser, item) {
  const file = resolve(OUT_DIR, `${getSlug(item.url)}.webp`);
  if (!FORCE && existsSync(file)) {
    stats.skipped += 1;
    console.log(`– ${item.name} (exists)`);
    return;
  }

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'en-US',
    ...(HEADED ? {} : { userAgent: USER_AGENT }),
  });
  const page = await context.newPage();
  page.setDefaultTimeout(SITE_TIMEOUT);
  await page.route(/.*/, (route) => (AD_HOSTS.test(route.request().url()) ? route.abort() : route.continue()));

  // Whole-site timeout so a slow page never blocks the run.
  const timer = new Promise((_, reject) => setTimeout(() => reject(new Error('timed out after 30s')), SITE_TIMEOUT));

  try {
    await Promise.race([
      (async () => {
        await page.goto(item.url, { waitUntil: 'load', timeout: SITE_TIMEOUT });
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(1500);
        // Give a bot check a few seconds to clear; refuse to save the challenge page itself.
        for (let i = 0; i < 8; i += 1) {
          const text = await page.evaluate(() => `${document.title} ${document.body?.innerText.slice(0, 400) || ''}`);
          if (!CHALLENGE.test(text)) break;
          if (i === 7) throw new Error('blocked by a bot check (try --headed, or add your own image)');
          await page.waitForTimeout(2500);
        }
        const png = await page.screenshot({ type: 'png', fullPage: false });
        await sharp(png).resize(OUTPUT.width, OUTPUT.height, { fit: 'cover' }).webp({ quality: 75 }).toFile(file);
      })(),
      timer,
    ]);
    stats.captured += 1;
    console.log(`✓ ${item.name}`);
  } catch (err) {
    stats.failed += 1;
    console.log(`✗ ${item.name}: ${err.message.split('\n')[0]}`);
  } finally {
    await context.close().catch(() => {});
  }
}

async function main() {
  const browser = await chromium.launch(
    HEADED
      ? { channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] }
      : { headless: true }
  );
  const queue = [...items];

  // Run a few sites at a time.
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const item = queue.shift();
        await capture(browser, item);
      }
    })
  );

  await browser.close();
  console.log(`\nDone. captured ${stats.captured} / skipped ${stats.skipped} / failed ${stats.failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
