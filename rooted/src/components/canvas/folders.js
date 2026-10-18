// Folder items: geometry, presets, auto-fit and tidy-up.
// Children (cards, images, labels) live INSIDE a folder: their `cx`, `cy` are
// relative to the body's padded top-left (32px padding on every side).
import { measureLabelText, textOn } from './labelColors.js';

export const FOLDER_PRESETS = [
  { id: 'paper', name: 'Paper', bg: '#FFFFFF', text: '#111111' },
  { id: 'stone', name: 'Stone', bg: '#E7E3D8', text: '#111111' },
  { id: 'sky', name: 'Sky', bg: '#B7D0F5', text: '#111111' },
  { id: 'mint', name: 'Mint', bg: '#CDE7D3', text: '#111111' },
  { id: 'butter', name: 'Butter', bg: '#F5E3A1', text: '#111111' },
  { id: 'blush', name: 'Blush', bg: '#F3CFD5', text: '#111111' },
  { id: 'lilac', name: 'Lilac', bg: '#D9D0F2', text: '#111111' },
  { id: 'ink', name: 'Ink', bg: '#1F1F1F', text: '#FFFFFF' },
];
export const DEFAULT_FOLDER_COLOR = 'paper';
export const FOLDER_PAD = 32;
export const CARD_W = 280;
export const GRID_GAP = 24;
export const MAX_COLS = 6;
export const DEFAULT_COLS = 4;
export const FOLDER_MIN_W = FOLDER_PAD * 2 + CARD_W; // 344: one card
export const FOLDER_MIN_H = 200;
export const FOLDER_RADIUS = 20;
export const FOLDER_STRIP = 12; // body height while collapsed
export const FOLDER_FS = 13;
export const TAB_H = 40;
export const TAB_CURVE = 16;
export const TAB_CORNER = 14;
export const TAB_INSET = 24;
export const TAB_PAD = 20;
export const RIBBON_ROOM = 12;
export const FOLDER_GAP = 72; // default column: bottom of one to the next tab top
export const FREE_GAP = 48; // free items pushed right of the folder column

export function folderColors(color) {
  const preset = FOLDER_PRESETS.find((p) => p.id === (color || DEFAULT_FOLDER_COLOR));
  if (preset) return { bg: preset.bg, text: preset.text };
  if (/^#[0-9a-f]{3,6}$/i.test(color)) return { bg: color, text: textOn(color) };
  return folderColors(DEFAULT_FOLDER_COLOR);
}

export function darken(hex, amount = 0.18) {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const ch = [0, 2, 4].map((i) => Math.round(parseInt(full.slice(i, i + 2), 16) * (1 - amount)));
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export const childrenOf = (items, folderId) => items.filter((it) => it.parentId === folderId);

export const tabTitle = (folder) => (folder.title || 'Folder').toUpperCase();

// Tab metrics scale with the font size (40px tall, 20px side padding at 13px).
export function tabMetrics(folder, childCount = 0) {
  const fs = folder.fontSize || FOLDER_FS;
  const k = fs / FOLDER_FS;
  const text = `${tabTitle(folder)}  ${childCount}`;
  const textW = measureLabelText(text, fs) + text.length * fs * 0.08;
  return { fs, k, height: Math.round(TAB_H * k), width: Math.round(textW + 2 * TAB_PAD * k), curve: Math.round(TAB_CURVE * k), corner: TAB_CORNER * k };
}

// Tab + body as ONE path. Origin: the tab's top row (y = 0); the body starts at
// y = tabH. The body corner on the tab's side shrinks so the 16px curve can
// start 24px from the edge without a kink.
export function folderPath(w, bodyH, tabH, tabX, tabW, curve, corner) {
  const c = Math.max(0, Math.min(curve, tabX, w - tabX - tabW));
  const r = Math.min(corner, tabW / 2);
  const RL = Math.max(0, Math.min(FOLDER_RADIUS, tabX - c, bodyH / 2));
  const RR = Math.max(0, Math.min(FOLDER_RADIUS, w - (tabX + tabW + c), bodyH / 2));
  const RB = Math.min(FOLDER_RADIUS, bodyH / 2);
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

export const tabXFor = (folder, w, tabW) => (folder.tabSide === 'right' ? Math.max(TAB_INSET, w - TAB_INSET - tabW) : TAB_INSET);

// Width for n columns of cards.
export const widthForCols = (n) => FOLDER_PAD * 2 + n * CARD_W + (n - 1) * GRID_GAP;
export const colsForWidth = (w) => Math.max(1, Math.min(MAX_COLS, Math.round((w - 2 * FOLDER_PAD + GRID_GAP) / (CARD_W + GRID_GAP))));

// Auto-fit around the children's relative rects: 32px padding, min 344 × 200.
export function fitFolder(folder, children) {
  if (!children.length) return { ...folder, w: FOLDER_MIN_W, h: FOLDER_MIN_H };
  const right = Math.max(...children.map((c) => (c.cx || 0) + c.w));
  const bottom = Math.max(...children.map((c) => (c.cy || 0) + c.h));
  return { ...folder, w: Math.max(FOLDER_MIN_W, Math.round(right + 2 * FOLDER_PAD)), h: Math.max(FOLDER_MIN_H, Math.round(bottom + 2 * FOLDER_PAD)) };
}

export function refitFolders(items) {
  let out = items;
  for (const f of items) {
    if (f.type !== 'folder') continue;
    const fitted = fitFolder(f, childrenOf(items, f.id));
    if (fitted.w !== f.w || fitted.h !== f.h) out = out.map((it) => (it.id === f.id ? fitted : it));
  }
  return out;
}

// Grid the children (`cols` per row, 24px gaps, reading order), then fit.
export function tidyFolder(items, folderId) {
  const folder = items.find((it) => it.id === folderId);
  const kids = childrenOf(items, folderId).sort((a, b) => (a.cy || 0) - (b.cy || 0) || (a.cx || 0) - (b.cx || 0));
  if (!folder || !kids.length) return refitFolders(items);
  const cols = folder.cols || DEFAULT_COLS;
  const moved = new Map();
  let y = 0;
  for (let i = 0; i < kids.length; i += cols) {
    const row = kids.slice(i, i + cols);
    const room = row.some((c) => c.type === 'image' && c.ribbon) ? RIBBON_ROOM : 0;
    let x = 0;
    for (const c of row) {
      moved.set(c.id, { cx: x, cy: y + room });
      x += c.w + GRID_GAP;
    }
    y += room + Math.max(...row.map((c) => c.h)) + GRID_GAP;
  }
  const next = items.map((it) => (moved.has(it.id) ? { ...it, ...moved.get(it.id) } : it.id === folderId ? { ...it, collapsed: false } : it));
  return refitFolders(next);
}

export const tidyAll = (items) => items.filter((it) => it.type === 'folder').reduce((acc, f) => tidyFolder(acc, f.id), items);

// Where a card dropped at the relative point (rx, ry) would land: the grid slot
// index and its rect, for the ghost and for inserting.
export function slotAt(items, folderId, rx, ry, dropped) {
  const folder = items.find((it) => it.id === folderId);
  const cols = folder?.cols || DEFAULT_COLS;
  const kids = childrenOf(items, folderId).filter((c) => c.id !== dropped?.id).sort((a, b) => (a.cy || 0) - (b.cy || 0) || (a.cx || 0) - (b.cx || 0));
  const rowH = (kids.length ? Math.max(...kids.map((c) => c.h)) : dropped?.h || 263) + GRID_GAP;
  const row = Math.max(0, Math.floor((ry + rowH / 2) / rowH));
  const col = Math.max(0, Math.min(cols - 1, Math.floor((rx + (CARD_W + GRID_GAP) / 2) / (CARD_W + GRID_GAP))));
  const index = Math.min(kids.length, row * cols + col);
  const r = Math.floor(index / cols);
  const cidx = index % cols;
  return { index, cx: cidx * (CARD_W + GRID_GAP), cy: r * rowH, w: dropped?.w || CARD_W, h: dropped?.h || 263 };
}

// Insert a child at a slot index: give it coordinates just before the occupant, then tidy.
export function insertChildAt(items, folderId, childId, index) {
  const slot = slotAt(items, folderId, 0, 0, null);
  const kids = childrenOf(items, folderId).filter((c) => c.id !== childId).sort((a, b) => (a.cy || 0) - (b.cy || 0) || (a.cx || 0) - (b.cx || 0));
  const occupant = kids[index];
  const folder = items.find((it) => it.id === folderId);
  const cols = folder?.cols || DEFAULT_COLS;
  const target = occupant ? { cx: (occupant.cx || 0) - 1, cy: occupant.cy || 0 } : kids.length ? { cx: ((kids.length % cols) * (CARD_W + GRID_GAP)) + 1, cy: (kids[kids.length - 1].cy || 0) + (kids.length % cols === 0 ? 1 : 0) } : { cx: 0, cy: 0 };
  void slot;
  return tidyFolder(items.map((it) => (it.id === childId ? { ...it, parentId: folderId, ...target } : it)), folderId);
}

// Free items (no folder) must not overlap any folder: push them to the right
// of the folder column with 48px of space, stacking them with 24px gaps.
export function clearOverlaps(items, rectOf) {
  const folders = items.filter((it) => it.type === 'folder');
  if (!folders.length) return items;
  const frames = folders.map((f) => { const r = rectOf(f); return { x: r.x, y: r.y - TAB_H, w: r.w, h: r.h + TAB_H }; });
  const right = Math.max(...frames.map((r) => r.x + r.w)) + FREE_GAP;
  const hit = (r) => frames.some((f) => r.x < f.x + f.w && f.x < r.x + r.w && r.y < f.y + f.h && f.y < r.y + r.h);
  let out = items;
  let nextY = Math.min(...frames.map((r) => r.y));
  const placed = [];
  for (const it of items) {
    if (it.type === 'folder' || it.parentId) continue;
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
