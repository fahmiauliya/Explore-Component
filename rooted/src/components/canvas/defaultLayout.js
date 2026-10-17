// Builds the first-visit canvas from the Visuals sections in the data file,
// and keeps a saved canvas in step with later edits to that file.
import { getDomain, getSlug } from '../../lib/references.js';

export const CARD_W = 256;
export const CARD_H = 216;
export const LABEL_H = 21; // 14px text at line-height 1.5
const GAP = 16;
const GROUP_GAP = 64;

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
    items.push({ id: `label:${section.id}`, type: 'label', text: section.title, x: 0, y, w: 80, h: LABEL_H, z: z++, locked: false });
    y += LABEL_H + GAP;
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
  items = items.map((it) => {
    if (it.type !== 'link') return it;
    const { item, section } = dataLinks.get(it.url);
    return { ...it, name: item.name, description: item.description, image: item.image, sectionId: section.id };
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
          y = label.y + label.h + GAP;
        } else {
          y = bottom + GROUP_GAP;
          items.push({ id: `label:${section.id}`, type: 'label', text: section.title, x: 0, y, w: 80, h: LABEL_H, z: z++, locked: false });
          y += LABEL_H + GAP;
          bottom = y + CARD_H;
        }
      }
      items.push(linkItem(item, section, x, y, z++));
      present.add(item.url);
    }
  }
  return items;
}
