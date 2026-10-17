import type { Grid } from './dots';

/*
 * The stepped update loop every dot illustration runs on: fixed-rate ticks between which nothing is drawn, the
 * grid measured from the box (the panel's columns across, rows to fill the height at the same spacing), one
 * backing pixel per device pixel even when an ancestor scales the canvas, and a stop when the element is off
 * screen or the tab hidden. The component decides what a tick draws and what pausing means for its clock.
 */
export const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export type StepperOptions = {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  dirty: { current: boolean };                      // set by the component when something asks for an update
  rate: () => number;                               // updates a second
  columns: () => number;
  grid: (grid: Grid) => void;                       // the grid was (re)measured
  tick: (ctx: CanvasRenderingContext2D, grid: Grid) => void;
  shown: (on: boolean) => void;                     // off screen or hidden (false) and back (true)
  motion: () => void;                               // prefers-reduced-motion changed
  every?: (ctx: CanvasRenderingContext2D, grid: Grid, now: number) => void; // every screen frame, after any tick (the Sky version's shimmer and grid)
};

/** Starts the loop; returns its stop. */
export function startStepper(o: StepperOptions) {
  const ctx = o.canvas.getContext('2d')!;
  let raf = 0, due = 0, ticked = 0, shown = true, intersecting = true;
  let grid: Grid = { cols: 0, rows: 0, cell: 0, ox: 0, oy: 0, width: 0, height: 0, px: 1 };

  const measure = () => {
    const width = o.element.clientWidth, height = o.element.clientHeight, rect = o.element.getBoundingClientRect();
    const px = (width ? rect.width / width : 1) * devicePixelRatio;
    const cols = Math.max(1, Math.round(o.columns())), cell = width / cols, rows = Math.max(1, Math.floor(height / cell));
    grid = { cols, rows, cell, ox: 0, oy: (height - rows * cell) / 2, width, height, px };
    o.canvas.width = Math.max(1, Math.round(width * px));
    o.canvas.height = Math.max(1, Math.round(height * px));
    o.grid(grid);
    o.dirty.current = true;
  };
  // Fixed-rate ticks: between them the dots do not move, whatever the screen's frame rate. Ticks keep the rate's
  // grid (a quarter frame early counts), so on a 60 Hz screen 24 a second alternates two- and three-frame holds,
  // never come closer than most of an interval, and after a stall the grid restarts rather than catching up.
  const frame = () => {
    raf = requestAnimationFrame(frame);
    const now = performance.now(), interval = 1000 / o.rate();
    if (now - due >= -4 && now - ticked >= interval * .6) {
      due = now - due > interval ? now + interval : due + interval;
      ticked = now;
      if (o.dirty.current) {
        o.dirty.current = false;
        if (Math.round(o.columns()) !== grid.cols) measure();
        ctx.setTransform(grid.px, 0, 0, grid.px, 0, 0);
        o.tick(ctx, grid);
      }
    }
    if (o.every) { ctx.setTransform(grid.px, 0, 0, grid.px, 0, 0); o.every(ctx, grid, now); }
  };
  // Off screen or in a hidden tab nothing renders; the component's clock waits with it.
  const show = (on: boolean) => {
    if (on === shown) return;
    shown = on;
    if (!on) { cancelAnimationFrame(raf); raf = 0; }
    else { o.dirty.current = true; due = ticked = 0; raf = requestAnimationFrame(frame); }
    o.shown(on);
  };
  const visibility = () => show(intersecting && !document.hidden);
  const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; visibility(); });
  const sizes = new ResizeObserver(measure);
  const motion = () => { o.dirty.current = true; o.motion(); };
  observer.observe(o.element);
  sizes.observe(o.element);
  addEventListener('resize', measure);
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', motion);
  measure();
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect(); sizes.disconnect();
    removeEventListener('resize', measure);
    document.removeEventListener('visibilitychange', visibility);
    reduced.removeEventListener('change', motion);
  };
}

/** A per-frame loop for a decoration (the sky): runs while the element is on screen and the tab visible; returns its stop. */
export function startFrames(element: Element, draw: (now: number) => void) {
  let raf = 0, intersecting = true;
  const frame = (now: number) => { raf = requestAnimationFrame(frame); draw(now); };
  const show = () => { const on = intersecting && !document.hidden; if (on && !raf) raf = requestAnimationFrame(frame); else if (!on && raf) { cancelAnimationFrame(raf); raf = 0; } };
  const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; show(); });
  observer.observe(element);
  document.addEventListener('visibilitychange', show);
  show();
  return () => { cancelAnimationFrame(raf); raf = 0; observer.disconnect(); document.removeEventListener('visibilitychange', show); };
}

/** True when two grids are the same cell for cell: a flying thing drawn twice alike is a bug worth a warning. */
export const sameGrid = (a: Uint8Array | null, b: Uint8Array) => !!a && a.length === b.length && a.every((v, i) => v === b[i]);

/** A short note beside a panel action button, for about 1.5 s. */
export function note(action: string, text: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>('.dialkit-root button')].find(b => b.textContent?.trim() === action);
  button?.parentElement?.querySelector('.dial-note')?.remove();
  const span = Object.assign(document.createElement('span'), { className: 'dial-note', role: 'status', textContent: text });
  (button ?? document.body).insertAdjacentElement(button ? 'afterend' : 'beforeend', span);
  setTimeout(() => span.remove(), 1500);
}
