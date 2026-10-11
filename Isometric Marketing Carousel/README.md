# Isometric Marketing Carousel

A looping social media carousel of the ten interactive line illustrations: one card at a time, each playing its own demo. It is a standalone project, separate from the Isometric Marketing Kit website.

```sh
npm ci
npm run dev
```

Preview: http://localhost:5191/

The page shows only the frame (4:5) at actual size, 540 × 675, wherever the window leaves room beside two DialKit surfaces:
- the **panel** (top right) holds every layout, type and motion setting;
- the **timeline dock** (bottom) holds one card's cycle, one clip per row.

Where the room is smaller, the frame scales down, and it never scales up. The canvas draws at the screen's pixel density, so lines stay crisp. Neither DialKit surface appears in the frame or the MP4. Every setting persists in `localStorage`, and the save button writes both to `settings.json` (see [Saved settings](#saved-settings)).

Keyboard: Space plays or pauses. ← and → jump to the previous or next card, landing as it settles in. Both are ignored while a control has focus.

## Scale

The card is laid out in logical pixels at 540 × 675. The export draws it at 2× (1080 × 1350), so a 1px line is 2 pixels of the video. Illustration strokes are 1px as well, redrawn from vector snapshots at full resolution.

## Frame

All sizes below are logical pixels at the default settings. The only lines are:
- the container: a 1px rectangle inset 24px;
- the outlines of the two chevron buttons.

There are no dividers, counters, brand or status labels, and corners are square. Inside the container's 32px padding (16px at the top), top to bottom:

1. **The illustration.** It sits in an area the full inner width, centred, with no border. The area aims for 1:1. The space a square needs isn't there, so the area is as tall as fits: 428 × 367. It starts 16px below the container line (`topPadding`; the other sides keep the 32px padding).
   - Its height comes out of the space above the nav row, never the gaps. The card with the most lines (01) still clears the nav row by 16px.
   - The drawing's extent over every state fills `illustrationScale` (0.9) of the area. Each card then has its own size on top (`ILLUSTRATION.cardScale`): 0.8 for every card except 08 Product launch, which stays at 1.
   - Measured over every card's demo in both themes, each drawing stays at least 17px inside the area, 33px from the container line, 42px clear of the text, and further from the container line and the nav row.
2. 24px, then the **eyebrow**: the number and topic ("06 · EMAIL MARKETING"), with 2px of left padding so it sits 2px right of the headline, subheadline and button.
3. 8px, then the **headline**.
4. 4px, then the **subheadline**. Lines are balanced when it wraps, so no word sits alone (card 01 splits after "crowd.").
5. 24px, then **"See details →"**: a plain text link, no outline or padding, 20px tall. It is static.
6. The leftover space, then the **nav row**, pinned to the bottom padding:
   - the previous button, 24px, the progress bar, 24px, the next button;
   - both buttons are 40 × 40 squares with a 1px outline and a 1px chevron;
   - the bar is ten equal 1px segments, 6px apart. Done segments are highlight, upcoming ones dim stroke, and the current one fills through its demo.

   The previous button is disabled (dim chevron) on card 01 and turns active the moment the press on card 01 lands.

The frame uses only four type styles, set in pixels on the canvas:

| Style | Font | Size / line height | Weight | Colour | Notes |
| --- | --- | --- | --- | --- | --- |
| Eyebrow | Geist Mono | 12 / 16px | Regular | Muted | Uppercase, 0.07em (0.84px) tracking |
| Headline | Geist | 14 / 20px | Medium | Text | |
| Subheadline | Geist | 14 / 20px | Regular | Muted | |
| Button | Geist | 14 / 20px | Medium | Text | Sentence case, no tracking |

## DialKit panel

| Folder | Controls |
| --- | --- |
| Layout | containerInset 24 (0–48), innerPadding 32 (0–64), blockGap 24 (8–48), eyebrowGap 8 (0–24), subGap 4 (0–24), illustrationScale 0.9 (0.4–1) |
| Typography | eyebrowSize 12 (10–16), eyebrowTracking 0.07em (0–0.2), headlineSize 14 (12–20), subSize 14 (12–20), buttonSize 14 (12–20) |
| Motion | cardSpring (spring, 0.5 s, bounce 0), slideDistance 24 (0–80), pointerSpring (spring, 0.45 s, bounce 0.05), pressScale 0.94 (0.8–1) |
| Pointer | visible on, size 15 (8–28) |
| Playback | theme dark / light, card 01–10, loop on, Export MP4, Reset All |

The Motion folder writes into the timeline's clips:
- **slideDistance** sets `cardIn.from.x` and `−cardOut.to.x`.
- **cardSpring** sets the curve of both card clips. DialKit times a spring by its clip's duration, so only its bounce shapes those clips.
- **pointerSpring** sets the curve of `pointerToNext`. It is also used in full, through Motion's `spring`, for the pointer's glides between demo targets.
- **pressScale** sets the low point of `nextPress`.

Edits made directly in the dock are kept until the matching panel value changes. **Reset All** resets both the panel and the timeline.

## Timeline: "Card"

One card's cycle, 4.25 s at the defaults. Each phase is its own clip, so they stack as separate rows in the dock:

| Clip | At | Length | What it drives |
| --- | --- | --- | --- |
| cardIn | 0 | 0.6 s | The content block, from x = slideDistance and opacity 0 to x = 0 and opacity 1, on cardSpring |
| demo | 0.6 s | 2.8 s | A marker clip. Through its span the pointer visits each hover target, gliding on pointerSpring, and the illustration answers with its own motion |
| pointerToNext | 3.4 s | 0.5 s | The pointer leaves the drawing for the next button. The illustration gets its pointer-leave here and settles back to rest |
| nextHover | 3.6 s | 0.3 s | The next button's hover: highlight fill, chevron in the background colour |
| nextPress | 3.9 s | 0.1 + 0.1 s | The press: the button scales to pressScale and back, and the pointer shrinks with it. From here the nav row reports the next card |
| cardOut | 3.9 s | 0.35 s | The content block, from x = 0 and opacity 1 to x = −slideDistance and opacity 0 |

The timeline loops. Each wrap brings on the next card, from card 10 back to 01. With loop off it plays through to card 10 and stops there.

The frame is drawn from every clip's `current` and `progress` at the playhead, so edits in the dock show at once. The dock's transport runs the carousel: scrubbing moves the current card, and its illustration follows the scrubbed time. Idle motion (the tray's spin, the balloon's bob, the gears) runs on real time while playing.

## Saved settings

The clipboard button in the panel header and in the dock header saves both the panel's and the timeline's values to `settings.json`, at the project root. It does this instead of DialKit's copy, and the page doesn't reload. The note under the frame confirms the save with its time.

Saved settings sit between the browser and `config.ts`:
- Values DialKit keeps in the browser win, as before.
- Saved settings come next: they are the DialKit defaults, so they load in a fresh or cleared browser, and **Reset All** returns to them.
- `config.ts`'s values apply where nothing is saved.

The card on screen isn't saved. Saving needs the dev server (`npm run dev`); a production build reads `settings.json` as it was at build time.

## Config

Every adjustable value lives in `src/config.ts`, with a comment on each. The components read only from it, and from DialKit where a value is wired to the panel or the dock. The DialKit defaults and ranges come from it too. It holds:

- **Frame:** size, export scale and fps.
- **Layout:** container inset, inner padding, the top padding above the illustration, the gaps, and the eyebrow's left padding.
- **Illustration:** the area's ratio, the illustration scale, the nav clearance, and the stroke width.
- **Link and nav:** the link's label, and its optional outline and padding; the chevron buttons, gaps, segments and chevron icon.
- **Typography:** families, and each style's size, weight, line height and letter-spacing.
- **Colours:** both themes, plus the page around the frame.
- **Card content:** the eyebrow, headline and subheadline of all ten cards.
- **Timing:** every phase (cardIn, demo, pointerToNext, nextHover, nextPress, cardOut) and the demo's script.
- **Motion and pointer:** the springs, slide distance, press scale, and the pointer's size, shape and resting point.
- **Page and storage:** the margins around the frame, and where the panel and the dock save their values.

The timing values are the dock's defaults where `settings.json` saves none. The panel keeps its browser values under `STORAGE.panelId`. When a default in `config.ts` changes, bump that id: list the old id in `previousPanelIds` and the changed paths in `changedDefaults`. Every other browser value then carries over, and those paths take the new default.

## How it works

The illustrations:
- `src/cards.ts` reads the ten figure files unchanged from `../Line Illustration/figures`, alongside each one's demo stops and its measured extent over every state, and pairs them with the copy from `src/config.ts`.
- `src/vendor/hairline-kernel.js` is an unchanged copy of the hairline kernel.
- `src/scene.ts` runs each figure in a hidden same-origin frame on a virtual clock: its `requestAnimationFrame`, `performance.now` and colour transitions advance only when told to. Solid parts fill with the theme background, so hidden lines stay hidden in both themes.

The carousel:
- `src/timeline.ts` defines the timeline and samples it with DialKit's own `computeStaticTimeline` and `computeClipState`.
- `src/carousel.ts` lays out and draws a frame from a sample. It uses Motion's `spring` for the pointer and Motion's `mix` for the button's colours.
- `src/App.tsx` mounts `DialRoot` and `DialTimeline` and runs the frame loop.

The export runs only when **Export MP4** is clicked in the Playback panel; nothing exports on its own. It reads the timeline as it is set at that moment and renders each card once, from card 01, frame by frame on fresh scenes. That is 10 × round(duration × 60) frames: 2,550 at the defaults, 42.5 s. It draws at 2× and is encoded in the browser as H.264 MP4, 1080 × 1350, 60 fps, with WebCodecs and `mp4-muxer`. It ends as card 10 fades out and starts as card 01 fades in, so it loops without a seam. The funnel's clock is nudged so its gears make a whole number of turns per loop.

## Exports

`exports/` holds the current render, made with the app's own **Export MP4** at the defaults (`settings.json` empty), then converted for delivery:

| File | What it is |
| --- | --- |
| `isometric-marketing-carousel-dark-1080x1350-60fps.mp4` | Dark theme, 5.6 MB |
| `isometric-marketing-carousel-light-1080x1350-60fps.mp4` | Light theme, 5.7 MB |
| `poster-dark.png`, `poster-light.png` | Card 01 mid-demo (2.2 s), for a cover image |
| `preview.html` | Both videos looping side by side, with download links |
| `export-info.json` | The checks below, per file |

Both are H.264 High, 1080 × 1350, constant 60 fps, 2,550 frames (10 cards × 4.25 s = 42.5 s), no audio, with the index at the front for streaming.

The browser's encoder marks its output as full-range colour (`yuvj420p`), which some players and upload pipelines misread. So each file is re-encoded once with ffmpeg to standard `yuv420p`, BT.709 limited range, at CRF 15 (`-preset slow`). Colours match the browser render to within 1–2 levels.

Checked:
- frame count, fps and size with ffprobe;
- a full decode with `-xerror`: no errors;
- the loop seam, last frame against first: a mean difference of 0.10 (dark) and 0.15 (light) on a 0–255 scale, the size of one ordinary frame step. The video ends as card 10 fades out and starts just before card 01 fades in.

The first frame is the empty card before card 01 fades in. Where a platform takes the first frame as the thumbnail, set the cover from `poster-*.png` or from a frame in card 01.
