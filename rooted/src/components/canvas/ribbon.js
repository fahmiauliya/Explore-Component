// Bookmark ribbon labels on uploaded images: statuses, limits and geometry.
export const RIBBON_STATUSES = [
  { id: 'grey', name: 'Saved', light: '#F4F4F4', dark: '#CFCFCF', text: '#6B6B6B' },
  { id: 'blue', name: 'Inspiration', light: '#E6F0FF', dark: '#9EBDF2', text: '#2B4C8C' },
  { id: 'yellow', name: 'To review', light: '#FFF6D6', dark: '#E9CF7A', text: '#7A5B0F' },
  { id: 'red', name: 'Favorite', light: '#FFE5E2', dark: '#F0A39A', text: '#8E2A20' },
];
export const RIBBON_LIMITS = [4, 8, 8];
export const DEFAULT_RIBBON = { lines: ['New'], status: 'grey', side: 'right' };

export const ribbonStatus = (id) => RIBBON_STATUSES.find((s) => s.id === id) || RIBBON_STATUSES[0];

// Trim, cap and drop empty lines (max 3).
export function cleanLines(lines) {
  return (lines || [])
    .map((l, i) => String(l || '').trim().slice(0, RIBBON_LIMITS[Math.min(i, 2)]))
    .filter(Boolean)
    .slice(0, 3);
}

// Base geometry at width 64 (scale = ribbonWidth / 64).
export const RIBBON_BASE_W = 64;
export const RIBBON_FOLD = 12;
export const RIBBON_NOTCH = 12;
export const RIBBON_RADIUS = 6;
const PAD = 4;
const LINE1 = 24; // 20px text
const DIVIDER = 13; // 6 + 1 + 6
const LINE = 15.6; // 12px at 1.3

export function ribbonLayout(lines) {
  const n = Math.max(1, Math.min(3, lines.length));
  const height = RIBBON_FOLD + PAD + LINE1 + (n > 1 ? DIVIDER + (n - 1) * LINE : 0) + PAD + RIBBON_NOTCH;
  const line1Y = RIBBON_FOLD + PAD + 19; // baseline
  const dividerY = RIBBON_FOLD + PAD + LINE1 + 6;
  const lineYs = [];
  for (let i = 1; i < n; i += 1) lineYs.push(dividerY + 7 + (i - 1) * LINE + 11);
  return { height, line1Y, dividerY, lineYs };
}

// One path: rounded top, straight sides, V-notch bottom.
export function ribbonPath(h) {
  const W = RIBBON_BASE_W;
  const r = RIBBON_RADIUS;
  return `M${r} 0H${W - r}A${r} ${r} 0 0 1 ${W} ${r}V${h - RIBBON_NOTCH}L${W / 2} ${h}L0 ${h - RIBBON_NOTCH}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
}

// Ribbon width follows the image: clamp(48, width × 0.22, 96).
export const ribbonWidth = (imageW) => Math.min(96, Math.max(48, imageW * 0.22));
