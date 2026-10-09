export type Theme = 'dark' | 'light';

/** The site's colour tokens. The illustrations read the same ones through the kernel's --hairline-* properties. */
export const TOKENS = {
  dark: { bg: '#0A0B0D', surface: '#0F1013', border: '#1F2125', dim: '#3A3D42', mid: '#52565C', stroke: '#6B6F76', hi: '#F2F3F5', text: '#E6E7E9', muted: '#8A8E95', tint: '#3A3D42' },
  light: { bg: '#FAFAF9', surface: '#FFFFFF', border: '#E4E4E2', dim: '#C9CAC7', mid: '#ABACA8', stroke: '#8C8E8A', hi: '#111214', text: '#17181A', muted: '#6B6D6A', tint: '#EEEEEB' },
} as const;

/** The kernel's five tones from the tokens, plus the soft tint for fills (the kernel's "dot off"). Solid parts fill with the background, so hidden lines stay hidden in both themes. */
export const hairlineVars = (theme: Theme) => {
  const t = TOKENS[theme];
  return { plate: t.bg, lo: t.dim, mid: t.mid, edge: t.stroke, hi: t.hi, tint: t.tint };
};

export const FONT_MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
export const FONT_SANS = '"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
