// Folder items: geometry, presets, stacking, auto-fit and tidy-up.
// Children (cards, images) live INSIDE a folder: their `cx`, `cy` are relative
// to the body's padded top-left. Folders keep `x`, `y` as their Spread position.
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
export const FOLDER_PAD = 24;
export const FOLDER_MIN_W = 320;
export const FOLDER_MIN_H = 200;
export const FOLDER_RADIUS = 20;
export const FOLDER_STRIP = 12; // body height while collapsed
export const FOLDER_FS = 13; // default tab text size
export const TAB_H = 40; // at 13px
export const TAB_CURVE = 16; // concave curve into the body
export const TAB_CORNER = 14;
export const TAB_INSET = 24;
export const STACK_STEP = 56; // each stacked folder sits 56px lower (tab + 16px strip)
export const TIDY_COLS = 4;
export const TIDY_GAP = 24;
export const RIBBON_ROOM = 12;

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

export function tabText(folder, childCount = 0) {
  const title = (folder.title || 'Folder').toUpperCase();
  return folder.collapsed ? `${title} · ${childCount}` : title;
}

// Tab metrics scale with the font size (40px tall, text + 48px wide at 13px).
export function tabMetrics(folder, childCount = 0) {
  const fs = folder.fontSize || FOLDER_FS;
  const k = fs / FOLDER_FS;
  const text = tabText(folder, childCount);
  const textW = measureLabelText(text, fs) + text.length * fs * 0.08;
  return { fs, k, height: Math.round(TAB_H * k), width: Math.round(textW + 48 * k), curve: Math.round(TAB_CURVE * k), corner: TAB_CORNER * k };
}

// Tab + body as ONE path. Origin: the tab's top-left row (y = 0); the body
// starts at y = tabH. `tabX` is the tab's left edge within the folder width.
export function folderPath(w, bodyH, tabH, tabX, tabW, curve, corner) {
  const R = Math.min(FOLDER_RADIUS, bodyH / 2);
  const c = Math.min(curve, tabX, w - tabX - tabW);
  const r = Math.min(corner, tabW / 2);
  const y0 = tabH;
  const H = y0 + bodyH;
  return [
    `M${R} ${y0}`,
    `L${tabX - c} ${y0}`,
    `A${c} ${c} 0 0 0 ${tabX} ${y0 - c}`,
    `L${tabX} ${r}`,
    `A${r} ${r} 0 0 1 ${tabX + r} 0`,
    `L${tabX + tabW - r} 0`,
    `A${r} ${r} 0 0 1 ${tabX + tabW} ${r}`,
    `L${tabX + tabW} ${y0 - c}`,
    `A${c} ${c} 0 0 0 ${tabX + tabW + c} ${y0}`,
    `L${w - R} ${y0}`,
    `A${R} ${R} 0 0 1 ${w} ${y0 + R}`,
    `L${w} ${H - R}`,
    `A${R} ${R} 0 0 1 ${w - R} ${H}`,
    `L${R} ${H}`,
    `A${R} ${R} 0 0 1 0 ${H - R}`,
    `L0 ${y0 + R}`,
    `A${R} ${R} 0 0 1 ${R} ${y0}`,
    'Z',
  ].join(' ');
}

// The tab's flare (16px) must clear the body's 20px corner, so the smallest
// inset that keeps one clean path is 36px.
const MIN_INSET = FOLDER_RADIUS + TAB_CURVE;
const clampTabX = (x, w, tabW) => Math.max(MIN_INSET, Math.min(w - MIN_INSET - tabW, x));

// Tab x within a folder for the Spread view (left or right side).
export const spreadTabX = (folder, w, tabW) => clampTabX(folder.tabSide === 'right' ? w - TAB_INSET - tabW : TAB_INSET, w, tabW);

// Staggered tab slots for a stack of N: left, right, left-center, right-center, …
export function stackTabX(index, count, w, tabW) {
  const pair = Math.floor(index / 2);
  const step = count > 1 ? (w - 2 * MIN_INSET - tabW) / count : 0;
  return clampTabX(index % 2 === 0 ? MIN_INSET + pair * step : w - MIN_INSET - tabW - pair * step, w, tabW);
}

// Auto-fit around the children's relative rects (min 320 × 200).
export function fitFolder(folder, children) {
  if (!children.length) return { ...folder, w: Math.max(FOLDER_MIN_W, folder.autoSize === false ? folder.w : FOLDER_MIN_W), h: Math.max(FOLDER_MIN_H, folder.autoSize === false ? folder.h : FOLDER_MIN_H) };
  const right = Math.max(...children.map((c) => (c.cx || 0) + c.w));
  const bottom = Math.max(...children.map((c) => (c.cy || 0) + c.h));
  return { ...folder, w: Math.max(FOLDER_MIN_W, Math.round(right + 2 * FOLDER_PAD)), h: Math.max(FOLDER_MIN_H, Math.round(bottom + 2 * FOLDER_PAD)) };
}

export function refitFolders(items) {
  let out = items;
  for (const f of items) {
    if (f.type !== 'folder' || f.autoSize === false) continue;
    const fitted = fitFolder(f, childrenOf(items, f.id));
    if (fitted.w !== f.w || fitted.h !== f.h) out = out.map((it) => (it.id === f.id ? fitted : it));
  }
  return out;
}

// Grid the children (4 per row, 24px gaps, reading order), then fit.
export function tidyFolder(items, folderId) {
  const kids = childrenOf(items, folderId).sort((a, b) => (a.cy || 0) - (b.cy || 0) || (a.cx || 0) - (b.cx || 0));
  if (!kids.length) return items;
  const moved = new Map();
  let y = 0;
  for (let i = 0; i < kids.length; i += TIDY_COLS) {
    const row = kids.slice(i, i + TIDY_COLS);
    const room = row.some((c) => c.type === 'image' && c.ribbon) ? RIBBON_ROOM : 0;
    let x = 0;
    for (const c of row) {
      moved.set(c.id, { cx: x, cy: y + room });
      x += c.w + TIDY_GAP;
    }
    y += room + Math.max(...row.map((c) => c.h)) + TIDY_GAP;
  }
  const next = items.map((it) => (moved.has(it.id) ? { ...it, ...moved.get(it.id) } : it.id === folderId ? { ...it, autoSize: true, collapsed: false } : it));
  return refitFolders(next);
}

// The next free grid slot in a folder (for cards dropped onto a back tab).
export function nextSlot(items, folderId, w, h) {
  const kids = childrenOf(items, folderId);
  if (!kids.length) return { cx: 0, cy: 0 };
  const bottom = Math.max(...kids.map((c) => (c.cy || 0) + c.h));
  const lastRow = kids.filter((c) => (c.cy || 0) + c.h >= bottom - 1);
  const right = Math.max(...lastRow.map((c) => (c.cx || 0) + c.w));
  if (lastRow.length < TIDY_COLS) return { cx: right + TIDY_GAP, cy: Math.min(...lastRow.map((c) => c.cy || 0)) };
  return { cx: 0, cy: bottom + TIDY_GAP };
}
