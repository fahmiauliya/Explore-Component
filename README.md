# Explore Component

Animated component studies built with code. This repository lives directly in the local `Code Explore` folder.

```text
Code Explore/
├── Dot Illustration/
├── Floral Dashboard/
├── Isometric Marketing Carousel/
├── Isometric Marketing Kit/
├── Line Illustration/
├── Liquid Transform Navigation/
├── Space Signal Scan/
├── Training Capacity/
└── rooted/
```

Each component keeps its own source, dependencies, previews, and exports.

## Liquid Transform Navigation

A looping navigation transformation with normal and slow-motion versions.

```sh
cd "Liquid Transform Navigation"
npm ci
npm run dev
```

Preview: http://localhost:5186/

Final videos and comparison player: [exports/final](Liquid%20Transform%20Navigation/exports/final/). See the [component documentation](Liquid%20Transform%20Navigation/README.md).


## Space Signal Scan

A React, TypeScript, and SVG presentation with an animated radar icon, twinkling cross background, and signal heatmap. Includes the original composition, a vertical mobile video, and the latest enlarged radar close-up.

### Run locally

```sh
cd "Space Signal Scan"
npm ci
npm run dev
```

- Original animated preview: http://localhost:5187/
- Radar close-up: http://localhost:5187/?view=closeup
- Signal controls close-up: http://localhost:5187/?view=detail
- Button loop video preview: http://localhost:5187/exports/preview-detail.html
- Radar video preview: http://localhost:5187/exports/preview-closeup.html

### Videos

All videos are H.264 MP4, **60 fps**, **eight-second seamless loops**, with 480 verified frames and no audio.

| Version | Resolution | File |
| --- | --- | --- |
| Inspect Signal button loop | 2082 × 1560 | [Download](Space%20Signal%20Scan/exports/space-signal-scan-detail-2082x1560-60fps.mp4) |
| Radar close-up | 2082 × 1560 | [Download](Space%20Signal%20Scan/exports/space-signal-scan-closeup-2082x1560-60fps.mp4) |
| Original full card | 2082 × 1560 | [Download](Space%20Signal%20Scan/exports/space-signal-scan-2082x1560-60fps.mp4) |
| Vertical mobile | 1080 × 1920 | [Download](Space%20Signal%20Scan/exports/space-signal-scan-1080x1920-60fps.mp4) |

See the [component documentation](Space%20Signal%20Scan/README.md) for export commands and animation details. Exports use Google Chrome and Homebrew FFmpeg on macOS; the interactive preview runs through Vite.


## Training Capacity

A Figma-matched presentation of the training card, with a translucent glass shell, layered capacity gauge, and workout breakdown. An eight-second loop sweeps the gauge to 71%, counts up the load, and grows each bar to its true share of the week. Scales the original 1041 × 780 composition to fit the viewport.

```sh
cd "Training Capacity"
npm ci
npm run dev
```

- Preview: http://localhost:5188/
- Video preview: http://localhost:5188/exports/preview.html

### Video

H.264 MP4, **60 fps**, a **40-second seamless loop** (five card loops over two loops of the background video), with 2,400 verified frames and no audio.

| Version | Resolution | File |
| --- | --- | --- |
| Full card | 2082 × 1560 | [Download](Training%20Capacity/exports/training-capacity-2082x1560-60fps.mp4) |

See the [component documentation](Training%20Capacity/README.md) for the export command and animation details.


## Line Illustration

A study built on [`@lucasmarkes/hairline`](https://hairline.lucasmarkes.com): isometric line figures that respond to the pointer. Ten Marketing figures live in `figures/` and ten Fintech figures in `fintech/`, one folder each.

```sh
cd "Line Illustration"
npm ci
npm run dev
```

Preview: http://localhost:5189/

See the [component documentation](Line%20Illustration/README.md).


## Isometric Marketing Kit

Compo, a website for code components; its first section, Illustrations, holds twenty line illustrations in two tabs, Marketing and Fintech (`/illustrations/marketing`, `/illustrations/fintech`). They run live in a gallery, grey at rest with only the hovered part highlighted, and each opens on its own page (`/illustrations/fintech/edc-payment`), with no status labels. A Request modal in the header emails what visitors want drawn next through Resend. Each downloads as a self-contained React component (`.jsx`, React only), a 1080 × 1080, 60 fps MP4 demo loop, SVG states, a PNG, a GIF, or a transparent WebM or PNG sequence, all rendered in the browser. It deploys on Vercel from `github.com/fahmiauliya/Compo`. Dark and light themes share one set of colour tokens with the illustrations.

```sh
cd "Isometric Marketing Kit"
npm ci
npm run dev
```

Preview: http://localhost:5190/illustrations

See the [component documentation](Isometric%20Marketing%20Kit/README.md).


## Isometric Marketing Carousel

A looping 4:5 social media carousel of the ten line illustrations, one card at a time, each playing its demo, with an eyebrow, headline, subheadline and "See details" button per card. It is designed at 540 × 675, previewed at actual size and exported at 2× (1080 × 1350). A DialKit panel tunes layout, type and motion, and a DialKit timeline dock times one card's cycle clip by clip. Both stay out of the frame. It can export a seamless 60 fps MP4 at the timeline's exact timing, rendered frame by frame in the browser. Separate from the website.

```sh
cd "Isometric Marketing Carousel"
npm ci
npm run dev
```

Preview: http://localhost:5191/

The current renders (dark and light, 1080 × 1350, 60 fps, 42.5 s) are in `Isometric Marketing Carousel/exports/`.

See the [component documentation](Isometric%20Marketing%20Carousel/README.md).


## Floral Dashboard

A Figma-matched rebuild of the Portfolio 2026 flower (`486:1018`): eight glass petals with a white outer glow, four faint overlapping rings, and a centre flare over a flower photograph, monochrome (`488:25191`) or rose-tinted (`486:2906`, `?bg=rose`). It is built entirely in code, with no images or SVG: each Figma layer is an HTML element with CSS outlines, gradients and blurs at Figma's exact values. The loop folds the petals in 3D into a cupped bud with light leaking through, lets the light build, unfolds them quickly one after another in a clockwise spiral while the glow spills behind them and the background circles ripple out, holds open for twelve seconds with a gentle petal sway while the light stays steady, then breathes the light in and folds inner-first. A second view, `?view=dashboard`, is the app window from the same Figma page (`483:23065`), the top-left corner of a 2× dashboard with the flower as its rail icon, built to Figma's values with the icons as code; an 11.2-second loop zooms the camera in until the window is Figma `489:2919`, holds and eases back out, while the flower icon, in an icon style calibrated against Figma, shows the agent's status: swaying, breathing and turning on the Agent Icon timeline's swing tracks while working, easing still when complete while its always-visible green dot (`486:1845`) pulses once. The Agent Icon timeline dock is the view's one clock; an Agent panel holds the status, icon, dot and pulse dials. Nothing animates opacity. A DialKit timeline dock is the loop's clock, one clip per phase, and a DialKit panel tunes the rest; both show in development only, and Save to file keeps the tuning in `src/bloom/bloom.tuning.json`. Scales the original 1041 × 780 composition to fit the viewport.

```sh
cd "Floral Dashboard"
npm ci
npm run dev
```

- Preview: http://localhost:5192/ (monochrome ground), http://localhost:5192/?bg=rose (rose ground)
- Dashboard view: http://localhost:5192/?view=dashboard
- Video previews: http://localhost:5192/exports/preview.html, http://localhost:5192/exports/preview-rose.html, http://localhost:5192/exports/preview-dashboard.html

### Video

H.264 MP4, **60 fps**, one seamless loop of the saved tuning (**15.3 seconds**, 918 verified frames; the dashboard view's Agent Icon loop is **11.2 seconds**, 672 frames), no audio.

| Version | Resolution | File |
| --- | --- | --- |
| Monochrome ground | 2082 × 1560 | [Download](Floral%20Dashboard/exports/floral-dashboard-2082x1560-60fps.mp4) |
| Rose ground | 2082 × 1560 | [Download](Floral%20Dashboard/exports/floral-dashboard-rose-2082x1560-60fps.mp4) |
| Dashboard view | 2082 × 1560 | [Download](Floral%20Dashboard/exports/floral-dashboard-dashboard-2082x1560-60fps.mp4) |

See the [component documentation](Floral%20Dashboard/README.md) for the export command and animation details.


## Dot Illustration

Animals in motion as a dot matrix, on a 6:4 frame. A low-poly swift, a butterfly and a manta ray of our own, built from primitives in three.js, and the three.js horse (a morph-target gallop) and the Khronos fox (a skinned run) models, all lit from the top right, are rendered 24 times a second into a small hidden target (4 × 4 pixels per cell), read back and averaged into one value per cell that combines coverage and shading; thresholds make each cell empty, a light-blue dot, a bright-blue dot or navy, and the navy cells are drawn as thin vertical pills that merge down a column. The bird flaps with its outer wing trailing the inner, glides with its wings held wide and banks, on a looping "Dot Bird" DialKit timeline with one clip per phase. The main view loops bird → butterfly → manta → horse → fox, about four seconds each: the manta's fins carry a slow travelling wave while its thin tail trails as a line of navy pills, the horse gallops, the fox runs, the butterfly folds its wings almost shut and spreads them wide as it floats; between every pair a dot dissolve switches dots off and on in blotchy clumps, the flat fills first and the outline and navy details last, down to a few scattered dots, on a "Dot Sequence" timeline with a clip per animal and dissolveOut / dissolveIn clips between them, each animal switchable in or out of the loop. The dots hold still between updates, so it is all stop-motion, and nothing fades. The "Dot Bird" panel tunes the dot density (columns 24–120 with Chunky, Default, Fine and Ultra presets; everything scales with the cell) and dot size, the tone thresholds and light, the colours and the bird's motion; the "Dot Sequence" panel the manta, the transition, and Pause, Step one frame, Skip to next subject and Save to file. A tab switch above the frame shows either version as Current, the flat colours on the grey ground, or as Sky: the same animation and clock drawn as shimmering white squares with a few red and green sparkles over a sky (drawn in code, or an image or video from `public/`), inside a tracking grid of four thin white lines that ease after the subject's bounds, with small square markers where they cross, the animal's name standing up the top-left corner and live tracking data (position, size, coordinates, frame, sequence, time) in the bottom-right; a "Sky" panel tunes the background, the dots, the shimmer, the grid, the text, the markers and two optional extras, a caption and stars; a "Tracking" panel adds an object-tracking overlay, pins locked to the dots at the animal's tracked points with lime coordinate labels, stepping with the dots. Both tabs share the tracking grid, markers, texts and pins, solid navy on Current and white on Sky, with every animal at 70% of its framing. Off screen or in a hidden tab it pauses; under reduced motion it shows the bird in one still pose.

```sh
cd "Dot Illustration"
npm ci
npm run dev
```

Preview: http://localhost:5193/ (bird ↔ manta) · http://localhost:5193/?view=bird (the bird alone)

See the [component documentation](Dot%20Illustration/README.md).


## Rooted

A free website that lists design references as a full-width grid of screenshot cards in four tabs (Bookmarks with nested folders, Components, Open Source, Visuals), under a centered 600px header, intro and segmented tab switch, with search (⌘K), a random pick (⌘E) and a request form. React + Vite, plain JavaScript and one CSS file; Geist at 400 and 500 only; all content in one data file. Screenshots for the cards are captured by `npm run previews` (headless Chromium via Playwright, resized to 640 × 400 WebP) and committed in `public/previews/`.

```sh
cd rooted
npm ci
npm run dev
```

Preview: http://localhost:5194/

See the [site documentation](rooted/README.md).
