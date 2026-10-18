# Rooted

A free website that lists design references as a grid of screenshot cards. Four tabs (Bookmarks, Components, Open Source, Visuals), search, a random pick and a request form. The Bookmarks tab works like Chrome bookmarks: folders inside folders, opened on the same page.

Built with React + Vite, plain JavaScript and one CSS file. No backend.

## Run it

```sh
npm install
npm run dev
```

Open http://localhost:5194/. To make a production build: `npm run build` (output in `dist/`).

## Add or change content

Everything lives in one file: `src/data/references.js`. The comment at the top shows the shape.

- **Add a reference** (Components, Open Source, Visuals): find the tab and section, then add a line like
  `{ name: 'Site', url: 'https://example.com', description: 'One short line.', tags: ['Tag', 'Tag'] }`.
  `tags` is optional: 2 or 3 short words shown as chips at the top of the card. Clicking a chip filters the tab by that tag (the filter also lives in the URL as `?tag=gallery`).
- **Add a bookmark or folder** (Bookmarks tab): the tab holds a `children` tree instead of sections. A folder is `{ type: 'folder', id: 'awards', name: 'Awards', children: [ … ] }` and a bookmark is `{ type: 'bookmark', id: 'awwwards', name: 'Awwwards', url: 'https://…', tags: ['Tag'], thumbnail: '/previews/my.jpg' }` (`thumbnail` optional, like `image`). Folders nest at any depth. Ids appear in the URL (`#bookmarks/galleries/awards`), so keep them short and unique inside their folder. Bookmark cards show the tags and the name only, no description.
- **"New" chip:** add `added: 'YYYY-MM-DD'` to an item. For 14 days after that date the card shows a "New" chip. Leave it out on older items.
- **Add a section:** inside a tab's `sections`, add `{ id, title, description, items: [] }`. The label and count appear automatically. The section `description` is kept in the data but is not shown on the page.
- **Add a social link:** add to `socials`. Allowed ids: `x`, `linkedin`, `instagram`, `threads`, `website`.

Tab counts, section counts, search and the random pick all read from this file. Nothing is hard-coded.

## The Bookmarks tab

- **Folders:** the top level shows folders first, then loose bookmarks. Clicking a folder opens it in place (subfolders first, then its bookmarks) and a breadcrumb above the grid (Bookmarks / Galleries / Awards, every part clickable) shows where you are. The URL hash carries the path (`#bookmarks/galleries/awards`), so the browser back button and a refresh land in the same folder. The old `#websites` hash redirects to `#bookmarks`. The tab count is every bookmark in every folder.
- **Folder card:** a macOS-style folder in the same grid as the cards: a gray back panel with a tab on the top right, 2–3 thumbnails of the bookmarks inside (for a folder with only subfolders, the first ones found inside them; an empty folder shows a plain sheet) peeking out above a frosted front panel that carries the favicon of the first bookmark (or a folder glyph), the name and "3 folders · 12 bookmarks". Hover lifts the papers 8px and fans them (−3°, 0°, 3°) while the front panel tilts back 7°; pressing scales the folder to 0.97 for 100ms; keyboard focus shows the neutral ring; with reduced motion only colors and shadows change.
- **Search:** ⌘K finds bookmarks inside any folder and shows the folder path in the row.
- **Tag pills:** every state (default, hover, selected, selected + hover, keyboard focus) uses the same 22px box with a 1px border; only the colors change, over 150ms, so toggling never shifts the layout.

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

The Visuals tab is a full-screen board instead of a grid, under the floating header and tabs. Its link cards come from the same data file; the first visit puts each data section's cards in a colored **section** (a tab on top, a body that holds the cards). The bars sit at the bottom: tools in the middle (+ Section, + Text, Upload image; they switch to the selection's controls while something is selected), the Sections list and zoom on the right, and an "i" button on the left with credits, social links, shortcuts and the board backup.

- **Move around:** scroll, hold Space and drag, or drag with the middle mouse button (one finger pans on touch). Pinch or ⌘/Ctrl + scroll to zoom (25–200%). The zoom bar has −, +, a snap-to-grid toggle and fit-to-content.
- **Select:** click, Shift + click, drag on empty space for a box (Shift + drag adds to the selection; a box that touches a section takes the section, not its cards), ⌘/Ctrl + A. The selection is drawn in the neutral text color: a 1.5px outline 4px outside the item that follows the item's corner radius, with the resize handles centered on its corners; sections stroke their own shape. Drag to move, handles to resize, arrow keys to nudge (Shift for 8px). Hold ⌘/Ctrl to drag without snapping.
- **Add:** "+ Section" adds an empty section below the last one and lets you name it. "+ Text" adds free text (double-click to edit, Enter for a new line, Esc to finish; filled or transparent background, color, S/M/L/XL, weight and alignment from the selection bar; drag a side handle to set a wrap width). "Upload image" adds images as white moodboard cards (also drag files onto the board, or paste). PNG, JPG, WebP, GIF and AVIF up to 10MB, 20 per drop; images are scaled to at most 1600px and stored as WebP. Inside a section, image cards flow in a masonry grid. Right-click an image for Add ribbon (then Edit text, Status, Side and Remove ribbon), Duplicate, Copy and Remove.
- **Sections:** the cards live inside colored sections laid out in a column. Each section sizes itself to its cards (32px padding, 280px cards, 24px gaps, up to 4 per row); drag its side handles to change the number of columns. Drag a card or image into a section's body to file it where the ghost shows; drag it out to remove it. "Tidy up" re-grids the contents, "Collapse" shrinks the section to its tab, and the menu also offers 8 colors, 4 tab sizes, the tab side, duplicate and delete (which can keep the items). The Sections button in the zoom bar (or ⌘J) lists every section; pick one to jump to it. The tab hugs its name; only a name wider than the section itself is cut with an ellipsis. Free text and images are kept clear of the sections.
- **Ribbons:** an uploaded image can carry a bookmark ribbon with up to 3 short lines (4, 8 and 8 characters) and a status: Saved (grey), Inspiration (blue), To review (yellow) or Favorite (red). Right-click the image, use the ribbon button in the selection bar, press R, or double-click the ribbon to edit it. The "i" popover can dim every image that doesn't have a chosen status.
- **Phones:** the options open as bottom sheets. Tap an item to select it, then drag to move it; one finger on empty space pans, two fingers pinch, and a long press opens the options.
- **Arrange:** the toolbar at the bottom and the right-click menu offer Edit, Duplicate (⌘D), Copy (⌘C), Open link, Bring to front (⌘]), Send to back (⌘[), Align and Distribute, Lock (⌘L) and Remove (Delete or Backspace; Esc deselects). ⌘V pastes the copied items (the right-click menu on empty space pastes them there), and Option + drag duplicates: the original stays and the copy follows the pointer. A copy of a card or image that lives in a section goes into that section's grid right after its original and the section grows to fit; a free copy lands 16px down-right of its original. Shortcuts stay off while you type in a field or edit text. ⌘Z / ⌘⇧Z undo and redo.
- **Saving:** every change is saved in the visitor's own browser 300ms after the last edit (layout in localStorage under `rooted:visuals-canvas:v5`, uploaded images as bytes in IndexedDB so they come back after a refresh or a tab switch). A small "Saved" note right of the tool bar reads "Saving…" while a save is pending. Older layouts (v1 to v4) are converted on first load.
- **Backup:** the "i" popover has "Export board" (downloads `rooted-board-YYYY-MM-DD.json` with the layout and the uploaded images as data URLs) and "Import board" (replaces the current board with a backup after a confirmation). Other people don't see those changes. "Reset canvas" in the right-click menu on empty space restores the default. If the data file gains or loses a Visuals link, the board picks that up on the next load without touching labels or uploaded images.

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
    components/canvas/      the Visuals board: canvas, sections, text, images, ribbons, menus, snapping, storage, backup
  scripts/capture-previews.mjs   screenshot script
  public/previews/          generated screenshots
```
