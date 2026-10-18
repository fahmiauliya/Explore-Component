// Builds the first-visit canvas from the Visuals sections in the data file,
// and keeps a saved canvas in step with later edits to that file.
import { getDomain, getSlug } from '../../lib/references.js';
import { labelHeight } from './labelColors.js';
import { FOLDER_PAD, TAB_H, fitFolder, tidyFolder } from './folders.js';

export const CARD_W = 280;
export const CARD_H = 263; // rendered height of a 280-wide card (tags, screenshot, text); re-measure if the card changes
export const GROUP_LABEL_FS = 20; // (v1) group labels started at M
export const LABEL_H = labelHeight(GROUP_LABEL_FS);
export { fitFolder };
const GAP = 24; // between cards
const LABEL_GAP = 16; // label -> cards
const GROUP_GAP = 80;
const FOLDER_GAP = 48; // between folders (tab to previous body)
// Default folder colours per section, tabs alternating left / right.
const FOLDER_COLORS = { fonts: 'paper', colors: 'sky', 'image-style': 'stone', 'illustration-style': 'lilac' };

export function linkId(url) {
  return `link:${getSlug(url)}`;
}

function linkItem(item, section, x, y, z) {
  return {
    id: linkId(item.url),
    type: 'link',
    x,
    y,
    w: CARD_W,
    h: CARD_H,
    z,
    locked: false,
    url: item.url,
    name: item.name,
    description: item.description,
    tags: item.tags,
    image: item.image,
    domain: getDomain(item.url),
    sectionId: section.id,
  };
}

export const folderId = (sectionId) => `folder:${sectionId}`;

const makeFolder = (section, i, z, x, y) => ({ id: folderId(section.id), type: 'folder', title: section.title, color: FOLDER_COLORS[section.id] || 'paper', tabSide: i % 2 === 0 ? 'left' : 'right', fontSize: 13, collapsed: false, autoSize: true, x, y, w: 320, h: 200, z, locked: false });

// 4 folders (Spread positions stacked 48px apart) each holding its link cards
// inside, 4 per row with 24px gaps. The default view is Stack.
export function buildDefaultItems(tab) {
  let items = [];
  let y = TAB_H;
  let z = 1;
  tab.sections.forEach((section, i) => {
    const folder = makeFolder(section, i, z++, 0, y);
    items.push(folder);
    section.items.forEach((item) => items.push({ ...linkItem(item, section, 0, 0, z++), parentId: folder.id, cx: 0, cy: 0 }));
    items = tidyFolder(items, folder.id);
    const fitted = items.find((it) => it.id === folder.id);
    y = fitted.y + fitted.h + FOLDER_GAP + TAB_H;
  });
  return items;
}

export const defaultLayout = (items) => ({ mode: 'stack', stack: { x: 0, y: TAB_H }, order: items.filter((it) => it.type === 'folder').map((it) => it.id) });

// v1 canvases: a label per section with the cards in a row under it.
export function migrateV1(saved, tab) {
  let items = saved.filter((it) => it.type !== 'folder');
  let z = items.reduce((m, it) => Math.max(m, it.z || 0), 0) + 1;
  tab.sections.forEach((section, i) => {
    const label = items.find((it) => it.id === `label:${section.id}`);
    if (!label) return;
    const folder = makeFolder(section, i, z++, label.x, label.y + TAB_H);
    folder.title = label.text || section.title;
    items = items.filter((it) => it.id !== label.id);
    items = items.map((it) => (it.type === 'link' && it.sectionId === section.id && !it.parentId ? { ...it, parentId: folder.id, cx: 0, cy: 0 } : it));
    items = [folder, ...items];
    items = tidyFolder(items, folder.id);
  });
  return repairV2(items, tab);
}

// v2 canvases stored children with world coordinates, and some folders ended
// up empty with their cards sitting loose below them. Convert and repair.
export function repairV2(saved, tab) {
  let items = saved.map((it) => ({ ...it }));
  const folders = items.filter((it) => it.type === 'folder').sort((a, b) => a.y - b.y);
  // 1. children with world x/y -> relative cx/cy
  items = items.map((it) => {
    if (!it.parentId || it.cx !== undefined) return it;
    const f = items.find((x) => x.id === it.parentId);
    if (!f) return { ...it, parentId: undefined };
    return { ...it, cx: Math.max(0, it.x - f.x - FOLDER_PAD), cy: Math.max(0, it.y - f.y - FOLDER_PAD) };
  });
  // 2. empty folders adopt the loose link cards between them and the next folder
  folders.forEach((f, i) => {
    if (items.some((it) => it.parentId === f.id)) return;
    const next = folders[i + 1];
    const loose = items.filter((it) => it.type === 'link' && !it.parentId && it.y >= f.y - TAB_H && (!next || it.y < next.y - TAB_H));
    if (!loose.length) return;
    const ids = new Set(loose.map((it) => it.id));
    items = items.map((it) => (ids.has(it.id) ? { ...it, parentId: f.id, cx: Math.max(0, it.x - f.x - FOLDER_PAD), cy: Math.max(0, it.y - f.y - FOLDER_PAD) } : it));
    items = tidyFolder(items, f.id);
  });
  // 3. any link card still loose but matching a section folder goes into it
  for (const f of folders) {
    const section = tab.sections.find((sec) => folderId(sec.id) === f.id);
    if (!section) continue;
    const loose = items.filter((it) => it.type === 'link' && !it.parentId && it.sectionId === section.id);
    if (!loose.length) continue;
    const ids = new Set(loose.map((it) => it.id));
    items = items.map((it) => (ids.has(it.id) ? { ...it, parentId: f.id, cx: 0, cy: 0 } : it));
    items = tidyFolder(items, f.id);
  }
  return items;
}

// Saved canvas + current data file -> items.
// New links are added at the end of their section's row; links that left the
// data file are removed. Labels and uploaded images are never touched.
export function mergeWithData(saved, tab) {
  const dataLinks = new Map();
  for (const section of tab.sections) for (const item of section.items) dataLinks.set(item.url, { item, section });

  let items = saved.filter((it) => it.type !== 'link' || dataLinks.has(it.url));
  // Refresh name/description/image from the data file so edits there show up.
  // Labels saved before colors existed: group labels become Black, others Gray.
  items = items.map((it) => {
    if (it.type === 'label') {
      const isGroup = tab.sections.some((sec) => it.id === `label:${sec.id}`);
      return { ...it, color: it.color === 'gray' || !it.color ? (isGroup && !it.color ? 'black' : 'white') : it.color, fontSize: it.fontSize || (isGroup ? GROUP_LABEL_FS : 14) };
    }
    if (it.type !== 'link') return it;
    const { item, section } = dataLinks.get(it.url);
    return { ...it, name: item.name, description: item.description, tags: item.tags, image: item.image, sectionId: section.id };
  });

  let z = items.reduce((m, it) => Math.max(m, it.z || 0), 0) + 1;
  const present = new Set(items.filter((it) => it.type === 'link').map((it) => it.url));
  let bottom = items.reduce((m, it) => Math.max(m, it.y + it.h), 0);

  for (const section of tab.sections) {
    for (const item of section.items) {
      if (present.has(item.url)) continue;
      const folder = items.find((it) => it.id === folderId(section.id));
      if (folder) {
        items.push({ ...linkItem(item, section, 0, 0, z++), parentId: folder.id, cx: 0, cy: 0 });
        present.add(item.url);
        items = tidyFolder(items, folder.id);
        continue;
      }
      // No folder for this section yet (it was deleted, or the data file gained a
      // section): add one below everything else and put the link in it.
      const i = tab.sections.indexOf(section);
      const made = makeFolder(section, i, z++, 0, bottom + FOLDER_GAP + TAB_H);
      items.push(made);
      items.push({ ...linkItem(item, section, 0, 0, z++), parentId: made.id, cx: 0, cy: 0 });
      present.add(item.url);
      items = tidyFolder(items, made.id);
      bottom = Math.max(bottom, ...items.map((it) => it.y + it.h));
      continue;
    }
  }
  return items;
}
