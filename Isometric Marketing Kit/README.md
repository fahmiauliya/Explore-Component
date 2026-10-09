# Isometric Marketing Kit

A website for the ten interactive line illustrations from [Line Illustration](../Line%20Illustration/README.md). Each one runs live in the gallery and on its own page, and each downloads as a React component or an MP4.

```sh
npm ci
npm run dev
```

Preview: http://localhost:5190/ · a detail page: http://localhost:5190/funnel

| # | Illustration | Topic | Page | Figure |
| --- | --- | --- | --- | --- |
| 01 | Funnel | Conversion | `/funnel` | `funnel` |
| 02 | Megaphone | Awareness | `/megaphone` | `megaphone` |
| 03 | Magnet | Lead generation | `/magnet` | `magnet` |
| 04 | Spotlight | Target audience | `/spotlight` | `target` |
| 05 | Connected glasses | ROI | `/connected-glasses` | `roi` |
| 06 | Pigeonhole cabinet | Email marketing | `/pigeonhole-cabinet` | `email` |
| 07 | Rotating tray | Segmentation | `/rotating-tray` | `segmentation` |
| 08 | Hot air balloon | Product launch | `/hot-air-balloon` | `launch` |
| 09 | Tick gauge | Analytics | `/tick-gauge` | `analytics` |
| 10 | Folded map | Customer journey | `/folded-map` | `journey` |

## Look

- **Type:** Geist for text and Geist Mono for labels, both from Google Fonts, in two weights only (400 and 500) and nothing above 16px.
  - **Mono labels:** 11px capitals spaced 0.08em.
- **Corners:** square everywhere.
- **Spacing:** on an 8px scale only (8, 16, 24, 32, 48, 64, 96).
- **Container:** at most 1440px wide, with side margins of 64px on desktop, 32px on tablet and 16px on phones.
- **Header:** the same on every page. It is 56px tall, with the name and "10 illustrations" on the left and the square Dark / Light toggle on the right.
- **Gallery:**
  - **Intro:** the title with the description under it, padded 96px above and 64px below.
  - **Grid:** a table of 4:5 cells sharing 1px hairlines, 5 × 2 from 1280px wide, 2 columns below that, 1 on phones.
  - **Cell labels:** inside 24px of padding, number and topic sit top left and the name bottom left. The status label fades in top right only while the cell is hovered or active, and "Open →" shows bottom right on hover.
  - **Rhythm:** 64px separate the grid from the footer, which only the gallery has.
- **Detail page:** a 48px nav row ("← All illustrations" on the left, "← Prev 02 / 10 Next →" on the right; the arrow keys step too), then one main area filling the rest of the window. On desktop the page never scrolls.
  - **Main area:** two columns share hairlines: the illustration box (two thirds, status top right) and a side column.
  - **Side column:** label, name, description, the two full-width download buttons and the theme note, with leftover space at the bottom.
  - **Below 900px:** the box turns square and stacks above the column.
- **Strokes:** 1px at every size; the kernel's strokes do not scale.

**Fitting every drawing to its safe area.** `box` in `src/figures.ts` is each figure's measured extent over every state: rest, each hover, and the motion between (the balloon at its highest, the gauge at full sweep, every travelled pin position). `Illustration.tsx` scales the 400 × 320 drawing so that extent fills the safe area and centres it, in container units so it holds at every size. In a gallery cell the safe area is 60% of the width, but never closer than 48px to an edge or to the labels. In the detail box it is 70% of the box's smaller side. The drawing and its pointer mapping move together, so hit areas stay exact.

**Light-mode fills.** The tint fills, the spotlight's cone and the glasses' liquid (the kernel's `dot off`), use a `--tint` token. In light mode it is `#EEEEEB`, close to the background and always lighter than any line. In dark mode it stays the dim stroke. The video and the `.jsx` download use it too.

## How it reuses the illustrations

`src/figures.ts` imports each figure file from `../Line Illustration/figures/<name>/<name>.js` as raw text and evaluates it unchanged, so drawing, motion and interaction are exactly those of the figures. `src/vendor/hairline-kernel.js` is an unchanged copy of the hairline kernel. The site mounts each figure the way the bench does: a `data-hairline` host, a 400 × 320 svg, and a read-out that feeds the status label. A change to a figure in Line Illustration shows up here on reload.

The kernel's single frame loop only runs figures that are on screen, and its springs land at once under `prefers-reduced-motion` (the tray's spin and the balloon's bob also stop). On touch, a tap holds its hover after the finger lifts, and a tap anywhere else returns to rest. In the detail view every hover target is a keyboard stop: Tab moves between them and focus acts as hover.

## Themes

Dark is the default. The toggle sets `data-theme` on the page and is remembered in local storage. All colours are tokens in `src/styles.css` (mirrored in `src/tokens.ts` for the downloads):

| Token | Dark | Light |
| --- | --- | --- |
| background | `#0A0B0D` | `#FAFAF9` |
| surface | `#0F1013` | `#FFFFFF` |
| border | `#1F2125` | `#E4E4E2` |
| dim stroke | `#3A3D42` | `#C9CAC7` |
| normal stroke | `#6B6F76` | `#8C8E8A` |
| highlight | `#F2F3F5` | `#111214` |
| text | `#E6E7E9` | `#17181A` |
| muted text | `#8A8E95` | `#6B6D6A` |

The illustrations take them through the kernel's `--hairline-*` properties: plate = background (so every solid part fills with the background and hidden lines stay hidden in both themes), lo = dim stroke, edge = normal stroke, hi = highlight, and mid, the kernel's in-between tone, halfway between dim and normal. Switching theme crossfades the site and the illustrations over about 200 ms, without restarting any animation.

## Downloads

**React component (.jsx).** `src/download/component.ts` writes one self-contained file per illustration, such as `FunnelIllustration.jsx`: a comment block with props and usage, the colour tokens for both themes, the kernel and the figure (both unchanged), and a component that mounts it. It depends only on React. Props: `theme` (`"dark"` or `"light"`, default `"dark"`), `intensity` (the figure's own number, defaulting to the middle of its range), `interactive` (default `true`) and `className`. The current state is mirrored on the wrapper as `data-status`.

**Video (.mp4).** `src/download/video.ts` renders a scripted demo loop of 1080 × 1080 at 60 fps in the current theme. The script is rest → each hover target in order → rest. It shows only the drawing on the plain background, with no frame, labels, controls or cursor. The drawing's extent over every state fills the middle 70% of the frame. The figure runs in a hidden same-origin iframe on a virtual clock: its `requestAnimationFrame` and `performance.now` advance exactly 1/60 s per frame, and its colour transitions are paused and stepped to the same clock. Every frame is exact, however fast the machine renders. Each frame's svg is drawn to a canvas with its computed colours and strokes scaled to the frame. It is encoded with WebCodecs as H.264, at constant quality where supported, and muxed into an MP4 with `mp4-muxer`. Browsers without WebCodecs fall back to `MediaRecorder` with an MP4 type, recorded in real time. If neither can produce MP4, the button reports it. The button shows `Rendering… n%` while it works.

Loops are 8 seconds (480 frames), except the balloon at 9 seconds, two periods of its bob, so its loop is seamless. The folded map ends with the pin back on "discover". The funnel's gears and the tray's spin turn continuously, so those two loops show a small jump in the gears' and the tray's angle at the seam.

## Checked

All ten in the gallery and the detail view, in both themes, with a hovered state. Both downloads were checked for every illustration:
- **Videos:** H.264 High, 1080 × 1080, 60 fps, 480 frames (540 for the balloon), decoded without errors, every hover state reached.
- **Components:** the ten `.jsx` files bundled into a plain React page and rendered in both themes.

Also checked:
- **Phone width:** 375 px has no horizontal scroll.
- **Touch:** a tap holds its state, and a tap outside resets it.
- **Reduced motion:** stops the tray.
