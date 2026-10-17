// Label chip colors: 9 presets (background / text) plus custom hex values.
export const LABEL_PRESETS_COLORS = [
  { id: 'white', name: 'White', bg: '#FFFFFF', text: '#111111', border: '#E3E3E3' },
  { id: 'black', name: 'Black', bg: '#111111', text: '#FFFFFF' },
  { id: 'red', name: 'Red', bg: '#FDE8E8', text: '#9B1C1C' },
  { id: 'orange', name: 'Orange', bg: '#FEEBDC', text: '#9A3412' },
  { id: 'yellow', name: 'Yellow', bg: '#FEF6D5', text: '#854D0E' },
  { id: 'green', name: 'Green', bg: '#E3F6E8', text: '#166534' },
  { id: 'blue', name: 'Blue', bg: '#E3EDFD', text: '#1E40AF' },
  { id: 'purple', name: 'Purple', bg: '#EFE7FD', text: '#5B21B6' },
  { id: 'pink', name: 'Pink', bg: '#FCE7F3', text: '#9D174D' },
];

export const DEFAULT_LABEL_COLOR = 'white';

// WCAG relative luminance of a #rrggbb color.
function luminance(hex) {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// White or #111, whichever reads better on the given background.
export function textOn(bg) {
  const l = luminance(bg);
  const white = 1.05 / (l + 0.05);
  const dark = (l + 0.05) / 0.05;
  return white >= dark ? '#FFFFFF' : '#111111';
}

// 'blue' | '#AABBCC' | undefined -> { bg, text, border }
export function labelColors(color) {
  const id = color === 'gray' ? 'white' : color || DEFAULT_LABEL_COLOR; // Gray was replaced by White
  const preset = LABEL_PRESETS_COLORS.find((p) => p.id === id);
  if (preset) return { bg: preset.bg, text: preset.text, border: preset.border || 'rgba(0, 0, 0, 0.08)' };
  if (/^#[0-9a-f]{3,6}$/i.test(color)) return { bg: color, text: textOn(color), border: 'rgba(0, 0, 0, 0.08)' };
  return labelColors(DEFAULT_LABEL_COLOR);
}

// ---- size ----
export const LABEL_MIN_FS = 14;
export const LABEL_MAX_FS = 40;
export const LABEL_SIZES = [
  { id: 'S', fs: 14 },
  { id: 'M', fs: 20 },
  { id: 'L', fs: 28 },
  { id: 'XL', fs: 40 },
];
const LINE = 1.3;

export const clampFontSize = (fs) => Math.min(LABEL_MAX_FS, Math.max(LABEL_MIN_FS, Math.round(fs)));

// Everything scales with the font size: padding 8/14, radius 8 and height 36 at 14px.
export function labelMetrics(fontSize = LABEL_MIN_FS) {
  const k = fontSize / 14;
  return { fontSize, padX: 14 * k, padY: 8 * k, radius: 8 * k, lineHeight: LINE, height: Math.round(fontSize * LINE + 16 * k + 2) };
}

export const labelHeight = (fontSize) => labelMetrics(fontSize).height;

// Height -> font size (inverse of labelHeight), used by corner resizing.
export const fontSizeForHeight = (h) => clampFontSize((h - 2) / (LINE + 16 / 14));

let ctx;
// Natural width of a label's text at a font size (without padding).
export function measureLabelText(text, fontSize = LABEL_MIN_FS) {
  if (typeof document === 'undefined') return text.length * fontSize * 0.55;
  ctx = ctx || document.createElement('canvas').getContext('2d');
  ctx.font = `500 ${fontSize}px Geist, system-ui, sans-serif`;
  return ctx.measureText(text || ' ').width;
}

// Smallest width a label may be resized to: its text + padding, or 64px.
export function labelMinWidth(text, fontSize) {
  const m = labelMetrics(fontSize);
  return Math.max(64, Math.ceil(measureLabelText(text, fontSize) + 2 * m.padX + 2));
}

// Natural (auto) width of a label.
export function labelNaturalWidth(text, fontSize) {
  const m = labelMetrics(fontSize);
  return Math.ceil(measureLabelText(text, fontSize) + 2 * m.padX + 2);
}
