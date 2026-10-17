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
  `tags` is optional: 2 or 3 short words shown as pills at the top of the card.
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

Commit the generated images so the live site serves them as normal files.

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
  scripts/capture-previews.mjs   screenshot script
  public/previews/          generated screenshots
```
