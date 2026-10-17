import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tabs } from '../../data/references.js';
import { modLabel } from '../../lib/platform.js';
import Modal from '../Modal.jsx';
import {
  BringFrontIcon,
  CloseIcon,
  CopyIcon,
  ExternalLinkIcon,
  FrameIcon,
  GridIcon,
  ImageIcon,
  LockIcon,
  PencilIcon,
  ResetIcon,
  SendBackIcon,
  TagIcon,
  TrashIcon,
  UnlockIcon,
  ZoomInIcon,
  AlignLeftIcon,
} from '../Icons.jsx';
import CanvasItem from './CanvasItem.jsx';
import Guides from './Guides.jsx';
import ZoomBar from './ZoomBar.jsx';
import ToolBar, { LABEL_PRESETS } from './ToolBar.jsx';
import InfoPopover from './InfoPopover.jsx';
import ContextMenu from './ContextMenu.jsx';
import { alignEntries } from './alignEntries.jsx';
import { buildDefaultItems, mergeWithData, LABEL_H } from './defaultLayout.js';
import * as storage from './useCanvasStorage.js';
import { bounds, snapMove, snapResize, snapValue } from './snapping.js';

const visualsTab = tabs.find((t) => t.id === 'visuals');
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
const IMAGE_W = 280;
const HINT_KEY = 'rooted:visuals-hint:v1';
// Space kept clear by "fit": the floating header + tabs on top, the bars at the bottom.
const SAFE = { top: 128, bottom: 88, side: 48 };
const CAPTION_H = 22; // 12px caption at 1.5 + 4px gap
const DRAG_START = 3; // screen px before a press becomes a drag
const LONG_PRESS = 500;

const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
const newId = (type) => `${type}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Link cards keep their shape as they grow: screenshot (16:10) plus the text block.
// The real height is measured after render; this keeps resizing smooth.
export const cardHeight = (w) => Math.round(w * 0.625 + 94);
const imageHeight = (item, w) => Math.round(w / item.ratio) + (item.caption ? CAPTION_H : 0);

export default function VisualsCanvas() {
  const canvasRef = useRef(null);
  const [items, setItemsState] = useState([]);
  const itemsRef = useRef([]);
  const [view, setViewState] = useState({ panX: 0, panY: 0, zoom: 1 });
  const viewRef = useRef(view);
  const [selection, setSelectionState] = useState([]);
  const selectionRef = useRef([]);
  const [snapGrid, setSnapGridState] = useState(true);
  const snapGridRef = useRef(true);
  const [editingId, setEditingIdState] = useState(null);
  const editingRef = useRef(null);
  const [menu, setMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [images, setImages] = useState({});
  const [overlay, setOverlay] = useState({ guides: [], spacings: [], box: null });
  const [draggingIds, setDraggingIds] = useState(null);
  const [cursor, setCursor] = useState(''); // '' | 'grab' | 'grabbing'
  const [dialog, setDialog] = useState(null); // { type: 'reset' } | { type: 'image', id, caption, url }
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState(() => {
    try {
      return !localStorage.getItem(HINT_KEY);
    } catch {
      return true;
    }
  });

  const history = useRef({ past: [], future: [] });
  const sizeRef = useRef({ w: 0, h: 0 });
  const gesture = useRef(null);
  const pointers = useRef(new Map());
  const latest = useRef(null);
  const raf = useRef(0);
  const spaceRef = useRef(false);
  const saveTimer = useRef(0);
  const toastTimer = useRef(0);
  const longPress = useRef(0);
  const pendingFit = useRef(false);
  const lastPress = useRef({ id: null, time: 0, x: 0, y: 0 }); // for double-click / double-tap

  // ---- tiny state helpers that keep refs in sync for event handlers ----
  const setItems = useCallback((next) => {
    itemsRef.current = next;
    setItemsState(next);
  }, []);
  const setView = useCallback((v) => {
    viewRef.current = v;
    setViewState(v);
  }, []);
  const setSelection = useCallback((ids) => {
    selectionRef.current = ids;
    setSelectionState(ids);
  }, []);
  const setEditingId = useCallback((id) => {
    editingRef.current = id;
    setEditingIdState(id);
  }, []);
  const setSnapGrid = (v) => {
    snapGridRef.current = v;
    setSnapGridState(v);
  };

  const showToast = useCallback((text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ---- history ----
  const pushHistory = useCallback((prev) => {
    const h = history.current;
    h.past.push(prev);
    if (h.past.length > 50) h.past.shift();
    h.future = [];
  }, []);
  const commit = useCallback(
    (next) => {
      pushHistory(itemsRef.current);
      setItems(next);
    },
    [pushHistory, setItems]
  );
  const keepExisting = useCallback(
    (list) => setSelection(selectionRef.current.filter((id) => list.some((it) => it.id === id))),
    [setSelection]
  );
  const undo = useCallback(() => {
    const h = history.current;
    const prev = h.past.pop();
    if (!prev) return;
    h.future.push(itemsRef.current);
    setItems(prev);
    keepExisting(prev);
  }, [keepExisting, setItems]);
  const redo = useCallback(() => {
    const h = history.current;
    const next = h.future.pop();
    if (!next) return;
    h.past.push(itemsRef.current);
    setItems(next);
    keepExisting(next);
  }, [keepExisting, setItems]);

  // ---- coordinates ----
  const canvasRect = () => canvasRef.current.getBoundingClientRect();
  const toWorld = useCallback((clientX, clientY) => {
    const r = canvasRect();
    const v = viewRef.current;
    return { x: (clientX - r.left - v.panX) / v.zoom, y: (clientY - r.top - v.panY) / v.zoom };
  }, []);
  const toScreen = useCallback((wx, wy) => ({ x: wx * view.zoom + view.panX, y: wy * view.zoom + view.panY }), [view]);
  const viewCenterWorld = () => {
    const { w, h } = sizeRef.current;
    const v = viewRef.current;
    const cy = SAFE.top + (h - SAFE.top - SAFE.bottom) / 2;
    return { x: (w / 2 - v.panX) / v.zoom, y: (cy - v.panY) / v.zoom };
  };

  const dismissHint = () => {
    setHint(false);
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  // ---- zoom / fit ----
  const zoomTo = useCallback(
    (newZoom, sx, sy) => {
      const v = viewRef.current;
      const z = clampZoom(newZoom);
      if (sx === undefined) {
        sx = sizeRef.current.w / 2;
        sy = sizeRef.current.h / 2;
      }
      const wx = (sx - v.panX) / v.zoom;
      const wy = (sy - v.panY) / v.zoom;
      setView({ zoom: z, panX: sx - wx * z, panY: sy - wy * z });
      setMenu(null);
    },
    [setView]
  );
  const fitToContent = useCallback(
    (list = itemsRef.current) => {
      const b = bounds(list);
      const { w, h } = sizeRef.current;
      if (!b || !w || !h) return;
      const aw = w - 2 * SAFE.side;
      const ah = h - SAFE.top - SAFE.bottom;
      const z = clampZoom(Math.min(aw / b.w, ah / b.h, 1));
      setView({ zoom: z, panX: SAFE.side + (aw - b.w * z) / 2 - b.x * z, panY: SAFE.top + (ah - b.h * z) / 2 - b.y * z });
      setMenu(null);
    },
    [setView]
  );

  // ---- load once ----
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = storage.loadLayout();
      const blobs = await storage.getAllImages();
      if (!alive) return;
      const urls = {};
      for (const [key, blob] of blobs) urls[key] = URL.createObjectURL(blob);
      setImages(urls);
      let list;
      if (saved?.items?.length) {
        list = mergeWithData(saved.items, visualsTab);
        if (saved.view) setView(saved.view);
        else pendingFit.current = true;
        if (typeof saved.snapGrid === 'boolean') setSnapGrid(saved.snapGrid);
      } else {
        list = buildDefaultItems(visualsTab);
        pendingFit.current = true;
      }
      setItems(list);
      setReady(true);
      if (pendingFit.current && sizeRef.current.w) {
        pendingFit.current = false;
        fitToContent(list);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Canvas size (for fit and zoom-around-center).
  useEffect(() => {
    const el = canvasRef.current;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      sizeRef.current = { w: r.width, h: r.height };
      if (pendingFit.current && itemsRef.current.length) {
        pendingFit.current = false;
        fitToContent();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitToContent]);

  // ---- save (300ms after the last change) ----
  useEffect(() => {
    if (!ready) return undefined;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const ok = storage.saveLayout({ items: itemsRef.current, view: viewRef.current, snapGrid });
      if (!ok) showToast("Couldn't save in this browser.");
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [items, view, snapGrid, ready, showToast]);

  // ---- wheel: pan, or zoom with ⌘/Ctrl (trackpad pinch arrives as ctrl+wheel) ----
  useEffect(() => {
    const el = canvasRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      setMenu(null);
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        zoomTo(viewRef.current.zoom * Math.exp(-e.deltaY * 0.003), e.clientX - r.left, e.clientY - r.top);
      } else {
        const v = viewRef.current;
        setView({ ...v, panX: v.panX - e.deltaX, panY: v.panY - e.deltaY });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setView, zoomTo]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(toastTimer.current);
      clearTimeout(longPress.current);
    },
    []
  );

  // ---- selection helpers ----
  const selectedItems = useMemo(() => items.filter((it) => selection.includes(it.id)), [items, selection]);
  const maxZ = () => itemsRef.current.reduce((m, it) => Math.max(m, it.z), 0);

  const deleteSelected = useCallback(() => {
    const sel = selectionRef.current;
    const removing = itemsRef.current.filter((it) => sel.includes(it.id) && !it.locked);
    if (!removing.length) return;
    const next = itemsRef.current.filter((it) => !removing.includes(it));
    commit(next);
    keepExisting(next);
    for (const it of removing) {
      if (it.type === 'image' && !next.some((o) => o.type === 'image' && o.imageKey === it.imageKey)) {
        storage.deleteImage(it.imageKey);
      }
    }
  }, [commit, keepExisting]);

  const duplicateSelected = useCallback(() => {
    const sel = selectionRef.current;
    let z = maxZ();
    const copies = itemsRef.current
      .filter((it) => sel.includes(it.id))
      .map((it) => ({ ...it, id: newId(it.type), x: it.x + 16, y: it.y + 16, z: ++z, locked: false }));
    if (!copies.length) return;
    commit([...itemsRef.current, ...copies]);
    setSelection(copies.map((c) => c.id));
  }, [commit, setSelection]);

  const bringToFront = useCallback(() => {
    const sel = selectionRef.current;
    let z = maxZ();
    commit(itemsRef.current.map((it) => (sel.includes(it.id) ? { ...it, z: ++z } : it)));
  }, [commit]);

  const sendToBack = useCallback(() => {
    const sel = selectionRef.current;
    let z = itemsRef.current.reduce((m, it) => Math.min(m, it.z), 0);
    commit(itemsRef.current.map((it) => (sel.includes(it.id) ? { ...it, z: --z } : it)));
  }, [commit]);

  const toggleLock = useCallback(() => {
    const sel = selectionRef.current;
    const chosen = itemsRef.current.filter((it) => sel.includes(it.id));
    if (!chosen.length) return;
    const lock = !chosen.every((it) => it.locked);
    commit(itemsRef.current.map((it) => (sel.includes(it.id) ? { ...it, locked: lock } : it)));
  }, [commit]);

  const align = useCallback(
    (kind) => {
      const sel = selectionRef.current;
      const chosen = itemsRef.current.filter((it) => sel.includes(it.id));
      if (chosen.length < 2) return;
      const box = bounds(chosen);
      const pos = new Map();
      if (kind.startsWith('distribute')) {
        if (chosen.length < 3) return;
        const horizontal = kind === 'distribute-h';
        const sorted = [...chosen].sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));
        const total = horizontal ? box.w - sorted.reduce((s, it) => s + it.w, 0) : box.h - sorted.reduce((s, it) => s + it.h, 0);
        const gap = total / (sorted.length - 1);
        let cursorPos = horizontal ? box.x : box.y;
        for (const it of sorted) {
          pos.set(it.id, horizontal ? { x: cursorPos } : { y: cursorPos });
          cursorPos += (horizontal ? it.w : it.h) + gap;
        }
      } else {
        for (const it of chosen) {
          if (kind === 'left') pos.set(it.id, { x: box.x });
          if (kind === 'center') pos.set(it.id, { x: box.x + box.w / 2 - it.w / 2 });
          if (kind === 'right') pos.set(it.id, { x: box.x + box.w - it.w });
          if (kind === 'top') pos.set(it.id, { y: box.y });
          if (kind === 'middle') pos.set(it.id, { y: box.y + box.h / 2 - it.h / 2 });
          if (kind === 'bottom') pos.set(it.id, { y: box.y + box.h - it.h });
        }
      }
      commit(itemsRef.current.map((it) => (pos.has(it.id) && !it.locked ? { ...it, ...pos.get(it.id) } : it)));
    },
    [commit]
  );

  const nudge = useCallback(
    (dx, dy) => {
      const sel = selectionRef.current;
      if (!sel.length) return;
      commit(itemsRef.current.map((it) => (sel.includes(it.id) && !it.locked ? { ...it, x: it.x + dx, y: it.y + dy } : it)));
    },
    [commit]
  );

  // ---- adding things ----
  const addLabel = useCallback(
    (text) => {
      const c = viewCenterWorld();
      const id = newId('label');
      const item = { id, type: 'label', text: text || 'Label', x: snapValue(c.x - 40), y: snapValue(c.y - LABEL_H / 2), w: 80, h: LABEL_H, z: maxZ() + 1, locked: false };
      commit([...itemsRef.current, item]);
      setSelection([id]);
      if (!text) setEditingId(id);
      canvasRef.current?.focus({ preventScroll: true });
    },
    [commit, setSelection, setEditingId]
  );

  const addFiles = useCallback(
    async (files, at) => {
      const valid = [];
      for (const f of files) {
        if (!f.type.startsWith('image/')) showToast(`${f.name} isn't an image.`);
        else if (f.size > storage.MAX_FILE_BYTES) showToast(`${f.name} is larger than 10MB.`);
        else valid.push(f);
      }
      if (!valid.length) return;
      const origin = at || viewCenterWorld();
      let x = origin.x;
      let z = maxZ();
      const added = [];
      const urls = {};
      let saveFailed = false;
      for (const f of valid) {
        try {
          const { blob, width, height } = await storage.processImageFile(f);
          const key = storage.newImageKey();
          if (!(await storage.putImage(key, blob))) saveFailed = true;
          urls[key] = URL.createObjectURL(blob);
          const w = IMAGE_W;
          added.push({ id: newId('image'), type: 'image', imageKey: key, ratio: width / height, x: snapValue(x), y: snapValue(origin.y), w, h: Math.round(w * height / width), z: ++z, locked: false });
          x += w + 16;
        } catch {
          showToast(`Couldn't read ${f.name}.`);
        }
      }
      if (saveFailed) showToast("Couldn't save in this browser.");
      if (!added.length) return;
      setImages((prev) => ({ ...prev, ...urls }));
      commit([...itemsRef.current, ...added]);
      setSelection(added.map((it) => it.id));
    },
    [commit, setSelection, showToast]
  );

  const openLink = (item) => item.url && window.open(item.url, '_blank', 'noopener,noreferrer');

  const startEdit = useCallback(() => {
    const chosen = itemsRef.current.filter((it) => selectionRef.current.includes(it.id));
    if (chosen.length !== 1) return;
    const it = chosen[0];
    if (it.type === 'label') setEditingId(it.id);
    if (it.type === 'image') setDialog({ type: 'image', id: it.id, caption: it.caption || '', url: it.url || '' });
  }, [setEditingId]);

  const resetCanvas = useCallback(async () => {
    storage.clearLayout();
    await storage.clearImages();
    for (const url of Object.values(images)) URL.revokeObjectURL(url);
    setImages({});
    history.current = { past: [], future: [] };
    const list = buildDefaultItems(visualsTab);
    setItems(list);
    setSelection([]);
    setDialog(null);
    fitToContent(list);
  }, [fitToContent, images, setItems, setSelection]);

  // ---- pointer gestures ----
  const trackPointer = (e) => pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const endGesture = () => {
    gesture.current = null;
    setOverlay({ guides: [], spacings: [], box: null });
    setDraggingIds(null);
    setCursor(spaceRef.current ? 'grab' : '');
  };

  function startPinch() {
    const pts = [...pointers.current.values()];
    if (pts.length < 2) return;
    const v = viewRef.current;
    gesture.current = { type: 'pinch', startDist: dist(pts[0], pts[1]), startMid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }, startView: v };
    clearTimeout(longPress.current);
    setDraggingIds(null);
  }

  function startPan(e) {
    gesture.current = { type: 'pan', pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startView: viewRef.current };
    canvasRef.current.setPointerCapture(e.pointerId);
    setCursor('grabbing');
  }

  function armLongPress(e, item) {
    if (e.pointerType !== 'touch') return;
    clearTimeout(longPress.current);
    const { clientX, clientY } = e;
    longPress.current = setTimeout(() => {
      gesture.current = null;
      try {
        canvasRef.current.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      openMenuAt(clientX, clientY, item);
    }, LONG_PRESS);
  }

  function onItemPointerDown(e, item) {
    if (e.button !== 0) return;
    if (editingRef.current) return;
    if (e.target.closest?.('.citem__label-edit')) return;
    e.stopPropagation();
    canvasRef.current.focus({ preventScroll: true });
    setMenu(null);
    trackPointer(e);
    if (pointers.current.size >= 2) return startPinch();
    if (spaceRef.current) return startPan(e);

    const sel = selectionRef.current;
    if (e.shiftKey) {
      setSelection(sel.includes(item.id) ? sel.filter((id) => id !== item.id) : [...sel, item.id]);
      return;
    }
    // Double-click (or double-tap) on a label starts renaming it. Detected here
    // because pointer capture keeps the browser's own dblclick from reaching the item.
    const now = Date.now();
    const last = lastPress.current;
    lastPress.current = { id: item.id, time: now, x: e.clientX, y: e.clientY };
    if (last.id === item.id && now - last.time < 400 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 6) {
      if (item.type === 'label' && !item.locked) {
        setSelection([item.id]);
        setEditingId(item.id);
        lastPress.current = { id: null, time: 0, x: 0, y: 0 };
        return;
      }
    }
    const nextSel = sel.includes(item.id) ? sel : [item.id];
    setSelection(nextSel);
    if (item.locked) return;
    const moving = new Map(itemsRef.current.filter((it) => nextSel.includes(it.id) && !it.locked).map((it) => [it.id, { x: it.x, y: it.y }]));
    gesture.current = { type: 'move', pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startItems: itemsRef.current, primary: item.id, moving, moved: false };
    canvasRef.current.setPointerCapture(e.pointerId);
    armLongPress(e, item);
  }

  function onCanvasPointerDown(e) {
    if (e.button !== 0 && e.button !== 1) return;
    // Menus and dialogs live in portals (React still bubbles their events here);
    // toolbars, the zoom bar and resize handles handle their own presses.
    if (!canvasRef.current.contains(e.target)) return;
    if (e.target.closest?.('.cbar, .info-pop, .handle, .canvas__toast')) return;
    canvasRef.current.focus({ preventScroll: true });
    setMenu(null);
    trackPointer(e);
    if (pointers.current.size >= 2) return startPinch();
    if (e.shiftKey && !spaceRef.current && e.button === 0) {
      gesture.current = { type: 'box', pointerId: e.pointerId, start: toWorld(e.clientX, e.clientY), startSel: selectionRef.current };
      canvasRef.current.setPointerCapture(e.pointerId);
      return;
    }
    if (!e.shiftKey && editingRef.current === null) setSelection([]);
    startPan(e);
    armLongPress(e, null);
  }

  function onHandlePointerDown(e, corner) {
    e.stopPropagation();
    if (e.button !== 0) return;
    const it = itemsRef.current.find((x) => x.id === selectionRef.current[0]);
    if (!it || it.locked) return;
    const heightFor = it.type === 'link' ? cardHeight : (w) => imageHeight(it, w);
    gesture.current = { type: 'resize', pointerId: e.pointerId, id: it.id, corner, start: { x: it.x, y: it.y, w: it.w, h: it.h }, startItems: itemsRef.current, heightFor };
    canvasRef.current.setPointerCapture(e.pointerId);
    setDraggingIds([it.id]);
  }

  function onPointerMove(e) {
    if (pointers.current.has(e.pointerId)) trackPointer(e);
    const g = gesture.current;
    if (!g) return;
    if (longPress.current && Math.hypot(e.clientX - (g.startX ?? e.clientX), e.clientY - (g.startY ?? e.clientY)) > 6) clearTimeout(longPress.current);
    latest.current = { clientX: e.clientX, clientY: e.clientY, altKey: e.altKey };
    if (!raf.current) raf.current = requestAnimationFrame(processMove);
  }

  function processMove() {
    raf.current = 0;
    const g = gesture.current;
    const p = latest.current;
    if (!g || !p) return;
    const v = viewRef.current;
    const threshold = 6 / v.zoom;

    if (g.type === 'pan') {
      setView({ ...g.startView, panX: g.startView.panX + (p.clientX - g.startX), panY: g.startView.panY + (p.clientY - g.startY) });
    } else if (g.type === 'pinch') {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const r = canvasRect();
      const z = clampZoom(g.startView.zoom * (dist(pts[0], pts[1]) / g.startDist));
      const mid = { x: (pts[0].x + pts[1].x) / 2 - r.left, y: (pts[0].y + pts[1].y) / 2 - r.top };
      const wx = (g.startMid.x - r.left - g.startView.panX) / g.startView.zoom;
      const wy = (g.startMid.y - r.top - g.startView.panY) / g.startView.zoom;
      setView({ zoom: z, panX: mid.x - wx * z, panY: mid.y - wy * z });
    } else if (g.type === 'box') {
      const cur = toWorld(p.clientX, p.clientY);
      const bx = { x: Math.min(g.start.x, cur.x), y: Math.min(g.start.y, cur.y), w: Math.abs(cur.x - g.start.x), h: Math.abs(cur.y - g.start.y) };
      const touched = itemsRef.current.filter((it) => it.x < bx.x + bx.w && bx.x < it.x + it.w && it.y < bx.y + bx.h && bx.y < it.y + it.h).map((it) => it.id);
      setSelection([...new Set([...g.startSel, ...touched])]);
      const a = { x: g.start.x * v.zoom + v.panX, y: g.start.y * v.zoom + v.panY };
      const b = { x: cur.x * v.zoom + v.panX, y: cur.y * v.zoom + v.panY };
      setOverlay({ guides: [], spacings: [], box: { x1: a.x, y1: a.y, x2: b.x, y2: b.y } });
    } else if (g.type === 'move') {
      const dx = (p.clientX - g.startX) / v.zoom;
      const dy = (p.clientY - g.startY) / v.zoom;
      if (!g.moved) {
        if (Math.hypot(p.clientX - g.startX, p.clientY - g.startY) < DRAG_START) return;
        g.moved = true;
        clearTimeout(longPress.current);
        setDraggingIds([...g.moving.keys()]);
        setCursor('grabbing');
      }
      const primary = g.startItems.find((it) => it.id === g.primary);
      const rect = { ...primary, x: primary.x + dx, y: primary.y + dy };
      const others = g.startItems.filter((it) => !g.moving.has(it.id));
      const snapped = snapMove(rect, others, { threshold, grid: snapGridRef.current, noSnap: p.altKey });
      const sdx = snapped.x - primary.x;
      const sdy = snapped.y - primary.y;
      setItems(g.startItems.map((it) => (g.moving.has(it.id) ? { ...it, x: g.moving.get(it.id).x + sdx, y: g.moving.get(it.id).y + sdy } : it)));
      setOverlay({ guides: snapped.guides, spacings: snapped.spacings, box: null });
    } else if (g.type === 'resize') {
      const pointer = toWorld(p.clientX, p.clientY);
      const others = g.startItems.filter((it) => it.id !== g.id);
      const { rect, guides } = snapResize(g.start, g.corner, pointer, others, { threshold, grid: snapGridRef.current, noSnap: p.altKey, heightFor: g.heightFor, minW: 80 });
      setItems(g.startItems.map((it) => (it.id === g.id ? { ...it, ...rect } : it)));
      setOverlay({ guides, spacings: [], box: null });
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
    clearTimeout(longPress.current);
    const g = gesture.current;
    if (!g) return;
    if (g.type === 'pinch') {
      if (pointers.current.size < 2) endGesture();
      return;
    }
    if (g.pointerId !== e.pointerId) return;
    try {
      canvasRef.current.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (g.type === 'move' && g.moved) pushHistory(g.startItems);
    if (g.type === 'resize') pushHistory(g.startItems);
    endGesture();
  }

  // ---- labels: measuring and inline editing ----
  const onMeasure = useCallback(
    (id, w, h) => {
      setItems(itemsRef.current.map((it) => (it.id === id ? { ...it, w, h } : it)));
    },
    [setItems]
  );
  const onEditCommit = useCallback(
    (item, text) => {
      if (editingRef.current !== item.id) return;
      setEditingId(null);
      const next = text || item.text;
      if (next !== item.text) commit(itemsRef.current.map((it) => (it.id === item.id ? { ...it, text: next } : it)));
      canvasRef.current?.focus({ preventScroll: true });
    },
    [commit, setEditingId]
  );
  const onEditCancel = useCallback(() => {
    setEditingId(null);
    canvasRef.current?.focus({ preventScroll: true });
  }, [setEditingId]);

  function onItemDoubleClick(e, item) {
    if (item.type === 'label' && !item.locked) {
      e.stopPropagation();
      setSelection([item.id]);
      setEditingId(item.id);
    }
  }

  // ---- right-click menu ----
  function openMenuAt(clientX, clientY, item) {
    if (item) {
      if (!selectionRef.current.includes(item.id)) setSelection([item.id]);
      setMenu({ x: clientX, y: clientY, kind: 'item' });
    } else {
      setMenu({ x: clientX, y: clientY, kind: 'canvas', world: toWorld(clientX, clientY) });
    }
  }
  function onItemContextMenu(e, item) {
    e.preventDefault();
    e.stopPropagation();
    openMenuAt(e.clientX, e.clientY, item);
  }
  function onCanvasContextMenu(e) {
    if (!canvasRef.current.contains(e.target)) return;
    e.preventDefault();
    openMenuAt(e.clientX, e.clientY, null);
  }

  const menuEntries = useMemo(() => {
    if (!menu) return [];
    const mod = (k) => modLabel(k);
    if (menu.kind === 'canvas') {
      return [
        { label: 'Add label', icon: TagIcon, onSelect: () => addLabel('Label') },
        { label: 'Upload image', icon: ImageIcon, onSelect: () => document.getElementById('canvas-file-input')?.click() },
        { label: 'Zoom to fit', icon: FrameIcon, onSelect: () => fitToContent() },
        { label: 'Zoom to 100%', icon: ZoomInIcon, shortcut: mod('0'), onSelect: () => zoomTo(1) },
        { label: 'Snap to grid', icon: GridIcon, checked: snapGrid, onSelect: () => setSnapGrid(!snapGridRef.current) },
        'divider',
        { label: 'Reset canvas', icon: ResetIcon, danger: true, onSelect: () => setDialog({ type: 'reset' }) },
      ];
    }
    const chosen = itemsRef.current.filter((it) => selectionRef.current.includes(it.id));
    const one = chosen.length === 1 ? chosen[0] : null;
    const allLocked = chosen.length > 0 && chosen.every((it) => it.locked);
    const entries = [];
    if (one && one.type !== 'link') entries.push({ label: 'Edit', icon: PencilIcon, onSelect: startEdit });
    entries.push({ label: 'Duplicate', icon: CopyIcon, shortcut: mod('D'), onSelect: duplicateSelected });
    if (one?.url) entries.push({ label: 'Open link', icon: ExternalLinkIcon, onSelect: () => openLink(one) });
    entries.push({ label: 'Bring to front', icon: BringFrontIcon, shortcut: mod(']'), onSelect: bringToFront });
    entries.push({ label: 'Send to back', icon: SendBackIcon, shortcut: mod('['), onSelect: sendToBack });
    entries.push({ label: 'Align', icon: AlignLeftIcon, disabled: chosen.length < 2, submenu: alignEntries(chosen.length, align) });
    entries.push({ label: allLocked ? 'Unlock position' : 'Lock position', icon: allLocked ? UnlockIcon : LockIcon, shortcut: mod('L'), onSelect: toggleLock });
    entries.push('divider');
    entries.push({ label: 'Remove', icon: TrashIcon, danger: true, shortcut: 'Del', disabled: allLocked, onSelect: deleteSelected });
    return entries;
  }, [menu, snapGrid, addLabel, fitToContent, zoomTo, startEdit, duplicateSelected, bringToFront, sendToBack, align, toggleLock, deleteSelected]);

  // ---- keyboard (only while the canvas has focus) ----
  function onKeyDown(e) {
    if (e.target.closest?.('.modal, .cmenu, .citem__label-edit, input, textarea')) return;
    if (editingRef.current) return;
    const mod = e.metaKey || e.ctrlKey;
    const k = e.key;
    const lower = k.toLowerCase();
    if (k === ' ') {
      e.preventDefault();
      if (!spaceRef.current) {
        spaceRef.current = true;
        if (!gesture.current) setCursor('grab');
      }
      return;
    }
    if (k === 'Escape') {
      if (menu) setMenu(null);
      else setSelection([]);
      return;
    }
    if (mod && lower === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && lower === 'a') {
      e.preventDefault();
      setSelection(itemsRef.current.map((it) => it.id));
      return;
    }
    if (mod && lower === 'd') {
      e.preventDefault();
      duplicateSelected();
      return;
    }
    if (mod && k === ']') return e.preventDefault(), bringToFront();
    if (mod && k === '[') return e.preventDefault(), sendToBack();
    if (mod && lower === 'l') return e.preventDefault(), toggleLock();
    if (mod && (k === '=' || k === '+')) return e.preventDefault(), zoomTo(viewRef.current.zoom + ZOOM_STEP);
    if (mod && (k === '-' || k === '_')) return e.preventDefault(), zoomTo(viewRef.current.zoom - ZOOM_STEP);
    if (mod && k === '0') return e.preventDefault(), zoomTo(1);
    if (k === 'Delete' || k === 'Backspace') return e.preventDefault(), deleteSelected();
    const step = e.shiftKey ? 8 : 1;
    if (k === 'ArrowLeft') return e.preventDefault(), nudge(-step, 0);
    if (k === 'ArrowRight') return e.preventDefault(), nudge(step, 0);
    if (k === 'ArrowUp') return e.preventDefault(), nudge(0, -step);
    if (k === 'ArrowDown') return e.preventDefault(), nudge(0, step);
    return undefined;
  }
  function onKeyUp(e) {
    if (e.key === ' ') {
      spaceRef.current = false;
      if (!gesture.current) setCursor('');
    }
  }

  // ---- files: drop and paste ----
  function onDrop(e) {
    e.preventDefault();
    const files = [...e.dataTransfer.files];
    if (files.length) addFiles(files, toWorld(e.clientX, e.clientY));
  }
  function onPaste(e) {
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) {
      e.preventDefault();
      addFiles(files, null);
    }
  }

  // ---- render ----
  const single = selectedItems.length === 1 ? selectedItems[0] : null;
  const handles = single && !single.locked && single.type !== 'label' && !editingId ? { x: single.x, y: single.y, w: single.w, h: single.h } : null;
  const sorted = useMemo(() => [...items].sort((a, b) => a.z - b.z), [items]);

  return (
    <>
      <div
        ref={canvasRef}
        className={`canvas${cursor ? ` is-${cursor}` : ''}`}
        tabIndex={0}
        aria-label="Visuals canvas"
        data-canvas
        style={{ backgroundSize: `${16 * view.zoom}px ${16 * view.zoom}px`, backgroundPosition: `${view.panX}px ${view.panY}px` }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={onCanvasContextMenu}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onPaste={onPaste}
      >
        <div className="canvas__world" style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }}>
          {ready &&
            sorted.map((item) => (
              <CanvasItem
                key={item.id}
                item={item}
                selected={selection.includes(item.id)}
                editing={editingId === item.id}
                dragging={draggingIds?.includes(item.id)}
                imageUrl={item.type === 'image' ? images[item.imageKey] : undefined}
                onPointerDown={onItemPointerDown}
                onDoubleClick={onItemDoubleClick}
                onContextMenu={onItemContextMenu}
                onMeasure={onMeasure}
                onEditCommit={onEditCommit}
                onEditCancel={onEditCancel}
                onOpen={openLink}
              />
            ))}
        </div>

        <Guides guides={overlay.guides} spacings={overlay.spacings} box={overlay.box} handles={handles} toScreen={toScreen} zoom={view.zoom} onHandlePointerDown={onHandlePointerDown} />

        <ToolBar
          selectionCount={selection.length}
          canEdit={!!single && single.type !== 'link'}
          allLocked={selectedItems.length > 0 && selectedItems.every((it) => it.locked)}
          onAddLabel={addLabel}
          onUploadFiles={(files) => addFiles(files, null)}
          onEdit={startEdit}
          onAlign={align}
          onToggleLock={toggleLock}
          onDelete={deleteSelected}
          onClearSelection={() => setSelection([])}
        />
        <ZoomBar
          zoom={view.zoom}
          snap={snapGrid}
          onZoomIn={() => zoomTo(viewRef.current.zoom + ZOOM_STEP)}
          onZoomOut={() => zoomTo(viewRef.current.zoom - ZOOM_STEP)}
          onReset={() => zoomTo(1)}
          onToggleSnap={() => setSnapGrid(!snapGridRef.current)}
          onFit={() => fitToContent()}
        />
        <InfoPopover />
        {toast ? (
          <div className="canvas__toast canvas__toast--dark" role="status">
            {toast}
          </div>
        ) : (
          hint && (
            <div className="canvas__toast floating" role="status">
              Drag to move · {modLabel('')}+ scroll to zoom · Right-click for options
              <button type="button" className="icon-button" onClick={dismissHint} aria-label="Dismiss hint">
                <CloseIcon width={14} height={14} />
              </button>
            </div>
          )
        )}
      </div>

      {menu && <ContextMenu x={menu.x} y={menu.y} entries={menuEntries} onClose={() => setMenu(null)} label={menu.kind === 'item' ? 'Item menu' : 'Canvas menu'} />}

      <Modal open={dialog?.type === 'reset'} onClose={() => setDialog(null)} title="Reset the canvas?" subtitle="Your layout and uploaded images in this browser will be removed." width={420}>
        <div className="cdialog">
          <div className="modal__actions">
            <button type="button" className="button button--light" data-autofocus onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button type="button" className="button button--dark" onClick={resetCanvas}>
              Reset
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={dialog?.type === 'image'} onClose={() => setDialog(null)} title="Edit image" width={420}>
        {dialog?.type === 'image' && (
          <form
            className="cdialog"
            onSubmit={(e) => {
              e.preventDefault();
              const caption = dialog.caption.trim();
              const url = dialog.url.trim();
              commit(itemsRef.current.map((it) => (it.id === dialog.id ? { ...it, caption, url: url || undefined, h: imageHeight({ ...it, caption }, it.w) } : it)));
              setDialog(null);
            }}
          >
            <div className="field">
              <label htmlFor="img-caption">Caption</label>
              <input id="img-caption" type="text" data-autofocus value={dialog.caption} onChange={(e) => setDialog({ ...dialog, caption: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="img-url">Link (optional)</label>
              <input id="img-url" type="url" placeholder="https://" value={dialog.url} onChange={(e) => setDialog({ ...dialog, url: e.target.value })} />
            </div>
            <div className="modal__actions">
              <button type="button" className="button button--light" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button type="submit" className="button button--dark">
                Save
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

export { LABEL_PRESETS };
