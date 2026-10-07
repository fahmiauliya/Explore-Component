# Explore Component

Animated component studies built with code. This repository lives directly in the local `Code Explore` folder.

```text
Code Explore/
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

Preview: http://localhost:5188/

See the [component documentation](Training%20Capacity/README.md).


## Line Illustration

A study built on [`@lucasmarkes/hairline`](https://hairline.lucasmarkes.com): isometric line figures that respond to the pointer. Currently a gallery of all twenty-seven figures.

```sh
cd "Line Illustration"
npm ci
npm run dev
```

Preview: http://localhost:5189/

See the [component documentation](Line%20Illustration/README.md).
