export type Theme = 'dark' | 'light';

/** The site's colour tokens. The illustrations read the same ones through the kernel's --hairline-* properties. */
export const TOKENS = {
  dark: { bg: '#0A0B0D', surface: '#0F1013', border: '#1F2125', dim: '#3A3D42', mid: '#52565C', stroke: '#6B6F76', hi: '#F2F3F5', text: '#E6E7E9', muted: '#8A8E95', tint: '#1A1C1F' },
  light: { bg: '#FAFAF9', surface: '#FFFFFF', border: '#E4E4E2', dim: '#C9CAC7', mid: '#ABACA8', stroke: '#8C8E8A', hi: '#111214', text: '#17181A', muted: '#6B6D6A', tint: '#EEEEEB' },
} as const;

/**
 * The kernel's tones from the tokens, plus the soft tint for fills (the kernel's "dot off"). Every line at rest is the
 * one grey (lo, mid and edge alike); only the part being interacted with turns hi. Solid parts fill with the
 * background, so hidden lines stay hidden in both themes.
 */
export const hairlineVars = (theme: Theme) => {
  const t = TOKENS[theme];
  return { plate: t.bg, lo: t.stroke, mid: t.stroke, edge: t.stroke, hi: t.hi, tint: t.tint };
};

/**
 * What every illustration gets on top of the kernel's own styles, wherever it is mounted (the site, the hidden scene
 * the downloads and Copy SVG draw from, the React download): grey and highlight cross over in 200 ms both ways; the
 * soft tint (the spotlight's cone, the glasses' liquid) fills only those; and dots are background-filled outlines in
 * their tone (grey, or highlight while active), never solid.
 */
export const FIGURE_CSS = [
  '[data-hairline] > svg :is(path, polygon, ellipse, line) { transition-duration: 200ms; }',
  '[data-hairline] > svg .dot.off { fill: var(--hairline-tint); }',
  '[data-hairline] > svg .dot:not(.off) { fill: var(--hl-plate); stroke: var(--hl-hi); }',
  '[data-hairline] > svg .dot.m { stroke: var(--hl-edge); }',
].join('\n');

export const FONT_MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
export const FONT_SANS = '"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
