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

// ---- Bookmark trees ----
// The Bookmarks tab holds `children` (folders and bookmarks at any depth)
// instead of `sections`. These helpers read both shapes.
export const isTree = (tab) => Array.isArray(tab.children);
export const isFolder = (node) => node.type === 'folder';

// Every bookmark under `nodes`, depth-first, with the folders above it.
export function* walkBookmarks(nodes, path = []) {
  for (const node of nodes || []) {
    if (isFolder(node)) yield* walkBookmarks(node.children, [...path, node]);
    else yield { node, path };
  }
}

// The flattened item for a tree node (filled in by flattenItems).
const nodeItems = new WeakMap();
export const itemForNode = (node) => nodeItems.get(node);

// Every item from every tab in one flat list, each one tagged with
// its tab and section (or folder path) so search and random can show
// where it came from.
export function flattenItems() {
  const out = [];
  for (const tab of tabs) {
    if (isTree(tab)) {
      for (const { node, path } of walkBookmarks(tab.children)) {
        const folderIds = path.map((f) => f.id);
        const folderNames = path.map((f) => f.name);
        const parent = path[path.length - 1];
        const item = {
          ...node,
          image: node.thumbnail || node.image,
          key: `${tab.id}/${[...folderIds, node.id].join('/')}`,
          tabId: tab.id,
          tabLabel: tab.label,
          sectionId: parent ? parent.id : '',
          sectionTitle: parent ? parent.name : tab.label,
          folderIds,
          folderNames,
          pathLabel: [tab.label, ...folderNames].join(' / '),
          domain: getDomain(node.url),
        };
        nodeItems.set(node, item);
        out.push(item);
      }
      continue;
    }
    for (const section of tab.sections) {
      for (const item of section.items) {
        out.push({
          ...item,
          key: `${tab.id}/${section.id}/${getSlug(item.url)}`,
          tabId: tab.id,
          tabLabel: tab.label,
          sectionId: section.id,
          sectionTitle: section.title,
          pathLabel: `${tab.label} · ${section.title}`,
          domain: getDomain(item.url),
        });
      }
    }
  }
  return out;
}

export const allItems = flattenItems();

// Number of items in one tab (used for the header tab counts). For the
// Bookmarks tab that is every bookmark in every folder.
export function countItems(tab) {
  if (isTree(tab)) return [...walkBookmarks(tab.children)].length;
  return tab.sections.reduce((sum, section) => sum + section.items.length, 0);
}

// Folder helpers.
export const folderChildren = (folder) => (folder.children || []).filter(isFolder);
export const folderBookmarks = (folder) => (folder.children || []).filter((n) => !isFolder(n));
// { folders: direct subfolders, bookmarks: every bookmark inside, at any depth }
export function folderStats(folder) {
  return { folders: folderChildren(folder).length, bookmarks: [...walkBookmarks(folder.children)].length };
}
export function folderCountLabel(folder) {
  const { folders, bookmarks } = folderStats(folder);
  const b = `${bookmarks} bookmark${bookmarks === 1 ? '' : 's'}`;
  return folders ? `${folders} folder${folders === 1 ? '' : 's'} · ${b}` : b;
}
// The first `n` bookmarks for a folder's preview: its own first, then the
// first ones found inside its subfolders.
export function folderPreviews(folder, n = 3) {
  const own = folderBookmarks(folder).slice(0, n);
  if (own.length >= n) return own;
  const out = [...own];
  for (const { node } of walkBookmarks(folderChildren(folder))) {
    out.push(node);
    if (out.length >= n) break;
  }
  return out;
}
// Resolve folder ids to folder nodes; stops at the first id that doesn't exist.
export function folderPath(tab, ids) {
  const path = [];
  let nodes = tab.children || [];
  for (const id of ids || []) {
    const next = nodes.find((n) => isFolder(n) && n.id === id);
    if (!next) break;
    path.push(next);
    nodes = next.children || [];
  }
  return path;
}

// Case-insensitive search across name, description, domain, tab and section.
// Empty query: the first `limit` items. Otherwise: up to `limit` matches.
export function searchItems(query, limit = 12) {
  const q = query.trim().toLowerCase();
  if (!q) return allItems.slice(0, 8);
  const words = q.split(/\s+/);
  const matches = allItems.filter((item) => {
    const haystack = [item.name, item.description, item.domain, item.tabLabel, item.sectionTitle, ...(item.folderNames || []), ...(item.tags || [])]
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

// Tab id <-> URL hash helpers (#bookmarks, #bookmarks/galleries/awards, #components, …).
// The Websites tab became Bookmarks: #websites still resolves to it.
const HASH_ALIASES = { websites: 'bookmarks' };
export function parseHash(hash) {
  const parts = (hash || '').replace(/^#/, '').split('/').filter(Boolean);
  const first = HASH_ALIASES[parts[0]] || parts[0];
  const tab = tabs.find((t) => t.id === first) || tabs[0];
  const folderIds = tabs.some((t) => t.id === first) && isTree(tab) ? folderPath(tab, parts.slice(1)).map((f) => f.id) : [];
  return { tabId: tab.id, folderIds, legacy: Boolean(HASH_ALIASES[parts[0]]) };
}
export const hashFor = (tabId, folderIds = []) => `#${[tabId, ...folderIds].join('/')}`;
export function tabFromHash(hash) {
  return parseHash(hash).tabId;
}
