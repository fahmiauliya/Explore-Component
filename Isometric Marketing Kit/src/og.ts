import { ALL, CATEGORIES, loadCategory, type Entry } from './figures';
import { loadFigure, loadKernel } from './hairline';
import { openScene, rasterSvg } from './download/scene';
import { TOKENS } from './tokens';

/*
 * The share images (1200 × 630), drawn in the browser from the figures themselves: each illustration at rest with its
 * name, and one for the site. Not part of the site: scripts/og.mjs runs it and writes public/og/*.png
 * (npm run og, after a figure changes).
 */

const W = 1200, H = 630, PAD = 80, t = TOKENS.dark;

async function canvas() {
  await Promise.all(['500 64px Geist', '400 26px Geist', '400 20px "Geist Mono"'].map((f) => document.fonts.load(f)));
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = t.bg; g.fillRect(0, 0, W, H);
  return { c, g };
}

/** A figure at rest, its rest pose's area `size` px square (but never wider than `maxW` or taller than `maxH`), centred
 *  on (cx, cy), with 2px lines. */
async function figure(g: CanvasRenderingContext2D, e: Entry, cx: number, cy: number, size: number, maxW = size * 1.25, maxH = size * 1.25) {
  const value = loadFigure(e.source, loadKernel()).range[1];
  const scene = await openScene(e, 'dark', value);
  try {
    await scene.point();
    scene.settle(3);
    const [r0, r1, r2, r3] = e.rest, k = Math.min(size / Math.sqrt((r2 - r0) * (r3 - r1)), maxW / (r2 - r0), maxH / (r3 - r1));
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(rasterSvg(scene, 400 * k, 320 * k, 2 / k));
    await img.decode();
    g.drawImage(img, cx - (k * (r0 + r2)) / 2, cy - (k * (r1 + r3)) / 2, 400 * k, 320 * k);
  } finally {
    scene.close();
  }
}

function text(g: CanvasRenderingContext2D, s: string, x: number, y: number, font: string, color: string, spacing = 0) {
  g.font = font; g.fillStyle = color; g.textBaseline = 'alphabetic';
  (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
  g.fillText(s, x, y);
}

/** One illustration's image: its number and topic, its name, and the drawing on the right. */
export async function illustrationImage(slug: string) {
  await Promise.all(CATEGORIES.map((c) => loadCategory(c.key)));
  const e = ALL.find((x) => x.slug === slug)!;
  const { c, g } = await canvas();
  text(g, 'COMPO', PAD, PAD + 16, '400 20px "Geist Mono"', t.muted, 2);
  text(g, `${e.n} · ${e.topic.toUpperCase()}`, PAD, 300, '400 20px "Geist Mono"', t.muted, 2);
  // the name keeps to the left half: a long one steps down in size
  let px = 64;
  for (g.font = `500 ${px}px Geist`; g.measureText(e.name).width > 520 && px > 40; g.font = `500 ${px}px Geist`) px -= 2;
  text(g, e.name, PAD, 370, `500 ${px}px Geist`, t.text);
  text(g, 'Interactive line illustration', PAD, H - PAD, '400 26px Geist', t.muted);
  // the drawing keeps to the right half, clear of the name
  await figure(g, e, 885, 320, 340, 440, 440);
  return c.toDataURL('image/png');
}

/** The site's image: the name and line, and four illustrations. */
export async function siteImage() {
  await Promise.all(CATEGORIES.map((c) => loadCategory(c.key)));
  const { c, g } = await canvas();
  text(g, 'Compo', PAD, 290, '500 64px Geist', t.text);
  text(g, 'Interactive components for product teams.', PAD, 350, '400 26px Geist', t.muted);
  text(g, 'Starting with line illustrations.', PAD, 388, '400 26px Geist', t.muted);
  text(g, 'FREE FOR PERSONAL AND COMMERCIAL USE', PAD, H - PAD, '400 20px "Geist Mono"', t.muted, 2);
  const pick = ['funnel', 'safe-box', 'megaphone', 'rate-board'].map((s) => ALL.find((x) => x.slug === s)!);
  const cells = [[790, 185], [1020, 185], [790, 445], [1020, 445]];
  for (const [i, e] of pick.entries()) await figure(g, e, cells[i][0], cells[i][1], 170);
  return c.toDataURL('image/png');
}

/** The favicon as PNG: the SVG mark drawn on the dark background (apple-touch-icon) or bare (32px). */
export async function iconImage(size: number, background: boolean) {
  const svg = (await (await fetch('/favicon.svg')).text()).replace('path{stroke:#17181A}', `path{stroke:${background ? t.text : '#6B6F76'}}`).replace(/@media[^}]*}}/, '');
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  if (background) { g.fillStyle = t.bg; g.fillRect(0, 0, size, size); }
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const inset = background ? size * 0.2 : 0;
  g.drawImage(img, inset, inset, size - inset * 2, size - inset * 2);
  return c.toDataURL('image/png');
}
