# Training Capacity

Standalone visual study of Figma node `429:1709`, Portfolio 2026.

```sh
npm ci
npm run dev
```

Preview: http://localhost:5188/

The 1041 × 780 artboard scales proportionally. The card, typography, breakdown rows, and glass shell use React/CSS; the gauge uses the original layered Figma SVG and high-resolution PNG assets. All assets and the Inter font are local.

The outer shell refracts the live video directly through a rounded SVG displacement lens. Its 52 px bevel smoothly bends adjacent video pixels, with the strongest displacement near the edge. This layer is painted before the neutral 10% tint and thin border so those decorations are never sampled as background. There are no painted rainbow highlights, contrast amplification, or separate color-channel offsets. The lens map is generated once; the video remains a single player. SVG backdrop displacement is intended for the Chrome preview; other browsers may show only the neutral glass fallback. The inner gauge panel stays opaque.

The This Week pill is presentation-only.

## Breakdown bars

Each fill is the category's true share of the week's 4,280 load, measured on the 230.5 px track: Strength 1,820 (42.5%), Cardio 1,240 (29.0%), Mobility 720 (16.8%), Other 500 (11.7%). The source design drew all four at 152 px, which made 43% and 11% look identical. Labels keep the design's rounded percentages, which sum to 100%. Fills carry a soft top highlight and a tinted contact shadow in their own colour.

## Capacity loop

`src/CapacityMotion.ts` runs one eight-second timeline:

- 0.45–2.45 s: the gauge sweeps from the left foot to Figma's 71% marker (124.74°). The white marker and its shadow ride the leading edge; untouched capacity reads as grey track. Figma split the grey band and the inactive reflection at 71%, so both show a cut whenever the gauge is partly filled. `capacity-track.svg` joins Figma's two band curves into one seamless path, and the reflection is limited to the filled area, where the fill always covers it. The percentage and load count up with the arc.
- 0.95–2.74 s: bars grow in order, 0.13 s apart, each counting its load and share.
- 6.0–7.3 s: bars, then the gauge, drain back to empty and rest until the seam.

Motion uses Web Animations on registered custom properties (`--sweep`, `--fill`), started on one shared clock. Displayed numbers are read back from those properties each frame, so a paused or exact-time frame always shows matching values. The original Figma mask still defines the arc's edge at rest. Frame 0 and 8 s are pixel-identical. Hidden tabs pause the timeline. Reduced motion shows the finished card with no animation.


## Video background

Uses the supplied `12820845_1080_1920_30fps.mp4` as a local background: 1080 × 1920, 30 fps, 20 seconds. Autoplays muted, loops, and plays inline on mobile. The portrait video is centered and cropped to fill the original landscape artboard. A still from the video is displayed while it loads; the gauge remains static.

## Video export

- `exports/training-capacity-2082x1560-60fps.mp4`: H.264, 2082 × 1560, constant 60 fps, 40 seconds, no audio.
- `exports/preview.html`: looping video player and download link.
- `exports/poster.png`: full-resolution first frame.
- `exports/export-info.json`: verified dimensions, frame rate, decoded frame count, and loop-boundary result.

With the preview running on port 5188, run `node scripts/export-video.mjs`. The exporter uses an isolated Chrome process and Homebrew FFmpeg on macOS. Each of the 2,400 frames is rendered at its exact timestamp. The card loops every 8 seconds and the background video every 20, so the export runs 40 seconds: five card loops and two video loops, seamless for both. The background video is paused in the capture page and stepped to the matching source frame (30 fps, so each one holds for two output frames). The final endpoint is verified against frame zero but is not duplicated in the MP4. Use `--poster` to check the first frame and the seam without encoding.

