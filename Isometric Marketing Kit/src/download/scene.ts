import type { Entry } from '../figures';
import { loadFigure, loadKernel, mountFigure, pointAt } from '../hairline';
import { TOKENS, hairlineVars, type Theme } from '../tokens';

/*
 * What every download draws from: the figure in a hidden same-origin frame whose clock, frame loop and colour
 * transitions advance only when told to, so each frame of a video, and each state of an image, is exact.
 */

/** The figure, unchanged, in a hidden frame on a virtual clock. */
export async function openScene(entry: Entry, theme: Theme, value: number) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  // on screen (so the kernel's visibility check passes) but invisible and out of the way
  frame.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:320px;border:0;opacity:0;pointer-events:none;z-index:-1;';
  frame.srcdoc = '<!doctype html><html><body style="margin:0"></body></html>';
  document.body.append(frame);
  await new Promise((r) => frame.addEventListener('load', r, { once: true }));
  const win = frame.contentWindow!, doc = frame.contentDocument!;

  let now = 0, ids = 1;
  const queue = new Map<number, FrameRequestCallback>();
  Object.assign(win, {
    requestAnimationFrame: (cb: FrameRequestCallback) => { queue.set(ids, cb); return ids++; },
    cancelAnimationFrame: (id: number) => { queue.delete(id); },
  });
  Object.defineProperty(win.performance, 'now', { value: () => now, configurable: true });

  const HL = loadKernel(win), figure = loadFigure(entry.source, HL, win);
  const stage = doc.createElement('div');
  stage.style.width = '400px';
  for (const [k, v] of Object.entries(hairlineVars(theme))) stage.style.setProperty(`--hairline-${k}`, v);
  const tint = doc.createElement('style');
  tint.textContent = '[data-hairline] > svg .dot.off { fill: var(--hairline-tint); }';
  doc.head.append(tint);
  doc.body.append(stage);
  let status = 'rest';
  const handle = mountFigure(HL, stage, figure, value, (text) => { status = text; });
  // let the kernel's visibility observer see the stage before the clock starts
  for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 60));

  const started = new Map<Animation, number>();
  const scene = {
    stage,
    get status() { return status; },
    get now() { return now; },
    svg: stage.querySelector('svg') as SVGSVGElement,
    win,
    /** Moves the clock to ms: runs the frame loop once, then sets every colour transition to its own elapsed time. */
    advance(ms: number) {
      now = ms;
      const due = [...queue.values()];
      queue.clear();
      due.forEach((cb) => cb(now));
      for (const a of doc.getAnimations()) {
        if (!started.has(a)) started.set(a, now);
        a.pause();
        a.currentTime = now - started.get(a)!;
      }
    },
    /** Points at a viewBox point, or leaves the drawing (a leave lands on the next task, as a real one does). */
    async point(at?: [number, number]) {
      pointAt(stage, at ? 'pointermove' : 'pointerleave', at);
      if (!at) await new Promise((r) => setTimeout(r, 0));
    },
    /** Runs the clock on for `seconds` at 60 frames a second, so springs and tweens come to rest. */
    settle(seconds: number) {
      const start = now;
      for (let i = 1; i <= Math.round(seconds * 60); i++) scene.advance(start + (i * 1000) / 60);
    },
    close() { handle.destroy(); frame.remove(); },
  };
  return scene;
}
export type Scene = Awaited<ReturnType<typeof openScene>>;

const PAINT = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity', 'display', 'visibility'];

/** The site's stroke, in screen pixels: what a `stroke` override keeps the dashes in proportion to. */
const SITE_STROKE = 1.5;

/**
 * The svg as a standalone image for drawing to a canvas: every shape carries its computed colours. Strokes scale with
 * the frame, or, given `stroke` (in viewBox units), are drawn that wide with dashes in proportion.
 */
export function rasterSvg(scene: Scene, w: number, h: number, stroke?: number) {
  const { svg, win } = scene;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const from = svg.querySelectorAll('*'), to = clone.querySelectorAll('*');
  from.forEach((el, i) => {
    const cs = win.getComputedStyle(el), out = to[i] as SVGElement;
    let css = PAINT.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';') + ';vector-effect:none';
    if (stroke !== undefined) {
      const dash = cs.getPropertyValue('stroke-dasharray');
      css += `;stroke-width:${stroke}`;
      if (dash && dash !== 'none') css += `;stroke-dasharray:${dash.split(/[ ,]+/).map((d) => ((parseFloat(d) * stroke) / SITE_STROKE).toFixed(4)).join(' ')}`;
    }
    out.setAttribute('style', css);
    out.removeAttribute('class');
  });
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  return new XMLSerializer().serializeToString(clone);
}

/** The drawing's extent over every state, with a margin, as a viewBox. */
export function cropOf(entry: Entry, margin: number) {
  const [x0, y0, x1, y1] = entry.box, m = Math.max(x1 - x0, y1 - y0) * margin;
  return [x0 - m, y0 - m, x1 - x0 + 2 * m, y1 - y0 + 2 * m].map((v) => Math.round(v * 10) / 10) as [number, number, number, number];
}

/**
 * Draws the scene into a canvas: the drawing's extent over every state fills `safe` of the frame's shorter side,
 * centred. With a background the theme's is painted first; without one the frame stays transparent.
 */
export async function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, entry: Entry, theme: Theme, safe: number, background: boolean) {
  const W = ctx.canvas.width, H = ctx.canvas.height, [x0, y0, x1, y1] = entry.box;
  const k = (Math.min(W, H) * safe) / Math.max(x1 - x0, y1 - y0);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(rasterSvg(scene, 400 * k, 320 * k));
  await img.decode();
  ctx.clearRect(0, 0, W, H);
  if (background) { ctx.fillStyle = TOKENS[theme].bg; ctx.fillRect(0, 0, W, H); }
  ctx.drawImage(img, W / 2 - ((x0 + x1) / 2) * k, H / 2 - ((y0 + y1) / 2) * k, 400 * k, 320 * k);
}

/**
 * The demo every looping download plays: rest, each hover target in turn, then rest again, over the entry's own
 * length (about 8 s, stretched where an idle motion needs a whole period to loop).
 */
export function demoOf(entry: Entry) {
  const LEAD = 0.6, TAIL = 2, seconds = entry.seconds ?? 8;
  const stops = entry.targets.map((t) => t.at);
  if (entry.returnTo) stops.push(entry.targets.find((t) => t.label === entry.returnTo)!.at);
  const dwell = (seconds - LEAD - TAIL) / stops.length;
  const script: { t: number; at?: [number, number] }[] = [...stops.map((at, i) => ({ t: LEAD + i * dwell, at })), { t: seconds - TAIL }];
  return { seconds, script };
}

/**
 * Plays the demo frame by frame at `fps`: before each frame, the script's pointer moves due by then, then the clock.
 * `draw` gets the frame index once the scene is at that frame's time.
 */
export async function playDemo(scene: Scene, entry: Entry, fps: number, draw: (i: number, frames: number) => Promise<void>) {
  const { seconds, script } = demoOf(entry), frames = Math.round(seconds * fps);
  let next = 0;
  for (let i = 0; i < frames; i++) {
    const t = i / fps;
    while (next < script.length && script[next].t <= t + 1e-9) await scene.point(script[next++].at);
    scene.advance(t * 1000);
    await draw(i, frames);
  }
  return frames;
}

export type Progress = (fraction: number) => void;
