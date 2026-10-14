# Compo

Compo is a collection of code components; this folder is its website. Illustrations is the first section, and more sections will be added later. The illustrations come from the Line Illustration project, in two categories, Marketing (10) and Fintech (10). Each one runs live in the gallery and on its own page, and downloads as a React component, an MP4 and the other formats below. (The folder keeps its first name, `Isometric Marketing Kit`.)

```sh
npm ci
npm run dev
```

Preview: http://localhost:5190/illustrations · Fintech: http://localhost:5190/illustrations/fintech · a detail page: http://localhost:5190/illustrations/fintech/edc-payment

## Look, sections and addresses

The site follows fahmiauliya.com: a calm monochrome page in Geist 14/1.4, its glossy dark and light pills, and the same cards and grid overlay. Every value is a design token in `src/theme/tokens.ts`, measured from that site (its stylesheet's custom properties and computed styles, Chromium at 1440 and 375 px); `main.tsx` writes them as custom properties before the first render and `src/styles.css` reads only those. The dark theme is derived from the same tokens (#0F0F0F / #F2F2F2); light is the default. Reference and Compo screenshots are in `audit/reference/` and `audit/compo/` (not committed).

- **Header** on every page: a full-width 56px bar with a hairline under it. Left, "Compo" (→ `/`) and "Illustrations" (→ `/illustrations`, underlined while you're in that section; `SECTIONS` in `src/App.tsx`, so a new section is one more item). Right, a compact dark "Request" pill (opens the modal) and a small Dark / Light pill toggle.
- **Home** (`/`): in the 587px column between the guide lines (the only page that has them; under 640px the column fills the width without them), "Compo" / "Interactive line illustrations", three short paragraphs, a dark "Request" pill, a light "Browse" pill linking to `/illustrations`, and the grey social icons.
- **Illustrations:** left-aligned chips above the grid, "All 20" · "Fintech 10" · "Marketing 10" (the count in the secondary colour; the current chip the dark pill, the others light). All is the default and shows Fintech first, then Marketing, each card labelled with its category ("Fintech · 02 · Savings"); in a category the label drops it ("02 · Savings"). The chip lives in the address (`/illustrations`, `?c=fintech`, `?c=marketing`), so links, reload and the back button keep it; switching changes the grid at once, with no animation and no scroll. Cards in 4 columns (2, then 1, on narrow screens): name (with a sliders icon when it has Customize) and label above a 343:300 tile, a 12px-round light grey thumbnail with the white grid overlay, the live illustration centred; "(new)" on the right for the illustrations that replaced older ones. Hovering plays the illustration and brightens the overlay.
- **Detail page:** the same chip rides along in its address (`/illustrations/fintech/coin-tube?c=fintech`; none for All). "All illustrations" (a light pill) returns to that chip, and prev / next, the arrow keys and the counter stay within it: "02 / 10" in a category, "02 / 20" in All, which steps through all 20. The illustration sits in a large rounded tile; the side panel has the same type scale, rounded hairline fields, the React download as a full-width dark pill and "More formats" as a light pill.
- **No page transitions:** every page change is instant.
- **Footer** on every page: the social icons and "Compo · 2026 · Made by Fahmi" (the link goes in `MADE_BY_URL`).
- **404:** any unknown address shows "Page not found" in the column, with a "Back to Illustrations" pill.
- **Titles:** browser tabs read "Compo — Interactive line illustrations" (home), "Compo — Illustrations", "Compo — Fintech illustrations" and "Compo — Funnel".

| Address | Shows |
| --- | --- |
| `/` | the home page |
| `/illustrations` | the gallery, on All |
| `/illustrations?c=fintech`, `/illustrations?c=marketing` | the gallery, on that chip |
| `/illustrations/<category>/<slug>[?c=<chip>]` | a detail page, stepping within that chip (All without `?c`) |
| `/illustrations/marketing`, `/illustrations/fintech`, `/marketing`, `/fintech`, `/<category>/<slug>`, the first site's `/<slug>` (e.g. `/funnel`), `/request` | the new page at once, with the address rewritten in place |
| a replaced Fintech figure (`pneumatic-tube`, `coin-tube`, `growing-plant`, `money-plant`, `vault-door`, `ladder`, `credit-card`, `balance-scale`, `coin-swap`, `flip-coin`, `tear-off-calendar`, `loop-track`) | its replacement (`edc-payment`, `money-jar`, `coin-stacks`, `safe-box`, `approval-stamp`, `rate-board`, `subscription-box`; `REPLACED` in `src/fintech.ts`), keeping the chip |

Numbering restarts per category.

There are no status labels: the illustration speaks for itself. Each figure still sets its read-out (the bench and the React download's `data-status` use it), but the site doesn't show it.

### Marketing

| # | Illustration | Topic | Page | Figure |
| --- | --- | --- | --- | --- |
| 01 | Funnel | Conversion | `/illustrations/marketing/funnel` | `funnel` |
| 02 | Megaphone | Awareness | `/illustrations/marketing/megaphone` | `megaphone` |
| 03 | Magnet | Lead generation | `/illustrations/marketing/magnet` | `magnet` |
| 04 | Spotlight | Target audience | `/illustrations/marketing/spotlight` | `target` |
| 05 | Connected glasses | ROI | `/illustrations/marketing/connected-glasses` | `roi` |
| 06 | Pigeonhole cabinet | Email marketing | `/illustrations/marketing/pigeonhole-cabinet` | `email` |
| 07 | Rotating tray | Segmentation | `/illustrations/marketing/rotating-tray` | `segmentation` |
| 08 | Hot air balloon | Product launch | `/illustrations/marketing/hot-air-balloon` | `launch` |
| 09 | Tick gauge | Analytics | `/illustrations/marketing/tick-gauge` | `analytics` |
| 10 | Folded map | Customer journey | `/illustrations/marketing/folded-map` | `journey` |

### Fintech

| # | Illustration | Topic | Page | Figure | Read-out |
| --- | --- | --- | --- | --- | --- |
| 01 | EDC payment | Payments | `/illustrations/fintech/edc-payment` | `edc` | rest / tap / paid |
| 02 | Money jar | Savings | `/illustrations/fintech/money-jar` | `moneyjar` | rest / saving / full |
| 03 | Jars on a shelf | Budgeting | `/illustrations/fintech/jars-on-a-shelf` | `jars` | rest / jar 1–3 |
| 04 | Coin stacks | Investing | `/illustrations/fintech/coin-stacks` | `coinstacks` | rest / growing / grown |
| 05 | Safe box | Security | `/illustrations/fintech/safe-box` | `safe` | rest / entering / unlocked |
| 06 | Approval stamp | Credit score | `/illustrations/fintech/approval-stamp` | `stamp` | rest / stamping / approved |
| 07 | Bridge | Loans | `/illustrations/fintech/bridge` | `bridge` | rest / building / paid off |
| 08 | Receipt printer | Invoicing | `/illustrations/fintech/receipt-printer` | `receipt` | rest / printing / printed |
| 09 | Rate board | Currency exchange | `/illustrations/fintech/rate-board` | `board` | rest / flipping / idr |
| 10 | Subscription box | Subscriptions | `/illustrations/fintech/subscription-box` | `box` | rest / opening / open |

The EDC payment (`EdcPayment`, replacing the pneumatic tube, whose old address redirects here) is a detailed card terminal modelled in 3D and drawn in true isometric (30° ground axes, the one figure that doesn't use the set's 2:1 view; every straight edge is checked to run along one of the three isometric directions): it lies flat, keypad up, its long axis along the right-going axis, a rounded box 2.1× as long as it is wide with a printer hump at the far end sharing its side faces (a paper cover seam, a hinge line and a finely serrated tear bar), a bezelled screen with a contactless mark above it, a precise 3×4 grid of equal keys with their digits (1–9, *, 0, #) in single strokes and a row of ✕ ◁ ✓ function keys on the same columns, aligned to the screen's edges, a chip slot at the bottom and a short swipe groove on the side; a card with an EMV chip, a contactless mark and number dashes lies flat beside it. On hover the card lifts, tilts slightly in 3D and taps over the screen (the arcs draw out and back) and goes home; the amount is written in stroke by stroke in the single-stroke font at one fixed size ("$000000.00", 10 characters, fills 80% of the screen; case is kept) and a check draws under it while the ✓ key dips; then a short receipt curls out under the tear bar, about 2.3 s in all; leave reverses it (0.6 s). Its CUSTOMIZE block has an Amount (up to 10 of letters, digits, `. , $` and space, default "$24.00") and an optional Logo upload, converted to line art like the receipt's and shown small on the front of the printer hump (none by default); in React, `amount` and `logo`. The jars (`BudgetJars`) are three identical open glass cylinders (a double ring at the rim for the glass, no lid), spaced so their outlines never meet (a gap of about 31% of a jar's width), each with a straight stack of coins following its share: a 100% jar holds 6, each share rounds to the nearest coin and any share above 0% has at least one. Each label sits on the shelf's front edge under its jar, like a price tag, in the single-stroke font at one size. Hovering a jar lifts one or two coins out of the others, carries them across in a low arc above every rim and drops them in; leaving sends them back to the split in 0.5 s. Their CUSTOMIZE block has a Label and a % per jar (default NEEDS 50 · WANTS 30 · SAVE 20); the split only applies when it adds up to 100 ("Total: 90%. Must equal 100%." until then), with "Reset to 50/30/20"; in React, `jars={[{ label, percent }, …]}`. Coin stacks (`CoinStacks`, replacing the money plant and, before it, the growing plant, whose old addresses redirect here) is a low rounded tray holding 6 coin stacks in a row, rising 1 to 6 coins at rest like a growth chart, spaced so neighbouring stacks never overlap; each stack's top coin carries the mark. On hover coins drop from above the frame onto the stacks one at a time, left to right, each landing with a tiny bounce, until the stacks rise into compound growth (the last stack 8 coins at 1 year to 20 at 10); only the landing coin is lit, and at the end the top coin of the tallest stack. On leave the added coins lift off right to left and rise out of the frame. Its CUSTOMIZE block: Years (a 1–10 stepper, default 5) and a Coin mark (one character or "Rp", default $); in React, `years` and `mark`. The money jar (`MoneyJar`, replacing the coin tube, whose old address redirects here) is a glass mason jar (rounded foot, straight body, rounded shoulder, a short neck two thirds of the body's width, and a screw lid at the neck's width with thread lines and a coin slot); its back rim shows dim behind the money, with two short reflection lines on the upper left. Every coin and note is ground-filled, so nothing shows through them; notes are single outlines, gently bent, with an inner border and a small oval. At rest it already holds a small heap (5 coins and a folded banknote). On hover coins and the odd banknote drop in through the slot one after another: a coin passes the slot edge-on, tumbles in perspective, bounces once and settles at its own angle; a note flutters down and drapes over the coins; the heap rises unevenly, higher in the middle. Only the item falling or settling is lit. On leave the extra items slide down and tuck into the pile over 0.8 s; nothing flies back out or fades. Its CUSTOMIZE block: Fill (a 1–5 stepper, default 3: 1 fills about a quarter in about 2.4 s, 5 nearly to the shoulder in about 10 s) and an optional Label (up to 8, on a paper band wrapped round the jar in single strokes); in React, `fill` and `label`. The others answer one hover over time: the printer feeds out a receipt twice the old length, curling back at the top, and prints it row by row (three items, 0.3 s each; the total under a double rule; a dashed line; then a name, letter by letter), then a small cut, about 2.2 s in all; on leave it slides back in (0.6 s). The name (default "THANK YOU", up to 20 characters, wrapping to 2 lines at one fixed size) and an optional total (up to 10 characters, printed on the right of the total row) are the React download's `name` and `total` props and the receipt page's CUSTOMIZE fields, with counters; typing replays the print. The lettering is Hershey Roman Simplex single strokes (MIT, from the hersheytext package), stored in the figure as path data and laid on the paper's surface; a small logo sits in the upper back corner of the printer's left side, the same gap on screen from the corner's edge and from the top (default the Compo "C", Geist Medium's outline; a "Show logo" switch, the React `showLogo` prop, hides it), the React download's `logo` prop and the page's "Upload SVG": any SVG becomes single-colour line art in the browser (`src/logo.ts`). That means every visible shape, with its transforms, becomes an outline only with holes kept, and text is set in Geist Medium outlines at the browser's character positions. Colours, gradients, filters, images, masks, hidden shapes, a white artboard background and shapes under 1.5% of the logo are dropped. The file is read in a sandboxed frame that can't run its scripts, and it is never uploaded; files over 1 MB, invalid or without shapes are refused, keeping the current logo. the safe, standing on the ground, is hollow, its door on the face toward the lower left (so it swings clear of the opening) with only a code window (75% of the door, the 4 digits 60% of its height), a small lever at its right edge and two hinge marks on its left. On hover the window lights and the code fills in, 0.25 s a digit; the lever turns down (0.2 s) and the door swings open on its left hinge to 100° (0.7 s, ease-out), drawn with its thickness and its back panel, showing the back wall, floor, side wall and a thin inner rim; as it finishes, what's inside lights and lifts 4 units: a small cube with a lid line, 3 coins, or a cube with a Geist outline letter on top. On leave the object settles, the door closes (0.5 s), the lever returns and the digits clear (0.3 s), reversing from wherever it is. Its CUSTOMIZE block: Code (exactly 4 digits, default 2580), Hide code (dots instead), Inside (BOX | COIN | LETTER) and, for LETTER, a one-character Letter (default C): the React `code`, `hideCode`, `inside` and `mark` props; the stamp lifts (0.25 s), moves over the document's empty right half (0.35 s) and presses straight down with a 6% squash (0.15 s); its mark appears at contact, faded in over 100 ms, never scaled, centred on the stamp's face, with no border, lying straight on the paper with clear space all round; then it lifts, moves back and sets down. On leave the mark fades out over 300 ms. The mark is a CHECK | TEXT | LOGO choice in its CUSTOMIZE block and the React `mark` prop: a check; up to 8 characters in the receipt's single-stroke font, one fixed size with APPROVED filling 85% of the face (`text`, default APPROVED); or an uploaded SVG logo converted to line art like the receipt's (`logo`, default the Compo "C"). Each type shows only its own field, and the USE IT snippet lists only the props it uses; the bridge stands on two identical cliffs on one straight axis, their inner ends facing each other across a gap 45% of a cliff's length; its planks lie flush with the cliff tops from one end face to the other, the first and last touching them exactly, then the rope rails rise. The planks are (gap − spacing) ÷ installments wide, about 0.15 s apart and 1.6 s at most. The bridge's CUSTOMIZE block has an Installments stepper (– 5 +, 3–12, arrow keys) and an optional Goal (up to 8 letters, digits and spaces): a small flag on the far corner of the right cliff, in the receipt's single-stroke font, that waves and lights when the bridge connects. These are the React `installments` and `goal` props, and with a goal set the drawing is fitted to the flag too (`boxWith`); the box's taped top (a centre seam under clear tape, and short seams to the end flaps, so it reads as four flaps) opens along those seams: the back flaps, then the front ones, 0.5 s each with 0.15 s between flaps, showing the rim and inner back walls; then a small cube rises 0.6 s, high enough that its whole top face shows, with a letter on that face. On leave the cube sinks (0.5 s), then the front flaps and the back flaps close (0.5 s each). The letter is the React download's `mark` prop: one character, A–Z or 0–9, default "C". Every letter is drawn the same way: Geist Medium's glyph outline (taken once with opentype.js and stored in the figure as path data, so nothing needs the font), outline only with its counters empty, in the line colour and weight, projected point by point onto the top face. On its detail page, a CUSTOMIZE block above the downloads has a one-character Letter field: typing updates the drawing live and opens the box for 2 s, empty falls back to "C", and every download and the USE IT snippet use the current letter. The rate board is one desk flip block with three tiles: hover and they flip once each, left to right (250 ms each, 120 ms apart), from FROM to TO, the frame lit while TO shows; leaving flips them back. FROM and TO (default USD and IDR) are its CUSTOMIZE fields and the React `from` and `to` props. Hovering anywhere on the bridge, the stamp or the box starts it, and leaving reverses it.

## Request modal

The nav's round send button (and the intro's "Request" pill) opens "Request an illustration" (`src/RequestModal.tsx`).
- **Layout:** a centred dialog, 480 px wide (at most the screen minus 32 px), with a hairline border and 32 px padding, over the page dimmed black (40% in light, 60% in dark).
  - **Opening and closing:** it fades and scales from 0.98 in 160 ms, and back in 120 ms; with reduced motion it only fades.
  - **Phones:** below 640 px it is a full-width bottom sheet that slides up.
- **Content:**
  - the title and "Tell us what to draw next.";
  - on an illustration's page, a removable "ABOUT: FUNNEL" tag that is sent with the request;
  - a four-row text field, an optional email field, and a full-width Send.
- **Checks:** only on Send. The text can't be empty, and an email, if given, must be valid. Errors show under their field, linked to it and announced politely. The rules live in `src/request/form.ts`, which the server uses too.
- **Results:**
  - Success shows "Thanks, we got it." only when the server says it was sent, then closes after 2 s with the form reset.
  - Any other answer shows "Couldn't send. Please try again." under Send and keeps what was typed.
- **Keyboard:**
  - Focus starts in the text field, Tab and Shift+Tab stay inside, and the page behind is inert and doesn't scroll.
  - Esc, the × and the backdrop close it, first asking "Discard your request?" (Discard / Keep editing) when anything is typed.
  - Cmd+Enter or Ctrl+Enter sends; Enter is a new line.
  - Focus returns to "Request" on close. Every control shows a 1px highlight ring, 2px out.
- **Spam:** a hidden field and a minimum time open; bots are told it worked and nothing is sent.

**Delivery (`api/request.ts`).** A Vercel function emails each request through Resend. When an email was given it becomes the reply-to, so replying answers the requester. Set these in Vercel → Project → Settings → Environment Variables (see `.env.example`):
- `RESEND_API_KEY` (required);
- `REQUEST_TO`: your inbox (required);
- `REQUEST_FROM` (optional): a sender on a domain verified in Resend. Without it, Resend's test sender only delivers to your own Resend address.

Without the keys nothing is faked: the function refuses with "Requests aren't connected yet.", and the box shows "Couldn't send: …". The dev server runs the same function through a small Vite middleware and also prints the refused request in its terminal. Put the keys in `.env.local` to send real emails locally. `vercel.json` rewrites every path except `/api/` to the app.

## Sizing

Every figure looks the same size in its cell, whatever its motion does. Each one is sized by its rest pose (`rest` in `src/figures.ts` / `fintech.ts`, measured from rendered pixels): the rest pose's area, as a square's side, is 84% of the safe size. A long, flat one stops at 110% of the safe size across. Then, if a moving state (the balloon's flight, the box's open flaps) would leave the cell or reach the labels, the figure is made smaller or nudged until every state fits. The safe size is 60% of a gallery cell's width, clear of the labels, or 62% of a detail box's smaller side. This lives in `plane()` in `src/Illustration.tsx`.

## Sharing, titles and accessibility

- **Titles and descriptions:** each address has its own (`src/meta.ts`), e.g. "Compo — Coin tube". The app sets them as you move around. The build also writes them into a page of HTML per address (`dist/illustrations/fintech/coin-tube.html`…, served at the clean address through `cleanUrls`), so link previews and search engines see them without running the app.
- **Share images:** 1200 × 630, one for the site and one per illustration (the illustration at rest, its number, topic and name) in `public/og/`. Image and page addresses are absolute: `SITE_URL`, or Vercel's production domain. Regenerate them with `npm run og` after a figure changes; it draws them in Chrome from the figures themselves (`src/og.ts`, `scripts/og.mjs`).
- **Favicon:** a small isometric cube in the same hairline (`public/favicon.svg`, dark or light with the system), plus `favicon-32.png` and `apple-touch-icon.png`.
- **Accessibility:**
  - Each illustration is `role="img"` with a label like "Funnel illustration: conversion", on the site and in the React download.
  - Muted text measures 6.0:1 (dark) and 5.0:1 (light) against the background.
  - Gallery cells show a 1px highlight outline, inset, when focused by keyboard.
  - On a detail page, ← / → step through the illustrations.
  - With reduced motion, figures land at once and nothing idles.
- **Touch:** a tap on a part activates it and holds; a tap outside resets it. Tapping a gallery drawing explores it rather than opening the page.

## Performance

- **Figure files load per tab.** Each tab's figure files are their own chunk (`src/sources/marketing.ts`, `fintech.ts`, about 110 KB each), loaded when that tab or one of its pages opens. Hovering or focusing the tabs prefetches the other one, so switching stays instant. The first load went from 485 KB to about 380 KB of script; the main script went from 149 KB to about 90 KB gzipped, request form included.
- **Fetched in parallel.** The built page starts fetching the right chunk at once, with a tiny inline script that picks it from the address (`preloadTab` in `vite.config.ts`). So it doesn't wait for the main script, and the gallery is ready as fast as before (about 190 ms locally).
- **Gallery cells mount as they near the screen** (within 400 px, then stay). A phone mounts 2 figures on load instead of 10, and its script time fell from 30 ms to 18 ms.
- **Already handled by the kernel:** offscreen figures don't animate (it watches visibility), and a figure's frame loop stops once its motion settles. While idle, only the funnel's gears and the balloon's bob keep moving, by design.

## Downloads

Each illustration page leads with one full-width button, "Download React (.jsx)". The other formats sit under a collapsed "More formats": SVG (.zip), PNG, MP4, GIF, WebM and PNG sequence, each in the current theme's colours. Under them, "USE IT" shows the two lines that put the component on a page (Geist Mono 12px, with Copy) and its props: `theme`, `interactive`, `className`, plus any the figure adds (the subscription box's `mark`, the receipt's `logo`, `name` and `total`; a logo's path data is cut short with "…" in the snippet and copied in full). One renders at a time, and its row shows `Rendering… n%`. The encoders (`src/download/formats.ts`, `video.ts`) load on the first download, not with the page, so the site's own script stays at about 375 KB.

Each one draws from the same hidden copy of the figure (`src/download/scene.ts`): the figure file and kernel, unchanged, in a same-origin iframe on a virtual clock. Its `requestAnimationFrame` and `performance.now` advance only when told to, and its colour transitions are paused and stepped to the same clock. So every still and every frame is exact, however fast the machine is.

| Group | Format | What you get |
| --- | --- | --- |
| Code | React (.jsx) | The live, interactive component (below). |
| Image | SVG (.zip) | One SVG per state: `01-default.svg`, then `02-hover-<target>.svg` and on, one per hover target (4 to 12 per figure). |
| Image | PNG | The default state, 2000 px on the longer side, 4 px strokes, on the theme background, for slides. |
| Motion | MP4 | The demo loop, 1080 × 1080, 60 fps (below). |
| Motion | GIF | The same loop at 600 × 600, 25 fps, looping forever, for Notion and email. |
| Motion | WebM | The same loop on a transparent background, 1080 × 1080, 60 fps, VP9 with alpha, for the web. |
| Motion | PNG sequence (.zip) | The same loop as numbered transparent PNGs, 1080 × 1080, 30 fps, for video editors. |

**SVG states.**
- Each hover state starts from rest, the way a first hover would, and is given 2.5 s to settle before it is drawn.
- The files are cleaned for Figma and Illustrator:
  - only `path`, `g`, a `rect` and a `title`;
  - colours as plain hex attributes, and no styles, classes, masks or transforms;
  - strokes at the kernel's hairline width (0.9 in the drawing's units);
  - hidden layers dropped, and the background as its own layer (`id="background"`) that can be deleted.
- Every state uses the same crop, the drawing's extent over every state plus 6%, so the files stack and line up.

**GIF.**
- One fixed palette is built from the theme's tones and the antialiased steps between them, so no frame shifts colour.
- Each frame after the first stores only the pixels that moved; the rest show through from the frame before.
- That roughly halves the file (the funnel: 3.0 MB down to 1.4 MB) with identical pixels.

**Transparent video.** Browsers can't encode alpha directly. `mediabunny` encodes the alpha as a second VP9 stream and attaches it, which Chrome, Edge and Firefox play. Many video editors don't import transparent WebM, so the PNG sequence covers them. In both, the drawing's solid faces keep the theme's background colour, which is what hides the lines behind them, so it reads as a solid object over any backdrop.

**React component (.jsx).** `src/download/component.ts` writes one self-contained file per illustration, named after the illustration, such as `Funnel.jsx` or `CoinTube.jsx`, exporting the component by name (`import { Funnel } from './Funnel'`) and as the default: a comment block with props and usage, the colour tokens for both themes, the kernel and the figure (both unchanged), and a component that mounts it. It depends only on React. Props: `theme` (`"dark"` or `"light"`, default `"dark"`), `intensity` (the figure's own number, defaulting to the middle of its range), `interactive` (default `true`) and `className`. The current state is mirrored on the wrapper as `data-status`.

**Video (.mp4).** `src/download/video.ts` renders a scripted demo loop of 1080 × 1080 at 60 fps in the current theme. The script is rest → each hover target in order → rest. It shows only the drawing on the plain background, with no frame, labels, controls or cursor. The drawing's extent over every state fills the middle 70% of the frame. The figure runs in a hidden same-origin iframe on a virtual clock: its `requestAnimationFrame` and `performance.now` advance exactly 1/60 s per frame, and its colour transitions are paused and stepped to the same clock. Every frame is exact, however fast the machine renders. Each frame's svg is drawn to a canvas with its computed colours and strokes scaled to the frame. It is encoded with WebCodecs as H.264, at constant quality where supported, and muxed into an MP4 with `mp4-muxer`. Browsers without WebCodecs fall back to `MediaRecorder` with an MP4 type, recorded in real time. If neither can produce MP4, the button reports it. The button shows `Rendering… n%` while it works.

Loops are 8 seconds (480 frames), except the balloon at 9 seconds, two periods of its bob, so its loop is seamless. The folded map ends with the pin back on "discover". The funnel's gears and the tray's spin turn continuously, so those two loops show a small jump in the gears' and the tray's angle at the seam.

## Deploy (Vercel)

The site is a static Vite build, and `vercel.json` sets everything Vercel needs:
- framework Vite, install `npm ci`, build `npm run build`, output `dist`;
- `cleanUrls`, so each address is served its own built page (`illustrations/fintech/edc-payment.html`, with that page's title, description and share image);
- a rewrite of every other path, except `/api/`, to `index.html`, so any other address still loads the app (and shows the 404 page). Real files in `dist` are served first.

Node 20.19 or newer is required (`engines` in `package.json`), as Vite 7 needs it. The repo root must be this folder; it is pushed on its own to `github.com/fahmiauliya/Compo`.

Checked as Vercel would build it: a copy of this folder alone, with no Line Illustration beside it, installs with `npm ci` and builds clean. Served with the same fallback, the gallery shows all ten figures, and deep links to detail pages load directly.

## Checked

**Fonts.** Geist Medium (SIL Open Font License, Vercel) outlines are embedded as path data: the subscription box's letters and the default receipt logo in the figures, and `src/logo-glyphs.ts` for text in uploaded logos. Hershey Roman Simplex single strokes (from the MIT-licensed hersheytext package) are embedded in the receipt figure.

**React downloads in a fresh app (2026-10-12).** `Funnel.jsx`, `CoinTube.jsx` and `ApprovalStamp.jsx`, downloaded through the page's button, were dropped into a new Vite + React 18 app (React and React DOM only) and imported as `import { Funnel } from './Funnel'`. The app built and rendered in Chrome under StrictMode with no console errors:
- one drawing each, `role="img"` with its label, and the right background in dark and light;
- hover drove each one (stage 1, saving 1, approved) and leaving returned it;
- `interactive={false}` ignored hover;
- the default export worked too.

All ten in the gallery and the detail view, in both themes, with a hovered state. Both downloads were checked for every illustration:
- **Videos:** H.264 High, 1080 × 1080, 60 fps, 480 frames (540 for the balloon), decoded without errors, every hover state reached.
- **Components:** the ten `.jsx` files bundled into a plain React page and rendered in both themes.

Also checked:
- **Phone width:** 375 px has no horizontal scroll.
- **Touch:** a tap holds its state, and a tap outside resets it.
- **Reduced motion:** stops the tray.
