// Text items: free text with a filled or transparent background.
import { LABEL_PRESETS_COLORS, measureLabelText, textOn } from './labelColors.js';
import { SECTION_PRESETS } from './sections.js';

export const TEXT_SIZES = { S: 14, M: 20, L: 28, XL: 40 };
export const TEXT_SIZE_IDS = ['S', 'M', 'L', 'XL'];
export const TEXT_LINE = 1.3;
export const TEXT_PAD_Y = 10;
export const TEXT_PAD_X = 14;
export const TEXT_MIN_W = 64;
export const DEFAULT_TEXT_COLOR = '#111111';

// Text colors for the transparent fill.
export const TEXT_COLOR_PRESETS = [
  { id: '#111111', name: 'Ink', bg: '#111111', text: '#fff' },
  { id: '#737373', name: 'Gray', bg: '#737373', text: '#fff' },
  { id: '#9B1C1C', name: 'Red', bg: '#9B1C1C', text: '#fff' },
  { id: '#1E40AF', name: 'Blue', bg: '#1E40AF', text: '#fff' },
  { id: '#166534', name: 'Green', bg: '#166534', text: '#fff' },
  { id: '#5B21B6', name: 'Purple', bg: '#5B21B6', text: '#fff' },
];

export const textFontSize = (item) => TEXT_SIZES[item.size] || TEXT_SIZES.M;

// Background and text colors for a text item.
export function textColors(item) {
  if (item.fill === 'filled') {
    const id = item.color || 'paper';
    const preset = SECTION_PRESETS.find((p) => p.id === id) || LABEL_PRESETS_COLORS.find((p) => p.id === id);
    if (preset) return { bg: preset.bg, text: preset.text, border: preset.border || 'rgba(0,0,0,0.06)' };
    if (/^#[0-9a-f]{3,6}$/i.test(id)) return { bg: id, text: textOn(id), border: 'rgba(0,0,0,0.06)' };
    return { bg: '#FFFFFF', text: '#111111', border: 'rgba(0,0,0,0.06)' };
  }
  const c = item.color && /^#[0-9a-f]{3,6}$/i.test(item.color) ? item.color : DEFAULT_TEXT_COLOR;
  return { bg: 'transparent', text: c, border: 'transparent' };
}

// Rough size before the DOM has measured it (auto width: the longest line).
export function estimateTextSize(item) {
  const fs = textFontSize(item);
  const lines = String(item.text || ' ').split('\n');
  const padX = item.fill === 'filled' ? 2 * TEXT_PAD_X + 2 : 0;
  const padY = item.fill === 'filled' ? 2 * TEXT_PAD_Y + 2 : 0;
  const w = typeof item.w === 'number' ? item.w : Math.ceil(Math.max(...lines.map((l) => measureLabelText(l, fs))) + padX);
  return { w, h: Math.ceil(lines.length * fs * TEXT_LINE + padY) };
}

// World size of a text item: a fixed width or the measured auto width.
export const textSize = (item) => ({ w: typeof item.w === 'number' ? item.w : item.mw || estimateTextSize(item).w, h: item.mh || estimateTextSize(item).h });

// Old label chips become filled text items at a readable size.
export function labelToText(label) {
  const fs = label.fontSize || 14;
  const size = fs < 20 ? 'M' : fs < 24 ? 'M' : fs < 34 ? 'L' : 'XL';
  const { fontSize, fixedW, text, type, h, w, ...rest } = label;
  return { ...rest, type: 'text', text: text || 'Text', fill: 'filled', color: label.color || 'white', size, weight: 500, align: 'left', w: fixedW ? w : 'auto' };
}
