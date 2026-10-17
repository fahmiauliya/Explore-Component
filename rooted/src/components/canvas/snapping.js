// Pure math for snapping: grid, smart guides (red lines) and spacing numbers.
// All values are in world units; `threshold` is already divided by the zoom.

export const GRID = 8;

export const snapValue = (v, g = GRID) => Math.round(v / g) * g;

const edgesX = (r) => [r.x, r.x + r.w / 2, r.x + r.w];
const edgesY = (r) => [r.y, r.y + r.h / 2, r.y + r.h];

// Find the smallest delta that lines one of `mine` up with one of `theirs`.
function bestAlign(mine, others, edgeFn, threshold) {
  let best = null;
  for (const o of others) {
    for (const t of edgeFn(o)) {
      for (const m of mine) {
        const d = t - m;
        if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, pos: t, other: o };
      }
    }
  }
  return best;
}

const overlapsY = (a, b) => a.y < b.y + b.h && b.y < a.y + a.h;
const overlapsX = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w;

// Nearest neighbour on each side that overlaps on the other axis.
export function neighbours(rect, others) {
  let left = null, right = null, top = null, bottom = null;
  for (const o of others) {
    if (overlapsY(rect, o)) {
      if (o.x + o.w <= rect.x && (!left || o.x + o.w > left.x + left.w)) left = o;
      if (o.x >= rect.x + rect.w && (!right || o.x < right.x)) right = o;
    }
    if (overlapsX(rect, o)) {
      if (o.y + o.h <= rect.y && (!top || o.y + o.h > top.y + top.h)) top = o;
      if (o.y >= rect.y + rect.h && (!bottom || o.y < bottom.y)) bottom = o;
    }
  }
  return { left, right, top, bottom };
}

// Moving `rect` among `others`. Returns the snapped position plus what to draw.
export function snapMove(rect, others, { threshold, grid, noSnap }) {
  let { x, y } = rect;
  const guides = [];
  const spacings = [];
  if (noSnap) return { x, y, guides, spacings };

  const ax = bestAlign(edgesX(rect), others, edgesX, threshold);
  const ay = bestAlign(edgesY(rect), others, edgesY, threshold);
  if (ax) x += ax.d;
  if (ay) y += ay.d;

  let moved = { ...rect, x, y };

  // Equal spacing: if my gap to a neighbour nearly equals that neighbour's own
  // gap to its next neighbour, snap to that gap (unless a guide already won).
  const nb = neighbours(moved, others);
  if (!ax) {
    const dx = equalGapX(moved, nb, others, threshold);
    if (dx !== null) x += dx;
  }
  if (!ay) {
    const dy = equalGapY(moved, nb, others, threshold);
    if (dy !== null) y += dy;
  }
  if (!ax && !ay && grid) {
    x = snapValue(x);
    y = snapValue(y);
  } else if (grid) {
    if (!ax) x = snapValue(x);
    if (!ay) y = snapValue(y);
  }
  moved = { ...rect, x, y };

  if (ax) guides.push(guideX(ax.pos, moved, ax.other));
  if (ay) guides.push(guideY(ay.pos, moved, ay.other));

  const nb2 = neighbours(moved, others);
  if (nb2.left) spacings.push(spacingX(nb2.left, moved));
  if (nb2.right) spacings.push(spacingX(moved, nb2.right));
  if (nb2.top) spacings.push(spacingY(nb2.top, moved));
  if (nb2.bottom) spacings.push(spacingY(moved, nb2.bottom));

  return { x, y, guides, spacings };
}

function equalGapX(rect, nb, others, threshold) {
  if (nb.left) {
    const gap = rect.x - (nb.left.x + nb.left.w);
    const prev = neighbours(nb.left, others.filter((o) => o !== nb.left)).left;
    if (prev) {
      const ref = nb.left.x - (prev.x + prev.w);
      if (Math.abs(gap - ref) <= threshold) return ref - gap;
    }
  }
  if (nb.right) {
    const gap = nb.right.x - (rect.x + rect.w);
    const next = neighbours(nb.right, others.filter((o) => o !== nb.right)).right;
    if (next) {
      const ref = next.x - (nb.right.x + nb.right.w);
      if (Math.abs(gap - ref) <= threshold) return gap - ref;
    }
  }
  return null;
}

function equalGapY(rect, nb, others, threshold) {
  if (nb.top) {
    const gap = rect.y - (nb.top.y + nb.top.h);
    const prev = neighbours(nb.top, others.filter((o) => o !== nb.top)).top;
    if (prev) {
      const ref = nb.top.y - (prev.y + prev.h);
      if (Math.abs(gap - ref) <= threshold) return ref - gap;
    }
  }
  if (nb.bottom) {
    const gap = nb.bottom.y - (rect.y + rect.h);
    const next = neighbours(nb.bottom, others.filter((o) => o !== nb.bottom)).bottom;
    if (next) {
      const ref = next.y - (nb.bottom.y + nb.bottom.h);
      if (Math.abs(gap - ref) <= threshold) return gap - ref;
    }
  }
  return null;
}

const guideX = (pos, a, b) => ({ axis: 'x', pos, from: Math.min(a.y, b.y), to: Math.max(a.y + a.h, b.y + b.h) });
const guideY = (pos, a, b) => ({ axis: 'y', pos, from: Math.min(a.x, b.x), to: Math.max(a.x + a.w, b.x + b.w) });

// a is left of b
function spacingX(a, b) {
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  return { axis: 'x', from: a.x + a.w, to: b.x, at: (top + bottom) / 2, gap: Math.round(b.x - (a.x + a.w)) };
}

// a is above b
function spacingY(a, b) {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.w, b.x + b.w);
  return { axis: 'y', from: a.y + a.h, to: b.y, at: (left + right) / 2, gap: Math.round(b.y - (a.y + a.h)) };
}

// Resizing from a corner. `heightFor(w)` keeps the item's shape (aspect ratio).
// `corner` is one of 'nw' | 'ne' | 'sw' | 'se'. Returns the new rect plus guides.
export function snapResize(start, corner, pointer, others, { threshold, grid, noSnap, heightFor, minW = 80 }) {
  const right = corner.includes('e');
  const bottom = corner.includes('s');
  const anchorX = right ? start.x : start.x + start.w;
  const anchorY = bottom ? start.y : start.y + start.h;

  let w = Math.max(minW, Math.abs(pointer.x - anchorX));
  if (!noSnap) {
    // Smart guide on the moving vertical edge.
    const edge = right ? anchorX + w : anchorX - w;
    const ax = bestAlign([edge], others, edgesX, threshold);
    if (ax) w = Math.max(minW, right ? ax.pos - anchorX : anchorX - ax.pos);
    else if (grid) w = Math.max(minW, snapValue(w));
  }
  const h = heightFor ? heightFor(w) : Math.max(minW, Math.abs(pointer.y - anchorY));
  const x = right ? anchorX : anchorX - w;
  const y = bottom ? anchorY : anchorY - h;
  const rect = { x, y, w, h };

  const guides = [];
  if (!noSnap) {
    const edge = right ? x + w : x;
    const ax = bestAlign([edge], others, edgesX, 0.5);
    if (ax) guides.push(guideX(ax.pos, rect, ax.other));
  }
  return { rect, guides };
}

// Union box of a set of rects.
export function bounds(rects) {
  if (!rects.length) return null;
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const r = Math.max(...rects.map((r) => r.x + r.w));
  const b = Math.max(...rects.map((r) => r.y + r.h));
  return { x, y, w: r - x, h: b - y };
}
