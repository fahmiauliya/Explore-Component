// Builds the first-visit canvas from the Visuals sections in the data file,
// and keeps a saved canvas in step with later edits to that file.
import { getDomain, getSlug } from '../../lib/references.js';
import { labelHeight } from './labelColors.js';
import { DEFAULT_COLS, SECTION_GAP, SECTION_PAD, TAB_H, fitSection, tidyAll, tidySection } from './sections.js';
import { labelToText, textSize } from './text.js';

export const CARD_W = 280;
export const CARD_H = 273; // rendered height of a 280-wide canvas card (12px padding, full-width 16:10 screenshot, text); re-measure if the card changes
export const GROUP_LABEL_FS = 20; // (v1) group labels started at M
export const LABEL_H = labelHeight(GROUP_LABEL_FS);
export { fitSection };
const GAP = 24; // between cards
const LABEL_GAP = 16; // label -> cards
const GROUP_GAP = 80;
// Default sec colours per section, tabs alternating left / right.
const SECTION_COLORS = { fonts: 'paper', colors: 'sky', 'image-style': 'stone', 'illustration-style': 'lilac' };

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

export const sectionItemId = (sectionId) => `section:${sectionId}`;
// World height of a top-level item: text measures itself, everything else stores h.
const heightOf = (it) => { const h = it.type === 'text' ? textSize(it).h : it.h; return Number.isFinite(h) ? h : 0; };

const makeSection = (section, i, z, x, y) => ({ id: sectionItemId(section.id), type: 'section', title: section.title, color: SECTION_COLORS[section.id] || 'paper', tabSide: 'left', fontSize: 16, cols: DEFAULT_COLS, collapsed: false, x, y, w: 344, h: 200, z, locked: false });

// 4 secs in one left-aligned column, 72px between one sec's bottom and
// the next tab's top, each holding its link cards (4 per row, 24px gaps).
export function buildDefaultItems(tab) {
  let items = [];
  let y = TAB_H;
  let z = 1;
  tab.sections.forEach((section, i) => {
    const sec = makeSection(section, i, z++, 0, y);
    items.push(sec);
    section.items.forEach((item) => items.push({ ...linkItem(item, section, 0, 0, z++), parentId: sec.id, cx: 0, cy: 0 }));
    items = tidySection(items, sec.id);
    const fitted = items.find((it) => it.id === sec.id);
    y = fitted.y + fitted.h + SECTION_GAP + TAB_H;
  });
  return items;
}

// Lay the given secs out as the default column (keeps their order, colors and children).
export function columnize(items, orderIds) {
  const secs = orderIds.map((id) => items.find((it) => it.id === id)).filter(Boolean);
  let y = TAB_H;
  let out = items;
  for (const f of secs) {
    out = out.map((it) => (it.id === f.id ? { ...it, x: 0, y } : it));
    const fitted = out.find((it) => it.id === f.id);
    y += fitted.h + SECTION_GAP + TAB_H;
  }
  return out;
}

// v4 boards (and anything older, after the earlier migrations): "folder" items
// become "section" items with new ids; tabs move from 13px to 16px.
export function migrateV4(items) {
  const idMap = new Map();
  for (const it of items) if (it.type === 'folder' && String(it.id).startsWith('folder:')) idMap.set(it.id, it.id.replace(/^folder:/, 'section:'));
  return items.map((it) => {
    let next = it;
    if (next.type === 'folder') next = { ...next, type: 'section', id: idMap.get(next.id) || next.id, fontSize: !next.fontSize || next.fontSize === 13 ? 16 : next.fontSize };
    if (next.type === 'label') next = labelToText(next);
    if (next.parentId && idMap.has(next.parentId)) next = { ...next, parentId: idMap.get(next.parentId) };
    return next;
  });
}

// v3 boards: drop the stack; a stacked board gets the default column in its
// stack order, a spread board keeps its positions. Everything re-tidies to the
// new 32px padding and 280px grid.
export function migrateV3(saved, tab) {
  let items = saved.items.map((it) => (it.type === 'section' ? { ...it, cols: it.cols || DEFAULT_COLS, tabSide: it.tabSide === 'right' ? 'right' : 'left' } : it));
  items = tidyAll(items);
  const lay = saved.layout;
  if (lay?.mode === 'stack') {
    const secs = items.filter((it) => it.type === 'section');
    const order = [...(lay.order || []).filter((id) => secs.some((f) => f.id === id)), ...secs.filter((f) => !(lay.order || []).includes(f.id)).map((f) => f.id)];
    items = columnize(items, order);
  }
  return items;
}

// v1 canvases: a label per section with the cards in a row under it.
export function migrateV1(saved, tab) {
  let items = saved.filter((it) => it.type !== 'section');
  let z = items.reduce((m, it) => Math.max(m, it.z || 0), 0) + 1;
  tab.sections.forEach((section, i) => {
    const label = items.find((it) => it.id === `label:${section.id}`);
    if (!label) return;
    const sec = makeSection(section, i, z++, label.x, label.y + TAB_H);
    sec.title = label.text || section.title;
    items = items.filter((it) => it.id !== label.id);
    items = items.map((it) => (it.type === 'link' && it.sectionId === section.id && !it.parentId ? { ...it, parentId: sec.id, cx: 0, cy: 0 } : it));
    items = [sec, ...items];
    items = tidySection(items, sec.id);
  });
  return repairV2(items, tab);
}

// v2 canvases stored children with world coordinates, and some secs ended
// up empty with their cards sitting loose below them. Convert and repair.
export function repairV2(saved, tab) {
  let items = saved.map((it) => ({ ...it }));
  const secs = items.filter((it) => it.type === 'section').sort((a, b) => a.y - b.y);
  // 1. children with world x/y -> relative cx/cy
  items = items.map((it) => {
    if (!it.parentId || it.cx !== undefined) return it;
    const f = items.find((x) => x.id === it.parentId);
    if (!f) return { ...it, parentId: undefined };
    return { ...it, cx: Math.max(0, it.x - f.x - SECTION_PAD), cy: Math.max(0, it.y - f.y - SECTION_PAD) };
  });
  // 2. empty secs adopt the loose link cards between them and the next sec
  secs.forEach((f, i) => {
    if (items.some((it) => it.parentId === f.id)) return;
    const next = secs[i + 1];
    const loose = items.filter((it) => it.type === 'link' && !it.parentId && it.y >= f.y - TAB_H && (!next || it.y < next.y - TAB_H));
    if (!loose.length) return;
    const ids = new Set(loose.map((it) => it.id));
    items = items.map((it) => (ids.has(it.id) ? { ...it, parentId: f.id, cx: Math.max(0, it.x - f.x - SECTION_PAD), cy: Math.max(0, it.y - f.y - SECTION_PAD) } : it));
    items = tidySection(items, f.id);
  });
  // 3. any link card still loose but matching a section sec goes into it
  for (const f of secs) {
    const section = tab.sections.find((sec) => sectionItemId(sec.id) === f.id);
    if (!section) continue;
    const loose = items.filter((it) => it.type === 'link' && !it.parentId && it.sectionId === section.id);
    if (!loose.length) continue;
    const ids = new Set(loose.map((it) => it.id));
    items = items.map((it) => (ids.has(it.id) ? { ...it, parentId: f.id, cx: 0, cy: 0 } : it));
    items = tidySection(items, f.id);
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
  // Lowest edge of the top-level items (children have no world y of their own).
  // Text items carry a measured height (mh) instead of h, so go through heightOf.
  const lowestEdge = (list) => list.filter((it) => !it.parentId && typeof it.y === 'number').reduce((m, it) => Math.max(m, it.y + heightOf(it)), 0);
  let bottom = lowestEdge(items);

  for (const section of tab.sections) {
    for (const item of section.items) {
      if (present.has(item.url)) continue;
      const sec = items.find((it) => it.id === sectionItemId(section.id));
      if (sec) {
        items.push({ ...linkItem(item, section, 0, 0, z++), parentId: sec.id, cx: 0, cy: 0 });
        present.add(item.url);
        items = tidySection(items, sec.id);
        continue;
      }
      // No sec for this section yet (it was deleted, or the data file gained a
      // section): add one below everything else and put the link in it.
      const i = tab.sections.indexOf(section);
      const made = makeSection(section, i, z++, 0, bottom + SECTION_GAP + TAB_H);
      items.push(made);
      items.push({ ...linkItem(item, section, 0, 0, z++), parentId: made.id, cx: 0, cy: 0 });
      present.add(item.url);
      items = tidySection(items, made.id);
      bottom = Math.max(bottom, lowestEdge(items));
      continue;
    }
  }
  return items;
}
