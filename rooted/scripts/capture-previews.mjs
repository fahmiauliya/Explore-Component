// Takes a screenshot of every site in src/data/references.js and saves it as
// public/previews/<slug>.webp (640 x 400). Re-running only captures new links.
//
//   npm run previews                      capture missing ones
//   npm run previews:force                capture everything again
//   npm run previews -- --only lapa-ninja,saaspo-com   only these slugs (implies --force)
//   npm run previews -- --headed          use your installed Google Chrome in a visible
//                                         window; many bot checks (Cloudflare) pass this way
//
// GitHub repos get their README showcase image (or the social preview) through
// the GitHub API instead of a screenshot; set GITHUB_TOKEN to raise the API limit.
// public/previews/manifest.json records the source ("readme" | "social") and size.
//
// Needs Chromium once: npx playwright install chromium

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { getSlug, githubRepo, flattenItems } from '../src/lib/references.js';
import { fetchRepoImage, suggestRepo } from './github-image.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/previews');
const MANIFEST = resolve(OUT_DIR, 'manifest.json');
const TOKEN = process.env.GITHUB_TOKEN || '';
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

// Every unique URL across all tabs. GitHub repos are handled through the API.
const items = [];
const repos = [];
const ownersOnly = [];
const seen = new Set();
// Every unique URL across all tabs (bookmark folders included).
for (const item of flattenItems()) {
  if (seen.has(item.url)) continue;
  seen.add(item.url);
  if (ONLY && !ONLY.includes(getSlug(item.url))) continue;
  if (githubRepo(item.url)) repos.push(item);
  else if (/^https?:\/\/(www\.)?github\.com\/[^/?#]+\/?$/i.test(item.url)) {
    ownersOnly.push(item);
    items.push(item);
  } else items.push(item);
}

function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    return {};
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

async function captureRepos() {
  const manifest = readManifest();
  for (const item of repos) {
    const { owner, repo } = githubRepo(item.url);
    const slug = getSlug(item.url);
    const file = resolve(OUT_DIR, `${slug}.webp`);
    if (!FORCE && existsSync(file) && manifest[slug]) {
      stats.skipped += 1;
      console.log(`– ${item.name} (exists, ${manifest[slug].source})`);
      continue;
    }
    try {
      const img = await fetchRepoImage(owner, repo, TOKEN);
      const out = await sharp(img.buf, { pages: 1 }).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
      writeFileSync(file, out.data);
      manifest[slug] = { source: img.source, width: out.info.width, height: out.info.height };
      stats.captured += 1;
      console.log(`✓ ${item.name} (${img.source})`);
    } catch (err) {
      stats.failed += 1;
      console.log(`✗ ${item.name}: ${err.message.split('\n')[0]}`);
    }
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  for (const item of ownersOnly) {
    const owner = item.url.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/$/, '');
    const suggestion = await suggestRepo(owner, TOKEN).catch(() => null);
    console.log(`ℹ ${item.name}: ${item.url} is an owner page, not a repo (screenshot kept).${suggestion ? ` Likely main repo: ${suggestion}` : ''}`);
  }
}

async function main() {
  await captureRepos();
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
