# Rooted

A free website that lists design references as a grid of screenshot cards. Four tabs (Websites, Components, Open Source, Visuals), search, a random pick and a request form.

Built with React + Vite, plain JavaScript and one CSS file. No backend.

## Run it

```sh
npm install
npm run dev
```

Open http://localhost:5194/. To make a production build: `npm run build` (output in `dist/`).

## Add or change content

Everything lives in one file: `src/data/references.js`. The comment at the top shows the shape.

- **Add a reference:** find the tab and section, then add a line like
  `{ name: 'Site', url: 'https://example.com', description: 'One short line.', tags: ['Tag', 'Tag'] }`.
  `tags` is optional: 2 or 3 short words shown as chips at the top of the card. Clicking a chip filters the tab by that tag (the filter also lives in the URL as `?tag=gallery`).
- **"New" chip:** add `added: 'YYYY-MM-DD'` to an item. For 14 days after that date the card shows a "New" chip. Leave it out on older items.
- **Add a section:** inside a tab's `sections`, add `{ id, title, description, items: [] }`. The label and count appear automatically. The section `description` is kept in the data but is not shown on the page.
- **Add a social link:** add to `socials`. Allowed ids: `x`, `linkedin`, `instagram`, `threads`, `website`.

Tab counts, section counts, search and the random pick all read from this file. Nothing is hard-coded.

## Preview images

Each card shows a screenshot of its site. The images are made automatically.

1. Install Chromium once: `npx playwright install chromium`
2. After adding links, run `npm run previews`. It opens each new site, takes a 640 × 400 screenshot and saves it as `public/previews/<slug>.webp`. Existing images are skipped.
3. `npm run previews:force` retakes every image.

The file name is the URL without `https://` and `www.`, with everything that isn't a letter or digit turned into `-`. Example: `https://www.awwwards.com` becomes `awwwards-com.webp`.

Some sites block automatic browsers with a bot check. The script refuses to save the check page and reports `✗ name: blocked by a bot check`. For those:

1. Try again with your installed Google Chrome in a visible window, which passes most checks:
   `npm run previews -- --headed --only lapa-ninja,saaspo-com` (slugs are the file names without `.webp`).
2. If a site still blocks, drop your own 16:10 image in `public/previews/` with the same file name, or set `image: '/previews/my-image.jpg'` on the item in the data file. A screenshot of the page in the Wayback Machine works well for this.

Ad and tracker requests are blocked during capture so banners don't end up in the images.

If a local image is missing, the card falls back to the thum.io screenshot service (free, limited to about 1,000 loads a month), and after that to a gray placeholder with the favicon and domain. The step that worked is remembered per item, so failed images are not requested again.

**GitHub repos** (`github.com/{owner}/{repo}`) don't get a screenshot. The script asks the GitHub API for the README and uses its first real showcase image (at least 600px wide, wider than tall); if there is none it uses the repo's social preview. The result is saved uncropped and listed in `public/previews/manifest.json` with its source (`readme` images are shown cropped to 16:10, `social` cards are shown whole). The API allows 60 requests an hour without a token; set `GITHUB_TOKEN=ghp_…` in the environment to raise that. Owner-only links such as `github.com/phosphor-icons` keep a screenshot, and the log suggests the likely main repo.

Commit the generated images so the live site serves them as normal files.

## The Visuals canvas

The Visuals tab is a full-screen board instead of a grid, under the floating header and tabs. Its link cards come from the same data file; the first visit puts each section's cards in a colored **folder** (a tab on top, a body that holds the cards). The bars sit at the bottom: tools in the middle (add a label or upload; they switch to Edit, Align, Lock and Delete while something is selected), zoom on the right, and an "i" button on the left with credits, social links and shortcuts.

- **Move around:** drag empty space, hold Space and drag, or scroll. Pinch or ⌘/Ctrl + scroll to zoom (25–200%). The zoom bar has −, +, a snap-to-grid toggle and fit-to-content.
- **Select:** click, Shift + click, Shift + drag for a box, ⌘/Ctrl + A. Drag to move, corner handles to resize, arrow keys to nudge (Shift for 8px). Hold Alt/Option to drag without snapping.
- **Add:** "+ Label" (presets or custom text; double-click a label to rename it) and "Upload image" (also drag files onto the board, or paste). PNG, JPG, WebP, GIF and AVIF up to 10MB, 20 per drop; images are scaled to at most 1600px and stored as WebP.
- **Folders:** the cards live inside colored folders, one per section, laid out in a column. Each folder sizes itself to its cards (32px padding, 280px cards, 24px gaps, up to 4 per row); drag its side handles to change the number of columns. Drag a card or image into a folder's body to file it where the ghost shows; drag it out to remove it. "+ Folder" adds an empty one. "Tidy up" re-grids the contents, "Collapse" shrinks the folder to its tab, and the menu also offers 8 colors, 4 tab sizes, the tab side, duplicate and delete (which can keep the items). Free labels and images are kept clear of the folders.
- **Ribbons:** an uploaded image can carry a bookmark ribbon with up to 3 short lines (4, 8 and 8 characters) and a status: Saved (grey), Inspiration (blue), To review (yellow) or Favorite (red). Right-click the image, use the ribbon button in the selection bar, press R, or double-click the ribbon to edit it. The "i" popover can dim every image that doesn't have a chosen status.
- **Label colors and sizes:** labels are chips with 9 preset colors (White is the default) plus a custom color, and four sizes S/M/L/XL (14–40px). Change them from the selection bar or the right-click menu. Side handles change a label's width; corner handles scale it. Color, size and width are saved with the label.
- **Phones:** the options open as bottom sheets. Tap an item to select it, then drag to move it; one finger on empty space pans, two fingers pinch, and a long press opens the options.
- **Arrange:** the toolbar at the bottom and the right-click menu offer Edit, Duplicate (⌘D), Open link, Bring to front (⌘]), Send to back (⌘[), Align and Distribute, Lock (⌘L) and Remove. ⌘Z / ⌘⇧Z undo and redo.
- **Saving:** every change is saved in the visitor's own browser (layout in localStorage under `rooted:visuals-canvas:v4`, images in IndexedDB). Older layouts (v1 to v3) are converted on first load. Other people don't see those changes. "Reset canvas" in the right-click menu on empty space restores the default. If the data file gains or loses a Visuals link, the board picks that up on the next load without touching labels or uploaded images.

## Change the intro text

The three intro lines under the header live in `src/components/Intro.jsx`. The footer text lives in `src/components/Footer.jsx`.

## Request form

The "Send a request" form does **not** send anything yet. It only shows a thank-you screen. To connect it to an email or form service, look for the `TODO: connect form service` comment in `src/components/RequestDialog.jsx`.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| ⌘K / Ctrl K | Open or close search |
| 1–4 | Switch tabs |
| ⌘E / Ctrl E | Random reference |
| Esc | Close a dialog |

## Files

```
rooted/
  index.html
  src/
    App.jsx                 state, hash routing, keyboard shortcuts
    styles.css              all styles (colors, type sizes and spacing scale at the top)
    data/references.js      ALL content
    lib/references.js       helpers (slug, search, random, counts)
    lib/platform.js         ⌘ vs Ctrl labels
    components/             header, intro, tabs, cards, preview image, dialogs, footer
    components/canvas/      the Visuals board: canvas, items, toolbars, menu, snapping, storage
  scripts/capture-previews.mjs   screenshot script
  public/previews/          generated screenshots
```
