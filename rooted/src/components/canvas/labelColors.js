// Label chip colors: 9 presets (background / text) plus custom hex values.
export const LABEL_PRESETS_COLORS = [
  { id: 'gray', name: 'Gray', bg: '#F1F1F1', text: '#3D3D3D' },
  { id: 'black', name: 'Black', bg: '#111111', text: '#FFFFFF' },
  { id: 'red', name: 'Red', bg: '#FDE8E8', text: '#9B1C1C' },
  { id: 'orange', name: 'Orange', bg: '#FEEBDC', text: '#9A3412' },
  { id: 'yellow', name: 'Yellow', bg: '#FEF6D5', text: '#854D0E' },
  { id: 'green', name: 'Green', bg: '#E3F6E8', text: '#166534' },
  { id: 'blue', name: 'Blue', bg: '#E3EDFD', text: '#1E40AF' },
  { id: 'purple', name: 'Purple', bg: '#EFE7FD', text: '#5B21B6' },
  { id: 'pink', name: 'Pink', bg: '#FCE7F3', text: '#9D174D' },
];

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

// 'blue' | '#AABBCC' | undefined -> { bg, text }
export function labelColors(color) {
  const preset = LABEL_PRESETS_COLORS.find((p) => p.id === (color || 'gray'));
  if (preset) return { bg: preset.bg, text: preset.text };
  if (/^#[0-9a-f]{3,6}$/i.test(color)) return { bg: color, text: textOn(color) };
  return { bg: LABEL_PRESETS_COLORS[0].bg, text: LABEL_PRESETS_COLORS[0].text };
}
