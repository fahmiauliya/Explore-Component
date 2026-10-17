# Rooted

A free website that lists design references in a clean, easy-to-scan way. Four tabs (Websites, Components, Open Source, Visuals), section filters, search, a random pick, and a preview image that follows the cursor.

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
  `{ name: 'Site', url: 'https://example.com', description: 'One short line.' }`.
- **Add a section:** inside a tab's `sections`, add `{ id, title, description, items: [] }`. The pill, number and count appear automatically.
- **Add a social link:** add to `socials`. Allowed ids: `x`, `linkedin`, `instagram`, `threads`, `website`.

Tab counts, the "X of Y" counter, section numbers, search and the random pick all read from this file. Nothing is hard-coded.

## Preview images

When you hover a card, a screenshot of that site floats next to the cursor. The images are made automatically.

1. Install Chromium once: `npx playwright install chromium`
2. After adding links, run `npm run previews`. It opens each new site, takes a 640 × 400 screenshot and saves it as `public/previews/<slug>.webp`. Existing images are skipped.
3. `npm run previews:force` retakes every image.

The file name is the URL without `https://` and `www.`, with everything that isn't a letter or digit turned into `-`. Example: `https://www.awwwards.com` becomes `awwwards-com.webp`.

Some sites show cookie banners or block automatic browsers. For those you can:

- drop your own 16:10 image in `public/previews/` with the same file name, or
- set `image: '/previews/my-image.jpg'` on the item in the data file.

If a local image is missing, the site falls back to the thum.io screenshot service (free, limited to about 1,000 loads a month), and after that to a gray placeholder with the favicon and domain.

Commit the generated images so the live site serves them as normal files.

## Change the intro text

The hero title, subtitle and button live in `src/components/Hero.jsx`.

## Request form

The "Send a request" form does **not** send anything yet. It only shows a thank-you screen. To connect it to an email or form service, look for the `TODO: connect form service` comment in `src/components/RequestDialog.jsx`.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| ⌘K / Ctrl K | Open or close search |
| 1–4 | Switch tabs |
| ⌘E / Ctrl E | Random reference |
| Esc | Close a dialog, or clear the section filter |

## Files

```
rooted/
  index.html
  src/
    App.jsx                 state, hash routing, keyboard shortcuts
    styles.css              all styles (CSS variables at the top)
    data/references.js      ALL content
    lib/references.js       helpers (slug, search, random, counts)
    components/             header, hero, filter bar, cards, cursor preview, dialogs, footer
  scripts/capture-previews.mjs   screenshot script
  public/previews/          generated screenshots
```
