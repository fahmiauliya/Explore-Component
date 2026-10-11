import { strToU8, zipSync, type Zippable } from 'fflate';
import { GIFEncoder, applyPalette } from 'gifenc';
import { BufferTarget, CanvasSource, Output, QUALITY_HIGH, WebMOutputFormat } from 'mediabunny';
import type { Entry } from '../figures';
import { TOKENS, type Theme } from '../tokens';
import { FORMAT_INFO } from './info';
import { cropOf, drawScene, openScene, playDemo, rasterSvg, type Progress, type Scene } from './scene';

/*
 * The downloads beyond the React component and the MP4: SVG states and a PNG (stills), a looping GIF, a transparent
 * WebM and a transparent PNG sequence (motion). All of them use the current theme's colours.
 */

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pad = (n: number) => String(n).padStart(2, '0');

// ─── SVG: the default state and each hover state ────────────────────────────────────────────────────────────────

/** How long a state is given to come to rest before it is drawn. */
const SETTLE = 2.5;

/** The states an SVG download holds: rest, then each hover target. */
export const statesOf = (entry: Entry) => [{ name: 'default', at: undefined as [number, number] | undefined }, ...entry.targets.map((t) => ({ name: `hover-${slugify(t.label)}`, at: t.at }))];

/** Every state as its own SVG, in one ZIP. Each hover starts from rest, as a person's first hover would. */
export async function renderSvgStates(entry: Entry, theme: Theme, value: number, onProgress: Progress) {
  const scene = await openScene(entry, theme, value);
  try {
    const files: Zippable = {}, states = statesOf(entry), folder = `${entry.slug}-svg-${theme}`;
    for (const [i, state] of states.entries()) {
      await scene.point();
      scene.settle(SETTLE);
      if (state.at) { await scene.point(state.at); scene.settle(SETTLE); }
      files[`${folder}/${pad(i + 1)}-${state.name}.svg`] = strToU8(cleanSvg(scene, entry, theme, `${entry.name} · ${state.name.replace(/-/g, ' ')}`));
      onProgress((i + 1) / states.length);
    }
    return new Blob([zipSync(files)], { type: 'application/zip' });
  } finally {
    scene.close();
  }
}

/** A colour from computed style as hex, with its alpha apart (rgba → #rrggbb + opacity). */
function hex(css: string): { color: string; alpha: number } | null {
  if (!css || css === 'none') return null;
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return { color: css, alpha: 1 };
  const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean);
  const h = (v: string) => Math.round(Number(v)).toString(16).padStart(2, '0');
  return { color: `#${h(r)}${h(g)}${h(b)}`.toUpperCase(), alpha: Number(a) };
}

/**
 * The drawing as a clean, standalone SVG for Figma and Illustrator: computed colours as plain hex attributes, strokes
 * in the drawing's own units (1.5 at its native size), hidden layers dropped, no classes or styles, the background as
 * its own deletable layer, and the same crop for every state so the files line up.
 */
function cleanSvg(scene: Scene, entry: Entry, theme: Theme, title: string) {
  const { svg, win } = scene, ns = 'http://www.w3.org/2000/svg';
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const from = [...svg.querySelectorAll('*')], to = [...clone.querySelectorAll('*')], drop: Element[] = [];
  from.forEach((el, i) => {
    const out = to[i], cs = win.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) { drop.push(out); return; }
    for (const a of [...out.attributes]) if (!['d', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'points', 'transform', 'id', 'href', 'offset', 'gradientUnits', 'gradientTransform', 'clipPathUnits', 'patternUnits', 'viewBox', 'preserveAspectRatio', 'stop-color', 'stop-opacity', 'fill-rule', 'clip-rule', 'clip-path', 'mask'].includes(a.name)) out.removeAttribute(a.name);
    if (el.tagName === 'g') { if (Number(cs.opacity) < 1) out.setAttribute('opacity', String(+Number(cs.opacity).toFixed(3))); return; }
    if (!(el instanceof (win as Window & typeof globalThis).SVGGeometryElement) && el.tagName !== 'use') return;
    const fill = hex(cs.fill), stroke = hex(cs.stroke);
    out.setAttribute('fill', fill ? fill.color : 'none');
    if (fill && fill.alpha * Number(cs.fillOpacity || 1) < 1) out.setAttribute('fill-opacity', String(+(fill.alpha * Number(cs.fillOpacity || 1)).toFixed(3)));
    if (stroke && Number(cs.strokeWidth.replace('px', '')) > 0) {
      // a non-scaling stroke is drawn in screen pixels: in the drawing's units it is that over the element's scale
      const ctm = (el as SVGGraphicsElement).getCTM?.(), scale = ctm && cs.vectorEffect === 'non-scaling-stroke' ? Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c)) || 1 : 1;
      const width = parseFloat(cs.strokeWidth) / scale;
      out.setAttribute('stroke', stroke.color);
      out.setAttribute('stroke-width', String(+width.toFixed(3)));
      if (stroke.alpha * Number(cs.strokeOpacity || 1) < 1) out.setAttribute('stroke-opacity', String(+(stroke.alpha * Number(cs.strokeOpacity || 1)).toFixed(3)));
      if (cs.strokeLinecap !== 'butt') out.setAttribute('stroke-linecap', cs.strokeLinecap);
      if (cs.strokeLinejoin !== 'miter') out.setAttribute('stroke-linejoin', cs.strokeLinejoin);
      if (cs.strokeDasharray && cs.strokeDasharray !== 'none') out.setAttribute('stroke-dasharray', cs.strokeDasharray.split(/[ ,]+/).map((d) => +(parseFloat(d) / scale).toFixed(3)).join(' '));
    } else out.setAttribute('stroke', 'none');
    if (Number(cs.opacity) < 1) out.setAttribute('opacity', String(+Number(cs.opacity).toFixed(3)));
  });
  drop.forEach((el) => el.remove());
  for (const a of [...clone.attributes]) clone.removeAttribute(a.name);
  const [x, y, w, h] = cropOf(entry, 0.06);
  clone.setAttribute('xmlns', ns);
  clone.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const titleEl = document.createElementNS(ns, 'title');
  titleEl.textContent = title;
  const bg = document.createElementNS(ns, 'rect');
  for (const [k, v] of Object.entries({ id: 'background', x, y, width: w, height: h, fill: TOKENS[theme].bg })) bg.setAttribute(k, String(v));
  clone.prepend(titleEl, bg);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}\n`;
}

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

