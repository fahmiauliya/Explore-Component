/*
 * Every adjustable value of the carousel, in one place. The components read only from here, and from DialKit where
 * a value is wired to the panel or the timeline dock (the DialKit defaults below come from here too).
 *
 * All sizes are logical pixels of the 540 × 675 frame, unless a comment says otherwise.
 */

// ─── Frame ───────────────────────────────────────────────────────────────────────────────────────────────────────

export const FRAME = {
  /** The frame's logical width. */
  width: 540,
  /** The frame's logical height (4:5 with the width). */
  height: 675,
  /** The MP4 draws the frame at this many pixels per logical pixel: 2 → 1080 × 1350. */
  exportScale: 2,
  /** Frames per second, for the export and for scrubbing steps. */
  fps: 60,
};

// ─── Layout ──────────────────────────────────────────────────────────────────────────────────────────────────────

export const LAYOUT = {
  /** The container line's inset from the frame edges. DialKit: Layout › containerInset. */
  containerInset: 24,
  /** The space inside the container line. DialKit: Layout › innerPadding. */
  innerPadding: 32,
  /** The space between the container line's top and the illustration area: less than innerPadding, so the area
   *  starts higher and is taller. The other three sides use innerPadding. */
  topPadding: 16,
  /** The gap between the illustration and the text group, and between the text group and the button. DialKit: Layout › blockGap. */
  blockGap: 24,
  /** The gap between the eyebrow and the headline. DialKit: Layout › eyebrowGap. */
  eyebrowGap: 8,
  /** The gap between the headline and the subheadline. DialKit: Layout › subGap. */
  subGap: 4,
  /** Extra left padding on the eyebrow only, so it sits this much right of the headline, subheadline and button. */
  eyebrowPadding: 2,
};

export const ILLUSTRATION = {
  /** The illustration area's height as a fraction of the inner width (1 = square). It is capped so everything fits. */
  ratio: 1,
  /** The drawing's extent over every state fills this fraction of the area (0.9: 20% larger than 0.75). DialKit:
   *  Layout › illustrationScale. */
  scale: 0.9,
  /** Each card's drawing size on top of `scale`: `all` for every card, then any card by its number. */
  cardScale: { all: 0.8, '08': 1 } as Record<string, number>,
  /** The least space kept between the lowest button (the card with the most lines) and the nav row; the area's height
   *  comes out of the space above the nav row down to this. */
  navClearance: 16,
  /** The area never gets shorter than this, whatever the dials. */
  minHeight: 40,
  /** The illustration's stroke width: a 1px line like every other. */
  stroke: 1,
};

export const BUTTON = {
  /** The label of the static link under the text. */
  label: 'See details →',
  /** Draw an outline around it (false: a plain text link). */
  outline: false,
  /** Horizontal padding, inside the outline when there is one. */
  paddingX: 0,
  /** Vertical padding (0 with the 20px line height: the link is 20px tall). */
  paddingY: 0,
};

export const NAV = {
  /** The previous and next chevron buttons: squares of this size. */
  button: 40,
  /** The gap between each chevron button and the progress bar. */
  gap: 24,
  /** The gap between the progress bar's ten segments. */
  segmentGap: 6,
  /** The progress bar's line thickness. */
  segmentHeight: 1,
  /** The chevron icon: three points around the button's centre, pointing right (mirrored for the previous button). */
  chevron: [[-2.5, -5.5], [3, 0], [-2.5, 5.5]] as [number, number][],
};

/** Every outline in the frame: the container, the button and the chevron buttons. */
export const LINE_WIDTH = 1;

// ─── Typography ──────────────────────────────────────────────────────────────────────────────────────────────────

export const FONTS = {
  /** The eyebrow's family. */
  mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  /** The headline's, subheadline's and button's family. */
  sans: '"Geist", ui-sans-serif, system-ui, sans-serif',
};

/** Each style: size (DialKit: Typography › …Size), weight, line height and letter-spacing in em. When a size is
 *  tuned in DialKit, its line height keeps the same leading (line height − size). */
export const TYPE = {
  /** "06 · EMAIL MARKETING": Geist Mono, uppercase, muted. Tracking: DialKit Typography › eyebrowTracking. */
  eyebrow: { size: 12, weight: 400, lineHeight: 16, tracking: 0.07, uppercase: true },
  /** The headline, in the text colour. */
  headline: { size: 14, weight: 500, lineHeight: 20, tracking: 0 },
  /** The subheadline, muted, the same size as the headline. Lines are balanced when it wraps. */
  sub: { size: 14, weight: 400, lineHeight: 20, tracking: 0 },
  /** "See details →", sentence case. */
  button: { size: 14, weight: 500, lineHeight: 20, tracking: 0 },
};

// ─── Colours ─────────────────────────────────────────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light';

/** bg: background · line: outlines · dim: dim stroke (upcoming segments, a disabled chevron, the drawings' far
 *  lines) · mid: the drawings' middle tone · stroke: the drawings' edges · hi: highlight (done segments, hover fill,
 *  the pointer, active strokes) · text: headline and button · muted: eyebrow and subheadline · tint: the drawings'
 *  soft fill · room: the page around the frame. */
export const THEMES = {
  dark: { bg: '#0A0B0D', line: '#1F2125', dim: '#3A3D42', mid: '#52565C', stroke: '#6B6F76', hi: '#F2F3F5', text: '#E6E7E9', muted: '#8A8E95', tint: '#3A3D42', room: '#050607' },
  light: { bg: '#FAFAF9', line: '#E4E4E2', dim: '#C9CAC7', mid: '#ABACA8', stroke: '#8C8E8A', hi: '#111214', text: '#17181A', muted: '#6B6D6A', tint: '#EEEEEB', room: '#EFEFED' },
};

/** The theme the preview starts in. DialKit: Playback › theme. */
export const DEFAULT_THEME: Theme = 'dark';

// ─── Card content ────────────────────────────────────────────────────────────────────────────────────────────────

/** The ten cards in order: eyebrow (shown uppercase), headline and subheadline. The illustrations are matched by order. */
export const CONTENT = [
  { eyebrow: '01 · Conversion', headline: 'Turn visitors into customers', sub: 'Every stage narrows the crowd. Focus where the drop-off hurts most.' },
  { eyebrow: '02 · Awareness', headline: 'Get heard further', sub: 'Each wave of content carries your message to a wider audience.' },
  { eyebrow: '03 · Lead generation', headline: 'Pull the right leads in', sub: 'Attract interest one by one and line it up for your sales team.' },
  { eyebrow: '04 · Target audience', headline: 'Shine on the right people', sub: 'Pick one segment and give it your full attention.' },
  { eyebrow: '05 · ROI', headline: 'Put budget where it returns', sub: 'One budget, many channels. Feed the one that grows.' },
  { eyebrow: '06 · Email marketing', headline: 'A message for every inbox', sub: 'Segmented, personal emails that land in the right slot.' },
  { eyebrow: '07 · Segmentation', headline: 'Group your audience by type', sub: 'Different people, different needs. Sort them before you speak.' },
  { eyebrow: '08 · Product launch', headline: 'Drop the weight, rise higher', sub: 'Launch in stages. Let go of what holds you back and climb.' },
  { eyebrow: '09 · Analytics', headline: 'Measure what moves', sub: 'Track each channel and see exactly where performance lands.' },
  { eyebrow: '10 · Customer journey', headline: 'Map the whole journey', sub: 'From discovery to return, know where every customer is.' },
];

// ─── Timing ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** One card's cycle, in seconds. These are the timeline dock's defaults; edits made in the dock are saved there. */
export const TIMING = {
  /** The content block slides in and fades up. */
  cardIn: { at: 0, duration: 0.6 },
  /** The demo: the pointer visits each hover target of the illustration. */
  demo: { at: 0.6, duration: 2.8 },
  /** The pointer leaves the drawing for the next button; the drawing settles back to rest. */
  pointerToNext: { at: 3.4, duration: 0.5 },
  /** The next button's hover fill fades in. */
  nextHover: { at: 3.6, duration: 0.3 },
  /** The press: down to pressScale over `down`, back over `up`. The nav row reports the next card from here. */
  nextPress: { at: 3.9, down: 0.1, up: 0.1 },
  /** The content block slides out and fades away; the timeline wraps to the next card at its end. */
  cardOut: { at: 3.9, duration: 0.35 },
  /** The demo's script, as fractions of its length: the first target is set off for at `lead`, the targets share
   *  `span`, and each hover lands `arrive` × the glide's length after setting off, at most `dwellCap` of the time to
   *  the next target (or to `settleTail` of the demo, after the last). */
  demoScript: { lead: 0.06, span: 0.8, arrive: 0.6, dwellCap: 0.8, settleTail: 0.9 },
  /** How long the next button keeps its hover after the pointer leaves it at the start of a demo. */
  hoverRelease: 0.15,
};

// ─── Motion ──────────────────────────────────────────────────────────────────────────────────────────────────────

export const MOTION = {
  /** How far the content block slides in and out. DialKit: Motion › slideDistance. */
  slideDistance: 24,
  /** The card clips' curve (in the timeline, the clip's duration sets its length). DialKit: Motion › cardSpring. */
  cardSpring: { type: 'spring' as const, visualDuration: 0.5, bounce: 0 },
  /** The pointer's glides. DialKit: Motion › pointerSpring. */
  pointerSpring: { type: 'spring' as const, visualDuration: 0.45, bounce: 0.05 },
  /** The next button's scale at the bottom of the press. DialKit: Motion › pressScale. */
  pressScale: 0.94,
  /** The press legs' curve. */
  pressSpring: { type: 'spring' as const, bounce: 0 },
  /** The hover fill's easing (cubic Bézier). */
  hoverEase: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

// ─── Pointer ─────────────────────────────────────────────────────────────────────────────────────────────────────

export const POINTER = {
  /** Shown in the preview and the export. DialKit: Pointer › visible. */
  visible: true,
  /** The arrow's height. DialKit: Pointer › size. */
  size: 15,
  /** The arrow's outline, drawn in the background colour so it reads on any line. */
  outline: 0.75,
  /** The arrow's shape, in units of a 30-tall arrow with its tip at 0, 0. */
  shape: [[0, 0], [0, 26], [6.5, 20], [11, 30], [15, 28.2], [10.6, 18.6], [18.6, 18.6]] as [number, number][],
  /** Where its tip rests on the next button, as fractions of the button: below and right of the chevron. */
  onButton: [0.62, 0.6] as [number, number],
  /** How much more it shrinks than the button during the press (2 → 0.94 makes it 0.88). */
  pressShrink: 2,
};

// ─── Page (around the frame, never in it) ────────────────────────────────────────────────────────────────────────

export const PAGE = {
  /** The margin between the frame and the window edges, the panel and the dock. */
  margin: 16,
  /** The extra gap kept from the panel and the dock. */
  clearance: 12,
  /** The height taken by the shortcut note under the frame, with its gap. */
  note: 31,
  /** While scrubbing, the illustrations follow at most this many seconds per frame of scrub. */
  scrubCap: 0.5,
  /** How often the export note updates, in frames. */
  progressEvery: 12,
};

// ─── DialKit ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Slider ranges in the DialKit panel, as [min, max] or [min, max, step]; the defaults come from the sections above. */
export const RANGES = {
  containerInset: [0, 48], innerPadding: [0, 64], blockGap: [8, 48], eyebrowGap: [0, 24], subGap: [0, 24], illustrationScale: [0.4, 1, 0.01],
  eyebrowSize: [10, 16], eyebrowTracking: [0, 0.2, 0.01], headlineSize: [12, 20], subSize: [12, 20], buttonSize: [12, 20],
  slideDistance: [0, 80], pressScale: [0.8, 1, 0.01], pointerSize: [8, 28],
} as const;

/* Saved settings (settings.json, written by the save button) load before the values in this file: they are the
 * DialKit defaults, and Reset All returns to them. Values DialKit keeps in the browser win over both. */
export const STORAGE = {
  /** Where the panel keeps its values in the browser. Change it when a default above changes, and list the old id in
   *  previousPanelIds and the changed paths in changedDefaults: the other values carry over, those take the new default. */
  panelId: 'carousel-540-v4',
  /** Earlier panel ids, newest first, whose browser values carry over to panelId. */
  previousPanelIds: ['carousel-540-v3'],
  /** Panel paths whose defaults changed with this id: they are not carried over. */
  changedDefaults: ['Layout.illustrationScale'],
  /** Where the timeline dock saves its clips. */
  timelineId: 'card-timeline',
};
