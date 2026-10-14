# Explore Component

Animated component studies built with code. This repository lives directly in the local `Code Explore` folder.

```text
Code Explore/
├── Isometric Marketing Carousel/
├── Isometric Marketing Kit/
├── Line Illustration/
├── Liquid Transform Navigation/
├── Space Signal Scan/
└── Training Capacity/
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

Compo, a website for code components; its first section, Illustrations, holds twenty line illustrations in two tabs, Marketing and Fintech (`/illustrations/marketing`, `/illustrations/fintech`). They run live in a gallery, grey at rest with only the hovered part highlighted, and each opens on its own page (`/illustrations/fintech/pneumatic-tube`), with no status labels. A Request modal in the header emails what visitors want drawn next through Resend. Each downloads as a self-contained React component (`.jsx`, React only), a 1080 × 1080, 60 fps MP4 demo loop, SVG states, a PNG, a GIF, or a transparent WebM or PNG sequence, all rendered in the browser. It deploys on Vercel from `github.com/fahmiauliya/Compo`. Dark and light themes share one set of colour tokens with the illustrations.

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
