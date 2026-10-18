// Everything the canvas keeps in this browser:
//   - layout + view in localStorage (small JSON)
//   - uploaded images as bytes in IndexedDB (localStorage is too small for them)
// Every call is wrapped so a blocked or full storage never breaks the board.

const LS_KEY = 'rooted:visuals-canvas:v5';
const LEGACY_KEYS = ['rooted:visuals-canvas:v4', 'rooted:visuals-canvas:v3', 'rooted:visuals-canvas:v2', 'rooted:visuals-canvas:v1'];
const DB_NAME = 'rooted';
const DB_STORE = 'images';

// Returns { data, legacy }: `legacy` is 'v4' … 'v1' when only an older layout
// exists (kept until the first v5 save; see removeLegacy).
export function loadLayout() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { data: JSON.parse(raw), legacy: null };
    for (const key of LEGACY_KEYS) {
      const old = localStorage.getItem(key);
      if (old) return { data: JSON.parse(old), legacy: key.slice(-2) };
    }
  } catch {
    /* ignore */
  }
  return { data: null, legacy: null };
}

export function removeLegacy() {
  try {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function saveLayout(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearLayout() {
  try {
    localStorage.removeItem(LS_KEY);
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ---- IndexedDB ----

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no indexedDB'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('blocked'));
  });
}

function withStore(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, mode);
        const store = tx.objectStore(DB_STORE);
        const result = fn(store);
        tx.oncomplete = () => {
          db.close();
          resolve(result && 'result' in result ? result.result : undefined);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

// Images are stored as raw bytes + type rather than Blob objects: some browsers
// (Safari) hand back Blobs from IndexedDB that fail to load after a reload.
export const putImage = (key, blob) =>
  blob
    .arrayBuffer()
    .then((buf) => withStore('readwrite', (s) => s.put({ type: blob.type || 'image/webp', buf }, key)))
    .then(() => true)
    .catch(() => false);
const toBlob = (value) => (value instanceof Blob ? value : value && value.buf ? new Blob([value.buf], { type: value.type || 'image/webp' }) : null);
export const deleteImage = (key) => withStore('readwrite', (s) => s.delete(key)).then(() => true).catch(() => false);
export const clearImages = () => withStore('readwrite', (s) => s.clear()).then(() => true).catch(() => false);

// All stored images as a Map(key -> Blob).
export function getAllImages() {
  return openDb()
    .then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(DB_STORE, 'readonly');
          const store = tx.objectStore(DB_STORE);
          const out = new Map();
          const req = store.openCursor();
          req.onsuccess = () => {
            const cursor = req.result;
            if (!cursor) return;
            const blob = toBlob(cursor.value);
            if (blob) out.set(cursor.key, blob);
            cursor.continue();
          };
          tx.oncomplete = () => {
            db.close();
            resolve(out);
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        })
    )
    .catch(() => new Map());
}

// ---- Image files ----

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_SIDE = 1600;

// Scale an image file down (long side <= 1600px) and re-encode as WebP.
// Resolves { blob, width, height }.
export async function processImageFile(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!blob) throw new Error('encode failed');
  return { blob, width, height };
}

export function newImageKey() {
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
