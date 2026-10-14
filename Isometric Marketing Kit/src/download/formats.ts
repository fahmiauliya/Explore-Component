import { zipSync, type Zippable } from 'fflate';
import { GIFEncoder, applyPalette } from 'gifenc';
import { BufferTarget, CanvasSource, Output, QUALITY_HIGH, WebMOutputFormat } from 'mediabunny';
import type { Entry } from '../figures';
import { TOKENS, type Theme } from '../tokens';
import { FORMAT_INFO } from './info';
import { cropOf, drawScene, openScene, playDemo, rasterSvg, type Progress } from './scene';

/*
 * The downloads beyond the React component, the MP4 and the SVG states (svg.ts): a PNG (still), a looping GIF, a
 * transparent WebM and a transparent PNG sequence (motion). All of them use the current theme's colours.
 */

/** How long the rest state is given to settle before it is drawn. */
const SETTLE = 2.5;

// ─── PNG: the default state, large, for slides ──────────────────────────────────────────────────────────────────

const { side: PNG_SIDE, stroke: PNG_STROKE } = FORMAT_INFO.png;

export async function renderPng(entry: Entry, theme: Theme, value: number) {
  const scene = await openScene(entry, theme, value);
  try {
    await scene.point();
    scene.settle(SETTLE);
    const [x, y, w, h] = cropOf(entry, 0.06), k = PNG_SIDE / Math.max(w, h);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * k);
    canvas.height = Math.round(h * k);
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(rasterSvg(scene, 400 * k, 320 * k, PNG_STROKE / k));
    await img.decode();
    ctx.fillStyle = TOKENS[theme].bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, -x * k, -y * k, 400 * k, 320 * k);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) throw new Error('The PNG could not be encoded.');
    return { blob, name: `${entry.slug}-${theme}-${canvas.width}x${canvas.height}.png` };
  } finally {
    scene.close();
  }
}

// ─── GIF: the demo loop, for Notion and email ───────────────────────────────────────────────────────────────────

const { size: GIF_SIZE, fps: GIF_FPS } = FORMAT_INFO.gif, SAFE = 0.7;

/**
 * Every colour a frame can hold: the background, each of the drawing's tones, and the antialiased steps between them
 * (and between the soft fill and each line tone). One fixed palette, so no frame shifts colour against the next.
 */
function paletteOf(theme: Theme): number[][] {
  const t = TOKENS[theme], rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixes = (a: number[], b: number[], steps: number) => Array.from({ length: steps + 1 }, (_, i) => a.map((v, c) => Math.round(v + ((b[c] - v) * i) / steps)));
  const bg = rgb(t.bg), tones = [t.dim, t.mid, t.stroke, t.hi].map(rgb), tint = rgb(t.tint);
  const all = [...tones.flatMap((c) => mixes(bg, c, 40)), ...mixes(bg, tint, 16), ...tones.flatMap((c) => mixes(tint, c, 12))];
  const seen = new Set<string>(), palette: number[][] = [];
  for (const c of all) { const key = c.join(); if (!seen.has(key)) { seen.add(key); palette.push(c); } }
  return palette.slice(0, 256);
}

export async function renderGif(entry: Entry, theme: Theme, value: number, onProgress: Progress) {
  const scene = await openScene(entry, theme, value);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = GIF_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!, gif = GIFEncoder();
    // the last palette slot is "unchanged": each frame after the first stores only the pixels that moved, the rest
    // show through from the frame before (drawn over, never cleared), so the loop stays small enough for email
    const colours = paletteOf(theme).slice(0, 255), keep = colours.length, palette = [...colours, [255, 0, 255]];
    let prev: Uint8Array | null = null;
    await playDemo(scene, entry, GIF_FPS, async (i, frames) => {
      await drawScene(ctx, scene, entry, theme, SAFE, true);
      const index = applyPalette(ctx.getImageData(0, 0, GIF_SIZE, GIF_SIZE).data, colours), out = new Uint8Array(index);
      if (prev) for (let p = 0; p < out.length; p++) if (index[p] === prev[p]) out[p] = keep;
      gif.writeFrame(out, GIF_SIZE, GIF_SIZE, { palette: i === 0 ? palette : undefined, delay: 1000 / GIF_FPS, repeat: 0, transparent: i > 0, transparentIndex: keep, dispose: 1 });
      prev = index;
      onProgress((i + 1) / frames);
    });
    gif.finish();
    return new Blob([gif.bytes() as Uint8Array<ArrayBuffer>], { type: 'image/gif' });
  } finally {
    scene.close();
  }
}

// ─── Transparent: a WebM with alpha, and a PNG sequence ─────────────────────────────────────────────────────────

const { size: ALPHA_SIZE, webmFps: WEBM_FPS, sequenceFps: SEQUENCE_FPS } = FORMAT_INFO.alpha;

/** The demo loop on a transparent background as VP9 WebM with alpha (Chrome, Edge, Firefox and web tools play it). */
export async function renderTransparentWebm(entry: Entry, theme: Theme, value: number, onProgress: Progress) {
  const scene = await openScene(entry, theme, value);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ALPHA_SIZE;
    const ctx = canvas.getContext('2d')!;
    const output = new Output({ format: new WebMOutputFormat(), target: new BufferTarget() });
    const source = new CanvasSource(canvas, { codec: 'vp9', quality: QUALITY_HIGH, alpha: 'keep' });
    output.addVideoTrack(source, { frameRate: WEBM_FPS });
    await output.start();
    await playDemo(scene, entry, WEBM_FPS, async (i, frames) => {
      await drawScene(ctx, scene, entry, theme, SAFE, false);
      await source.add(i / WEBM_FPS, 1 / WEBM_FPS);
      onProgress((i + 1) / frames);
    });
    source.close();
    await output.finalize();
    return new Blob([output.target.buffer!], { type: 'video/webm' });
  } finally {
    scene.close();
  }
}

/** The demo loop as numbered transparent PNGs in a ZIP: every video editor imports an image sequence with alpha. */
export async function renderPngSequence(entry: Entry, theme: Theme, value: number, onProgress: Progress) {
  const scene = await openScene(entry, theme, value);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ALPHA_SIZE;
    const ctx = canvas.getContext('2d')!, files: Zippable = {}, folder = `${entry.slug}-${theme}-transparent-${ALPHA_SIZE}-${SEQUENCE_FPS}fps`;
    await playDemo(scene, entry, SEQUENCE_FPS, async (i, frames) => {
      await drawScene(ctx, scene, entry, theme, SAFE, false);
      const png = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
      if (!png) throw new Error('A frame could not be encoded.');
      // PNGs are compressed already: stored, not deflated again
      files[`${folder}/${entry.slug}_${String(i).padStart(4, '0')}.png`] = [new Uint8Array(await png.arrayBuffer()), { level: 0 }];
      onProgress((i + 1) / frames);
    });
    return new Blob([zipSync(files)], { type: 'application/zip' });
  } finally {
    scene.close();
  }
}

