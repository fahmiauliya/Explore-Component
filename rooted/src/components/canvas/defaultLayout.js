// Builds the first-visit canvas from the Visuals sections in the data file,
// and keeps a saved canvas in step with later edits to that file.
import { getDomain, getSlug } from '../../lib/references.js';
import { labelHeight } from './labelColors.js';
import { FOLDER_PAD, fitFolder, tabMetrics, tidyFolder } from './folders.js';

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

// 4 folders stacked with 48px gaps, same left edge, tabs alternating sides,
// each holding its link cards in a tidy grid.
export function buildDefaultItems(tab) {
  let items = [];
  let y = 0;
  let z = 1;
  tab.sections.forEach((section, i) => {
    const folder = { id: folderId(section.id), type: 'folder', title: section.title, color: FOLDER_COLORS[section.id] || 'paper', tabSide: i % 2 === 0 ? 'left' : 'right', fontSize: 13, collapsed: false, autoSize: true, x: 0, y: 0, w: 320, h: 200, z: z++, locked: false };
    y += tabMetrics(folder).height; // room for the tab above the body
    folder.y = y;
    items.push(folder);
    section.items.forEach((item) => items.push({ ...linkItem(item, section, 0, 0, z++), parentId: folder.id }));
    items = tidyFolder(items, folder.id);
    const fitted = items.find((it) => it.id === folder.id);
    y = fitted.y + fitted.h + FOLDER_GAP;
  });
  return items;
}

// v1 canvases had a label per section with the cards in a row under it.
// Turn each of those 4 labels into a folder holding its section's cards;
// user labels and uploaded images stay exactly where they are.
export function migrateV1(saved, tab) {
  let items = saved.filter((it) => it.type !== 'folder');
  let z = items.reduce((m, it) => Math.max(m, it.z || 0), 0) + 1;
  tab.sections.forEach((section, i) => {
    const label = items.find((it) => it.id === `label:${section.id}`);
    if (!label) return;
    const folder = { id: folderId(section.id), type: 'folder', title: label.text || section.title, color: FOLDER_COLORS[section.id] || 'paper', tabSide: i % 2 === 0 ? 'left' : 'right', fontSize: 13, collapsed: false, autoSize: true, x: label.x, y: label.y + tabMetrics({ fontSize: 13 }).height, w: 320, h: 200, z: z++, locked: false };
    items = items.filter((it) => it.id !== label.id);
    items = items.map((it) => (it.type === 'link' && it.sectionId === section.id && !it.parentId ? { ...it, parentId: folder.id } : it));
    items = [folder, ...items];
    items = tidyFolder(items, folder.id);
  });
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
        items.push({ ...linkItem(item, section, folder.x + FOLDER_PAD, folder.y + FOLDER_PAD, z++), parentId: folder.id });
        present.add(item.url);
        items = tidyFolder(items, folder.id);
        continue;
      }
      // No folder for this section yet (it was deleted, or the data file gained a
      // section): add one below everything else and put the link in it.
      const i = tab.sections.indexOf(section);
      const made = { id: folderId(section.id), type: 'folder', title: section.title, color: FOLDER_COLORS[section.id] || 'paper', tabSide: i % 2 === 0 ? 'left' : 'right', fontSize: 13, collapsed: false, autoSize: true, x: 0, y: bottom + FOLDER_GAP + tabMetrics({ fontSize: 13 }).height, w: 320, h: 200, z: z++, locked: false };
      items.push(made);
      items.push({ ...linkItem(item, section, made.x + FOLDER_PAD, made.y + FOLDER_PAD, z++), parentId: made.id });
      present.add(item.url);
      items = tidyFolder(items, made.id);
      bottom = Math.max(bottom, ...items.map((it) => it.y + it.h));
      continue;
    }
  }
  return items;
}
