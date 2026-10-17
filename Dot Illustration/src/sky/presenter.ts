import { centre, dotRadius, pills, type Grid } from '../dot/dots';
import { Cell } from '../dot/renderer';
import type { SkyValues } from './dial';
import { noise3, unit } from './noise';
import type { TrackingOverlay } from '../tracking/overlay';
import type { TrackingValues } from '../tracking/dial';

/*
 * The Sky version's drawing, and the chrome both versions share. On the Sky tab the subject's cells, held from the
 * stepped update, are drawn every screen frame as the Current version's very shapes in white, the three tones
 * told apart by opacity, each dot shimmering on a slow 3D noise over the grid and time, a pill sharing one value
 * along its length. Over the dots, on both tabs, the chrome: the tracking grid, four lines around the subject's
 * loop box (the box of every pose of its loop, from its calibration) plus a padding, so they barely move while
 * one animal shows; a line a filled cell would touch is pushed outward at once, and settles back slowly; between
 * animals the box glides to the next one's over 0.8 s. Markers where the lines cross, the name and the
 * bottom-right marker's coordinates along them, the overlay's pins and labels, an edge text up the top-left
 * corner and live tracking data in the bottom-right, refreshed once a second. The Sky tab draws it in its own
 * colours with opacities over a cleared canvas; the Current tab draws it over its own dots in solid colours.
 */
export type Bounds = { c0: number; c1: number; r0: number; r1: number };
export type Shapes = { dotSize: number; navyWidth: number };     // the Dot Bird panel's sizes, shared with the Current version
export type Meta = { name: string; index: number; total: number; rate: number }; // the subject showing and the update rate, for the texts
export type LoopBox = { width: number; height: number } | null;   // the subject's loop box as fractions of the frame, centred
export type Palette = { ink: string; solid: boolean };            // the edge texts' colour, and whether the chrome may use opacity (the Sky tab) or not (Current)
export const SKY_PALETTE: Palette = { ink: '#fff', solid: false };
type Lines = { l: number; r: number; t: number; b: number };
const SIDES = ['l', 'r', 't', 'b'] as const;
const SPARKLE_EVERY = 4;                            // updates a sparkle stays on a cell
const SPARKLE_SIZE = .55;                           // a sparkle's radius, × a dot's
const FLOOR = .01;                                  // no dot ever goes below 1% opacity
const GRID = { push: 2, guard: 2, speed: .05, switchSeconds: .8 };  // cells a pushed line lands beyond the outermost cell; cells a line keeps from the animal; the lines' top speed as a share of the frame's width a second; the glide between animals
const CAPTION = { size: 11, inset: 6 };             // the caption's font size and its distance inside the lines, CSS px
const TEXT = { margin: 12, name: '600 11px system-ui, sans-serif', data: '9.5px ui-monospace, Menlo, Consolas, monospace', line: 12, refresh: 1000 };
const MARKER_TEXT = { gap: 8, lift: 5, drop: 12, name: '600 10px system-ui, sans-serif', data: '9.5px ui-monospace, Menlo, Consolas, monospace' };

/** The filled cells' bounding box, or null when there are none. */
export function boundsOf(cells: Uint8Array, cols: number): Bounds | null {
  let c0 = Infinity, c1 = -1, r0 = Infinity, r1 = -1;
  for (let i = 0; i < cells.length; i++) if (cells[i] !== Cell.Empty) {
    const c = i % cols, r = (i - c) / cols;
    if (c < c0) c0 = c; if (c > c1) c1 = c; if (r < r0) r0 = r; if (r > r1) r1 = r;
  }
  return c1 < 0 ? null : { c0, c1, r0, r1 };
}

// Fixed-width numbers: a signed or unsigned integer part padded with zeros, and a fixed number of decimals.
const fixed = (value: number, digits: number, decimals: number, signed = false) => {
  const sign = value < 0 ? '-' : signed ? '+' : '', [int, frac] = Math.abs(value).toFixed(decimals).split('.');
  return `${sign}${int.padStart(digits, '0')}${decimals ? '.' + frac : ''}`;
};
const clock = (seconds: number) => [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, Math.floor(seconds) % 60].map(n => String(n).padStart(2, '0')).join(':');
const easeInOut = (p: number) => p < .5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;

export class SkyPresenter {
  overlay: TrackingOverlay | null = null;
  tracking: TrackingValues | null = null;
  crossings = 0;                                    // updates at which a filled cell touched a line after the push: never, or a bug
  private cells: Uint8Array | null = null;
  private bounds: Bounds | null = null;
  private meta: Meta | null = null;
  private loop: LoopBox = null;
  private padding = 3;
  private updates = 0;
  private lines: Lines | null = null;
  private switching = false;
  private glide: { from: Lines; start: number } | null = null;
  private last = 0;
  private started = 0;
  private dataAt = -Infinity;
  private data: string[] = [];
  private markerAt = -Infinity;
  private marker = '';

  /** The subject's new shape (at the stepped rate), the bounds the grid guards, what it is, and its loop box; the
   * hard rule runs here, at the update: a line a filled cell touches or sits outside is pushed outward now. */
  shape(cells: Uint8Array, bounds: Bounds | null, meta: Meta | undefined, grid: Grid, loop: LoopBox) {
    this.cells = cells.slice();
    if (bounds) this.bounds = bounds;
    if (meta) { if (this.meta && meta.name !== this.meta.name) this.switching = true; this.meta = meta; }
    this.loop = loop;
    this.updates++;
    if (!bounds) return;
    if (!this.lines) this.lines = this.target(grid);
    const edge = this.edges(bounds, grid), push = GRID.push * grid.cell, lines = this.lines;
    if (lines.l >= edge.l) lines.l = edge.l - push;
    if (lines.r <= edge.r) lines.r = edge.r + push;
    if (lines.t >= edge.t) lines.t = edge.t - push;
    if (lines.b <= edge.b) lines.b = edge.b + push;
    if (lines.l >= edge.l || lines.r <= edge.r || lines.t >= edge.t || lines.b <= edge.b) { this.crossings++; console.warn(`Grid: a filled cell touches a grid line at update ${this.updates}`); }
  }

  /** The filled cells' outer edges in frame pixels. */
  private edges(bounds: Bounds, grid: Grid): Lines { return { l: grid.ox + bounds.c0 * grid.cell, r: grid.ox + (bounds.c1 + 1) * grid.cell, t: grid.oy + bounds.r0 * grid.cell, b: grid.oy + (bounds.r1 + 1) * grid.cell }; }

  /** Where the lines want to be: the loop box plus the padding (the bounds plus the padding until a loop box is known),
   * never closer to the animal than the guard. */
  private target(grid: Grid): Lines {
    const pad = this.padding * grid.cell, guard = GRID.guard * grid.cell;
    let base: Lines;
    if (this.loop) { const cx = grid.ox + grid.cols * grid.cell / 2, cy = grid.oy + grid.rows * grid.cell / 2, w = this.loop.width * grid.cols * grid.cell / 2, h = this.loop.height * grid.rows * grid.cell / 2; base = { l: cx - w - pad, r: cx + w + pad, t: cy - h - pad, b: cy + h + pad }; }
    else { const e = this.edges(this.bounds!, grid); base = { l: e.l - pad, r: e.r + pad, t: e.t - pad, b: e.b + pad }; }
    const e = this.edges(this.bounds!, grid);
    return { l: Math.min(base.l, e.l - guard), r: Math.max(base.r, e.r + guard), t: Math.min(base.t, e.t - guard), b: Math.max(base.b, e.b + guard) };
  }

  /** One screen frame of the Sky version. With `still`, nothing moves: no shimmer, fixed sparkles, the lines on their target, the text frozen. */
  frame(ctx: CanvasRenderingContext2D, grid: Grid, now: number, v: SkyValues, shapes: Shapes, still: boolean) {
    ctx.clearRect(0, 0, grid.width, grid.height);
    const d = v['Sky Dots'], time = still ? 0 : now / 1000 * d.shimmerSpeed;
    const tone = [0, d.light / 100, d.mid / 100, d.dark / 100], low = d.shimmerLow / 100, high = d.shimmerHigh / 100;
    // The shimmer at a cell: slow patches of light over the grid at the clump size, drifting with time; squared toward
    // bright, so most of the subject stays bright. The final opacity is the tone's × this, never under the floor.
    const alpha = (state: number, c: number, r: number) => {
      const n = noise3(7, c / d.shimmerClump, r / d.shimmerClump, time), bright = 1 - (1 - n) * (1 - n);
      return Math.max(FLOOR, tone[state] * (low + (high - low) * bright));
    };
    const epoch = still ? 0 : Math.floor(this.updates / SPARKLE_EVERY), share = d.sparkles ? d.sparkleAmount / 100 : 0;
    const radius = dotRadius(grid, shapes.dotSize);
    if (this.cells && this.cells.length === grid.cols * grid.rows) {                 // a shape from another density waits for its update
      for (let r = 0; r < grid.rows; r++) for (let c = 0; c < grid.cols; c++) {
        const i = r * grid.cols + c, state = this.cells[i];
        if (state !== Cell.Light && state !== Cell.Mid) continue;
        const [x, y] = centre(grid, c, r);
        ctx.beginPath();
        if (share && unit(i * 7.31 + epoch * 101.7) < share) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = unit(i * 3.1 + epoch * 17.3) < .5 ? d.sparkleRed : d.sparkleGreen;
          ctx.arc(x, y, radius * SPARKLE_SIZE, 0, Math.PI * 2);
        } else {
          ctx.globalAlpha = alpha(state, c, r);
          ctx.fillStyle = '#fff';
          ctx.arc(x, y, radius, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      // A pill shimmers as one piece, on the value at its middle.
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = shapes.navyWidth * grid.cell;
      ctx.lineCap = 'round';
      for (const pill of pills(this.cells, grid, shapes.navyWidth)) {
        ctx.globalAlpha = alpha(Cell.Dark, pill.c, (pill.r0 + pill.r1) / 2);
        ctx.beginPath();
        ctx.moveTo(pill.x, pill.top);
        ctx.lineTo(pill.x, pill.bottom);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    this.chrome(ctx, grid, now, v, still, SKY_PALETTE);
  }

  /** Over the dots, on either tab: the pins, the grid and its markers and texts, the labels, the edge texts. */
  chrome(ctx: CanvasRenderingContext2D, grid: Grid, now: number, v: SkyValues, still: boolean, palette: Palette) {
    const dt = this.last && !still ? Math.min(.1, (now - this.last) / 1000) : 0;
    this.last = now;
    if (!this.started) this.started = now;
    this.padding = v.Grid.padding;
    const overlay = this.tracking?.Overlay.tracking ? this.overlay : null, tracking = this.tracking!;
    overlay?.drawNodes(ctx, tracking, palette.solid);
    this.gridLines(ctx, grid, v, dt, still, now, palette);
    overlay?.drawLabels(ctx, grid, tracking);
    this.text(ctx, grid, now, v, still, palette);
  }

  /** The lines for this frame: on their target when still; gliding to the next animal's box after a switch (0.8 s,
   * ease in and out); otherwise settling toward the target at no more than 5% of the frame a second, 95% of the way
   * in `return` seconds; and never inside the guard around the animal. */
  private move(grid: Grid, v: SkyValues, dt: number, still: boolean, now: number) {
    const target = this.target(grid), lines = this.lines!;
    if (still) { Object.assign(lines, target); return; }
    if (this.switching) { this.switching = false; this.glide = { from: { ...lines }, start: now }; }
    if (this.glide) {
      const p = Math.min(1, (now - this.glide.start) / 1000 / GRID.switchSeconds), e = easeInOut(p);
      for (const side of SIDES) lines[side] = this.glide.from[side] + (target[side] - this.glide.from[side]) * e;
      if (p >= 1) this.glide = null;
    } else {
      const k = 1 - Math.exp(-3 * dt / v.Grid.return), most = GRID.speed * grid.width * dt;
      for (const side of SIDES) lines[side] += Math.max(-most, Math.min(most, (target[side] - lines[side]) * k));
    }
    // Whatever moved them, the lines stay outside the guard around the animal.
    const e = this.edges(this.bounds!, grid), guard = GRID.guard * grid.cell;
    lines.l = Math.min(lines.l, e.l - guard); lines.r = Math.max(lines.r, e.r + guard); lines.t = Math.min(lines.t, e.t - guard); lines.b = Math.max(lines.b, e.b + guard);
  }

  /** The tracking grid: four lines, markers where they cross, the texts at the markers, the loop box when asked, and the caption. */
  private gridLines(ctx: CanvasRenderingContext2D, grid: Grid, v: SkyValues, dt: number, still: boolean, now: number, palette: Palette) {
    const g = v.Grid;
    if (!g.enabled || !this.bounds) return;
    if (!this.lines) this.lines = this.target(grid);
    this.move(grid, v, dt, still, now);
    const colours = palette.solid ? v['Grid Current'] : v['Grid Sky'], opacity = palette.solid ? 1 : v['Grid Sky'].opacity;
    const line = colours.line, marker = g.linkColors ? line : colours.marker, label = g.linkColors ? line : colours.label;
    // Crisp lines on the device's pixels, edge to edge, and a marker where they cross, on top.
    const px = grid.px, width = Math.max(1, Math.round(g.lineWidth * px)), snap = (value: number) => Math.round(value * px) + (width % 2 ? .5 : 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineWidth = width;
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = line;
    ctx.beginPath();
    for (const x of [this.lines.l, this.lines.r]) { ctx.moveTo(snap(x), 0); ctx.lineTo(snap(x), ctx.canvas.height); }
    for (const y of [this.lines.t, this.lines.b]) { ctx.moveTo(0, snap(y)); ctx.lineTo(ctx.canvas.width, snap(y)); }
    ctx.stroke();
    const m = v.Markers;
    if (m.enabled) {
      const size = Math.max(1, Math.round(m.size * px)), half = Math.floor(size / 2);
      ctx.globalAlpha = 1;
      ctx.fillStyle = ctx.strokeStyle = marker;
      ctx.lineWidth = 1;
      for (const x of [this.lines.l, this.lines.r]) for (const y of [this.lines.t, this.lines.b]) {
        const x0 = Math.round(x * px) - half, y0 = Math.round(y * px) - half;
        if (m.style === 'outline') ctx.strokeRect(x0 + .5, y0 + .5, size - 1, size - 1); else ctx.fillRect(x0, y0, size, size);
      }
    }
    ctx.restore();
    // The loop box, to check the grid against: a faint dashed rectangle.
    if (g.showLoopBox && this.loop) {
      const cx = grid.ox + grid.cols * grid.cell / 2, cy = grid.oy + grid.rows * grid.cell / 2, w = this.loop.width * grid.cols * grid.cell, h = this.loop.height * grid.rows * grid.cell;
      ctx.save();
      ctx.globalAlpha = .5;
      ctx.strokeStyle = label;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      ctx.restore();
    }
    // At the markers, moving with them: the name above the top line from 8 px right of the top-left marker, and the
    // bottom-right marker's own coordinates below the bottom line, ending 8 px left of it, refreshed once a second.
    if (v.Text.name && this.meta) {
      ctx.save();
      ctx.fillStyle = label;
      ctx.font = MARKER_TEXT.name;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0.14em';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(this.meta.name.toUpperCase(), this.lines.l + MARKER_TEXT.gap, this.lines.t - MARKER_TEXT.lift);
      ctx.restore();
    }
    if (v.Text.data) {
      if (now - this.markerAt >= TEXT.refresh || (still && !this.marker)) { this.markerAt = now; this.marker = `X ${fixed(this.lines.r, 4, 2)}  Y ${fixed(this.lines.b, 4, 2)}`; }
      ctx.save();
      ctx.globalAlpha = palette.solid ? 1 : .8;
      ctx.fillStyle = label;
      ctx.font = MARKER_TEXT.data;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(this.marker, this.lines.r - MARKER_TEXT.gap, this.lines.b + MARKER_TEXT.drop);
      ctx.restore();
    }
    if (!v.Extras.caption || !v.Extras.captionText) return;
    // The caption reads upward, its baseline just inside the right line, starting just above the bottom line.
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = label;
    ctx.font = `italic ${CAPTION.size}px system-ui, sans-serif`;
    ctx.translate(this.lines.r - CAPTION.inset, this.lines.b - CAPTION.inset);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(v.Extras.captionText, 0, 0);
    ctx.restore();
  }

  /** The edge text up the top-left corner, and the tracking data in the bottom-right, its numbers refreshed once a second. */
  private text(ctx: CanvasRenderingContext2D, grid: Grid, now: number, v: SkyValues, still: boolean, palette: Palette) {
    const t = v.Text, m = this.meta;
    const edge = t.edge.replace(/\{name\}/g, m?.name ?? '').replace(/\{seq\}/g, m ? `${fixed(m.index, 2, 0)}/${fixed(m.total, 2, 0)}` : '').replace(/\{grid\}/g, `${grid.cols}×${grid.rows}`).replace(/\{fps\}/g, String(Math.round(m?.rate ?? 0))).trim();
    if (edge) {
      ctx.save();
      ctx.fillStyle = palette.ink;
      ctx.font = TEXT.name;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0.14em';
      const label = edge.toUpperCase(), width = ctx.measureText(label).width;
      ctx.translate(TEXT.margin + 9, TEXT.margin + width);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
    if (!t.data) return;
    // The numbers follow the grid's box (in frame pixels), the coordinates drift around the base point with it, the
    // frame counter is the dot updates, and the time is since this started; all of it snaps to new values each second.
    if (now - this.dataAt >= TEXT.refresh || (still && !this.data.length)) {
      this.dataAt = now;
      const box = this.lines ?? { l: 0, r: grid.width, t: 0, b: grid.height }, w = box.r - box.l, h = box.b - box.t;
      const base = (text: string, fallback: number) => { const n = parseFloat(text); return Number.isFinite(n) ? n : fallback; };
      const lat = base(t.baseLat, -8.67052) - (box.t / grid.height - .5) * .02, lon = base(t.baseLon, 115.21264) + (box.l / grid.width - .5) * .02, alt = base(t.baseAlt, 412.6) + (w - grid.width * .3) * .25;
      const seq = this.meta ? `${fixed(this.meta.index, 2, 0)}/${fixed(this.meta.total, 2, 0)}` : '--/--';
      this.data = [
        `X ${fixed(box.l, 4, 2)}  Y ${fixed(box.t, 4, 2)}   W ${fixed(w, 4, 2)}  H ${fixed(h, 4, 2)}`,
        `LAT ${fixed(lat, 2, 5, true)}  LON ${fixed(lon, 3, 5)}  ALT ${fixed(alt, 4, 1)}M`,
        `FRM ${fixed(this.updates, 6, 0)}  SEQ ${seq}  T ${clock(still ? 0 : (now - this.started) / 1000)}`,
      ];
    }
    ctx.save();
    ctx.globalAlpha = palette.solid ? 1 : .8;
    ctx.fillStyle = palette.ink;
    ctx.font = TEXT.data;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    this.data.forEach((line, k) => ctx.fillText(line, grid.width - TEXT.margin, grid.height - TEXT.margin - (this.data.length - 1 - k) * TEXT.line));
    ctx.restore();
  }
}
