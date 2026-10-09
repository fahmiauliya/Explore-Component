# Line Illustration

Standalone study built on [`@lucasmarkes/hairline`](https://hairline.lucasmarkes.com) (MIT, v0.3.0): twenty-seven isometric line figures that respond to the pointer.

```sh
npm ci
npm run dev
```

Preview: http://localhost:5189/

The current page is a gallery of every figure on the near-black plate the package is drawn for (`#08090a`), used to choose a subject for the study.

## Figures

New figures are drawn with the `hairline-create` skill (`.claude/skills/hairline-create`), on the package's own engine and rules. Each figure has its own folder in `figures/`: the source (`<name>.js`), the built page (`hairline-<name>.html`), and the screenshots that check it (`hairline-<name>-*.png`).

| Figure | Page | What it does |
| --- | --- | --- |
| Funnel | http://localhost:5189/figures/funnel/hairline-funnel.html | Four open, tapered bands from a wide mouth to a narrow neck, with two turning gears. The band under the pointer grows; the rest draw in. |
| Megaphone | http://localhost:5189/figures/megaphone/hairline-megaphone.html | A megaphone on a plinth sending out four sound rings. The ring under the pointer moves out and brightens, and its neighbours are carried with it, less the farther they are. One calm spring drives the set, so moving between rings glides and leaving settles every ring back together. |
| Magnet | http://localhost:5189/figures/magnet/hairline-magnet.html | A flat horseshoe magnet lying on a plate, with six identical cubes scattered at varied angles. Hover a cube and it is pulled to the end of a row running out from between the poles, squared up, with even gaps. Free cubes lean toward the magnet, the nearer the more. Three dashed field lines between the poles brighten as leads arrive. On leave every cube drifts home. A separation step every frame keeps cubes from touching each other or the magnet. |
| Target | http://localhost:5189/figures/target/hairline-target.html | Spotlight on the audience: fourteen identical pawns in four loose clusters on a plate, and a stage spotlight on a stand at the back corner. Hover a cluster and the lamp swivels as the cone of light slides over it. Its pawns lift and brighten, and nearby pawns stir with a falloff. One spring carries the light, so gliding between clusters is one slide. On leave the light returns to the centre. The cone uses the palette's faintest colour as its tint and sits under the pawns. |
| ROI | http://localhost:5189/figures/roi/hairline-roi.html | Connected glasses: four identical glasses in a row rising to the right on a rounded tray. Each is a true cylinder with a thin double rim and tinted liquid. One round pipe lies on the tray behind them, from a lidded source tank at the back end, with a stub into each glass. Each valve (a round body and lever) shows in the gap beside its glass. Hover a glass and its lever turns open and it fills, while the tank and the other three give the same volume back, so the total stays constant. |
| Email | http://localhost:5189/figures/email/hairline-email.html | Open pigeonhole shelving on a plinth, open front to the lower right, 4×3 shallow slots showing back wall, floor and side wall. An identical envelope with a centred V flap stands in every slot, leaning back on the back wall. The envelope under the pointer slides forward and leans back to show its face, and its neighbours ease out with a falloff. Slot 1·1 is top-left. Slots paint from the right column to the left and bottom up, so nothing shows through. |
| Segmentation | http://localhost:5189/figures/segmentation/hairline-segmentation.html | A lazy-susan tray on a flared pedestal and a small plate, split by thin walls into four compartments of 40, 25, 20 and 15 percent holding cubes, spheres, cylinders and pawns. At rest the tray turns slowly, once every 24 seconds. When the pointer comes onto the tray the turn eases to a stop in about half a second; the compartment under the pointer lifts its tokens and brightens them in place, and its two neighbours lift a little. Hit areas are the compartments where they are now, and the tray is stopped while the pointer is on it, so they never move under it. Off the tray the tokens settle and the turn eases back in (no turn under reduced motion). Walls are vertical half-planes through the centre, so which side the camera is on gives an exact paint order, re-sorted every frame of the turn. |
| Launch | http://localhost:5189/figures/launch/hairline-launch.html | A hot air balloon moored over a small plate. The teardrop envelope is widest in its upper third: an exact sphere joined by a tangent cone that narrows to the mouth, with six meridian gores from crown to mouth, a small crown ring and a skirt ring. Just under the skirt sits a small burner frame, and four straight ropes run from the skirt to the top corners of an open basket about a quarter of the envelope's width, with an inner rim and two weave bands. Three identical sandbags hang on short ropes from the visible sides, clear of the plate. Hover sandbag 1, 2 or 3 and it and every bag before it fall straight down with their ropes and land below where they hung, while the balloon floats up one large step per bag and the tether goes from a soft curve to taut. Hit areas stay where the bags hang at rest. The balloon bobs slightly at rest (still under reduced motion). Status: rest, pre-launch, launch, scale. |
| Analytics | http://localhost:5189/figures/analytics/hairline-analytics.html | A tick-mark meter: a D-shaped dial, 3 units thick, stands on a slim, low plinth no wider than the dial, with its face turned 30° from the viewer toward the right so the arc reads as an even half-circle. The needle hub sits directly on the face. Two rows of radial ticks follow the arc, 2° apart: the outer row is the scale, the inner row the value. Both rows are split into four segments of 22 ticks with one missing tick between them, and five scale dots mark the segment ends. A thin needle turns on a small hub. Hover a segment and the needle swings to its end on a spring with a slight settle: the inner ticks light one by one behind it, ticks past it go dim, the ticks near its tip stretch with a smooth falloff, and that segment's scale ticks brighten. On leave it eases back and the ticks go out in reverse. Hit areas are the four tick segments, read in the dial's own plane. The dial's rim is drawn only where it faces the camera, split exactly where it turns away. Status: rest, segment 1–4. |
| Journey | http://localhost:5189/figures/journey/hairline-journey.html | A paper map folded zig-zag in three equal panels on a small plate (the outer two face the camera, the middle one slopes away). One smooth route, a Catmull-Rom curve through five dots (discover, consider, buy, use, return), crosses all three panels, swings round after "use" and comes back along the near edge to finish beside the start. It is laid out on the unfolded map and carried onto each panel by that panel's own affine map, cut exactly at the creases, so it lies on the paper and bends over the folds. Hover a dot: a map pin travels the route to it, forward or back, on a critically damped spring. It lifts while travelling and drops slightly as it lands. The route behind the pin is solid and bright, the route ahead dashed and dim, and the dot brightens. On leave the pin and the travelled route stay and the highlight fades. Hit areas are the five dots, which never move. Status: rest, discover, consider, buy, use, return. |

Rebuild and check a figure from its folder: `node ../../../.claude/skills/hairline-create/look.mjs <name>.js --answer x,y,z`.

## Lessons for the next figure

What the Funnel and Megaphone taught us, beyond the skill's ten rules. Each point fixed something that was visibly wrong in an earlier version.

### Shape and composition

- **Match the reference's construction, not just its outline.** A funnel read as stacked slabs until each stage became an open band, wider at its rim than at its foot. Together the bands form one taper, and the mouth shows the inner walls stepping down.
- **Leave gaps between stacked parts so every rim shows.** With a 5-unit gap the four bands merged into one cone; with 9, each rim read separately.
- **Turn the object so its repeated parts read.** Rings facing the viewer stacked like a coiled spring and hid the megaphone. With the axis turned to point right, 25° toward the viewer, they read as separate arcs.
- **Fill at least a third of the frame.** Below about 30%, raise the camera scale `S`.

### Line quality

- **Draw every curve as a true Bézier curve, never a polyline.** The camera is affine, so a circular arc built as cubics in the world and projected control point by control point stays exact. Use cubics of 90° or less, with handles `k = 4/3·tan(Δ/4)·r`.
- **Draw rounded corners as true arcs too.** At this camera the screen's left and right extremes sit at the middle of two corners (−45° and 135°). Split the outline there for the silhouette and the crease.
- **Solve outlines exactly instead of taking the hull of sampled points.** Two parallel circles project to the same-shaped ellipse at two sizes, so a cone's two tangent lines touch both ellipses at the same angle `f`, where `A cos f + B sin f = −Δr·K`.
- **Never let two edges run close and parallel.** A flat ring seen nearly edge-on narrows to about 2px at its sides and reads as a double line. Give bands a round cross-section instead: the outline is the centre ellipse offset by the tube's radius in screen space, one Hermite cubic per 45°. Keep the offset well under the ellipse's tightest curvature (`b²/a`), or its ends turn pointed.
- **Draw each part as one filled path.** A band is its outer edge plus its inner edge wound the other way, so the band is filled and the hole is not. A hover then recolours that one path: one clean highlight, never a second line beside it.
- **Don't redraw an edge that the outline already draws.** A mouth's far rim is part of the cone's outline, so draw only its near arc.

### Depth

- **Fill every part with the plate colour and paint back to front.** For rings on one axis, the ring further along the axis is in front at every crossing, so sorting by axis position is exact. Re-sort by moving the paths, not by redrawing them.

### Motion

- **Use a spring field for "the others follow".** A tween per item makes neighbours snap on their own. Read the pointer as a continuous position along the parts, against their resting centres so it can't flicker. Then follow it with one critically damped spring (`k 60, c 15.5`: calm, no overshoot), and fade the whole effect in and out with a second spring. Each part's travel is a falloff from the focus.
- **Start the focus where the pointer enters.** Coming from rest, set the focus straight to the pointer's position, because nothing is out yet. Otherwise it sweeps in from the first part.
- **Let the highlight follow the spring, not the pointer.** The engine fades stroke changes over 260ms, so the bright edge travels with the motion.
- **Prove that parts can't cross before you look.** Simulate every focus position at the strongest slider value and check the tightest gap (the Megaphone keeps 68% of rest). If a chosen part can pass its neighbour, the order stops reading.

### Checking

- Run `look.mjs`, then zoom in on the hover state (`--zoom answer` or `--zoom dark`). Corners, flat spots and double lines only show at three times the size.
- The skill's motion strip only covers the pointer arriving. Also drive a real pointer in Chrome: enter, glide across every part, and leave. Confirm the read-out at each step and a clean console.
- Each figure must stay within the engine's 200-line limit. Tighten comments before cutting behaviour.
