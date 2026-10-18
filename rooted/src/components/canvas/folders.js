// Folder items: geometry, presets, auto-fit and tidy-up.
import { measureLabelText, textOn } from './labelColors.js';

export const FOLDER_PRESETS = [
  { id: 'paper', name: 'Paper', bg: '#F6F5F2', text: '#111111' },
  { id: 'stone', name: 'Stone', bg: '#E8E5DC', text: '#111111' },
  { id: 'sky', name: 'Sky', bg: '#A9C8F2', text: '#111111' },
  { id: 'mint', name: 'Mint', bg: '#CFE8D5', text: '#111111' },
  { id: 'butter', name: 'Butter', bg: '#F6E7A8', text: '#111111' },
  { id: 'blush', name: 'Blush', bg: '#F4D3D8', text: '#111111' },
  { id: 'lilac', name: 'Lilac', bg: '#DCD3F4', text: '#111111' },
  { id: 'ink', name: 'Ink', bg: '#1F1F1F', text: '#FFFFFF' },
];
export const DEFAULT_FOLDER_COLOR = 'paper';
export const FOLDER_PAD = 24;
export const FOLDER_MIN_W = 320;
export const FOLDER_MIN_H = 200;
export const FOLDER_RADIUS = 20;
export const FOLDER_STRIP = 12; // body height while collapsed
export const FOLDER_FS = 13; // default tab text size
export const TIDY_COLS = 4;
export const TIDY_GAP = 24;
export const RIBBON_ROOM = 12; // extra space above images with a ribbon

export function folderColors(color) {
  const preset = FOLDER_PRESETS.find((p) => p.id === (color || DEFAULT_FOLDER_COLOR));
  if (preset) return { bg: preset.bg, text: preset.text };
  if (/^#[0-9a-f]{3,6}$/i.test(color)) return { bg: color, text: textOn(color) };
  return folderColors(DEFAULT_FOLDER_COLOR);
}

// A darker shade of the folder color for the "received a child" hint.
export function darken(hex, amount = 0.18) {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const ch = [0, 2, 4].map((i) => Math.round(parseInt(full.slice(i, i + 2), 16) * (1 - amount)));
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// Tab metrics scale with the font size (36px tall at 13px).
export function tabMetrics(folder) {
  const fs = folder.fontSize || FOLDER_FS;
  const k = fs / FOLDER_FS;
  const text = tabText(folder);
  const textW = measureLabelText(text, fs) + text.length * fs * 0.06; // letter-spacing .06em
  return { fs, k, height: Math.round(36 * k), width: Math.round(textW + 32 * k), curve: Math.round(12 * k), radius: 14 * k, inset: 24 };
}

export function tabText(folder, childCount = 0) {
  const title = (folder.title || 'Folder').toUpperCase();
  return folder.collapsed ? `${title} · ${childCount}` : title;
}

// One path: flare up from the body on the left, rounded tab, flare back down.
export function tabPath(width, height, curve, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  const W = width + 2 * curve;
  const H = height;
  return [
    `M0 ${H}`,
    `C${curve * 0.55} ${H} ${curve} ${H - curve * 0.45} ${curve} ${H - curve}`,
    `L${curve} ${r}`,
    `A${r} ${r} 0 0 1 ${curve + r} 0`,
    `L${curve + width - r} 0`,
    `A${r} ${r} 0 0 1 ${curve + width} ${r}`,
    `L${curve + width} ${H - curve}`,
    `C${curve + width} ${H - curve * 0.45} ${W - curve * 0.55} ${H} ${W} ${H}`,
    'Z',
  ].join(' ');
}

// The rectangle that stands for the folder body (collapsed = a thin strip).
export const folderRect = (f) => (f.collapsed ? { x: f.x, y: f.y, w: f.w, h: FOLDER_STRIP } : { x: f.x, y: f.y, w: f.w, h: f.h });

export const childrenOf = (items, folderId) => items.filter((it) => it.parentId === folderId);

// Auto-fit: the body wraps its children with 24px padding (min 320 × 200).
export function fitFolder(folder, children) {
  if (!children.length) return { ...folder, w: Math.max(FOLDER_MIN_W, folder.w || 0), h: Math.max(FOLDER_MIN_H, folder.h || 0) };
  const top = (c) => c.y - (c.type === 'image' && c.ribbon ? RIBBON_ROOM : 0);
  const minX = Math.min(...children.map((c) => c.x));
  const minY = Math.min(...children.map(top));
  const maxX = Math.max(...children.map((c) => c.x + c.w));
  const maxY = Math.max(...children.map((c) => c.y + c.h));
  return { ...folder, x: minX - FOLDER_PAD, y: minY - FOLDER_PAD, w: Math.max(FOLDER_MIN_W, maxX - minX + 2 * FOLDER_PAD), h: Math.max(FOLDER_MIN_H, maxY - minY + 2 * FOLDER_PAD) };
}

// Re-fit every auto-sized, expanded folder around its children.
export function refitFolders(items) {
  let out = items;
  for (const f of items) {
    if (f.type !== 'folder' || f.autoSize === false || f.collapsed) continue;
    const kids = childrenOf(items, f.id);
    const fitted = fitFolder(f, kids);
    if (fitted.x !== f.x || fitted.y !== f.y || fitted.w !== f.w || fitted.h !== f.h) out = out.map((it) => (it.id === f.id ? fitted : it));
  }
  return out;
}

// Arrange a folder's children in a grid (4 per row, 24px gaps, reading order)
// starting at the folder's padding, then fit the folder. Returns new items.
export function tidyFolder(items, folderId) {
  const folder = items.find((it) => it.id === folderId);
  if (!folder) return items;
  const kids = childrenOf(items, folderId).sort((a, b) => a.y - b.y || a.x - b.x);
  if (!kids.length) return items;
  const moved = new Map();
  let y = folder.y + FOLDER_PAD;
  for (let i = 0; i < kids.length; i += TIDY_COLS) {
    const row = kids.slice(i, i + TIDY_COLS);
    const room = row.some((c) => c.type === 'image' && c.ribbon) ? RIBBON_ROOM : 0;
    let x = folder.x + FOLDER_PAD;
    for (const c of row) {
      moved.set(c.id, { x, y: y + room });
      x += c.w + TIDY_GAP;
    }
    y += room + Math.max(...row.map((c) => c.h)) + TIDY_GAP;
  }
  const next = items.map((it) => (moved.has(it.id) ? { ...it, ...moved.get(it.id) } : it.id === folderId ? { ...it, autoSize: true, collapsed: false } : it));
  return refitFolders(next);
}

// Topmost expanded folder whose body contains the point.
export function folderAt(items, x, y, excludeIds = new Set()) {
  const hits = items.filter((it) => it.type === 'folder' && !it.collapsed && !excludeIds.has(it.id) && x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h);
  return hits.sort((a, b) => b.z - a.z)[0] || null;
}
