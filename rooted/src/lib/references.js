// Small helpers that read the data file. Nothing here is hard-coded:
// counts, search and random all come from `tabs` in src/data/references.js.
import { tabs } from '../data/references.js';

// Turn a URL into a safe file name, e.g.
//   https://www.awwwards.com              -> awwwards-com
//   https://github.com/radix-ui/primitives -> github-com-radix-ui-primitives
// The screenshot script uses the same function, so names always match.
export function getSlug(url) {
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// "https://www.awwwards.com/some/page" -> "awwwards.com"
export function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Every item from every tab in one flat list, each one tagged with
// its tab and section so search and random can show where it came from.
export function flattenItems() {
  const out = [];
  for (const tab of tabs) {
    for (const section of tab.sections) {
      for (const item of section.items) {
        out.push({
          ...item,
          key: `${tab.id}/${section.id}/${getSlug(item.url)}`,
          tabId: tab.id,
          tabLabel: tab.label,
          sectionId: section.id,
          sectionTitle: section.title,
          domain: getDomain(item.url),
        });
      }
    }
  }
  return out;
}

export const allItems = flattenItems();

// Number of items in one tab (used for the header tab counts).
export function countItems(tab) {
  return tab.sections.reduce((sum, section) => sum + section.items.length, 0);
}

// Case-insensitive search across name, description, domain, tab and section.
// Empty query: the first `limit` items. Otherwise: up to `limit` matches.
export function searchItems(query, limit = 12) {
  const q = query.trim().toLowerCase();
  if (!q) return allItems.slice(0, 8);
  const words = q.split(/\s+/);
  const matches = allItems.filter((item) => {
    const haystack = [item.name, item.description, item.domain, item.tabLabel, item.sectionTitle]
      .join(' ')
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
  return matches.slice(0, limit);
}

// A random item, never the same as `excludeKey` (so "Another one" always changes).
export function randomItem(excludeKey) {
  const pool = allItems.length > 1 ? allItems.filter((item) => item.key !== excludeKey) : allItems;
  return pool[Math.floor(Math.random() * pool.length)];
}

// "Image style" -> "image-style" (used in ?tag= and for matching).
export function tagSlug(tag) {
  return String(tag).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Items added within the last 14 days get a "New" chip.
export function isNew(added, now = Date.now()) {
  if (!added) return false;
  const t = Date.parse(added);
  if (Number.isNaN(t)) return false;
  const age = now - t;
  return age >= 0 && age <= 14 * 24 * 60 * 60 * 1000;
}

// Find the display text of a tag from its slug (first match in the data).
export function tagLabel(slug) {
  for (const item of allItems) for (const tag of item.tags || []) if (tagSlug(tag) === slug) return tag;
  return slug;
}

// "https://www.example.com/path/" -> "example.com/path" for duplicate checks.
export function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return String(url).trim().toLowerCase();
  }
}

// "https://github.com/radix-ui/primitives" -> { owner, repo }; null for owner-only or other URLs.
export function githubRepo(url) {
  const m = String(url).match(/^https?:\/\/(?:www\.)?github\.com\/([^/?#]+)\/([^/?#]+)\/?(?:[?#].*)?$/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

// GitHub's social preview image for a repo, or null.
export function githubPreview(url) {
  const r = githubRepo(url);
  return r ? `https://opengraph.githubassets.com/1/${r.owner}/${r.repo}` : null;
}

// Tab id <-> URL hash helpers (#websites, #components, #open-source, #visuals).
export function tabFromHash(hash) {
  const id = (hash || '').replace(/^#/, '');
  return tabs.some((tab) => tab.id === id) ? id : tabs[0].id;
}
