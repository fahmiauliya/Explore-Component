# Space Signal Scan

Standalone visual preview, recreated from Figma node `426:20510` in Portfolio 2026.

```sh
npm install
npm run dev
```

Preview: http://localhost:5187/

The original 1041 × 780 composition scales proportionally. Text and surfaces use React/CSS, the heatmap uses individually editable SVG rectangles with exact Figma cell values, and icons/axes are the original downloaded SVG assets. Inter is bundled locally.

`src/SpaceSignalScan.tsx` separates the header, heatmap, selection, legend, metrics, and footer for future motion. The radar icon runs an automatic, seamless four-second clockwise sweep using the original SVG artwork. Rings and center stay fixed; reduced-motion preferences stop the sweep. Controls are presentation-only, with no navigation or data requests.

Material details are isolated in `src/SurfaceDetails.tsx`: the original cross tile, fractional gradient rims, and engraved divider strokes. Button lighting uses one effect layer per surface to avoid doubling the source shadows.

The background now twinkles at selected original cross positions. Each star has a seeded phase and a restrained brightness peak; the base pattern remains visible. The eight-second cycle aligns with two radar revolutions. Hidden tabs pause the background animation, and reduced motion keeps the original static pattern. Tune density, duration, and brightness in `SurfaceDetails.tsx`; tune the twinkle envelope in `styles.css`.

The heatmap simulates repeated measurements of a persistent signal. `AnimatedPixels.tsx` modulates connected 3 × 3 cell patches with correlated periodic variation: up to ±38% for noise, ±32% for blue signal cells, and ±15% near the white core (relative cell opacity, with highlights capped). Pixel coordinates, colors, axes, selection, and values stay fixed. Local fluctuations evolve over roughly 1.6–4 seconds so the activity is visible at the normal preview size. The complete eight-second cycle runs without React frame updates, pauses in hidden tabs, restores the exact source appearance for reduced motion, and cancels animations/listeners on unmount. This is illustrative motion, not live scientific data.

## Video export

- `exports/space-signal-scan-2082x1560-60fps.mp4`: H.264, 2082 × 1560, constant 60 fps, 8 seconds, no audio.
- `exports/preview.html`: looping video player and download link.
- `exports/poster.png`: full-resolution first frame.
- `exports/export-info.json`: verified dimensions, frame rate, decoded frame count, and loop-boundary result.

With the preview running on port 5187, run `node scripts/export-video.mjs`. The exporter uses an isolated Chrome process and Homebrew FFmpeg on macOS. Each of the 480 frames is rendered at its exact timestamp; the original SVG radar is inlined only in the temporary capture page to share the same export clock as the chart and stars. The final endpoint is verified against frame zero but is not duplicated in the MP4.

### Vertical mobile export

Run `node scripts/export-video.mjs --vertical` with the preview server running. This renders a 1080 × 1920 (9:16), constant 60 fps, eight-second H.264 MP4. The full card is centered with approximately 60 px side margins; the cross pattern and stars extend across the portrait canvas. These composition adjustments apply only to the capture page.

- `exports/space-signal-scan-1080x1920-60fps.mp4`
- `exports/preview-vertical.html`
- `exports/poster-vertical.png`
- `exports/export-info-vertical.json`

Use `--vertical --poster` to check framing without encoding the video.

## Radar close-up preview

Open `http://localhost:5187/?view=closeup` for the composition from Figma `446:737`. The original animated card is scaled to 2440 px wide and placed at (314, 141.6772) within the 1041 × 780 frame; right and bottom clipping is intentional. Radar, heatmap, and background keep the existing eight-second loop. The standard preview and existing exported files retain their original framing.

Export the latest close-up with `node scripts/export-video.mjs --closeup`. Output: `exports/space-signal-scan-closeup-2082x1560-60fps.mp4` (2082 × 1560, 60 fps, eight seconds). `exports/preview-closeup.html` plays the video; `poster-closeup.png` and `export-info-closeup.json` hold its first frame and verification results.

## Signal controls close-up

Open `http://localhost:5187/?view=detail` for Figma `391:42719`. This view crops the lower-right controls, including signal confidence and Inspect Signal, by positioning the shared card at (-842, -1142) with a 1626.7686 px width. The background retains the existing eight-second twinkle loop. Radar and heatmap retain their shared animation but are outside this crop; the metric remains fixed. Inspect Signal has an automatic presentation-only cursor and tactile button loop.

### Inspect Signal click loop

The detail view uses an eight-second shared timeline: rest → cursor entry → hover → press at 3.5 seconds → release → cursor exit → rest. The button rim stays anchored; the opaque inner face and label move together, with a shifting radial highlight and compressed shadows. The cursor stays fully opaque and resets beyond the right edge. No click ripple, navigation, or opacity transitions are applied to the button or cursor. Reduced motion restores the default state and keeps the cursor outside the frame; hidden tabs pause the three coordinated tracks.

Export the button click loop with `node scripts/export-video.mjs --detail` while Vite is running. This produces `exports/space-signal-scan-detail-2082x1560-60fps.mp4`: 2082 × 1560, 60 fps, eight seconds, 480 frames. The cursor, button face, shadows, and background share the exact export clock. See `exports/preview-detail.html` for looping playback and `exports/export-info-detail.json` for verification.
