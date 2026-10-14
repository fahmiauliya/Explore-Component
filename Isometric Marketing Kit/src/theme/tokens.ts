import { TOKENS } from '../tokens';

/*
 * The site's design tokens, measured from fahmiauliya.com (Chromium, 1440 and 375 px, its default light theme): its
 * stylesheet's custom properties and the computed styles of the name, role line, body copy, nav, pills, guide lines,
 * works grid and cards. The dark theme is derived from the same values (background near #0F0F0F,
 * text near #F2F2F2, the greys inverted); the nav pill keeps its dark glossy look in both.
 *
 * styles.css uses only the custom properties written by `themeCss()` (main.tsx puts them in the page before the first
 * render), so a value changes here and nowhere else. The illustrations keep their own palette (src/tokens.ts); only
 * their plate follows the tile they sit on.
 */

export const type = {
  family: '"Geist", Arial, sans-serif',
  mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  /** the name ("Fahmi Auliya") and the role line under it: 14 / 1.4, the name tracked -0.28px */
  name: { size: '14px', weight: 400, line: 1.4, tracking: '-0.28px' },
  role: { size: '14px', weight: 400, line: 1.4, tracking: 'normal' },
  /** body paragraphs: 14 / 1.4 (13px under 640px), 12px apart; the lead paragraph at most 420px wide */
  body: { size: '14px', sizeSmall: '13px', weight: 400, line: 1.4, gap: '12px', lead: '420px' },
  /** nav labels: 12 / 1.4, -0.24px, white with a soft text shadow */
  nav: { size: '12px', line: 1.4, tracking: '-0.24px', shadow: '.5px .5px 1px rgba(0,0,0,.3), .3px .3px .4px rgba(0,0,0,.2)' },
  /** pill buttons: 14 / 1.4 */
  button: { size: '14px', line: 1.4 },
  /** card captions: the title 12px +0.24px, the subtitle 12px -0.24px at 60%, the right label 10px -0.2px at 60% ("soon" at 20%) */
  cardTitle: { size: '12px', line: 1.4, tracking: '0.24px' },
  cardSub: { size: '12px', line: 1.4, tracking: '-0.24px', opacity: 0.6 },
  cardLabel: { size: '10px', tracking: '-0.2px', opacity: 0.6, soonOpacity: 0.2 },
  /** section labels (the reference's "Experience"): the muted 12px caption style */
  section: { size: '12px', line: 1.4, tracking: '-0.24px' },
} as const;

export const color = {
  light: {
    canvas: '#fafafa', ink: '#1b1b1b', secondary: 'rgba(27, 27, 27, 0.7)', muted: 'rgba(27, 27, 27, 0.6)', faint: 'rgba(27, 27, 27, 0.2)',
    /** the guide lines: 1px rgba(0,0,0,.1) with a 1px white edge outside */
    guide: 'rgba(0, 0, 0, 0.1)', guideEdge: '#ffffff', hairline: 'rgba(0, 0, 0, 0.1)', field: '#ffffff',
    /** the card thumbnail fill (the reference's --color-project) and its white grid overlay */
    tile: '#ebebeb', tileBorder: 'rgba(255, 255, 255, 0.6)', grid: '255, 255, 255', gridFine: 0.21, gridMajor: 0.7, gridHover: 1.45,
    /** the illustrations on a tile: their solids fill with the tile, their tint sits between the tile and the lines */
    plateTint: '#dedede',
    light: { text: '#000000', ring: '#f0f0f0', ringHover: '#e4e4e4', border: 'rgba(0, 0, 0, 0.15)',
      background: 'linear-gradient(180deg, rgba(255,255,255,.2) 50%, rgba(230,230,230,.2)), #ffffff',
      inset: 'inset 0 .5px .5px rgba(255,255,255,.6), inset 0 -.5px .5px rgba(0,0,0,.2)', shadow: '.5px .5px 1px rgba(0,0,0,.25), .4px .4px .4px rgba(0,0,0,.25)' },
    backdrop: 'rgba(0, 0, 0, 0.4)', danger: '#B93B2E', focus: '#1b1b1b',
  },
  dark: {
    canvas: '#0f0f0f', ink: '#f2f2f2', secondary: 'rgba(242, 242, 242, 0.7)', muted: 'rgba(242, 242, 242, 0.6)', faint: 'rgba(242, 242, 242, 0.2)',
    guide: 'rgba(255, 255, 255, 0.1)', guideEdge: '#000000', hairline: 'rgba(255, 255, 255, 0.1)', field: '#161616',
    tile: '#1a1a1a', tileBorder: 'rgba(255, 255, 255, 0.04)', grid: '255, 255, 255', gridFine: 0.035, gridMajor: 0.09, gridHover: 1.6,
    plateTint: '#242424',
    light: { text: '#f2f2f2', ring: '#262626', ringHover: '#333333', border: 'rgba(255, 255, 255, 0.12)',
      background: 'linear-gradient(180deg, rgba(255,255,255,.06) 50%, rgba(0,0,0,.2)), #222222',
      inset: 'inset 0 .5px .5px rgba(255,255,255,.12), inset 0 -.5px .5px rgba(0,0,0,.6)', shadow: '.5px .5px 1px rgba(0,0,0,.6)' },
    backdrop: 'rgba(0, 0, 0, 0.6)', danger: '#F07A6F', focus: '#f2f2f2',
  },
} as const;

/** The nav: 28px round controls and a 28px pill 4px apart, 17px from the top, a dark glossy surface (both themes). */
export const nav = {
  top: '17px', height: '28px', gap: '4px', icon: '14px', itemPad: '5px 12px', itemHeight: '27px',
  surface: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.2)), #656565',
  rim: 'linear-gradient(180deg, rgba(255,255,255,.2), rgba(153,153,153,.2))',
  shadow: '0 4px 5px 1px rgba(0,0,0,.1), 0 2px 2px rgba(0,0,0,.25), 0 0 0 .5px rgba(0,0,0,.55)',
  inner: 'inset 0 2px 1px rgba(255,255,255,.15), inset 0 -1.5px 1px rgba(0,0,0,.15)',
  innerHover: 'inset 0 2px 1px rgba(255,255,255,.28), inset 0 -1.5px 1px rgba(0,0,0,.15)',
  hover: 'brightness(1.12)', active: 'brightness(.86)',
  /** the segmented tabs' indicator ("Selected Project / Recent Work"): 121px tabs, 23px tall */
  tab: '121px', tabHeight: '23px',
  indicator: 'rgba(255,255,255,.2)', indicatorShadow: 'inset 0 0 0 .3px rgba(255,255,255,.2), inset 0 0 2px rgba(255,255,255,.36), inset 0 0 4px rgba(255,255,255,.16)',
  itemHover: 'rgba(255,255,255,.08)', itemHoverShadow: 'inset 0 0 0 .3px rgba(255,255,255,.16)',
  slide: '.18s cubic-bezier(.22,1,.36,1)',
} as const;

/** Pill buttons: 33px tall, 6px 12px 6px 14px, fully round, 14px icons 4px from the label. */
export const pill = {
  height: '33px', pad: '6px 12px 6px 14px', radius: '999px', icon: '14px', gap: '4px',
  dark: { text: '#ffffff', border: 'rgba(0,0,0,.2)', background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.4)), #636363',
    ring: '#d6d6d6', inset: 'inset 0 1.5px .6px rgba(255,255,255,.15), inset 0 -1px .5px #000', insetHover: 'inset 0 1px 1px rgba(255,255,255,.3), inset 0 -1px .5px #000',
    insetActive: 'inset 0 1.5px 3px rgba(0,0,0,.55), inset 0 -.5px .5px rgba(255,255,255,.1)', textShadow: '.5px .5px 1px rgba(0,0,0,.3), .3px .3px .4px rgba(0,0,0,.2)' },
} as const;

/** Layout: the 587px column between two guide lines, 16px gutters, the works grid up to 1408px + gutters. */
export const layout = {
  bar: '56px', column: '587px', gutter: '16px', panelTop: '61px', introGap: '70px', introGapSmall: 'clamp(36px, 8vh, 70px)',
  wide: '1440px', sectionTop: '120px', sectionTopSmall: '80px', footer: '77px',
  radius: { control: '999px', tile: '12px', field: '8px', panel: '16px' },
} as const;

/** The works grid: 4 columns 12px apart, rows 16px apart (2 columns, then 1, on narrow screens); cards 343:300 under a 36px caption. */
export const grid = {
  columns: 4, gapX: '12px', gapY: '16px', gapYNarrow: '32px', captionGap: '12px', caption: '36px', aspect: '343 / 300',
  /** the overlay: fine lines every 6.4px, major ones every 124.14px offset 25.28px, 0.32px wide (drawn as 0.5px) */
  fine: '6.4px', major: '124.14px', majorOffset: '25.28px', line: '.5px',
} as const;

/** The custom properties styles.css reads, one set per theme. */
export function themeCss() {
  const block = (t: 'light' | 'dark') => {
    const c = color[t];
    return [
      `--canvas:${c.canvas}`, `--ink:${c.ink}`, `--secondary:${c.secondary}`, `--muted:${c.muted}`, `--faint:${c.faint}`,
      `--guide:${c.guide}`, `--guide-edge:${c.guideEdge}`, `--hairline:${c.hairline}`, `--field:${c.field}`,
      `--tile:${c.tile}`, `--tile-border:${c.tileBorder}`, `--grid-rgb:${c.grid}`, `--grid-fine:${c.gridFine}`, `--grid-major:${c.gridMajor}`, `--grid-hover:${c.gridHover}`,
      `--plate:${c.tile}`, `--plate-tint:${c.plateTint}`, `--stroke:${TOKENS[t].stroke}`, `--hi:${TOKENS[t].hi}`,
      `--light-text:${c.light.text}`, `--light-ring:${c.light.ring}`, `--light-ring-hover:${c.light.ringHover}`, `--light-border:${c.light.border}`,
      `--light-bg:${c.light.background}`, `--light-inset:${c.light.inset}`, `--light-shadow:${c.light.shadow}`,
      `--backdrop:${c.backdrop}`, `--danger:${c.danger}`, `--focus:${c.focus}`,
    ].join(';');
  };
  const shared = [
    `--font:${type.family}`, `--mono:${type.mono}`,
    `--name-size:${type.name.size}`, `--name-line:${type.name.line}`, `--name-track:${type.name.tracking}`,
    `--body-size:${type.body.size}`, `--body-size-small:${type.body.sizeSmall}`, `--body-line:${type.body.line}`, `--body-gap:${type.body.gap}`, `--lead:${type.body.lead}`,
    `--nav-size:${type.nav.size}`, `--nav-line:${type.nav.line}`, `--nav-track:${type.nav.tracking}`, `--nav-text-shadow:${type.nav.shadow}`,
    `--button-size:${type.button.size}`, `--button-line:${type.button.line}`,
    `--card-title-size:${type.cardTitle.size}`, `--card-title-track:${type.cardTitle.tracking}`, `--card-sub-track:${type.cardSub.tracking}`, `--card-sub-opacity:${type.cardSub.opacity}`,
    `--card-label-size:${type.cardLabel.size}`, `--card-label-track:${type.cardLabel.tracking}`, `--card-label-opacity:${type.cardLabel.opacity}`, `--card-soon-opacity:${type.cardLabel.soonOpacity}`,
    `--section-size:${type.section.size}`, `--section-track:${type.section.tracking}`,
    `--nav-top:${nav.top}`, `--nav-h:${nav.height}`, `--nav-gap:${nav.gap}`, `--nav-icon:${nav.icon}`, `--nav-item-pad:${nav.itemPad}`, `--nav-item-h:${nav.itemHeight}`,
    `--nav-surface:${nav.surface}`, `--nav-rim:${nav.rim}`, `--nav-shadow:${nav.shadow}`, `--nav-inner:${nav.inner}`, `--nav-inner-hover:${nav.innerHover}`,
    `--nav-hover:${nav.hover}`, `--nav-active:${nav.active}`, `--nav-tab:${nav.tab}`, `--nav-tab-h:${nav.tabHeight}`,
    `--nav-indicator:${nav.indicator}`, `--nav-indicator-shadow:${nav.indicatorShadow}`, `--nav-item-hover:${nav.itemHover}`, `--nav-item-hover-shadow:${nav.itemHoverShadow}`, `--nav-slide:${nav.slide}`,
    `--pill-h:${pill.height}`, `--pill-pad:${pill.pad}`, `--pill-icon:${pill.icon}`, `--pill-gap:${pill.gap}`,
    `--dark-text:${pill.dark.text}`, `--dark-border:${pill.dark.border}`, `--dark-bg:${pill.dark.background}`, `--dark-ring:${pill.dark.ring}`,
    `--dark-inset:${pill.dark.inset}`, `--dark-inset-hover:${pill.dark.insetHover}`, `--dark-inset-active:${pill.dark.insetActive}`, `--dark-text-shadow:${pill.dark.textShadow}`,
    `--bar:${layout.bar}`, `--column:${layout.column}`, `--gutter:${layout.gutter}`, `--panel-top:${layout.panelTop}`, `--intro-gap:${layout.introGap}`, `--intro-gap-small:${layout.introGapSmall}`,
    `--wide:${layout.wide}`, `--section-top:${layout.sectionTop}`, `--section-top-small:${layout.sectionTopSmall}`, `--footer-h:${layout.footer}`,
    `--r-control:${layout.radius.control}`, `--r-tile:${layout.radius.tile}`, `--r-field:${layout.radius.field}`, `--r-panel:${layout.radius.panel}`,
    `--cols:${grid.columns}`, `--gap-x:${grid.gapX}`, `--gap-y:${grid.gapY}`, `--gap-y-narrow:${grid.gapYNarrow}`, `--caption-gap:${grid.captionGap}`, `--caption-h:${grid.caption}`, `--tile-aspect:${grid.aspect}`,
    `--grid-fine-step:${grid.fine}`, `--grid-major-step:${grid.major}`, `--grid-major-offset:${grid.majorOffset}`, `--grid-line:${grid.line}`,
  ].join(';');
  return `:root{${shared}}:root,:root[data-theme="dark"]{color-scheme:dark;${block('dark')}}:root[data-theme="light"]{color-scheme:light;${block('light')}}`;
}
