import { mix, spring } from 'motion';
import { CARDS, type Card } from './cards';
import { BUTTON, FONTS, FRAME, ILLUSTRATION, LAYOUT, LINE_WIDTH, MOTION, NAV, POINTER, THEMES, TIMING, TYPE, type Theme } from './config';
import { openScene, type Palette, type Scene } from './scene';
import type { Sample } from './timeline';

/*
 * The carousel: ten cards, one at a time, each playing its illustration's demo, then the pointer clicks the next
 * button and the content block slides on to the next card. Every illustration runs in its own hidden frame on a
 * virtual clock, so the preview and the export draw exactly the same frames.
 *
 * Everything is laid out in logical pixels of the frame (config.ts). The preview draws it at the screen's density,
 * the export at FRAME.exportScale.
 */
export const LW = FRAME.width, LH = FRAME.height, SCALE = FRAME.exportScale, W = LW * SCALE, H = LH * SCALE, FPS = FRAME.fps;
export const N = CARDS.length;
export { THEMES, type Theme };

type Colors = (typeof THEMES)[Theme];
const palette = (t: Theme): Palette => {
  const c = THEMES[t];
  // solid parts fill with the background, so hidden lines stay hidden; the soft tint only for the cone and the liquid
  return { plate: c.bg, lo: c.dim, mid: c.mid, edge: c.stroke, hi: c.hi, tint: c.tint };
};

/** What the DialKit panel tunes; every size in logical pixels. */
export type Dials = {
  containerInset: number; innerPadding: number; blockGap: number; eyebrowGap: number; subGap: number; illustrationScale: number;
  eyebrowSize: number; eyebrowTracking: number; headlineSize: number; subSize: number; buttonSize: number;
  slideDistance: number; pointerSpring: { visualDuration?: number; bounce?: number }; pressScale: number;
  pointer: boolean; pointerSize: number; theme: Theme;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
type Style = { size: number; weight: number; lineHeight: number; tracking: number };
/** A style at a tuned size: its line height keeps the config's leading. */
const lineOf = (style: Style, size: number) => size + (style.lineHeight - style.size);

/** The frame's fixed geometry for the current dials. */
function frameOf(d: Dials) {
  const c0 = d.containerInset, c1x = LW - c0, c1y = LH - c0;
  const x0 = c0 + d.innerPadding, x1 = c1x - d.innerPadding, y0 = c0 + LAYOUT.topPadding, y1 = c1y - d.innerPadding;
  const navY = y1 - NAV.button, prevX = x0, nextX = x1 - NAV.button, barX = prevX + NAV.button + NAV.gap;
  return { c0, c1x, c1y, x0, x1, y0, y1, iw: x1 - x0, navY, prevX, nextX, barX, barW: nextX - NAV.gap - barX };
}
type Frame = ReturnType<typeof frameOf>;

/** Wraps text into lines of the content width. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { out.push(line); line = word; } else line = next;
  }
  out.push(line);
  return out;
}

/** Wraps text, balanced: the narrowest width that keeps the same number of lines, so no word sits alone. */
function balancedLines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const n = wrapLines(ctx, text, width).length;
  if (n < 2) return wrapLines(ctx, text, width);
  let lo = width / n, hi = width;
  while (hi - lo > 1) { const mid = (lo + hi) / 2; if (wrapLines(ctx, text, mid).length > n) lo = mid; else hi = mid; }
  return wrapLines(ctx, text, hi);
}

/** Every type style the last frame drew with, read by the checks. */
export const fontsUsed = new Set<string>();
/** Sets one of the four styles at a size; `record` false while only measuring. */
function setFont(ctx: CanvasRenderingContext2D, style: Style, family: string, size: number, tracking: number, record = true) {
  ctx.font = `${style.weight} ${size}px ${family}`;
  ctx.letterSpacing = `${(tracking * size).toFixed(3)}px`;
  if (record) fontsUsed.add(`${ctx.font} / ${lineOf(style, size)}px / ${(tracking * size).toFixed(2)}px`);
}
const eyebrowFont = (ctx: CanvasRenderingContext2D, d: Dials) => setFont(ctx, TYPE.eyebrow, FONTS.mono, d.eyebrowSize, d.eyebrowTracking);
const headlineFont = (ctx: CanvasRenderingContext2D, d: Dials, record = true) => setFont(ctx, TYPE.headline, FONTS.sans, d.headlineSize, TYPE.headline.tracking, record);
const subFont = (ctx: CanvasRenderingContext2D, d: Dials, record = true) => setFont(ctx, TYPE.sub, FONTS.sans, d.subSize, TYPE.sub.tracking, record);
const buttonFont = (ctx: CanvasRenderingContext2D, d: Dials) => setFont(ctx, TYPE.button, FONTS.sans, d.buttonSize, TYPE.button.tracking);

/**
 * The content block, top to bottom: the illustration area (full inner width, ILLUSTRATION.ratio of it tall),
 * blockGap, eyebrow, eyebrowGap, headline, subGap, subheadline, blockGap, button; then the leftover space and the
 * nav row. The area is as tall as the ratio asks, or as tall as fits with the card with the most lines still
 * clearing the nav row by ILLUSTRATION.navClearance. Its height comes out of the leftover space, never the gaps.
 */
function blockOf(ctx: CanvasRenderingContext2D, d: Dials, f: Frame) {
  const eyeLH = lineOf(TYPE.eyebrow, d.eyebrowSize), headLH = lineOf(TYPE.headline, d.headlineSize), subLH = lineOf(TYPE.sub, d.subSize);
  const btnH = lineOf(TYPE.button, d.buttonSize) + 2 * BUTTON.paddingY;
  const texts = CARDS.map((c) => {
    headlineFont(ctx, d, false);
    const head = balancedLines(ctx, c.headline, f.iw);
    subFont(ctx, d, false);
    return { head, sub: balancedLines(ctx, c.sub, f.iw) };
  });
  const textH = (t: (typeof texts)[number]) => eyeLH + d.eyebrowGap + t.head.length * headLH + d.subGap + t.sub.length * subLH;
  const most = Math.max(...texts.map(textH));
  const room = f.navY - ILLUSTRATION.navClearance - btnH - d.blockGap - most - d.blockGap - f.y0;
  const artH = Math.max(ILLUSTRATION.minHeight, Math.min(f.iw * ILLUSTRATION.ratio, room));
  return { texts, eyeLH, headLH, subLH, btnH, artH, textY: f.y0 + artH + d.blockGap };
}

/** Where the drawing sits: its extent over every state, scaled to fit illustrationScale (× the card's own size) of the area, centred. */
function artOf(c: Card, d: Dials, f: Frame, artH: number) {
  const [bx0, by0, bx1, by1] = c.box;
  const own = ILLUSTRATION.cardScale[c.n] ?? ILLUSTRATION.cardScale.all ?? 1;
  const k = d.illustrationScale * own * Math.min(artH / (by1 - by0), f.iw / (bx1 - bx0));
  const cx = f.x0 + f.iw / 2, cy = f.y0 + artH / 2;
  return { k, at: ([x, y]: [number, number]): [number, number] => [cx + (x - (bx0 + bx1) / 2) * k, cy + (y - (by0 + by1) / 2) * k], left: cx - ((bx0 + bx1) / 2) * k, top: cy - ((by0 + by1) / 2) * k };
}

/** The demo script in timeline seconds: when the pointer sets off for each target, when it hovers it, when it leaves. */
function scriptOf(c: Card, s: Sample, vd: number) {
  const { lead, span, arrive, dwellCap, settleTail } = TIMING.demoScript, a = s.demo.at, D = s.demo.duration, n = c.stops.length;
  const starts = c.stops.map((_, i) => a + D * (lead + (span * i) / n));
  const hovers = starts.map((t, i) => t + Math.min(arrive * vd, dwellCap * ((starts[i + 1] ?? a + D * settleTail) - t)));
  return { starts, hovers, leave: s.pointerToNext.at };
}

const glideLength = (d: Dials) => d.pointerSpring.visualDuration ?? MOTION.pointerSpring.visualDuration;

/** Which target the illustration's pointer is on at the sample's time, if any. */
export function hoverAt(card: number, s: Sample, d: Dials) {
  const c = CARDS[card], { hovers, leave } = scriptOf(c, s, glideLength(d));
  if (s.time >= leave) return -1;
  let on = -1;
  hovers.forEach((t, i) => { if (s.time >= t) on = i; });
  return on;
}

/** The ten scenes and their cached images. */
export async function openCarousel(theme: Theme) {
  const scenes: Scene[] = [];
  for (const c of CARDS) scenes.push(await openScene(c.source, palette(theme)));
  const images: ({ img: HTMLImageElement; key: string } | undefined)[] = [], stale = CARDS.map(() => true), on = CARDS.map(() => -1);
  let abs = 0;
  return {
    scenes,
    setTheme(t: Theme) { scenes.forEach((s) => s.setPalette(palette(t))); stale.fill(true); },
    /** Puts card i's pointer on target j (−1: off the drawing); every other card's pointer leaves. */
    async point(card: number, j: number) {
      let leaving = false;
      for (let i = 0; i < N; i++) {
        const want = i === card ? j : -1;
        if (on[i] === want) continue;
        on[i] = want;
        scenes[i].point(want >= 0 ? CARDS[i].stops[want] : undefined);
        if (want < 0) leaving = true;
      }
      if (leaving) await new Promise((r) => setTimeout(r, 0)); // a mouse leave lands on the next task
    },
    /** Moves every illustration's clock on by dt seconds; a looping spin runs at rate[i] of real time. */
    advance(dt: number, rate: number[]) {
      abs += dt;
      scenes.forEach((s, i) => { s.advance(abs * 1000 * (rate[i] ?? 1)); if (s.takeChange()) stale[i] = true; });
    },
    /** Card i's drawing at the art's scale k and s canvas pixels per logical pixel, made again only when it changed. */
    async image(i: number, k: number, s: number) {
      const key = `${k.toFixed(5)}:${s}`, have = images[i];
      if (have && !stale[i] && have.key === key) return have.img;
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(scenes[i].snapshot(400 * k * s, 320 * k * s, ILLUSTRATION.stroke / k));
      await img.decode();
      images[i] = { img, key };
      stale[i] = false;
      return img;
    },
    close() { scenes.forEach((s) => s.close()); },
  };
}
export type Carousel = Awaited<ReturnType<typeof openCarousel>>;

/** For a looping export: each idle spin's clock rate, nudged so it makes a whole number of turns in `loop` seconds. */
export const ratesFor = (loop: number) => CARDS.map((c) => {
  if (!c.spin) return 1;
  const turns = Math.max(1, Math.round((c.spin * loop) / (2 * Math.PI)));
  return (turns * 2 * Math.PI) / (c.spin * loop);
});

/** The pointer glide between targets: Motion's spring, from the panel's pointerSpring. */
const glideCache = new Map<string, (t: number) => number>();
function glideOf(cfg: Dials['pointerSpring']) {
  const vd = cfg.visualDuration ?? MOTION.pointerSpring.visualDuration, bounce = cfg.bounce ?? MOTION.pointerSpring.bounce, key = `${vd}:${bounce}`;
  let f = glideCache.get(key);
  if (!f) {
    const g = spring({ keyframes: [0, 1], visualDuration: vd, bounce });
    f = (t: number) => (t <= 0 ? 0 : g.next(t * 1000).value as number);
    glideCache.set(key, f);
  }
  return f;
}

/**
 * One frame of card `card` at the sample's time, in logical pixels (the caller scales the context: px canvas
 * pixels per logical pixel). `shown` is the card the nav row reports: the next one from the press on.
 */
export async function drawFrame(ctx: CanvasRenderingContext2D, car: Carousel, card: number, s: Sample, d: Dials, px: number) {
  const c = THEMES[d.theme], f = frameOf(d), b = blockOf(ctx, d, f), half = LINE_WIDTH / 2;
  fontsUsed.clear();
  const shown = s.nextPress.started ? (card + 1) % N : card;
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, LW, LH);

  // what never moves: the container line, the nav row
  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeStyle = c.line;
  ctx.strokeRect(f.c0 + half, f.c0 + half, f.c1x - f.c0 - LINE_WIDTH, f.c1y - f.c0 - LINE_WIDTH);
  const segW = (f.barW - NAV.segmentGap * (N - 1)) / N, barY = f.navY + (NAV.button - NAV.segmentHeight) / 2;
  // the current card's segment fills through its demo; the press hands over to the next one
  const hold = clamp01((s.time - s.demo.at) / Math.max(0.01, s.nextPress.at - s.demo.at));
  for (let i = 0; i < N; i++) {
    const x = f.barX + i * (segW + NAV.segmentGap);
    const fill = shown === card ? (i < card ? 1 : i > card ? 0 : hold) : (i < shown ? 1 : 0);
    ctx.fillStyle = c.dim;
    ctx.fillRect(x, barY, segW, NAV.segmentHeight);
    if (fill > 0) { ctx.fillStyle = c.hi; ctx.fillRect(x, barY, segW * fill, NAV.segmentHeight); }
  }
  drawChevron(ctx, c, f.prevX, f.navY, -1, { enabled: shown > 0, hover: 0, scale: 1 });
  // hovered while the pointer rests on it: as it arrives, and from the click through the next card's arrival
  const release = s.time < s.demo.at ? 1 : clamp01(1 - (s.time - s.demo.at) / TIMING.hoverRelease);
  const hover = Math.max(s.nextHover.current?.h ?? 0, release), scale = s.nextPress.current?.s ?? 1;
  drawChevron(ctx, c, f.nextX, f.navY, 1, { enabled: true, hover, scale });

  // the content block, kept inside the container line, above the nav row
  const into = s.cardIn.current ?? { x: 0, opacity: 1 }, out = s.cardOut.current ?? { x: 0, opacity: 1 };
  const dx = s.cardOut.started ? out.x : into.x, alpha = s.cardOut.started ? out.opacity : into.opacity;
  if (alpha > 0.001) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(f.c0 + LINE_WIDTH, f.c0 + LINE_WIDTH, f.c1x - f.c0 - 2 * LINE_WIDTH, f.navY - f.c0 - LINE_WIDTH);
    ctx.clip();
    ctx.globalAlpha = clamp01(alpha);
    ctx.translate(dx, 0);
    const cd = CARDS[card], art = artOf(cd, d, f, b.artH), img = await car.image(card, art.k, px);
    ctx.drawImage(img, art.left, art.top, 400 * art.k, 320 * art.k);
    const t = b.texts[card];
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let y = b.textY;
    eyebrowFont(ctx, d);
    ctx.fillStyle = c.muted;
    ctx.fillText(TYPE.eyebrow.uppercase ? cd.eyebrow.toUpperCase() : cd.eyebrow, f.x0 + LAYOUT.eyebrowPadding, y + b.eyeLH / 2);
    y += b.eyeLH + d.eyebrowGap;
    headlineFont(ctx, d);
    ctx.fillStyle = c.text;
    t.head.forEach((line, j) => ctx.fillText(line, f.x0, y + j * b.headLH + b.headLH / 2));
    y += t.head.length * b.headLH + d.subGap;
    subFont(ctx, d);
    ctx.fillStyle = c.muted;
    t.sub.forEach((line, j) => ctx.fillText(line, f.x0, y + j * b.subLH + b.subLH / 2));
    y += t.sub.length * b.subLH + d.blockGap;
    // the static "see details" link (outlined only if the config asks)
    buttonFont(ctx, d);
    if (BUTTON.outline) {
      const bw = Math.ceil(ctx.measureText(BUTTON.label).width) + 2 * BUTTON.paddingX;
      ctx.strokeStyle = c.line;
      ctx.lineWidth = LINE_WIDTH;
      ctx.strokeRect(f.x0 + half, y + half, bw - LINE_WIDTH, b.btnH - LINE_WIDTH);
    }
    ctx.fillStyle = c.text;
    ctx.fillText(BUTTON.label, f.x0 + BUTTON.paddingX, y + b.btnH / 2);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  if (d.pointer) {
    const pos = pointerAt(card, s, d, f, b.artH), shrink = 1 - (1 - scale) * POINTER.pressShrink;
    drawPointer(ctx, pos, c, d.pointerSize * shrink);
  }
}

/** The pointer: on the next button through the card's arrival, then each demo target in turn, then back to the button. */
function pointerAt(card: number, s: Sample, d: Dials, f: Frame, artH: number): [number, number] {
  const button: [number, number] = [f.nextX + NAV.button * POINTER.onButton[0], f.navY + NAV.button * POINTER.onButton[1]];
  const cd = CARDS[card], art = artOf(cd, d, f, artH), g = glideOf(d.pointerSpring), { starts, leave } = scriptOf(cd, s, glideLength(d));
  const along = (time: number) => {
    let pos = button;
    starts.forEach((t0, i) => {
      if (time < t0) return;
      const to = art.at(cd.stops[i]), e = g(Math.min(time, starts[i + 1] ?? Infinity) - t0);
      pos = [pos[0] + (to[0] - pos[0]) * e, pos[1] + (to[1] - pos[1]) * e];
    });
    return pos;
  };
  if (s.time < leave) return along(s.time);
  const from = along(leave), p = s.pointerToNext.current?.p ?? 1;
  return [from[0] + (button[0] - from[0]) * p, from[1] + (button[1] - from[1]) * p];
}

/** A square chevron button: a 1px outline and a 1px chevron. Hover fills it; press scales it about its centre. */
function drawChevron(ctx: CanvasRenderingContext2D, c: Colors, x: number, y: number, dir: 1 | -1, { enabled, hover, scale }: { enabled: boolean; hover: number; scale: number }) {
  const cx = x + NAV.button / 2, cy = y + NAV.button / 2, half = (NAV.button / 2) * scale, inset = LINE_WIDTH / 2;
  ctx.save();
  if (hover > 0) { ctx.globalAlpha = hover; ctx.fillStyle = c.hi; ctx.fillRect(cx - half, cy - half, 2 * half, 2 * half); ctx.globalAlpha = 1; }
  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeStyle = mix(c.line, c.hi)(hover);
  ctx.strokeRect(cx - half + inset, cy - half + inset, 2 * half - LINE_WIDTH, 2 * half - LINE_WIDTH);
  ctx.strokeStyle = enabled ? mix(c.text, c.bg)(hover) : c.dim;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  NAV.chevron.forEach(([px, py], i) => { const X = cx + px * dir * scale, Y = cy + py * scale; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.stroke();
  ctx.restore();
}

/** The arrow, `size` logical pixels tall, in the highlight colour with a thin background outline to read on any line. */
function drawPointer(ctx: CanvasRenderingContext2D, [x, y]: [number, number], c: Colors, size: number) {
  const tall = Math.max(...POINTER.shape.map(([, b]) => b)), k = size / tall;
  ctx.save();
  ctx.beginPath();
  POINTER.shape.forEach(([a, b], i) => (i ? ctx.lineTo(x + a * k, y + b * k) : ctx.moveTo(x + a * k, y + b * k)));
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = POINTER.outline;
  ctx.strokeStyle = c.bg;
  ctx.stroke();
  ctx.fillStyle = c.hi;
  ctx.fill();
  ctx.restore();
}

export async function fontsReady(d: Dials) {
  const styles = [`${TYPE.eyebrow.weight} ${d.eyebrowSize}px ${FONTS.mono}`, `${TYPE.headline.weight} ${d.headlineSize}px ${FONTS.sans}`, `${TYPE.sub.weight} ${d.subSize}px ${FONTS.sans}`];
  await Promise.all(styles.map((f) => document.fonts.load(f))).catch(() => undefined);
}

/** The frame's geometry and the illustration area for the current dials, read by the checks. */
export function layoutOf(ctx: CanvasRenderingContext2D, d: Dials) {
  const f = frameOf(d), b = blockOf(ctx, d, f);
  return { ...f, artH: b.artH, textY: b.textY, arts: CARDS.map((c) => { const a = artOf(c, d, f, b.artH); return { k: a.k, left: a.left, top: a.top }; }) };
}
