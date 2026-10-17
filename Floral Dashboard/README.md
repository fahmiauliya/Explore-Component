# Floral Dashboard

Standalone visual study of Figma node `486:1018`, Portfolio 2026: an eight-petal glass flower glowing over a monochrome photograph of a flower (`488:25191`), opening from a cupped bud in a spiral of light and closing again, with a twelve-second hold open, timed on a DialKit timeline and tuned on a DialKit panel.

```sh
npm ci
npm run dev
```

Preview: http://localhost:5192/ (monochrome ground) · http://localhost:5192/?bg=rose (rose ground) · http://localhost:5192/?view=dashboard (the app window with the flower as its rail icon)

Besides React, the only dependencies are `dialkit` and `motion` (DialKit's peer dependency) for the tuning panel and timeline dock, which render in development only.

The 1041 × 780 artboard scales proportionally to the viewport. Its ground is a photograph, drawn as Figma places it, a rectangle larger than the artboard and cropped by it, over `#241e1e`: by default the monochrome `src/assets/background.png` (`488:25191`, Figma's 770 × 1024 export, 1087 × 1446 at −23, −333), or with `?bg=rose` the rose-tinted, iridescent `src/assets/background-rose.png` (`486:2906`, 768 × 1024, 1089 × 1445 at −24, −401). Same flower, same loop; only the ground changes. The flower frame `486:1020` is a 442.986 px square at 298.717, 168.997, 0.29 px left of and 0.49 px below the artboard centre.

## Built in code

The flower uses no images and no SVG. It is 380 HTML elements styled with CSS, 136 of them blurred. `src/flowerLayers.ts` holds every Figma layer in its piece's own frame, with Figma's numbers: ellipse centres, radii and rotations; outlines as path data; colours; radial gradients as Figma's gradient matrix; layer blur σ; opacities; and masks. `src/FlowerLayer.tsx` draws them:

- Ellipses are rounded `div`s and outlines are `clip-path: path()`. Layer blur is CSS `blur()` at Figma's σ, kept on a wrapper whenever an outline clips, because CSS blurs before it clips.
- Masks are clip paths on the group, matching Figma's alpha masks with solid fills.
- Gradients draw one 100 px circle and map it through Figma's matrix. CSS blends gradient stops with premultiplied alpha, but Figma blends them straight. Sixteen straight-blended stops per span keep the glow's red-to-20%-white core as pink as Figma's.
- The petal glow follows Figma's drop shadow: the petal's hard silhouette, blurred σ 13.8433, white at 60%, kept only outside the petal.
- Each petal's red base is drawn inside the same clip as its colour washes, so they share one anti-aliased edge and no red leaks along the rim.
- The three strokes in the background sparkle are stored as filled outlines, 2.51864 px wide with SVG's default miter joins.
- The grain (`src/grain.ts`) is Figma's duo noise: white and black specks at one grain per device pixel, from a seeded 256 px tile, so it stays identical between reloads and frames. Figma's render shows it at about one brightness level, and 5% of the nominal 25% specks matches that.

Layers stack in Figma's order:

- **Glow** (969 px): a red radial core (235.3 px radius, σ 124.6) and a white one (166.1 px, σ 27.7) under a soft rotated sparkle, centred on the flower and left unclipped so the blur fades across the artboard.
- **Rings** (`486:1031`, `486:1056`): eight 200.58 × 247.92 crescents at 20% opacity, two per side, each holding a blurred pink and two blurred white ellipses. Together they draw four faint overlapping circles.
- **Petals** (`486:1081`): eight 94.7 × 194.9 lens shapes, one every 45°, in five variants of blurred pink, amber, violet and white washes, with a white sheen on one half and the 11% white grain layer. The top petal sits over its neighbours.
- **Centre** (`486:1286`, 267.1 px): a blurred cross flare with three stacked four-point stars.

## Fidelity

Compared with Figma's own 1041 × 780 render in headless Chrome, rendered at 2× and scaled down: mean difference 1.2 of 255 levels; 0.53% of pixels differ by more than 10 levels and 0.08% by more than 25. Each piece's centre is within 0.04 px of its Figma position. The remaining differences are sub-pixel anti-aliasing along petal edges and small differences in how the two renderers draw blurs.

## Bud-to-bloom loop

`src/bloom/timeline.ts` defines the loop as a DialKit timeline, one clip per phase, and `src/FlowerMotion.ts` draws the flower from the clips' values at the playhead. The dock is the loop's one clock: playing, pausing, scrubbing and dragging or resizing a clip all show on the flower at once, and there is no other animation running. The loop is 17.6 s at the code's defaults and wraps to 0; its length follows the last close clip plus room for the stagger, so a saved tuning sets it too; t = 0 is the resting bud. Nothing animates opacity: petals move on `transform` (`rotateX` about a hinge on the flower centre, under a 1000 px perspective), `rotate` and `scale`; light on `scale` and `filter: brightness()`; the petal highlights on `translate`. Nothing reacts to the pointer; the flower has `pointer-events: none`.

The clips, with their default times:

- **budHold**, 0–1 s, a marker: the bud rests and the light pulses in scale by ±3% at 0.6 Hz, brightness held.
- **pressure**, 1–1.6 s: the background light goes from 32% scale and 115% brightness to 36% and 130%, the centre stars from 22% and 115% to 25% and 145%, on `cubic-bezier(.33, 1, .68, 1)`.
- **bloom**, a group: **outerPetals** from 1.6 s and **innerPetals** from 2.2 s, each with `props` tracks. `fold` runs in two steps from 62° (outer) or 74° (inner) past flat to −1.5° at 0.75 s on `cubic-bezier(.22, 1, .36, 1)`, then settles to 0 over 0.2 s; `twist` from −18° to 0 over 0.95 s on the same curve; `scale` from 0.92 to 1 over 0.8 s after a 0.05 s delay.
- **lightSpill** from 1.95 s, three steps: the light spreads to 112% while its brightness eases to 105% (1.3 s), settles to 100% with a soft peak to 115% (0.8 s), and relaxes to 100% (0.7 s), then holds steady.
- **ripples**, a group: **r0–r3**, one per background circle clockwise from the top-left, from 2.5 s and 0.25 s apart, each 0.15 s slower (1–1.45 s), 30% to 100%.
- **openHold**, 3.5–15.5 s, a marker: the petals sway for twelve seconds.
- **lightPullback** from 15.5 s, `props` tracks for the light and each circle, 0.6 s each, the circles 0.12 s apart: the amount pulled back toward the bud.
- **close**, a group: **innerPetals** from 16 s, then **outerPetals** from 16.4 s, `props` tracks for the amount of the bud fold, twist and scale reached, 0.6 s (scale 0.55 s after 0.05 s) on `cubic-bezier(.45, 0, .55, 1)`, with no overshoot.

The petal clips carry one petal's motion; the driver adds, on top of each clip's values, the spiral stagger (Bloom › spacing, 0.1 s per petal clockwise from the left petal; Close › spacing, 0.1 s, inner-first), seeded per-petal variation (±40 ms of delay, ±10% of duration, its own 1–2° overshoot, sway speed and phase), each petal's own bud fold between the outer and inner clips' values, the shade and highlight sweep from how folded it is, and the sway and pulse from the markers' progress. Close tracks and the pullback are amounts, 0 → 1, toward the bud values that the bloom and pressure clips start from, so the loop's last frame is its first whatever the dock sets; at the code's defaults the 0 s and 17.6 s frames agree within 2 levels of 255, the compositor's raster jitter.

The glow's filter is always a `brightness()` list, never switched to `none`, it never blurs, and brightness moves only inside clips of 0.6 s or more; between the relax and the pullback it is exactly 100% and still. Each frame writes 43 inline styles in about 0.1 ms, `will-change` keeps every moving part on its own composited layer, and the loop holds 60 fps. With reduced motion the timeline registers paused and nothing is written, so the page shows the untouched design.

## Bloom panel, dock and tuning file

The DialKit panel at the top right holds what is not a clip: Bud (perspective, shade, desaturate), Bloom (spacing, randomness, sheenSweep), Open (tilt, turn), Close (spacing), Light (pulse, pulseHz) and two actions. The dock at the bottom holds every clip's time, length, values and curve, with play, pause and replay. Both persist in the browser (`dialkit:bloom-panel`, `dialkit:bloom-timeline`), with versions and DialKit's Copy.

**Save to file** writes the panel's values and the timeline's timings, transitions and values to `src/bloom/bloom.tuning.json` through the dev server (`/__save-tuning`, a Vite plugin in `vite.config.ts` that does not exist in production builds) and shows "Saved" beside the button for 1.5 s. `src/bloom/tuning.ts` loads that file as the defaults of both, so the tuning is part of the code once saved, even with browser storage cleared; what DialKit keeps in the browser still wins until **Reset to file** returns both to the file, except that a file this browser has not seen yet (saved from another browser, or edited by hand) applies itself once on load, tracked by the file's `savedAt`. The artboard keeps clear of the panel and the dock.

Panel and dock render only in development builds. The timeline still drives the flower in production, from the saved file's values.

## Removing DialKit for production

The timeline is the clock, so removing DialKit means replacing it: keep `bloom.tuning.json` and `timeline.ts` as the record of the tuning, then either sample `FlowerMotion.ts`'s `draw` at 60 Hz into Web Animations keyframes (as the earlier `FlowerMotion.ts` did, in git history) or drive it from a plain `requestAnimationFrame` clock through `dialkit/timeline`'s `computeStaticTimeline` and `computeClipState`, which have no UI. Then drop `BloomClock`, `DialRoot`, `DialTimeline`, `useDialKitController`, `dialkit/styles.css` and the save plugin, and `npm uninstall dialkit motion`.

## Dashboard view

`?view=dashboard` shows Figma `483:23065`: the top-left corner of an app window drawn at 2.049× (a 1440 × 900 window at 2950 × 1843.75, at 174, 91), on a light ground (`rgba(197,197,197,.38)` over white → `#d6d6d6`). `src/Dashboard.tsx` and `src/dashboard.css` build it from Figma's own values: the window's 2.049 px border, 32.778 px radius, dark `#261f29` body with its bottom shade and four shadows, and its inner highlight; the blurred light behind the sidebar (Figma's ellipse, 792.812 × 1065.28 with its blur); the white panel at 124.96 with its 2.049 px `rgba(0,0,0,.15)` border, 20.486 px radius and white inner glow, holding the 409.722 px `#fdfcfc` sidebar and the empty page with its 2.049 px left border; and the dark rail of 65.556 px icon cells down the window's left edge. The sidebar and rail are Figma's auto-layout stacks, so flex places them with Figma's paddings and gaps (12.292, 16.389, 20.486, 24.583, 28.681, 32.778 px). Text is Inter Medium 26.632 / 32.778 px.

The rail's flower is the Floral Dashboard flower itself, scaled from its 442.986 px frame to 32.778 px. The company tile is Figma's dark glass square: its deep-red radial rim, three light sweeps in hard-light, colour-dodge and plus-lighter blends, the `#ffa27d` inner glow, the blurred glass edge and the logo. The other icons and light shapes are code: `src/dashboardIcons.tsx` holds Figma's vectors as JSX, every path, stroke and blur, at their exported sizes, with nothing loaded from a file. The selected "Content" pill, the tree line (`#e0e0e0`, 2.049 × 223.299 at 47.12, 88.09) and its black indicator sit where Figma has them. The Tutorials box at the sidebar's foot is built too, below the artboard's edge.

Compared with Figma's render, the view differs by a mean of 2.7 levels of 255, with 2.0% of pixels off by more than 25, all of it text and icon anti-aliasing (Figma's text renders a little darker); the ground, rail and page match within 1 level. Two values are calibrated rather than copied. Figma exports the pill's border as `rgba(0,0,0,.6)` but renders it at about a fifth of that, so the pill uses `rgba(0,0,0,.2)`, which matches the render. And Figma exports the window's stroke as solid white but renders it at about 75 grey over the body, with the frame's inner highlight drawn over the stroke, so the outline reads about 120 grey along the top and 100 down the left: the border is white at 17%, and the highlight is a `::after` reaching 2.049 px past the padding box, over the border, while the content is clipped by its own `.dash-clip` box (a CSS inset shadow stops at the padding edge, so it could not reach the border otherwise). Measured against Figma across the window's top and left edges, the outline's pixels are now within 4 levels on average (the ring, stroke and highlight fall-off: Figma 124, 93, 59, 48 from the top edge inward, this 120, 88, 59, 50; down the left, Figma 97, 89, 47, 37, this 87, 90, 47, 37). This view has its own DialKit panel, Agent, described below.

### Icon style

At icon size the illustration's light, made for 443 px, washes everything out in Chrome: the petals' white halo bleeds over them and the light's white core becomes a blob. `FloralDashboard` with `variant="icon"` draws the same layers in an icon style: the petal halo is off, the light's white core and its blurred sparkle copy are off, the red core stays as a dark pink haze whose strength is a dial, the four discs are faint by the same dial, the petals can be narrowed across to leave gaps, and the centre keeps its 4-point stars and rays, which are crisp at this scale. The Agent panel's Icon folder holds the three dials, glowStrength, petalWidth and sparkleSize. Their defaults were calibrated against two renders of Figma `486:1845` (its 1× export and your canvas screenshot, aligned to the artboard) by measuring the icon's cell at the close framing over a grid: both prefer full-width petals and a haze of 0.8, and are indifferent to the star's size, so the defaults are 0.98, 0.8 and 1. At those the icon's cell differs from the two renders by means of 4.7 and 5.2 levels of 255.

### Agent Icon timeline

The dashboard view has one clock: the **Agent Icon** timeline, a DialKit dock at the bottom of the page (`src/agent/timeline.ts`, id `agent-timeline`, looping, persisted, saved to `bloom.tuning.json` as `agentTimeline`). Every value the view draws is a clip's `current` at the playhead, written on each tick, seek, clip edit and panel change, so scrubbing, moving and resizing clips show on the view live; there is no other animation. One pass is an 11.2-second demo of the agent finishing:

- **camera**, 0–11.2 s, steps: the wide framing rests 1 s, closes in over 2.6 s on `cubic-bezier(.65, 0, .35, 1)` to `closeness` 1, rests 4 s, eases out over 2.6 s, rests 1 s. The window is scaled by 3.2951^closeness about the one point of the artboard that both framings share (117.79, 490.54), so closeness 1 is exactly Figma `489:2919`.
- **working**, from 0, looping, `props` tracks that are swings ending where they start, each its own period: `rotate` ±6° over 2.8 s (1.4 s per swing), `petalSway` ±4.5° over 2.24 s, `breathing` 0.96–1.04 over 3.73 s, each step on a sine-like ease-in-out. 4, 5 and 3 whole cycles per loop keep the seam. Each petal samples the sway track at its own speed (0.6–1.4×, whole cycles too) and phase, and tips about its hinge by 0.4 of its sway, so the petals move apart from each other; layered sines, no jitter.
- **settle**, 4.5–5.1 s: the amount of sway, 1 → 0, so the flower eases from its current pose to fully open and still.
- **donePulse**, from 5.1 s: the dot's one pulse, scale 1 → 1.4 over 0.16 s on an ease-out, then back to 1 over 0.35 s on a time-based spring with a small bounce. The ring scales with it. The Agent panel's Pulse sliders, scale and duration, write into this clip's steps.
- **complete**, 5.7–7.7 s, a marker: everything still, the light at its normal level.
- **resume**, 7.9–8.7 s: the amount of sway 0 → 1; the flower sways again from the open pose it is in, and the loop wraps at 11.2 s with the sway mid-cycle.

The status is where the playhead is, complete from the settle's start to the sway's return, and `FloralDashboard` takes it as `status`, labelling itself "Agent working" or "Agent finished, waiting for your reply". The Agent panel's **Status** select follows the playhead and, when changed, jumps it: complete seeks to the settle, working to the resume, so the transitions always play. Nothing animates opacity and the glow's filter is never touched. Reduced motion shows the still wide framing with the flower open and the dot at its size.

The green dot is always visible, at full size, from start to finish, through working and the resume; it sits outside the swaying group, after it, so it never rotates, sways or breathes, and its ring stays on top of the petals. It is Figma `489:2911`, measured from the flower's width W (389.8 of its units, petal tip to petal tip): the Dot folder's dials are its diameter (0.30 W), the ring around it (0.11 W, in `#241e27`, a shade darker than the rail), and its centre's offset right and up (0.42 W, 0.40 W); `dotStyle` rounds each to whole pixels at icon size, so it stays sharp, and sets them as CSS variables on the flower. The dot itself is a centred radial gradient `#dbffd8` → `#31ba25`, a white inner shadow at the top left and a dark one at the bottom right, and a hairline ring fading from 40% white at the top. In the complete state at the close hold the dot's centre and size match Figma's render within a pixel, and the icon's cell differs from Figma's 1× render and your canvas screenshot by means of 4.6 and 5.2 levels.

## Video export

- `exports/floral-dashboard-2082x1560-60fps.mp4` (monochrome ground) and `exports/floral-dashboard-rose-2082x1560-60fps.mp4` (rose ground): H.264, 2082 × 1560, constant 60 fps, one loop of the saved tuning (15.3 seconds, 918 frames), no audio. `exports/floral-dashboard-dashboard-2082x1560-60fps.mp4` (dashboard view): the same encoding, one loop of the Agent Icon timeline (11.2 seconds, 672 frames); its loop boundary differs by at most 1 level on 19 pixels.
- `exports/preview.html`, `exports/preview-rose.html`, `exports/preview-dashboard.html`: looping video players and download links.
- `exports/poster.png`, `exports/poster-rose.png`: full-resolution first frames (the bud); `exports/poster-open.png`, `exports/poster-open-rose.png`: frames from the open hold. `exports/poster-dashboard.png`: the dashboard's wide first frame; `exports/poster-open-dashboard.png`: the close framing at 7.7 s, the agent complete with its dot settled after the pulse.
- `exports/export-info.json`, `exports/export-info-rose.json`, `exports/export-info-dashboard.json`: verified dimensions, frame rate, decoded frame count, loop length and the loop-boundary result.

With the preview running on port 5192, run `node scripts/export-video.mjs`, `node scripts/export-video.mjs --bg rose` for the rose ground, or `node scripts/export-video.mjs --view dashboard` for the dashboard's zoom loop (11.2 s, 672 frames, `-dashboard` outputs). Add `--url http://127.0.0.1:5193/` to render against `vite preview` of a build, so editing the source meanwhile cannot reload the page under the export. The exporter uses an isolated Chrome process and Homebrew FFmpeg on macOS. It hides the DialKit panel and dock and drives the page's `window.__floral` clock (the Bloom timeline for the flower, the Agent Icon timeline for the dashboard), pausing it and seeking to each frame's exact time, so the video is exactly what the dock is set to, as long as the timeline is: change the tuning and the loop length follows. The first frame is checked against the loop's end and against a second render of itself; since styles are written per frame the compositor may re-raster a layer a hair differently, so frames agree when no channel differs by more than 2 levels of 255 and fewer than 0.5% of pixels differ at all. The endpoint is not duplicated in the MP4. Use `--poster` to render the posters and check the seam without encoding.
