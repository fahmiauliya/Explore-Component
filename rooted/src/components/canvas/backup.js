// Board backup: export everything (images as data URLs) to a JSON file, and
// read such a file back.
import { getAllImages } from './useCanvasStorage.js';

export const BACKUP_VERSION = 5;
const LIMIT_MB = 50;

const blobToDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

export async function exportBoard(items, view, snapGrid) {
  const blobs = await getAllImages();
  const used = new Set(items.filter((it) => it.type === 'image').map((it) => it.imageKey));
  const images = {};
  for (const [key, blob] of blobs) if (used.has(key)) images[key] = await blobToDataURL(blob);
  const payload = { app: 'rooted', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), view, snapGrid, items, images };
  const json = JSON.stringify(payload);
  const sizeMB = json.length / 1024 / 1024;
  const download = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rooted-board-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return { download, itemCount: items.length, imageCount: Object.keys(images).length, sizeMB: sizeMB.toFixed(1), tooBig: sizeMB > LIMIT_MB };
}

async function dataURLToBlob(dataURL) {
  const res = await fetch(dataURL);
  return res.blob();
}

// Parses a backup file. Throws when it isn't a Rooted board. Older versions
// go through the same migrations as saved boards.
export async function parseBackup(file, migrations) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || data.app !== 'rooted' || !Array.isArray(data.items)) throw new Error('not a rooted backup');
  const version = Number(data.version) || 0;
  if (version > BACKUP_VERSION) throw new Error('unsupported version');
  let items = data.items;
  const { migrateV1, repairV2, migrateV3, migrateV4, tab } = migrations;
  if (version <= 1) items = migrateV1(items, tab);
  if (version === 2) items = repairV2(items, tab);
  if (version <= 3) items = migrateV3({ items, layout: data.layout || null }, tab);
  if (version <= 4) items = migrateV4(items);
  const blobs = {};
  for (const [key, dataURL] of Object.entries(data.images || {})) {
    if (typeof dataURL === 'string' && dataURL.startsWith('data:')) blobs[key] = await dataURLToBlob(dataURL);
  }
  return { items, blobs, view: data.view || null };
}
