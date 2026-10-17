import { centre, type Grid } from '../dot/dots';
import { Cell } from '../dot/renderer';
import type { TrackingValues } from './dial';
import type { Projected } from './points';

/*
 * The object-tracking overlay: the animal's tracked points as pins, each locked to a dot. At every dot update the
 * points, projected from the same posed frame that made the dots, snap to the centre of the nearest filled cell
 * within one cell; a hidden point, or one with no dot that near, is off for that update. The labels read the
 * snapped cell's frame pixels, and the first key point carries a small target box. Nothing moves between
 * updates, and through a dissolve the pins go off and on with the dots they sit on.
 */
export type Node = { x: number; y: number; label: string; key?: string };
const LABEL = { gap: 8, font: '10px ui-monospace, Menlo, Consolas, monospace', margin: 4 };
const TARGET = 14;                                  // the target box's side, CSS px

export class TrackingOverlay {
  nodes: Node[] = [];

  /** A dot update: each projected point to the nearest filled cell within one cell, or off. */
  setPoints(points: Projected[], cells: Uint8Array, grid: Grid) {
    const nodes: Node[] = [];
    for (const p of points) {
      if (!p.visible) continue;
      const c0 = Math.floor((p.x - grid.ox) / grid.cell), r0 = Math.floor((p.y - grid.oy) / grid.cell);
      let best: { c: number; r: number; d: number } | null = null;
      for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) {
        if (c < 0 || r < 0 || c >= grid.cols || r >= grid.rows || cells[r * grid.cols + c] === Cell.Empty) continue;
        const [x, y] = centre(grid, c, r), d = Math.hypot(x - p.x, y - p.y);
        if (d <= grid.cell && (!best || d < best.d)) best = { c, r, d };
      }
      if (!best) continue;
      const [x, y] = centre(grid, best.c, best.r);
      nodes.push({ x, y, label: `x: ${Math.round(x)}  y: ${Math.round(y)}`, key: p.key });
    }
    this.nodes = nodes;
  }

  /** The pins: a small dot with a thin ring, over the dots. `solid` draws without opacity, for the Current tab. */
  drawNodes(ctx: CanvasRenderingContext2D, v: TrackingValues, solid: boolean) {
    const dot = v.Points.nodeSize / 2, ring = v.Points.nodeSize * 1.2;
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = solid ? '#fff' : 'rgba(255,255,255,.8)';
    ctx.lineWidth = .75;
    for (const n of this.nodes) {
      ctx.beginPath(); ctx.arc(n.x, n.y, dot, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, ring, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  /** The labels at the key points, right of the pin (left when the frame's edge is near), and the target box on the first: on top. */
  drawLabels(ctx: CanvasRenderingContext2D, grid: Grid, v: TrackingValues) {
    if (!v.Overlay.labels && !v.Overlay.targetBox) return;
    const keys = this.nodes.filter(n => n.key).slice(0, Math.round(v.Labels.count));
    ctx.save();
    ctx.fillStyle = ctx.strokeStyle = v.Labels.color;
    ctx.font = LABEL.font;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
    keys.forEach((n, k) => {
      if (v.Overlay.labels) {
        const width = ctx.measureText(n.label).width, right = n.x + LABEL.gap + width <= grid.width - LABEL.margin;
        ctx.textAlign = right ? 'left' : 'right';
        ctx.fillText(n.label, right ? n.x + LABEL.gap : n.x - LABEL.gap, n.y);
      }
      if (v.Overlay.targetBox && k === 0) ctx.strokeRect(Math.round(n.x) - TARGET / 2 + .5, Math.round(n.y) - TARGET / 2 + .5, TARGET, TARGET);
    });
    ctx.restore();
  }
}
