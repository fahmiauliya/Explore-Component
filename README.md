# Explore Component

Animated component studies built with code. This repository lives directly in the local `Code Explore` folder.

```text
Code Explore/
├── Liquid Transform Navigation/
└── Space Signal Scan/
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
- Latest exported video preview: http://localhost:5187/exports/preview-closeup.html

### Videos

All videos are H.264 MP4, **60 fps**, **eight-second seamless loops**, with 480 verified frames and no audio.

| Version | Resolution | File |
| --- | --- | --- |
| Latest radar close-up | 2082 × 1560 | [Download](Space%20Signal%20Scan/exports/space-signal-scan-closeup-2082x1560-60fps.mp4) |
| Original full card | 2082 × 1560 | [Download](Space%20Signal%20Scan/exports/space-signal-scan-2082x1560-60fps.mp4) |
| Vertical mobile | 1080 × 1920 | [Download](Space%20Signal%20Scan/exports/space-signal-scan-1080x1920-60fps.mp4) |

See the [component documentation](Space%20Signal%20Scan/README.md) for export commands and animation details. Exports use Google Chrome and Homebrew FFmpeg on macOS; the interactive preview runs through Vite.
