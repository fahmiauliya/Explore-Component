// Builds the first-visit canvas from the Visuals sections in the data file,
// and keeps a saved canvas in step with later edits to that file.
import { getDomain, getSlug } from '../../lib/references.js';
import { labelHeight } from './labelColors.js';

export const CARD_W = 280;
export const CARD_H = 263; // rendered height of a 280-wide card (tags, screenshot, text); re-measure if the card changes
export const GROUP_LABEL_FS = 20; // group labels start at M
export const LABEL_H = labelHeight(GROUP_LABEL_FS);
const GAP = 24; // between cards
const LABEL_GAP = 16; // label -> cards
const GROUP_GAP = 80;

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

export function buildDefaultItems(tab) {
  const items = [];
  let y = 0;
  let z = 1;
  for (const section of tab.sections) {
    items.push({ id: `label:${section.id}`, type: 'label', text: section.title, color: 'black', fontSize: GROUP_LABEL_FS, x: 0, y, w: 80, h: LABEL_H, z: z++, locked: false });
    y += LABEL_H + LABEL_GAP;
    section.items.forEach((item, i) => {
      items.push(linkItem(item, section, i * (CARD_W + GAP), y, z++));
    });
    y += CARD_H + GROUP_GAP;
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
      const row = items.filter((it) => it.type === 'link' && it.sectionId === section.id);
      let x = 0;
      let y;
      if (row.length) {
        const last = row.reduce((a, b) => (b.x + b.w > a.x + a.w ? b : a));
        x = last.x + last.w + GAP;
        y = last.y;
      } else {
        const label = items.find((it) => it.id === `label:${section.id}`);
        if (label) {
          x = label.x;
          y = label.y + label.h + LABEL_GAP;
        } else {
          y = bottom + GROUP_GAP;
          items.push({ id: `label:${section.id}`, type: 'label', text: section.title, color: 'black', fontSize: GROUP_LABEL_FS, x: 0, y, w: 80, h: LABEL_H, z: z++, locked: false });
          y += LABEL_H + LABEL_GAP;
          bottom = y + CARD_H;
        }
      }
      items.push(linkItem(item, section, x, y, z++));
      present.add(item.url);
    }
  }
  return items;
}
