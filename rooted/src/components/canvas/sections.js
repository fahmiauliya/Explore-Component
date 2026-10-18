// Section items: geometry, presets, auto-fit and tidy-up.
// Children (cards, images, labels) live INSIDE a section: their `cx`, `cy` are
// relative to the body's padded top-left (32px padding on every side).
import { measureLabelText, textOn } from './labelColors.js';

export const SECTION_PRESETS = [
  { id: 'paper', name: 'Paper', bg: '#FFFFFF', text: '#111111' },
  { id: 'stone', name: 'Stone', bg: '#E7E3D8', text: '#111111' },
  { id: 'sky', name: 'Sky', bg: '#B7D0F5', text: '#111111' },
  { id: 'mint', name: 'Mint', bg: '#CDE7D3', text: '#111111' },
  { id: 'butter', name: 'Butter', bg: '#F5E3A1', text: '#111111' },
  { id: 'blush', name: 'Blush', bg: '#F3CFD5', text: '#111111' },
  { id: 'lilac', name: 'Lilac', bg: '#D9D0F2', text: '#111111' },
  { id: 'ink', name: 'Ink', bg: '#1F1F1F', text: '#FFFFFF' },
];
export const DEFAULT_SECTION_COLOR = 'paper';
export const SECTION_PAD = 32;
export const CARD_W = 280;
export const GRID_GAP = 24;
export const MAX_COLS = 6;
export const DEFAULT_COLS = 4;
export const SECTION_MIN_W = SECTION_PAD * 2 + CARD_W; // 344: one card
export const SECTION_MIN_H = 200;
export const SECTION_RADIUS = 20;
export const SECTION_STRIP = 12; // body height while collapsed
export const SECTION_FS = 16;
export const TAB_H = 44;
export const TAB_CURVE = 16;
export const TAB_CORNER = 14;
export const TAB_INSET = 24;
export const TAB_PAD = 20;
export const RIBBON_ROOM = 12;
export const SECTION_GAP = 72; // default column: bottom of one to the next tab top
export const FREE_GAP = 48; // free items pushed right of the section column

export function sectionColors(color) {
  const preset = SECTION_PRESETS.find((p) => p.id === (color || DEFAULT_SECTION_COLOR));
  if (preset) return { bg: preset.bg, text: preset.text };
  if (/^#[0-9a-f]{3,6}$/i.test(color)) return { bg: color, text: textOn(color) };
  return sectionColors(DEFAULT_SECTION_COLOR);
}

export function darken(hex, amount = 0.18) {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const ch = [0, 2, 4].map((i) => Math.round(parseInt(full.slice(i, i + 2), 16) * (1 - amount)));
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export const childrenOf = (items, sectionItemId) => items.filter((it) => it.parentId === sectionItemId);

// Width/height of a child (text items may have an auto width that was measured).
export const sizeOf = (c) => (c.type === 'text' ? { w: typeof c.w === 'number' ? c.w : c.mw || 80, h: c.mh || 26 } : { w: c.w, h: c.h });

export const tabTitle = (section) => (section.title || 'Section').toUpperCase();

// Tab metrics scale with the font size (40px tall, 20px side padding at 13px).
export function tabMetrics(section, childCount = 0) {
  const fs = section.fontSize || SECTION_FS;
  const k = fs / SECTION_FS;
  const text = `${tabTitle(section)}  ${childCount}`;
  const textW = measureLabelText(text, fs) + text.length * fs * 0.08;
  return { fs, k, height: Math.round(TAB_H * k), width: Math.round(textW + 2 * TAB_PAD * k), curve: Math.round(TAB_CURVE * k), corner: TAB_CORNER * k };
}

// Tab + body as ONE path. Origin: the tab's top row (y = 0); the body starts at
// y = tabH. The body corner on the tab's side shrinks so the 16px curve can
// start 24px from the edge without a kink.
export function sectionPath(w, bodyH, tabH, tabX, tabW, curve, corner) {
  const c = Math.max(0, Math.min(curve, tabX, w - tabX - tabW));
  const r = Math.min(corner, tabW / 2);
  const RL = Math.max(0, Math.min(SECTION_RADIUS, tabX - c, bodyH / 2));
  const RR = Math.max(0, Math.min(SECTION_RADIUS, w - (tabX + tabW + c), bodyH / 2));
  const RB = Math.min(SECTION_RADIUS, bodyH / 2);
  const y0 = tabH;
  const H = y0 + bodyH;
  return [
    `M${RL} ${y0}`,
    `L${tabX - c} ${y0}`,
    `A${c} ${c} 0 0 0 ${tabX} ${y0 - c}`,
    `L${tabX} ${r}`,
    `A${r} ${r} 0 0 1 ${tabX + r} 0`,
    `L${tabX + tabW - r} 0`,
    `A${r} ${r} 0 0 1 ${tabX + tabW} ${r}`,
    `L${tabX + tabW} ${y0 - c}`,
    `A${c} ${c} 0 0 0 ${tabX + tabW + c} ${y0}`,
    `L${w - RR} ${y0}`,
    `A${RR} ${RR} 0 0 1 ${w} ${y0 + RR}`,
    `L${w} ${H - RB}`,
    `A${RB} ${RB} 0 0 1 ${w - RB} ${H}`,
    `L${RB} ${H}`,
    `A${RB} ${RB} 0 0 1 0 ${H - RB}`,
    `L0 ${y0 + RL}`,
    `A${RL} ${RL} 0 0 1 ${RL} ${y0}`,
    'Z',
  ].join(' ');
}

export const tabXFor = (section, w, tabW) => (section.tabSide === 'right' ? Math.max(TAB_INSET, w - TAB_INSET - tabW) : TAB_INSET);

// Width for n columns of cards.
export const widthForCols = (n) => SECTION_PAD * 2 + n * CARD_W + (n - 1) * GRID_GAP;
export const colsForWidth = (w) => Math.max(1, Math.min(MAX_COLS, Math.round((w - 2 * SECTION_PAD + GRID_GAP) / (CARD_W + GRID_GAP))));

// Auto-fit around the children's relative rects: 32px padding, min 344 × 200.
export function fitSection(section, children) {
  if (!children.length) return { ...section, w: SECTION_MIN_W, h: SECTION_MIN_H };
  const right = Math.max(...children.map((c) => (c.cx || 0) + sizeOf(c).w));
  const bottom = Math.max(...children.map((c) => (c.cy || 0) + sizeOf(c).h));
  return { ...section, w: Math.max(SECTION_MIN_W, Math.round(right + 2 * SECTION_PAD)), h: Math.max(SECTION_MIN_H, Math.round(bottom + 2 * SECTION_PAD)) };
}

export function refitSections(items) {
  let out = items;
  for (const f of items) {
    if (f.type !== 'section') continue;
    const fitted = fitSection(f, childrenOf(items, f.id));
    if (fitted.w !== f.w || fitted.h !== f.h) out = out.map((it) => (it.id === f.id ? fitted : it));
  }
  return out;
}

// Children keep an explicit `order`; older data is ordered by position first.
export function orderedChildren(items, sectionId, exclude) {
  const kids = childrenOf(items, sectionId).filter((c) => c.id !== exclude);
  const byPos = (a, b) => (a.cy || 0) - (b.cy || 0) || (a.cx || 0) - (b.cx || 0);
  return kids.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || byPos(a, b));
}

// Positions for a list of children: a row grid, or masonry (shortest column
// first) when heights differ, e.g. image cards. Returns [{ id, cx, cy }].
export function layoutChildren(kids, cols) {
  const masonry = kids.some((c) => c.type === 'image');
  const out = [];
  if (masonry) {
    const heights = Array.from({ length: cols }, () => 0);
    for (const c of kids) {
      const room = c.type === 'image' && c.ribbon ? RIBBON_ROOM : 0;
      let col = 0;
      for (let i = 1; i < cols; i += 1) if (heights[i] < heights[col]) col = i;
      out.push({ id: c.id, cx: col * (CARD_W + GRID_GAP), cy: heights[col] + room });
      heights[col] += room + sizeOf(c).h + GRID_GAP;
    }
    return out;
  }
  let y = 0;
  for (let i = 0; i < kids.length; i += cols) {
    const row = kids.slice(i, i + cols);
    const room = row.some((c) => c.type === 'image' && c.ribbon) ? RIBBON_ROOM : 0;
    let x = 0;
    for (const c of row) {
      out.push({ id: c.id, cx: x, cy: y + room });
      x += sizeOf(c).w + GRID_GAP;
    }
    y += room + Math.max(...row.map((c) => sizeOf(c).h)) + GRID_GAP;
  }
  return out;
}

// Re-flow a section's children (grid or masonry), renumber their order, then fit.
export function tidySection(items, sectionId) {
  const section = items.find((it) => it.id === sectionId);
  const kids = orderedChildren(items, sectionId);
  if (!section || !kids.length) return refitSections(items);
  const placed = new Map(layoutChildren(kids, section.cols || DEFAULT_COLS).map((p) => [p.id, p]));
  const orderOf = new Map(kids.map((c, i) => [c.id, i]));
  const next = items.map((it) => (placed.has(it.id) ? { ...it, cx: placed.get(it.id).cx, cy: placed.get(it.id).cy, order: orderOf.get(it.id) } : it.id === sectionId ? { ...it, collapsed: false } : it));
  return refitSections(next);
}

export const tidyAll = (items) => items.filter((it) => it.type === 'section').reduce((acc, f) => tidySection(acc, f.id), items);

// Where a card dropped at the relative point (rx, ry) would land: the index in
// the children order and the rect it would take, for the ghost and for inserting.
export function slotAt(items, sectionId, rx, ry, dropped) {
  const section = items.find((it) => it.id === sectionId);
  const cols = section?.cols || DEFAULT_COLS;
  const kids = orderedChildren(items, sectionId, dropped?.id);
  const ds = dropped ? sizeOf(dropped) : { w: CARD_W, h: 263 };
  const probe = { id: '__probe', type: dropped?.type === 'text' ? 'link' : dropped?.type || 'link', w: ds.w, h: ds.h, ribbon: dropped?.ribbon };
  // Try every insertion index and take the one whose slot is nearest the point.
  let best = null;
  for (let index = 0; index <= kids.length; index += 1) {
    const trial = [...kids.slice(0, index), probe, ...kids.slice(index)];
    const pos = layoutChildren(trial, cols).find((p) => p.id === '__probe');
    const d = Math.hypot(pos.cx + probe.w / 2 - (rx + probe.w / 2), pos.cy + probe.h / 2 - (ry + probe.h / 2));
    if (!best || d < best.d) best = { index, cx: pos.cx, cy: pos.cy, d };
  }
  return { index: best.index, cx: best.cx, cy: best.cy, w: probe.w, h: probe.h };
}

// Insert a child at an index of the section's order, then tidy.
export function insertChildAt(items, sectionId, childId, index) {
  const kids = orderedChildren(items, sectionId, childId);
  const orderOf = new Map();
  kids.forEach((c, i) => orderOf.set(c.id, i < index ? i : i + 1));
  orderOf.set(childId, index);
  return tidySection(items.map((it) => (orderOf.has(it.id) ? { ...it, parentId: sectionId, order: orderOf.get(it.id) } : it)), sectionId);
}

// Free items (no section) must not overlap any section: push them to the right
// of the section column with 48px of space, stacking them with 24px gaps.
export function clearOverlaps(items, rectOf) {
  const sections = items.filter((it) => it.type === 'section');
  if (!sections.length) return items;
  const frames = sections.map((f) => { const r = rectOf(f); return { x: r.x, y: r.y - TAB_H, w: r.w, h: r.h + TAB_H }; });
  const right = Math.max(...frames.map((r) => r.x + r.w)) + FREE_GAP;
  const hit = (r) => frames.some((f) => r.x < f.x + f.w && f.x < r.x + r.w && r.y < f.y + f.h && f.y < r.y + r.h);
  let out = items;
  let nextY = Math.min(...frames.map((r) => r.y));
  const placed = [];
  for (const it of items) {
    if (it.type === 'section' || it.parentId) continue;
    const r = rectOf(it);
    if (!hit(r)) continue;
    let y = Math.max(nextY, r.y);
    while (placed.some((p) => y < p.y + p.h && p.y < y + r.h)) y = Math.max(...placed.map((p) => p.y + p.h)) + GRID_GAP;
    placed.push({ y, h: r.h });
    out = out.map((x) => (x.id === it.id ? { ...x, x: right, y } : x));
    nextY = y + r.h + GRID_GAP;
  }
  return out;
}
