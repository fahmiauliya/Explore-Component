import { categoryOf, type Category, type Entry } from './figures';

/*
 * Each page's title, description and share image. The app sets them as you move around (setMeta); the build writes
 * them into a page of HTML per address (vite.config.ts), because link previews and search engines don't run the app.
 */

export type Page = { entry: Entry } | { gallery: 'all' | Category } | { home: true } | { missing: true };
export type Meta = { path: string; title: string; description: string; image: string };

export const SITE_DESCRIPTION = 'Interactive components for product teams, starting with 20 line illustrations for marketing and fintech. Free for personal and commercial use.';

export function metaFor(page: Page): Meta {
  if ('entry' in page) {
    const e = page.entry;
    return {
      path: `/illustrations/${e.category}/${e.slug}`,
      title: `Compo — ${e.name}`,
      description: `${e.name}: an interactive line illustration for ${e.topic.toLowerCase() === e.topic ? e.topic : lower(e.topic)}. Hover to explore, then download it as a React component, SVG, PNG, MP4 or GIF.`,
      image: `/og/${e.slug}.png`,
    };
  }
  if ('home' in page) return { path: '/', title: 'Compo — Interactive line illustrations', description: SITE_DESCRIPTION, image: '/og/site.png' };
  if ('gallery' in page && page.gallery !== 'all') {
    const c = categoryOf(page.gallery)!;
    return {
      path: `/illustrations?c=${c.key}`,
      title: `Compo — ${c.label} illustrations`,
      description: `${c.entries.length} interactive ${c.label.toLowerCase()} line illustrations: ${list(c.entries.map((e) => lower(e.topic)))}. Free for personal and commercial use.`,
      image: '/og/site.png',
    };
  }
  if ('missing' in page) return { path: '/404', title: 'Compo — Page not found', description: SITE_DESCRIPTION, image: '/og/site.png' };
  return { path: '/illustrations', title: 'Compo — Illustrations', description: SITE_DESCRIPTION, image: '/og/site.png' };
}

/** "Credit score" → "credit score", but "ROI" stays "ROI". */
export const lower = (s: string) => s.split(' ').map((w) => (w === w.toUpperCase() ? w : w.toLowerCase())).join(' ');
const list = (items: string[]) => `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/** The tags a page's <head> carries, as HTML; `origin` makes the image and page addresses absolute. */
export function metaTags(m: Meta, origin: string) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    `<link rel="canonical" href="${origin}${m.path}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Compo">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:url" content="${origin}${m.path}">`,
    `<meta property="og:image" content="${origin}${m.image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(m.title)}">`,
    `<meta name="twitter:description" content="${esc(m.description)}">`,
    `<meta name="twitter:image" content="${origin}${m.image}">`,
  ].join('\n');
}

/** Sets the current page's title, description, canonical address and share tags in place. */
export function setMeta(page: Page) {
  const m = metaFor(page), origin = location.origin;
  document.title = m.title;
  const put = (selector: string, attr: string, value: string) => { const el = document.head.querySelector(selector); if (el) el.setAttribute(attr, value); };
  put('meta[name="description"]', 'content', m.description);
  put('link[rel="canonical"]', 'href', origin + m.path);
  for (const [k, v] of [['title', m.title], ['description', m.description], ['url', origin + m.path], ['image', origin + m.image]]) {
    put(`meta[property="og:${k}"]`, 'content', v);
    if (k !== 'url') put(`meta[name="twitter:${k}"]`, 'content', v);
  }
}
