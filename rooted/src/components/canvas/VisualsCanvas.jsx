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
  PaletteIcon,
  PencilIcon,
  ResetIcon,
  SendBackIcon,
  TagIcon,
  TextIcon,
  TextSizeIcon,
  TrashIcon,
  SectionIcon,
  TidyIcon,
  CollapseIcon,
  ExpandIcon,
  TabSideIcon,
  UnlockIcon,
  ZoomInIcon,
  AlignLeftIcon,
  RibbonIcon,
  AlignTextLeftIcon,
  AlignTextCenterIcon,
  AlignTextRightIcon,
  AutoWidthIcon,
  BoldIcon,
  FillIcon,
  TransparentIcon,
  ListIcon,
  CheckIcon,
  ClipboardIcon,
} from '../Icons.jsx';
import CanvasItem from './CanvasItem.jsx';
import Guides from './Guides.jsx';
import ZoomBar from './ZoomBar.jsx';
import ToolBar from './ToolBar.jsx';
import InfoPopover from './InfoPopover.jsx';
import ContextMenu from './ContextMenu.jsx';
import { alignEntries } from './alignEntries.jsx';
import { CARD_H, buildDefaultItems, mergeWithData, migrateV1, migrateV3, migrateV4, repairV2, LABEL_H } from './defaultLayout.js';
import { DEFAULT_COLS, DEFAULT_SECTION_COLOR, SECTION_GAP, sectionColors, SECTION_MIN_H, SECTION_MIN_W, SECTION_PAD, SECTION_PRESETS, SECTION_STRIP, MAX_COLS, TAB_H, TAB_INSET, childrenOf, clearOverlaps, colsForWidth, insertChildAt, orderedChildren, refitSections, slotAt, tabMetrics, tabXFor, tidySection, widthForCols } from './sections.js';
import * as storage from './useCanvasStorage.js';
import { exportBoard, parseBackup } from './backup.js';
import { bounds, snapMove, snapResize, snapValue } from './snapping.js';
import { DEFAULT_LABEL_COLOR, LABEL_PRESETS_COLORS, LABEL_SIZES, clampFontSize, fontSizeForHeight, labelHeight, labelMinWidth, labelNaturalWidth, labelMetrics } from './labelColors.js';
import SheetMenu from './SheetMenu.jsx';
import { DEFAULT_RIBBON, RIBBON_LIMITS, RIBBON_STATUSES, cleanLines } from './ribbon.js';
import { TEXT_COLOR_PRESETS, TEXT_MIN_W, TEXT_SIZE_IDS, estimateTextSize, textColors, textSize } from './text.js';
import { snapEdgeX } from './snapping.js';

const visualsTab = tabs.find((t) => t.id === 'visuals');
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
const IMAGE_W = 280;
const DROP_COLS = 4;
const DROP_GAP = 16;
const MAX_DROP = 20;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
const TYPE_ERROR = 'Only PNG, JPG, WebP, GIF or AVIF up to 10MB';
const HINT_KEY = 'rooted:visuals-hint:v1';
const HINT_MS = 6000;
const phoneQuery = () => window.matchMedia('(max-width: 640px)');
const touchQuery = () => window.matchMedia('(hover: none)');
// Space kept clear by "fit": the floating header + tabs on top, the bars at the bottom.
const SAFE = { top: 128, bottom: 88, side: 48 };
const CAPTION_H = 22; // 12px caption at 1.5 + 4px gap
const DRAG_START = 3; // screen px before a press becomes a drag
const LONG_PRESS = 500;

const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
// Copied items travel as text so a paste works across tabs of the same browser.
const CLIP_MARK = 'rooted-items:';
const newId = (type) => `${type}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Link cards keep their shape as they grow: screenshot (16:10) plus the text block.
// The real height is measured after render; this keeps resizing smooth.
export const cardHeight = (w) => Math.round(w * 0.625 + 94);
// Image card: 12px padding around an image at the inner width, natural ratio.
const IMAGE_PAD = 12;
const imageHeight = (item, w) => Math.round((w - 2 * IMAGE_PAD) / (item.ratio || 1.6)) + 2 * IMAGE_PAD;

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
  const [saveState, setSaveState] = useState('saved'); // 'saving' while a change waits for the 300ms autosave
  const [images, setImages] = useState({});
  const [overlay, setOverlay] = useState({ guides: [], spacings: [], box: null, tip: null });
  const [phone, setPhone] = useState(() => phoneQuery().matches);
  const touchRef = useRef(touchQuery().matches);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [draggingIds, setDraggingIds] = useState(null);
  const [cursor, setCursor] = useState(''); // '' | 'grab' | 'grabbing'
  const [dialog, setDialog] = useState(null); // { type: 'reset' } | { type: 'image', id, caption, url }
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState([]); // skeletons while dropped images are processed
  const [flashId, setFlashId] = useState(null); // section that just received a child
  const geomsRef = useRef(new Map());
  const [dropTarget, setDropTarget] = useState(null); // { sectionItemId, slot } while a card is dragged over a section
  const [sectionList, setSectionList] = useState(null); // { x, y } anchor of the Sections popover
  const [ribbonEditId, setRibbonEditId] = useState(null); // image whose ribbon text is being edited
  const ribbonEditRef = useRef(null);
  const [ribbonFilter, setRibbonFilter] = useState(null); // 'grey' | 'blue' | ... (not saved)
  const ribbonMenuOpen = useRef(false);
  const clipboardRef = useRef(null); // { items, pastes } from the last copy
  const pendingPaste = useRef(null);
  const imagesRef = useRef({});
  imagesRef.current = images;
  const [clipHas, setClipHas] = useState(false);
  // Tab widths are measured with canvas text; measure again once Geist has loaded.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let on = true;
    document.fonts?.ready.then(() => on && setFontsReady(true));
    return () => {
      on = false;
    };
  }, []);
  const flashTimer = useRef(0);
  const legacyRef = useRef(false); // v1 layout migrated; remove it after the first v2 save
  const [dropping, setDropping] = useState(false);
  const dragDepth = useRef(0);
  const colorInput = useRef(null);
  const [hint, setHint] = useState(() => {
    try {
      return !localStorage.getItem(HINT_KEY);
    } catch {
      return true;
    }
  });
  const hintRef = useRef(hint);

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

  // ---- geometry: world rectangles for every item ----
  // Sections get { x, y (body top-left), w, h, tabX, tabW, tabH, curve, corner, fs }.
  // Children are placed inside their section's padded body (cx, cy).
  function computeGeoms(list) {
    const map = new Map();
    const counts = new Map();
    for (const it of list) if (it.parentId) counts.set(it.parentId, (counts.get(it.parentId) || 0) + 1);
    for (const f of list) {
      if (f.type !== 'section') continue;
      const m = tabMetrics(f, counts.get(f.id) || 0);
      // The tab hugs its name; only a name wider than the section itself gets cut (ellipsis).
      const tabW = Math.min(m.width, Math.max(80, f.w - 2 * TAB_INSET));
      map.set(f.id, { x: f.x, y: f.y, w: f.w, h: f.collapsed ? SECTION_STRIP : f.h, tabX: tabXFor(f, f.w, tabW), tabW, tabH: m.height, curve: m.curve, corner: m.corner, fs: m.fs });
    }
    for (const it of list) {
      if (it.type === 'section') continue;
      const fg = it.parentId ? map.get(it.parentId) : null;
      const sz = it.type === 'text' ? textSize(it) : { w: it.w, h: it.h };
      map.set(it.id, fg ? { x: fg.x + SECTION_PAD + (it.cx || 0), y: fg.y + SECTION_PAD + (it.cy || 0), w: sz.w, h: sz.h } : { x: it.x, y: it.y, w: sz.w, h: sz.h });
    }
    return map;
  }
  const rectOf = (it) => geomsRef.current.get(it.id) || { x: it.x || 0, y: it.y || 0, ...(it.type === 'text' ? textSize(it) : { w: it.w, h: it.h }) };
  // Frame of a section including its tab (for handles, overlap checks and fit).
  const frameOf = (f) => {
    const g = rectOf(f);
    return { x: g.x, y: g.y - (g.tabH || TAB_H), w: g.w, h: g.h + (g.tabH || TAB_H) };
  };
  // Write a world position back to an item (children store it relative to the section).
  const setAbs = (it, x, y, list = itemsRef.current) => {
    if (!it.parentId) return { ...it, x, y };
    const fg = geomsRef.current.get(it.parentId) || computeGeoms(list).get(it.parentId);
    return { ...it, cx: x - fg.x - SECTION_PAD, cy: y - fg.y - SECTION_PAD };
  };
  // Children of collapsed sections are kept but hidden.
  const hiddenIds = (list) => {
    const collapsed = new Set(list.filter((it) => it.type === 'section' && it.collapsed).map((it) => it.id));
    return new Set(list.filter((it) => it.parentId && collapsed.has(it.parentId)).map((it) => it.id));
  };
  // The expanded section whose body contains a world point (topmost by z).
  const sectionAtPoint = (x, y, excludeIds = new Set()) => {
    const candidates = itemsRef.current.filter((it) => it.type === 'section' && !it.collapsed && !excludeIds.has(it.id)).sort((a, b) => b.z - a.z);
    for (const f of candidates) {
      const g = rectOf(f);
      if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) return f;
    }
    return null;
  };
  // Free items never sit on a section: after layout changes push them aside.
  const settle = (list) => clearOverlaps(refitSections(list), (it) => computeGeoms(list).get(it.id) || it);

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
      setItems(settle(next));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const dismissHint = useCallback(() => {
    if (!hintRef.current) return;
    hintRef.current = false;
    setHint(false);
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  // The hint fades out by itself after 6 seconds.
  useEffect(() => {
    if (!hint) return undefined;
    const t = setTimeout(dismissHint, HINT_MS);
    return () => clearTimeout(t);
  }, [hint, dismissHint]);

  // Phone / touch media queries.
  useEffect(() => {
    const mq = phoneQuery();
    const tq = touchQuery();
    const onChange = () => {
      setPhone(mq.matches);
      touchRef.current = tq.matches;
    };
    mq.addEventListener('change', onChange);
    tq.addEventListener('change', onChange);
    return () => {
      mq.removeEventListener('change', onChange);
      tq.removeEventListener('change', onChange);
    };
  }, []);

  // While a label is being edited on a phone, keep it above the keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!editingId || !vv) return undefined;
    const keep = () => {
      const el = canvasRef.current?.querySelector(`[data-item-id="${editingId}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const limit = vv.offsetTop + vv.height - 24;
      if (r.bottom > limit) setView({ ...viewRef.current, panY: viewRef.current.panY - (r.bottom - limit) });
    };
    vv.addEventListener('resize', keep);
    vv.addEventListener('scroll', keep);
    return () => {
      vv.removeEventListener('resize', keep);
      vv.removeEventListener('scroll', keep);
    };
  }, [editingId, setView]);

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
  // Animate pan/zoom to a target view (300ms ease-out).
  const animRef = useRef(0);
  const animateView = useCallback(
    (target, ms = 300) => {
      cancelAnimationFrame(animRef.current);
      const from = { ...viewRef.current };
      const t0 = performance.now();
      const ease = (t) => 1 - (1 - t) ** 3;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms);
        const k = ease(t);
        setView({ zoom: from.zoom + (target.zoom - from.zoom) * k, panX: from.panX + (target.panX - from.panX) * k, panY: from.panY + (target.panY - from.panY) * k });
        if (t < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    },
    [setView]
  );
  // View that fits a world rect in the safe area (never above 100%).
  const viewForRect = (b, maxZoom = 1) => {
    const { w, h } = sizeRef.current;
    const aw = w - 2 * SAFE.side;
    const ah = h - SAFE.top - SAFE.bottom;
    const z = clampZoom(Math.min(aw / b.w, ah / b.h, maxZoom));
    return { zoom: z, panX: SAFE.side + (aw - b.w * z) / 2 - b.x * z, panY: SAFE.top + (ah - b.h * z) / 2 - b.y * z };
  };

  const fitToContent = useCallback(
    (list = itemsRef.current) => {
      const geoms = computeGeoms(list);
      const hidden = hiddenIds(list);
      const rects = list.filter((it) => !hidden.has(it.id)).map((it) => {
        const g = geoms.get(it.id);
        return it.type === 'section' ? { x: g.x, y: g.y - g.tabH, w: g.w, h: g.h + g.tabH } : g;
      });
      const b = bounds(rects);
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

  // Image cards: 280px wide inside sections, height from the card formula.
  const normalizeImages = (list) => {
    const touched = new Set();
    let out = list.map((it) => {
      if (it.type === 'link' && it.h !== CARD_H) {
        if (it.parentId) touched.add(it.parentId);
        return { ...it, w: 280, h: CARD_H };
      }
      if (it.type !== 'image') return it;
      const w = it.parentId ? IMAGE_W : it.w;
      const h = imageHeight(it, w);
      if (w === it.w && h === it.h) return it;
      if (it.parentId) touched.add(it.parentId);
      return { ...it, w, h };
    });
    for (const id of touched) out = tidySection(out, id);
    return out;
  };

  // ---- load once ----
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: saved, legacy } = storage.loadLayout();
      const blobs = await storage.getAllImages();
      if (!alive) return;
      const urls = {};
      for (const [key, blob] of blobs) urls[key] = URL.createObjectURL(blob);
      setImages(urls);
      let list;
      if (saved?.items?.length) {
        legacyRef.current = Boolean(legacy);
        let base = saved.items;
        if (legacy === 'v1') base = migrateV1(saved.items, visualsTab);
        if (legacy === 'v2') base = repairV2(saved.items, visualsTab);
        if (legacy && legacy !== 'v4') base = migrateV3({ items: base, layout: legacy === 'v3' ? saved.layout : null }, visualsTab);
        if (legacy) base = migrateV4(base);
        list = settle(normalizeImages(mergeWithData(base, visualsTab)));
        if (saved.view && legacy !== 'v3') setView(saved.view);
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
      setSize({ w: r.width, h: r.height });
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
    setSaveState('saving');
    saveTimer.current = setTimeout(() => {
      const ok = storage.saveLayout({ items: itemsRef.current, view: viewRef.current, snapGrid });
      if (!ok) showToast("Couldn't save in this browser.");
      else if (legacyRef.current) {
        legacyRef.current = false;
        storage.removeLegacy();
      }
      setSaveState(ok ? 'saved' : 'failed');
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [items, view, snapGrid, ready, showToast]);

  // The "Saved" note sits just right of the tool bar, whatever width the bar has.
  useEffect(() => {
    const bar = canvasRef.current?.querySelector('.cbar--tools');
    if (!bar || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => canvasRef.current?.style.setProperty('--tools-w', `${bar.offsetWidth}px`));
    ro.observe(bar);
    return () => ro.disconnect();
  }, [ready, phone]);

  // ---- wheel: pan, or zoom with ⌘/Ctrl (trackpad pinch arrives as ctrl+wheel) ----
  useEffect(() => {
    const el = canvasRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      setMenu(null);
      dismissHint();
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
  }, [setView, zoomTo, dismissHint]);

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

  // Remove items. Sections with children ask first (keepChildren: true unparents them).
  const removeItems = useCallback(
    (ids, keepChildren) => {
      const idSet = new Set(ids);
      const sections = itemsRef.current.filter((it) => it.type === 'section' && idSet.has(it.id)).map((it) => it.id);
      let next = itemsRef.current;
      if (!keepChildren) for (const it of next) if (it.parentId && sections.includes(it.parentId)) idSet.add(it.id);
      const removing = next.filter((it) => idSet.has(it.id));
      next = next.filter((it) => !idSet.has(it.id)).map((it) => {
        if (!(it.parentId && sections.includes(it.parentId))) return it;
        const r = rectOf(it);
        return { ...it, parentId: undefined, cx: undefined, cy: undefined, x: r.x, y: r.y };
      });
      commit(next);
      keepExisting(next);
      for (const it of removing) {
        const inClipboard = (clipboardRef.current?.items || []).some((c) => c.imageKey === it.imageKey);
        if (it.type === 'image' && !inClipboard && !next.some((o) => o.type === 'image' && o.imageKey === it.imageKey)) storage.deleteImage(it.imageKey);
      }
    },
    [commit, keepExisting]
  );

  const deleteSelected = useCallback(() => {
    const sel = selectionRef.current;
    const removing = itemsRef.current.filter((it) => sel.includes(it.id) && !it.locked);
    if (!removing.length) return;
    const ids = removing.map((it) => it.id);
    const childCount = itemsRef.current.filter((it) => it.parentId && ids.includes(it.parentId) && !ids.includes(it.id)).length;
    if (childCount > 0) {
      setDialog({ type: 'deleteSection', ids, count: childCount });
      return;
    }
    removeItems(ids, false);
  }, [removeItems]);

  // Copies of `sources` (a section brings its children along). A child of a
  // section that still exists is filed into that grid right after its original;
  // free copies land `offset` px down-right of theirs, or at `at`. `raw` keeps
  // every copy exactly where its original is (Option-drag moves it from there).
  const cloneItems = (list, sources, { offset = 16, at = null, raw = false } = {}) => {
    const chosen = new Map(sources.map((it) => [it.id, it]));
    for (const it of list) if (it.parentId && chosen.has(it.parentId) && !chosen.has(it.id)) chosen.set(it.id, it);
    const all = [...chosen.values()];
    const idMap = new Map(all.map((it) => [it.id, newId(it.type)]));
    let z = list.reduce((m, it) => Math.max(m, it.z), 0);
    let next = [...list];
    const filed = [];
    const free = all.filter((it) => !(it.parentId && idMap.has(it.parentId)));
    const origin = at ? bounds(free.map(rectOf)) : null;
    for (const src of all) {
      const copy = { ...src, id: idMap.get(src.id), z: ++z, locked: false };
      if (src.parentId && idMap.has(src.parentId)) {
        next.push({ ...copy, parentId: idMap.get(src.parentId) });
        continue;
      }
      if (src.parentId && list.some((it) => it.id === src.parentId)) {
        if (raw) next.push(copy);
        else filed.push({ copy, src });
        continue;
      }
      const r = rectOf(src);
      const x = raw ? r.x : origin ? at.x + (r.x - origin.x) : r.x + offset;
      const y = raw ? r.y : origin ? at.y + (r.y - origin.y) : r.y + offset;
      next.push({ ...copy, parentId: undefined, cx: undefined, cy: undefined, order: undefined, x, y });
    }
    for (const { copy, src } of filed) {
      const siblings = orderedChildren(next, copy.parentId);
      const i = siblings.findIndex((c) => c.id === src.id);
      next.push(copy);
      next = insertChildAt(next, copy.parentId, copy.id, i < 0 ? siblings.length : i + 1);
    }
    return { next, ids: free.map((it) => idMap.get(it.id)), idMap };
  };

  const duplicateSelected = useCallback(() => {
    const sel = selectionRef.current;
    const sources = itemsRef.current.filter((it) => sel.includes(it.id));
    if (!sources.length) return;
    const { next, ids } = cloneItems(itemsRef.current, sources);
    commit(next);
    setSelection(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, setSelection]);

  // ---- clipboard: ⌘C keeps a snapshot (and writes it as text), ⌘V clones it ----
  const snapshotSelection = () => {
    const chosen = new Set(selectionRef.current);
    for (const it of itemsRef.current) if (it.parentId && chosen.has(it.parentId)) chosen.add(it.id);
    // Children carry their world position too, so a paste still works when their section is gone.
    const items = itemsRef.current.filter((it) => chosen.has(it.id)).map((it) => ({ ...it, x: rectOf(it).x, y: rectOf(it).y }));
    return items.length ? items : null;
  };
  const copySelection = useCallback((e) => {
    const items = snapshotSelection();
    if (!items) return false;
    clipboardRef.current = { items, pastes: 0 };
    setClipHas(true);
    const text = CLIP_MARK + JSON.stringify(items);
    if (e?.clipboardData) {
      e.clipboardData.setData('text/plain', text);
      e.preventDefault();
    } else navigator.clipboard?.writeText(text).catch(() => {});
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pasteItems = useCallback(
    (sources, at = null) => {
      if (!sources?.length) return;
      const have = sources.filter((it) => it.type !== 'image' || imagesRef.current[it.imageKey]);
      if (have.length < sources.length) showToast(have.length ? 'Some images are no longer available.' : 'That image is no longer available.');
      if (!have.length) return;
      const clip = clipboardRef.current;
      const n = clip ? (clip.pastes += 1) : 1; // every paste of the same copy steps 16px further
      const { next, ids } = cloneItems(itemsRef.current, have, { offset: 16 * n, at });
      commit(next);
      setSelection(ids);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commit, setSelection, showToast]
  );

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
      const chosen = itemsRef.current.filter((it) => sel.includes(it.id)).map((it) => ({ ...it, ...rectOf(it), item: it }));
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
      commit(itemsRef.current.map((it) => {
        if (!pos.has(it.id) || it.locked) return it;
        const r = rectOf(it);
        const p = pos.get(it.id);
        return setAbs(it, p.x ?? r.x, p.y ?? r.y);
      }));
    },
    [commit]
  );

  const nudge = useCallback(
    (dx, dy) => {
      const sel = new Set(selectionRef.current);
      if (!sel.size) return;
      commit(itemsRef.current.map((it) => {
        if (!sel.has(it.id) || it.locked) return it;
        const r = rectOf(it);
        return setAbs(it, r.x + dx, r.y + dy);
      }));
    },
    [commit]
  );

  // ---- adding things ----
  // Nearest free spot for a w × h box near the centre of the view: the box is
  // checked against every item with a 16px margin, searching outward on an 8px grid.
  function findFreeSpot(w, h) {
    const c = viewCenterWorld();
    const list = itemsRef.current;
    const margin = 16;
    const free = (x, y) => !list.some((it) => { const r = rectOf(it); return x < r.x + r.w + margin && r.x < x + w + margin && y < r.y + r.h + margin && r.y < y + h + margin; });
    const cx = snapValue(c.x - w / 2);
    const cy = snapValue(c.y - h / 2);
    if (free(cx, cy)) return { x: cx, y: cy };
    for (let r = 8; r <= 4000; r += 8) {
      for (let i = -r; i <= r; i += 8) {
        for (const [x, y] of [[cx + i, cy - r], [cx + i, cy + r], [cx - r, cy + i], [cx + r, cy + i]]) {
          if (free(x, y)) return { x, y };
        }
      }
    }
    return { x: cx, y: cy };
  }

  const addLabel = useCallback(
    (text) => {
      const value = text || 'Label';
      const fontSize = 14;
      const w = labelNaturalWidth(value, fontSize);
      const h = labelHeight(fontSize);
      const spot = findFreeSpot(w, h);
      const id = newId('label');
      const item = { id, type: 'label', text: value, color: DEFAULT_LABEL_COLOR, fontSize, x: spot.x, y: spot.y, w, h, z: maxZ() + 1, locked: false };
      commit([...itemsRef.current, item]);
      setSelection([id]);
      setEditingId(id);
      canvasRef.current?.focus({ preventScroll: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commit, setSelection, setEditingId]
  );

  // Add image files. `at` is the world point to start from (drop point) or null
  // for the centre of the view. Images are laid out in a grid of 4, 280px wide.
  // Skeletons show while files are processed; then everything is committed at
  // once, so one undo removes the whole batch.
  // "+ Text": a transparent, medium, #111 text at the centre of the view, editing right away.
  const addText = useCallback(() => {
    const item = { id: newId('text'), type: 'text', text: 'Text', fill: 'transparent', color: '#111111', size: 'M', weight: 500, align: 'left', w: 'auto', x: 0, y: 0, z: maxZ() + 1, locked: false };
    const est = estimateTextSize(item);
    const spot = findFreeSpot(est.w, est.h);
    item.x = spot.x;
    item.y = spot.y;
    item.mw = est.w;
    item.mh = est.h;
    commit([...itemsRef.current, item]);
    setSelection([item.id]);
    setEditingId(item.id);
    canvasRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, setSelection, setEditingId]);

  // Apply a patch to every selected text item (fill, color, size, weight, align, w).
  const colorInputText = useRef(null);
  const setTextProps = useCallback(
    (patch) => {
      if (patch.color === '__custom') {
        colorInputText.current?.click();
        return;
      }
      const ids = new Set(itemsRef.current.filter((it) => it.type === 'text' && selectionRef.current.includes(it.id)).map((it) => it.id));
      if (!ids.size) return;
      commit(itemsRef.current.map((it) => (ids.has(it.id) ? { ...it, ...patch, ...(patch.fill && patch.fill !== it.fill ? { color: patch.fill === 'filled' ? 'paper' : '#111111' } : {}) } : it)));
    },
    [commit]
  );

  const addFiles = useCallback(
    async (files, at) => {
      const valid = [];
      let rejected = 0;
      for (const f of files) {
        if (!IMAGE_TYPES.includes(f.type) || f.size > storage.MAX_FILE_BYTES) rejected += 1;
        else valid.push(f);
      }
      if (rejected) showToast(TYPE_ERROR);
      if (valid.length > MAX_DROP) {
        showToast(`Up to ${MAX_DROP} images at a time; adding the first ${MAX_DROP}.`);
        valid.length = MAX_DROP;
      }
      if (!valid.length) return;

      const origin = at || viewCenterWorld();
      const slot = (i) => ({ x: snapValue(origin.x + (i % DROP_COLS) * (IMAGE_W + DROP_GAP)), y: snapValue(origin.y + Math.floor(i / DROP_COLS) * (IMAGE_W * 0.625 + DROP_GAP)) });
      const batch = `${Date.now()}`;
      setPending(valid.map((f, i) => ({ id: `${batch}-${i}`, ...slot(i), w: IMAGE_W, h: Math.round(IMAGE_W * 0.625) })));

      let z = maxZ();
      const added = [];
      const urls = {};
      let saveFailed = false;
      for (let i = 0; i < valid.length; i += 1) {
        const f = valid[i];
        try {
          const { blob, width, height } = await storage.processImageFile(f);
          const key = storage.newImageKey();
          if (!(await storage.putImage(key, blob))) saveFailed = true;
          urls[key] = URL.createObjectURL(blob);
          const w = IMAGE_W;
          added.push({ id: newId('image'), type: 'image', imageKey: key, ratio: width / height, ...slot(i), w, h: imageHeight({ ratio: width / height }, w), z: ++z, locked: false });
        } catch {
          showToast(`Couldn't read ${f.name}.`);
        }
      }
      setPending([]);
      if (saveFailed) showToast("Couldn't save in this browser.");
      if (!added.length) return;
      setImages((prev) => ({ ...prev, ...urls }));
      const target = at ? sectionAtPoint(at.x, at.y) : null;
      let next = [...itemsRef.current, ...added.map((it) => (target ? { ...it, parentId: target.id, cx: 1e6, cy: 1e6 } : it))];
      if (target) next = tidySection(next, target.id);
      commit(next);
      setSelection(added.map((it) => it.id));
    },
    [commit, setSelection, showToast]
  );

  // ---- label size presets ----
  const setLabelSize = useCallback(
    (fs) => {
      const ids = new Set(itemsRef.current.filter((it) => (it.type === 'label' || it.type === 'section') && selectionRef.current.includes(it.id)).map((it) => it.id));
      if (!ids.size) return;
      commit(
        itemsRef.current.map((it) => {
          if (!ids.has(it.id)) return it;
          if (it.type === 'section') return { ...it, fontSize: fs };
          const old = it.fontSize || 14;
          return { ...it, fontSize: fs, w: it.fixedW ? Math.round((it.w * fs) / old) : labelNaturalWidth(it.text, fs), h: labelHeight(fs) };
        })
      );
    },
    [commit]
  );

  // ---- label colors ----
  const selectedLabels = () => itemsRef.current.filter((it) => it.type === 'label' && selectionRef.current.includes(it.id));
  const setLabelColor = useCallback(
    (color) => {
      if (color === '__custom') {
        colorInput.current?.click();
        return;
      }
      const ids = new Set(itemsRef.current.filter((it) => (it.type === 'label' || it.type === 'section') && selectionRef.current.includes(it.id)).map((it) => it.id));
      if (!ids.size) return;
      commit(itemsRef.current.map((it) => (ids.has(it.id) ? { ...it, color } : it)));
    },
    [commit]
  );

  // ---- ribbons (uploaded images only) ----
  const selectedImageIds = () => itemsRef.current.filter((it) => it.type === 'image' && selectionRef.current.includes(it.id)).map((it) => it.id);
  const startRibbonEdit = useCallback(
    (id) => {
      ribbonEditRef.current = id;
      setRibbonEditId(id);
    },
    []
  );
  const addOrEditRibbon = useCallback(
    (ids = selectedImageIds()) => {
      if (!ids.length) return;
      const missing = ids.filter((id) => !itemsRef.current.find((it) => it.id === id)?.ribbon);
      if (missing.length) commit(itemsRef.current.map((it) => (missing.includes(it.id) ? { ...it, ribbon: { ...DEFAULT_RIBBON, lines: [...DEFAULT_RIBBON.lines] } } : it)));
      if (ids.length === 1) startRibbonEdit(ids[0]);
    },
    [commit, startRibbonEdit]
  );
  const setRibbon = useCallback(
    (patch, ids = selectedImageIds()) => {
      const set = new Set(ids);
      commit(itemsRef.current.map((it) => (set.has(it.id) && it.ribbon ? { ...it, ribbon: { ...it.ribbon, ...patch } } : it)));
    },
    [commit]
  );
  const removeRibbon = useCallback(
    (ids = selectedImageIds()) => {
      const set = new Set(ids);
      commit(itemsRef.current.map((it) => (set.has(it.id) && it.ribbon ? { ...it, ribbon: undefined } : it)));
    },
    [commit]
  );
  const onRibbonCommit = useCallback(
    (item, rawLines) => {
      if (ribbonEditRef.current !== item.id) return;
      ribbonEditRef.current = null;
      setRibbonEditId(null);
      const lines = cleanLines(rawLines);
      const current = itemsRef.current.find((it) => it.id === item.id);
      if (!current?.ribbon) return;
      if (!lines.length) removeRibbon([item.id]);
      else if (JSON.stringify(lines) !== JSON.stringify(current.ribbon.lines)) setRibbon({ lines }, [item.id]);
      canvasRef.current?.focus({ preventScroll: true });
    },
    [removeRibbon, setRibbon]
  );
  const onRibbonCancel = useCallback(() => {
    ribbonEditRef.current = null;
    setRibbonEditId(null);
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  // Menu entries for the ribbon of the selected image(s).
  const ribbonEntriesFor = (images) => {
    if (!images.length) return null;
    const one = images.length === 1 ? images[0] : null;
    const withRibbon = images.filter((it) => it.ribbon);
    if (one && !one.ribbon) return [{ label: 'Add ribbon', icon: RibbonIcon, onSelect: () => addOrEditRibbon([one.id]) }];
    if (!withRibbon.length) return [{ label: 'Add ribbons', icon: RibbonIcon, onSelect: () => addOrEditRibbon(images.map((it) => it.id)) }];
    const status = withRibbon[0].ribbon.status;
    const ids = withRibbon.map((it) => it.id);
    const entries = [];
    if (one) entries.push({ label: 'Edit text…', icon: PencilIcon, onSelect: () => startRibbonEdit(one.id) });
    entries.push({ label: 'Status', icon: RibbonIcon, submenu: RIBBON_STATUSES.map((st, i) => ({ label: st.name, shortcut: String(i + 1), swatch: `linear-gradient(${st.light}, ${st.dark})`, selected: status === st.id, onSelect: () => setRibbon({ status: st.id }, ids) })) });
    if (one) entries.push({ label: 'Side', icon: TabSideIcon, submenu: [{ label: 'Left', selected: one.ribbon.side === 'left', onSelect: () => setRibbon({ side: 'left' }, [one.id]) }, { label: 'Right', selected: one.ribbon.side !== 'left', onSelect: () => setRibbon({ side: 'right' }, [one.id]) }] });
    entries.push({ label: withRibbon.length > 1 ? 'Remove ribbons' : 'Remove ribbon', icon: TrashIcon, danger: true, onSelect: () => removeRibbon(ids) });
    return entries;
  };

  // ---- sections ----
  const selectedSectionIds = () => itemsRef.current.filter((it) => it.type === 'section' && selectionRef.current.includes(it.id)).map((it) => it.id);
  const updateSections = useCallback(
    (fn) => {
      const ids = new Set(selectedSectionIds());
      if (!ids.size) return;
      commit(itemsRef.current.map((it) => (ids.has(it.id) ? fn(it) : it)));
    },
    [commit]
  );
  const setTabSide = useCallback((side) => updateSections((f) => ({ ...f, tabSide: side })), [updateSections]);

  const toggleCollapse = useCallback(
    (id) => {
      const ids = id ? [id] : selectedSectionIds();
      if (!ids.length) return;
      const next = itemsRef.current.map((it) => (ids.includes(it.id) ? { ...it, collapsed: !it.collapsed } : it));
      commit(next);
      // Hidden children leave the selection.
      const hidden = hiddenIds(next);
      setSelection(selectionRef.current.filter((sid) => !hidden.has(sid)));
    },
    [commit, setSelection]
  );
  const tidySelected = useCallback(() => {
    let next = itemsRef.current;
    for (const id of selectedSectionIds()) next = tidySection(next, id);
    commit(next);
  }, [commit]);
  const setSectionCols = useCallback(
    (id, cols) => {
      const c = Math.max(1, Math.min(MAX_COLS, cols));
      commit(tidySection(itemsRef.current.map((it) => (it.id === id ? { ...it, cols: c } : it)), id));
    },
    [commit]
  );

  // Jump to a section: animate the view to fit it in the safe area (max 100%) and select it.
  const jumpToSection = useCallback(
    (id) => {
      const f = itemsRef.current.find((it) => it.id === id);
      if (!f) return;
      const fr = frameOf(f);
      animateView(viewForRect(fr, 1));
      setSelection([id]);
      canvasRef.current?.focus({ preventScroll: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animateView, setSelection]
  );
  const openSectionList = useCallback((anchor) => {
    const r = anchor || canvasRef.current?.getBoundingClientRect();
    setSectionList({ x: r.left, y: r.top - 4 });
  }, []);

  // "+ Section": an empty section below the last one, on the same left edge,
  // then the view scrolls to it and the name is ready to be typed over.
  const addSection = useCallback(
    (title) => {
      const sections = itemsRef.current.filter((it) => it.type === 'section');
      const section = { id: newId('section'), type: 'section', title: title || 'Untitled section', color: DEFAULT_SECTION_COLOR, tabSide: 'left', fontSize: 16, cols: DEFAULT_COLS, collapsed: false, x: 0, y: 0, w: SECTION_MIN_W, h: SECTION_MIN_H, z: 0, locked: false };
      const tab = tabMetrics(section).height;
      if (sections.length) {
        const frames = sections.map((f) => frameOf(f));
        section.x = Math.min(...frames.map((r) => r.x));
        section.y = Math.max(...frames.map((r) => r.y + r.h)) + SECTION_GAP + tab;
      } else {
        const spot = findFreeSpot(SECTION_MIN_W, SECTION_MIN_H + tab);
        section.x = spot.x;
        section.y = spot.y + tab;
      }
      section.z = Math.min(0, ...sections.map((it) => it.z)) - 1;
      commit([...itemsRef.current, section]);
      setSelection([section.id]);
      setEditingId(section.id);
      // Bring it into view without changing the zoom unless it doesn't fit.
      const v = viewRef.current;
      const target = viewForRect({ x: section.x, y: section.y - tab, w: section.w, h: section.h + tab }, v.zoom);
      animateView(target);
      canvasRef.current?.focus({ preventScroll: true });
      return section.id;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commit, setSelection, setEditingId, animateView]
  );

  const openLink = (item) => item.url && window.open(item.url, '_blank', 'noopener,noreferrer');

  const startEdit = useCallback(() => {
    const chosen = itemsRef.current.filter((it) => selectionRef.current.includes(it.id));
    if (chosen.length !== 1) return;
    const it = chosen[0];
    if (it.type === 'label' || it.type === 'text') setEditingId(it.id);
    if (it.type === 'section' && !it.collapsed) setEditingId(it.id);
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
    geomsRef.current = computeGeoms(list);
    fitToContent(list);
  }, [fitToContent, images, setItems, setSelection]);

  // ---- backup: export / import ----
  const doExport = useCallback(async () => {
    const res = await exportBoard(itemsRef.current, viewRef.current, snapGridRef.current);
    if (res.tooBig && !window.confirm(`This backup is about ${res.sizeMB} MB. Export anyway?`)) return;
    if (res.tooBig) res.download();
    else res.download();
    showToast(`Exported ${res.itemCount} item${res.itemCount === 1 ? '' : 's'}, ${res.imageCount} image${res.imageCount === 1 ? '' : 's'}`);
  }, [showToast]);
  const [importing, setImporting] = useState(null); // parsed backup awaiting confirmation
  const importFileRef = useRef(null);
  const doImportFile = useCallback(
    async (file) => {
      try {
        const parsed = await parseBackup(file, { migrateV1, repairV2, migrateV3, migrateV4, tab: visualsTab });
        setImporting(parsed);
      } catch {
        showToast("This file isn't a Rooted board backup.");
      }
    },
    [showToast]
  );
  const confirmImport = useCallback(async () => {
    const data = importing;
    if (!data) return;
    setImporting(null);
    for (const url of Object.values(images)) URL.revokeObjectURL(url);
    await storage.clearImages();
    const urls = {};
    for (const [key, blob] of Object.entries(data.blobs)) {
      await storage.putImage(key, blob);
      urls[key] = URL.createObjectURL(blob);
    }
    setImages(urls);
    history.current = { past: [], future: [] };
    const list = settle(normalizeImages(mergeWithData(data.items, visualsTab)));
    setItems(list);
    setSelection([]);
    geomsRef.current = computeGeoms(list);
    fitToContent(list);
    showToast(`Imported ${data.items.length} item${data.items.length === 1 ? '' : 's'}, ${Object.keys(data.blobs).length} image${Object.keys(data.blobs).length === 1 ? '' : 's'}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importing, images, fitToContent, setItems, setSelection, showToast]);

  // ---- pointer gestures ----
  const trackPointer = (e) => pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const endGesture = () => {
    gesture.current = null;
    setOverlay({ guides: [], spacings: [], box: null, tip: null });
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
    dismissHint();
    trackPointer(e);
    if (pointers.current.size >= 2) return startPinch();
    if (spaceRef.current) return startPan(e);

    const sel = selectionRef.current;
    if (e.shiftKey) {
      setSelection(sel.includes(item.id) ? sel.filter((id) => id !== item.id) : [...sel, item.id]);
      return;
    }
    // Double-click (or double-tap): rename a label, rename or collapse a section.
    // Detected here because pointer capture keeps the browser's own dblclick
    // from reaching the item; it only fires on release if the pointer didn't move.
    const now = Date.now();
    const last = lastPress.current;
    lastPress.current = { id: item.id, time: now, x: e.clientX, y: e.clientY };
    let dbl = null;
    if (last.id === item.id && now - last.time < 400 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 6) {
      lastPress.current = { id: null, time: 0, x: 0, y: 0 };
      if ((item.type === 'label' || item.type === 'text') && !item.locked) dbl = { type: 'rename' };
      if (item.type === 'image' && item.ribbon && e.target.closest?.('[data-ribbon]')) dbl = { type: 'ribbon' };
      if (item.type === 'section') {
        const onText = Boolean(e.target.closest?.('[data-tab-text]'));
        dbl = onText && !item.collapsed && !item.locked ? { type: 'rename' } : { type: 'collapse' };
      }
    }
    // Touch: a drag only moves an item that is already selected. The first
    // tap selects it; a drag on an unselected item pans instead.
    if (e.pointerType === 'touch' && !sel.includes(item.id)) {
      setSelection([item.id]);
      startPan(e);
      armLongPress(e, item);
      return;
    }
    const nextSel = sel.includes(item.id) ? sel : [item.id];
    setSelection(nextSel);
    if (item.locked) {
      if (dbl?.type === 'collapse') toggleCollapse(item.id);
      return;
    }
    // Children ride along inside their section's element, so only the selected items move.
    const moving = new Map(itemsRef.current.filter((it) => nextSel.includes(it.id) && !it.locked).map((it) => [it.id, { x: rectOf(it).x, y: rectOf(it).y }]));
    gesture.current = { type: 'move', pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startItems: itemsRef.current, primary: item.id, moving, moved: false, dbl };
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
    dismissHint();
    trackPointer(e);
    if (pointers.current.size >= 2) return startPinch();
    if (!e.shiftKey && editingRef.current === null) setSelection([]);
    // A drag on empty space draws a selection box (Shift keeps the current
    // selection and adds to it). Space + drag, the middle button and touch pan.
    if (e.pointerType !== 'touch' && !spaceRef.current && e.button === 0) {
      gesture.current = { type: 'box', pointerId: e.pointerId, start: toWorld(e.clientX, e.clientY), startSel: e.shiftKey ? selectionRef.current : [] };
      canvasRef.current.setPointerCapture(e.pointerId);
      return;
    }
    startPan(e);
    armLongPress(e, null);
  }

  function onHandlePointerDown(e, corner) {
    e.stopPropagation();
    if (e.button !== 0) return;
    const it = itemsRef.current.find((x) => x.id === selectionRef.current[0]);
    if (!it || it.locked) return;
    const heightFor = it.type === 'link' ? cardHeight : it.type === 'image' ? (w) => imageHeight(it, w) : undefined;
    const r0 = rectOf(it);
    if (it.type === 'link') return; // link cards have a fixed size
    if (it.type === 'text' && !(corner === 'w' || corner === 'e')) return;
    if (it.type === 'image' && it.parentId) return; // image cards inside a section keep the 280px width
    gesture.current = { type: 'resize', pointerId: e.pointerId, id: it.id, corner, start: { x: r0.x, y: r0.y, w: r0.w, h: r0.h, fontSize: it.fontSize || 14, fixedW: Boolean(it.fixedW), text: it.text }, startItems: itemsRef.current, heightFor, label: it.type === 'label', text: it.type === 'text', section: it.type === 'section', image: it.type === 'image', cols: it.cols || DEFAULT_COLS };
    canvasRef.current.setPointerCapture(e.pointerId);
    setDraggingIds([it.id]);
  }

  // Option-drag: the originals stay put and fresh copies follow the pointer.
  function startDupe(g) {
    const sources = g.startItems.filter((it) => g.moving.has(it.id));
    const { next, ids, idMap } = cloneItems(g.startItems, sources, { raw: true });
    g.dupe = true;
    g.historyBase = g.startItems;
    g.startItems = next;
    g.moving = new Map([...g.moving].map(([id, pos]) => [idMap.get(id), pos]));
    g.primary = idMap.get(g.primary);
    setSelection(ids);
  }

  function onPointerMove(e) {
    if (pointers.current.has(e.pointerId)) trackPointer(e);
    const g = gesture.current;
    if (!g) return;
    if (longPress.current && Math.hypot(e.clientX - (g.startX ?? e.clientX), e.clientY - (g.startY ?? e.clientY)) > 6) clearTimeout(longPress.current);
    latest.current = { clientX: e.clientX, clientY: e.clientY, altKey: e.altKey, shiftKey: e.shiftKey, noSnap: e.metaKey || e.ctrlKey, pointerType: e.pointerType };
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
      const hidden = hiddenIds(itemsRef.current);
      const hits = itemsRef.current.filter((it) => !hidden.has(it.id)).filter((it) => { const r = rectOf(it); return r.x < bx.x + bx.w && bx.x < r.x + r.w && r.y < bx.y + bx.h && bx.y < r.y + r.h; });
      // A section stands for its contents: don't also pick the cards inside it.
      const hitIds = new Set(hits.map((it) => it.id));
      const touched = hits.filter((it) => !(it.parentId && hitIds.has(it.parentId))).map((it) => it.id);
      setSelection([...new Set([...g.startSel, ...touched])]);
      const a = { x: g.start.x * v.zoom + v.panX, y: g.start.y * v.zoom + v.panY };
      const b = { x: cur.x * v.zoom + v.panX, y: cur.y * v.zoom + v.panY };
      setOverlay({ guides: [], spacings: [], box: { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, tip: null });
    } else if (g.type === 'move') {
      const dx = (p.clientX - g.startX) / v.zoom;
      const dy = (p.clientY - g.startY) / v.zoom;
      if (!g.moved) {
        if (Math.hypot(p.clientX - g.startX, p.clientY - g.startY) < DRAG_START) return;
        g.moved = true;
        clearTimeout(longPress.current);
        if (p.altKey && p.pointerType !== 'touch') startDupe(g);
        setDraggingIds([...g.moving.keys()]);
        setCursor(g.dupe ? 'copy' : 'grabbing');
      }
      const primary = g.startItems.find((it) => it.id === g.primary);
      const start = g.moving.get(g.primary);
      const rect = { ...rectOf(primary), x: start.x + dx, y: start.y + dy };
      const hidden = hiddenIds(g.startItems);
      const insideMoving = (it) => g.moving.has(it.id) || (it.parentId && g.moving.has(it.parentId));
      const others = g.startItems.filter((it) => !insideMoving(it) && !hidden.has(it.id)).map(rectOf);
      const snapped = snapMove(rect, others, { threshold, grid: snapGridRef.current, noSnap: p.noSnap });
      const sdx = snapped.x - start.x;
      const sdy = snapped.y - start.y;
      setItems(g.startItems.map((it) => (g.moving.has(it.id) ? setAbs(it, g.moving.get(it.id).x + sdx, g.moving.get(it.id).y + sdy, g.startItems) : it)));
      setOverlay({ guides: snapped.guides, spacings: snapped.spacings, box: null, tip: null });
      // Dragging a single card or image over a section: show where it would land.
      if (g.moving.size === 1 && primary.type !== 'section' && primary.type !== 'label') {
        const cx = snapped.x + primary.w / 2;
        const cy = snapped.y + primary.h / 2;
        const target = sectionAtPoint(cx, cy, new Set([primary.id]));
        if (target) {
          const tg = rectOf(target);
          const slot = slotAt(g.startItems, target.id, snapped.x - tg.x - SECTION_PAD, snapped.y - tg.y - SECTION_PAD, primary);
          setDropTarget((d) => (d && d.sectionItemId === target.id && d.slot.index === slot.index ? d : { sectionItemId: target.id, slot }));
        } else setDropTarget((d) => (d ? null : d));
      }
    } else if (g.type === 'resize' && g.text) {
      // Text: a side handle sets a fixed width; the text wraps and re-measures.
      const pointer = toWorld(p.clientX, p.clientY);
      const right = g.corner === 'e';
      const anchorX = right ? g.start.x : g.start.x + g.start.w;
      let w = Math.max(TEXT_MIN_W, Math.round(Math.abs(pointer.x - anchorX)));
      if (!p.noSnap && snapGridRef.current) w = Math.max(TEXT_MIN_W, snapValue(w));
      const x = right ? anchorX : anchorX - w;
      setItems(g.startItems.map((it) => (it.id === g.id ? { ...setAbs(it, x, g.start.y, g.startItems), w } : it)));
      const r = canvasRect();
      setOverlay({ guides: [], spacings: [], box: null, tip: { x: p.clientX - r.left, y: p.clientY - r.top, text: `W ${w}` } });
    } else if (g.type === 'resize' && g.label) {
      // Labels: side handles change the width; corners scale the whole chip.
      const pointer = toWorld(p.clientX, p.clientY);
      const others = g.startItems.filter((it) => it.id !== g.id);
      const st = g.start;
      const right = g.corner.includes('e');
      const bottom = g.corner.includes('s');
      const side = g.corner === 'w' || g.corner === 'e';
      const anchorX = right ? st.x : st.x + st.w;
      const anchorY = bottom ? st.y : st.y + st.h;
      let fs = st.fontSize;
      let w;
      let fixedW = st.fixedW;
      let guides = [];
      const wPointer = Math.abs(pointer.x - anchorX);
      if (side) {
        w = wPointer;
        fixedW = true;
      } else if (p.shiftKey) {
        fs = fontSizeForHeight(Math.abs(pointer.y - anchorY));
        w = wPointer;
        fixedW = true;
      } else {
        fs = clampFontSize(st.fontSize * (wPointer / st.w));
        w = st.fixedW ? Math.round((st.w * fs) / st.fontSize) : labelNaturalWidth(st.text, fs);
      }
      if (!p.noSnap && (side || p.shiftKey)) {
        const edge = right ? anchorX + w : anchorX - w;
        const tentative = { x: right ? anchorX : anchorX - w, y: st.y, w, h: labelHeight(fs) };
        const snap = snapEdgeX(edge, tentative, others, threshold);
        if (snap) {
          w = right ? snap.pos - anchorX : anchorX - snap.pos;
          guides = [snap.guide];
        } else if (snapGridRef.current) w = snapValue(w);
      }
      w = Math.max(labelMinWidth(st.text, fs), Math.round(w));
      const h = labelHeight(fs);
      const rect = { x: right ? anchorX : anchorX - w, y: bottom ? anchorY : anchorY - h, w, h };
      setItems(g.startItems.map((it) => (it.id === g.id ? { ...setAbs(it, rect.x, rect.y, g.startItems), w: rect.w, h: rect.h, fontSize: fs, fixedW } : it)));
      const r = canvasRect();
      setOverlay({ guides, spacings: [], box: null, tip: { x: p.clientX - r.left, y: p.clientY - r.top, text: `W ${w} · ${fs}px` } });
    } else if (g.type === 'resize') {
      const pointer = toWorld(p.clientX, p.clientY);
      const others = g.startItems.filter((it) => it.id !== g.id);
      if (g.section) {
        // Section handles change the column count; the height follows the content.
        const right = g.corner.includes('e');
        const anchorX = right ? g.start.x : g.start.x + g.start.w;
        const cols = colsForWidth(Math.abs(pointer.x - anchorX));
        if (cols !== g.cols) {
          g.cols = cols;
          const w = widthForCols(cols);
          const x = right ? anchorX : anchorX - w;
          setItems(tidySection(g.startItems.map((it) => (it.id === g.id ? { ...it, cols, x } : it)), g.id));
        }
        const r = canvasRect();
        setOverlay({ guides: [], spacings: [], box: null, tip: { x: p.clientX - r.left, y: p.clientY - r.top, text: `${g.cols} column${g.cols === 1 ? '' : 's'}` } });
        return;
      }
      const { rect, guides } = snapResize(g.start, g.corner, pointer, others.map(rectOf), { threshold, grid: snapGridRef.current, noSnap: p.noSnap, heightFor: g.heightFor, minW: g.image ? 160 : 80 });
      setItems(g.startItems.map((it) => (it.id === g.id ? { ...setAbs(it, rect.x, rect.y, g.startItems), w: rect.w, h: rect.h } : it)));
      const r = canvasRect();
      setOverlay({ guides, spacings: [], box: null, tip: { x: p.clientX - r.left, y: p.clientY - r.top, text: `${Math.round(rect.w)} × ${Math.round(rect.h)}` } });
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
    if (g.type === 'move' && !g.moved && g.dbl) {
      const it = itemsRef.current.find((x) => x.id === g.primary);
      if (it && g.dbl.type === 'rename') {
        setSelection([it.id]);
        setEditingId(it.id);
      } else if (it && g.dbl.type === 'collapse') toggleCollapse(it.id);
      else if (it && g.dbl.type === 'ribbon') startRibbonEdit(it.id);
    }
    if (g.type === 'move' && g.moved) {
      pushHistory(g.historyBase || g.startItems);
      // Cards and images dropped inside a section body join it; dragged out, they leave it.
      let next = itemsRef.current;
      const movedTop = [...g.moving.keys()];
      let received = null;
      for (const id of movedTop) {
        const it = next.find((x) => x.id === id);
        if (!it || it.type === 'section' || it.type === 'label') continue;
        const r = rectOf(it);
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        const target = sectionAtPoint(cx, cy, new Set(movedTop));
        if (target) {
          // Insert at the grid slot nearest the drop point, then tidy.
          const tg = rectOf(target);
          const slot = slotAt(next, target.id, r.x - tg.x - SECTION_PAD, r.y - tg.y - SECTION_PAD, it);
          const from = it.parentId;
          // Image cards take the 280px column width inside a section.
          if (it.type === 'image' && it.w !== IMAGE_W) next = next.map((x) => (x.id === id ? { ...x, w: IMAGE_W, h: imageHeight(x, IMAGE_W) } : x));
          next = insertChildAt(next, target.id, id, slot.index);
          if (from && from !== target.id) next = tidySection(next, from);
          if (target.id !== from) received = target.id;
        } else if (it.parentId) {
          const from = it.parentId;
          next = next.map((x) => (x.id === id ? { ...x, parentId: undefined, cx: undefined, cy: undefined, x: r.x, y: r.y } : x));
          next = tidySection(next, from);
        }
      }
      setDropTarget(null);
      setItems(settle(next));
      if (received) {
        clearTimeout(flashTimer.current);
        setFlashId(received);
        flashTimer.current = setTimeout(() => setFlashId(null), 600);
      }
    }
    if (g.type === 'resize') {
      pushHistory(g.startItems);
      if (g.section) setItems(settle(itemsRef.current));
    }
    setDropTarget(null);
    endGesture();
    // A dropped card is re-parented in the DOM (into or out of a section), which
    // drops the focus it took on press; keep the keyboard on the canvas.
    requestAnimationFrame(() => {
      const el = canvasRef.current;
      if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
    });
  }

  // ---- labels: measuring and inline editing ----
  const onMeasure = useCallback(
    (id, w, h) => {
      setItems(itemsRef.current.map((it) => (it.id === id ? (it.type === 'text' ? { ...it, mw: w, mh: h } : { ...it, w, h }) : it)));
    },
    [setItems]
  );
  const text0 = (t) => (t == null ? '' : String(t));
  const onEditCommit = useCallback(
    (item, text) => {
      if (editingRef.current !== item.id) return;
      setEditingId(null);
      if (item.type === 'text') {
        const value = text0(text).replace(/\s+$/, '');
        if (!value.trim()) {
          commit(itemsRef.current.filter((it) => it.id !== item.id));
          setSelection([]);
        } else if (value !== item.text) commit(itemsRef.current.map((it) => (it.id === item.id ? { ...it, text: value } : it)));
        canvasRef.current?.focus({ preventScroll: true });
        return;
      }
      if (item.type === 'section') {
        const title = text || item.title || 'Section';
        if (title !== item.title) commit(itemsRef.current.map((it) => (it.id === item.id ? { ...it, title } : it)));
        canvasRef.current?.focus({ preventScroll: true });
        return;
      }
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
        { label: 'Add section', icon: SectionIcon, onSelect: () => addSection() },
        { label: 'Add text', icon: TextIcon, onSelect: () => addText() },
        { label: 'Upload image', icon: ImageIcon, onSelect: () => document.getElementById('canvas-file-input')?.click() },
        { label: 'Paste', icon: ClipboardIcon, shortcut: mod('V'), disabled: !clipHas, onSelect: () => pasteItems(clipboardRef.current?.items, menu.world) },
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
    if (one && one.type !== 'link' && one.type !== 'image' && !(one.type === 'section' && one.collapsed)) entries.push({ label: 'Edit', icon: PencilIcon, onSelect: startEdit });
    const sections = chosen.filter((it) => it.type === 'section');
    if (sections.length) {
      const f = sections[0];
      entries.push({ label: 'Color', icon: PaletteIcon, submenu: [...SECTION_PRESETS.map((p) => ({ label: p.name, swatch: p.bg, selected: (f.color || DEFAULT_SECTION_COLOR) === p.id, onSelect: () => setLabelColor(p.id) })), 'divider', { label: 'Custom…', onSelect: () => colorInput.current?.click() }] });
      entries.push({ label: 'Size', icon: TextSizeIcon, submenu: LABEL_SIZES.map((sz) => ({ label: `${sz.id} (${sz.fs})`, selected: f.fontSize === sz.fs, onSelect: () => setLabelSize(sz.fs) })) });
      entries.push({ label: 'Tab position', icon: TabSideIcon, submenu: [{ label: 'Left', selected: f.tabSide !== 'right', onSelect: () => setTabSide('left') }, { label: 'Right', selected: f.tabSide === 'right', onSelect: () => setTabSide('right') }] });
      entries.push({ label: f.collapsed ? 'Expand' : 'Collapse', icon: f.collapsed ? ExpandIcon : CollapseIcon, onSelect: () => toggleCollapse() });
      entries.push({ label: 'Tidy up', icon: TidyIcon, onSelect: tidySelected });
    }
    const imagesChosen = chosen.filter((it) => it.type === 'image');
    const ribbonEntries = ribbonEntriesFor(imagesChosen);
    if (ribbonEntries) {
      if (ribbonEntries.length === 1) entries.push(ribbonEntries[0]);
      else entries.push({ label: 'Ribbon', icon: RibbonIcon, submenu: ribbonEntries });
    }
    const texts = chosen.filter((it) => it.type === 'text');
    if (texts.length) {
      const t = texts[0];
      const presets = t.fill === 'filled' ? SECTION_PRESETS : TEXT_COLOR_PRESETS;
      entries.push({ label: 'Fill', icon: t.fill === 'filled' ? FillIcon : TransparentIcon, submenu: [{ label: 'Filled', icon: FillIcon, selected: t.fill === 'filled', onSelect: () => setTextProps({ fill: 'filled' }) }, { label: 'Transparent', icon: TransparentIcon, selected: t.fill !== 'filled', onSelect: () => setTextProps({ fill: 'transparent' }) }] });
      entries.push({ label: 'Color', icon: PaletteIcon, submenu: [...presets.map((p) => ({ label: p.name, swatch: p.bg, selected: t.color === p.id, onSelect: () => setTextProps({ color: p.id }) })), 'divider', { label: 'Custom…', onSelect: () => colorInputText.current?.click() }] });
      entries.push({ label: 'Size', icon: TextSizeIcon, submenu: TEXT_SIZE_IDS.map((id) => ({ label: `${id} (${{ S: 14, M: 20, L: 28, XL: 40 }[id]})`, selected: t.size === id, onSelect: () => setTextProps({ size: id }) })) });
      entries.push({ label: 'Weight', icon: BoldIcon, submenu: [{ label: 'Regular', selected: t.weight === 400, onSelect: () => setTextProps({ weight: 400 }) }, { label: 'Medium', selected: t.weight !== 400, onSelect: () => setTextProps({ weight: 500 }) }] });
      entries.push({ label: 'Align', icon: AlignTextLeftIcon, submenu: [{ label: 'Left', icon: AlignTextLeftIcon, selected: !t.align || t.align === 'left', onSelect: () => setTextProps({ align: 'left' }) }, { label: 'Center', icon: AlignTextCenterIcon, selected: t.align === 'center', onSelect: () => setTextProps({ align: 'center' }) }, { label: 'Right', icon: AlignTextRightIcon, selected: t.align === 'right', onSelect: () => setTextProps({ align: 'right' }) }] });
      if (typeof t.w === 'number') entries.push({ label: 'Auto width', icon: AutoWidthIcon, onSelect: () => setTextProps({ w: 'auto' }) });
    }
    const labels = chosen.filter((it) => it.type === 'label');
    if (labels.length) {
      const current = labels[0].color || 'gray';
      entries.push({
        label: 'Color',
        icon: PaletteIcon,
        submenu: [
          ...LABEL_PRESETS_COLORS.map((p) => ({ label: p.name, swatch: p.bg, selected: current === p.id, onSelect: () => setLabelColor(p.id) })),
          'divider',
          { label: 'Custom…', swatch: LABEL_PRESETS_COLORS.some((p) => p.id === current) ? 'linear-gradient(135deg, #f87171, #facc15, #4ade80, #60a5fa, #c084fc)' : current, selected: !LABEL_PRESETS_COLORS.some((p) => p.id === current), onSelect: () => colorInput.current?.click() },
        ],
      });
    }
    entries.push({ label: 'Duplicate', icon: CopyIcon, shortcut: mod('D'), onSelect: duplicateSelected });
    entries.push({ label: 'Copy', icon: ClipboardIcon, shortcut: mod('C'), onSelect: () => copySelection() });
    if (one?.url) entries.push({ label: 'Open link', icon: ExternalLinkIcon, onSelect: () => openLink(one) });
    entries.push({ label: 'Bring to front', icon: BringFrontIcon, shortcut: mod(']'), onSelect: bringToFront });
    entries.push({ label: 'Send to back', icon: SendBackIcon, shortcut: mod('['), onSelect: sendToBack });
    if (labels.length) {
      const fs = labels[0].fontSize || 14;
      entries.push({ label: 'Size', icon: TextSizeIcon, submenu: LABEL_SIZES.map((sz) => ({ label: `${sz.id} (${sz.fs})`, selected: fs === sz.fs, onSelect: () => setLabelSize(sz.fs) })) });
    }
    if (chosen.length >= 2) entries.push({ label: 'Align', icon: AlignLeftIcon, submenu: alignEntries(chosen.length, align) });
    entries.push({ label: allLocked ? 'Unlock position' : 'Lock position', icon: allLocked ? UnlockIcon : LockIcon, shortcut: mod('L'), onSelect: toggleLock });
    entries.push('divider');
    entries.push({ label: 'Remove', icon: TrashIcon, danger: true, shortcut: 'Del', disabled: allLocked, onSelect: deleteSelected });
    return entries;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu, snapGrid, clipHas, copySelection, pasteItems, addLabel, addSection, fitToContent, zoomTo, startEdit, duplicateSelected, bringToFront, sendToBack, align, toggleLock, deleteSelected, setLabelColor, setLabelSize, setTabSide, toggleCollapse, tidySelected, addOrEditRibbon, setRibbon, removeRibbon, startRibbonEdit, setTextProps]);

  // ---- keyboard (only while the canvas has focus) ----
  function onKeyDown(e) {
    const mod = e.metaKey || e.ctrlKey;
    const k = e.key;
    const lower = k.toLowerCase();
    // 1–4 set the ribbon status while the ribbon menu is open.
    if (ribbonMenuOpen.current && /^[1-4]$/.test(k) && !mod) {
      e.preventDefault();
      setRibbon({ status: RIBBON_STATUSES[Number(k) - 1].id });
      return;
    }
    if (e.target.closest?.('.modal, .cmenu, .citem__label-edit, .ribbon__edit, [contenteditable="true"], input, textarea')) return;
    if (editingRef.current || ribbonEditRef.current) return;
    if (lower === 'r' && !mod && !e.altKey && selectedImageIds().length) {
      e.preventDefault();
      addOrEditRibbon();
      return;
    }
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
    if (mod && lower === 'j') {
      e.preventDefault();
      openSectionList(document.querySelector('[aria-label="Sections (⌘J)"]')?.getBoundingClientRect());
      return;
    }
    if (mod && lower === 'a') {
      e.preventDefault();
      const hidden = hiddenIds(itemsRef.current);
      setSelection(itemsRef.current.filter((it) => !hidden.has(it.id)).map((it) => it.id));
      return;
    }
    if (mod && lower === 'd') {
      e.preventDefault();
      duplicateSelected();
      return;
    }
    if (mod && lower === 'c') {
      copySelection(); // the browser's own copy event follows and fills the system clipboard
      return;
    }
    if (mod && lower === 'v') {
      // The paste event carries the clipboard; if none arrives (empty system
      // clipboard), fall back to the last copy made here.
      if (clipboardRef.current) {
        const t = setTimeout(() => {
          if (pendingPaste.current !== t) return;
          pendingPaste.current = null;
          pasteItems(clipboardRef.current.items);
        }, 150);
        pendingPaste.current = t;
      }
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

  // ---- files: drag over, drop and paste ----
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
  function onDragEnter(e) {
    e.preventDefault();
    dragDepth.current += 1;
    if (hasFiles(e) && !touchRef.current) setDropping(true);
  }
  function onDragLeave() {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDropping(false);
  }
  function onDrop(e) {
    e.preventDefault();
    dragDepth.current = 0;
    setDropping(false);
    const files = [...e.dataTransfer.files];
    if (files.length) {
      addFiles(files, toWorld(e.clientX, e.clientY));
      return;
    }
    const types = [...e.dataTransfer.types];
    if (types.includes('text/uri-list') || types.includes('text/html') || types.includes('text/plain')) {
      showToast('Save the image to your computer first, then drop the file.');
    }
  }
  const typing = (e) => Boolean(e.target.closest?.('[contenteditable="true"], input, textarea') || editingRef.current || ribbonEditRef.current);
  function onCopy(e) {
    if (typing(e)) return;
    copySelection(e);
  }
  function onPaste(e) {
    clearTimeout(pendingPaste.current);
    pendingPaste.current = null;
    if (typing(e)) return;
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) {
      e.preventDefault();
      addFiles(files, null);
      return;
    }
    const text = e.clipboardData?.getData('text/plain') || '';
    if (text.startsWith(CLIP_MARK)) {
      e.preventDefault();
      try {
        const items = JSON.parse(text.slice(CLIP_MARK.length));
        if (!clipboardRef.current || JSON.stringify(clipboardRef.current.items) !== JSON.stringify(items)) clipboardRef.current = { items, pastes: 0 };
        setClipHas(true);
        pasteItems(clipboardRef.current.items);
      } catch {
        /* not ours */
      }
      return;
    }
    if (clipboardRef.current) {
      e.preventDefault();
      pasteItems(clipboardRef.current.items);
    }
  }

  // ---- render ----
  // World geometry for this render (also kept in a ref for the event handlers).
  const geoms = useMemo(() => computeGeoms(items), [items, fontsReady]);
  geomsRef.current = geoms;
  const single = selectedItems.length === 1 ? selectedItems[0] : null;
  const singleRect = single ? geoms.get(single.id) : null;
  // Section handles sit on the tab + body frame; link cards have no handles.
  const handles = single && singleRect && !single.locked && !editingId && single.type !== 'link' ? (single.type === 'section' ? { x: singleRect.x, y: singleRect.y - singleRect.tabH, w: singleRect.w, h: singleRect.h + singleRect.tabH, section: true } : { x: singleRect.x, y: singleRect.y, w: singleRect.w, h: singleRect.h }) : null;
  // Selection outlines are drawn in the overlay (zoom-independent gap and stroke);
  // each follows its item's corner radius. Sections stroke their own shape instead.
  const radiusFor = (it) => (it.type === 'image' ? 16 : it.type === 'link' ? 12 : it.type === 'text' ? 10 : it.type === 'label' ? labelMetrics(it.fontSize || 14).radius : 0);
  const hiddenNow = hiddenIds(items);
  const outlines = selectedItems.filter((it) => it.type !== 'section' && !hiddenNow.has(it.id) && geoms.get(it.id)).map((it) => { const g = geoms.get(it.id); return { id: it.id, x: g.x, y: g.y, w: g.w, h: g.h, radius: radiusFor(it) }; });
  const sizeLabel = single?.type === 'section' && singleRect ? { x: singleRect.x, y: singleRect.y + singleRect.h, text: `${single.cols || DEFAULT_COLS} column${(single.cols || DEFAULT_COLS) === 1 ? '' : 's'} · ${Math.round(singleRect.w)} × ${Math.round(singleRect.h)}` } : null;
  const groupBox = selectedItems.length > 1 ? bounds(selectedItems.map((it) => { const g = geoms.get(it.id); return it.type === 'section' ? { x: g.x, y: g.y - g.tabH, w: g.w, h: g.h + g.tabH } : g; })) : null;
  const selectedParents = new Set(selectedItems.map((it) => it.parentId).filter(Boolean));
  // Sections render first (stack order, or by z), then loose items by z. Children
  // render inside their section's element.
  const sorted = useMemo(() => {
    const byZ = (a, b) => a.z - b.z;
    return [...items.filter((it) => it.type === 'section').sort(byZ), ...items.filter((it) => it.type !== 'section' && !it.parentId).sort(byZ)];
  }, [items]);
  const childrenBySection = useMemo(() => {
    const m = new Map();
    for (const it of items) if (it.parentId) (m.get(it.parentId) || m.set(it.parentId, []).get(it.parentId)).push(it);
    for (const list of m.values()) list.sort((a, b) => a.z - b.z);
    return m;
  }, [items]);
  const childCounts = useMemo(() => {
    const m = new Map();
    for (const it of items) if (it.parentId) m.set(it.parentId, (m.get(it.parentId) || 0) + 1);
    return m;
  }, [items]);
  const firstSection = selectedItems.find((it) => it.type === 'section');
  const sectionEntries = firstSection
    ? [
        { label: 'Tab position', icon: TabSideIcon, submenu: [{ label: 'Left', selected: firstSection.tabSide !== 'right', onSelect: () => setTabSide('left') }, { label: 'Right', selected: firstSection.tabSide === 'right', onSelect: () => setTabSide('right') }] },
        { label: firstSection.collapsed ? 'Expand' : 'Collapse', icon: firstSection.collapsed ? ExpandIcon : CollapseIcon, onSelect: () => toggleCollapse() },
        { label: 'Tidy up', icon: TidyIcon, onSelect: tidySelected },
        'divider',
        { label: 'Duplicate', icon: CopyIcon, onSelect: duplicateSelected },
        { label: 'Bring to front', icon: BringFrontIcon, onSelect: bringToFront },
        { label: 'Send to back', icon: SendBackIcon, onSelect: sendToBack },
      ]
    : undefined;
  // Only items within the view plus a 500px margin render their images.
  const margin = 500 / view.zoom;
  const vx0 = -view.panX / view.zoom - margin;
  const vy0 = -view.panY / view.zoom - margin;
  const vx1 = (size.w - view.panX) / view.zoom + margin;
  const vy1 = (size.h - view.panY) / view.zoom + margin;
  const inView = (it) => {
    const r = geoms.get(it.id) || it;
    return r.x + r.w > vx0 && r.x < vx1 && r.y + r.h > vy0 && r.y < vy1;
  };
  const renderItem = (item, extra = {}) => (
    <CanvasItem
      key={item.id}
      item={item}
      selected={selection.includes(item.id)}
      editing={editingId === item.id}
      dragging={draggingIds?.includes(item.id)}
      visible={inView(item)}
      childCount={childCounts.get(item.id) || 0}
      flash={flashId === item.id}
      dimmed={Boolean(ribbonFilter) && item.type === 'image' && item.ribbon?.status !== ribbonFilter}
      ribbonEditing={ribbonEditId === item.id && !phone}
      imageUrl={item.type === 'image' ? images[item.imageKey] : undefined}
      geom={item.type === 'section' ? geoms.get(item.id) : null}
      childSelected={item.type === 'section' && selectedParents.has(item.id)}
      dropGhost={dropTarget && dropTarget.sectionItemId === item.id ? dropTarget.slot : null}
      onPointerDown={onItemPointerDown}
      onDoubleClick={onItemDoubleClick}
      onContextMenu={onItemContextMenu}
      onMeasure={onMeasure}
      onEditCommit={onEditCommit}
      onEditCancel={onEditCancel}
      onOpen={openLink}
      onRibbonCommit={onRibbonCommit}
      onRibbonCancel={onRibbonCancel}
      {...extra}
    >
      {item.type === 'section' && !item.collapsed ? (childrenBySection.get(item.id) || []).map((child) => renderItem(child)) : null}
    </CanvasItem>
  );
  const firstLabel = selectedItems.find((it) => it.type === 'label');
  const firstText = selectedItems.find((it) => it.type === 'text');

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
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onCopy={onCopy}
        onPaste={onPaste}
      >
        <div className="canvas__world" style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }}>
          {ready && sorted.map((item) => renderItem(item))}
        </div>

        {pending.length > 0 && (
          <div className="canvas__world canvas__world--pending" style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }} aria-hidden="true">
            {pending.map((p) => (
              <div key={p.id} className="skeleton" style={{ transform: `translate(${p.x}px, ${p.y}px)`, width: p.w, height: p.h }} />
            ))}
          </div>
        )}
        {dropping && (
          <div className="drop-overlay" aria-hidden="true">
            <div className="drop-overlay__pill floating">
              <ImageIcon />
              Drop images to add them
            </div>
          </div>
        )}

        <Guides guides={overlay.guides} spacings={overlay.spacings} box={overlay.box} handles={handles} sideHandles={single?.type === 'label' || single?.type === 'section' || single?.type === 'text'} sidesOnly={single?.type === 'text'} tip={overlay.tip} sizeLabel={sizeLabel} groupBox={groupBox} outlines={outlines} toScreen={toScreen} zoom={view.zoom} onHandlePointerDown={onHandlePointerDown} />

        <ToolBar
          selectionCount={selection.length}
          canEdit={!!single && single.type !== 'link' && single.type !== 'image' && !(single.type === 'section' && single.collapsed)}
          allLocked={selectedItems.length > 0 && selectedItems.every((it) => it.locked)}
          labelColor={firstLabel ? firstLabel.color || DEFAULT_LABEL_COLOR : undefined}
          labelSize={firstLabel ? firstLabel.fontSize || 14 : firstSection ? firstSection.fontSize || 13 : undefined}
          sectionColor={!firstLabel && firstSection ? firstSection.color || DEFAULT_SECTION_COLOR : undefined}
          sectionEntries={sectionEntries}
          textProps={firstText ? { fill: firstText.fill || 'transparent', color: firstText.color, swatch: firstText.fill === 'filled' ? textColors(firstText).bg : textColors(firstText).text, size: firstText.size || 'M', weight: firstText.weight || 500, align: firstText.align || 'left' } : undefined}
          onText={setTextProps}
          ribbonEntries={ribbonEntriesFor(selectedItems.filter((it) => it.type === 'image'))}
          onRibbonMenu={(open) => {
            ribbonMenuOpen.current = open;
          }}
          onAddSection={() => addSection()}
          onAddText={() => addText()}
          phone={phone}
          onPickColor={setLabelColor}
          onPickSize={setLabelSize}
          onAddLabel={addLabel}
          onUploadFiles={(files) => addFiles(files, null)}
          onEdit={startEdit}
          onAlign={align}
          onToggleLock={toggleLock}
          onDelete={deleteSelected}
          onClearSelection={() => setSelection([])}
        />
        {ready && !phone && (
          <span className={`canvas__saved${saveState === 'saving' ? ' is-saving' : ''}${saveState === 'failed' ? ' is-failed' : ''}`} role="status">
            {saveState === 'saved' && <CheckIcon width={12} height={12} />}
            {saveState === 'saving' ? 'Saving…' : saveState === 'failed' ? 'Not saved' : 'Saved'}
          </span>
        )}
        <ZoomBar
          zoom={view.zoom}
          snap={snapGrid}
          phone={phone}
          onZoomIn={() => zoomTo(viewRef.current.zoom + ZOOM_STEP)}
          onZoomOut={() => zoomTo(viewRef.current.zoom - ZOOM_STEP)}
          onReset={() => zoomTo(1)}
          onToggleSnap={() => setSnapGrid(!snapGridRef.current)}
          onFit={() => fitToContent()}
          onSections={(anchor) => (sectionList ? setSectionList(null) : openSectionList(anchor))}
          sectionsOpen={Boolean(sectionList)}
        />
        {sectionList &&
          (() => {
            const sections = [...items.filter((it) => it.type === 'section')].sort((a, b) => a.y - b.y || a.x - b.x);
            const entries = [
              ...sections.map((f) => ({ label: f.title || 'Untitled section', swatch: sectionColors(f.color).bg, trailing: items.filter((it) => it.parentId === f.id).length, onSelect: () => jumpToSection(f.id) })),
              'divider',
              { label: '+ New section', icon: SectionIcon, keep: true, onSelect: () => addSection() },
            ];
            const props = { entries, onClose: () => setSectionList(null), label: 'Sections' };
            return phone ? <SheetMenu {...props} /> : <ContextMenu x={sectionList.x} y={sectionList.y} above searchable placeholder="Jump to a section…" {...props} />;
          })()}
        <InfoPopover ribbonFilter={ribbonFilter} onRibbonFilter={setRibbonFilter} onExport={doExport} onImport={() => importFileRef.current?.click()} />
        <input ref={importFileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) doImportFile(f); e.target.value = ''; }} />
        {toast ? (
          <div className="canvas__toast canvas__toast--dark" role="status">
            {toast}
          </div>
        ) : (
          hint && (
            <div className="canvas__toast floating" role="status">
              {touchRef.current ? 'Drag to move · Pinch to zoom · Long-press for options' : `Drag to move · ${modLabel('')}+ scroll to zoom · Right-click for options`}
              <button type="button" className="icon-button" onClick={dismissHint} aria-label="Dismiss hint">
                <CloseIcon width={14} height={14} />
              </button>
            </div>
          )
        )}
      </div>

      <input ref={colorInput} type="color" className="visually-hidden" tabIndex={-1} aria-hidden="true" defaultValue="#AABBCC" onChange={(e) => setLabelColor(e.target.value)} />
      <input ref={colorInputText} type="color" className="visually-hidden" tabIndex={-1} aria-hidden="true" defaultValue="#AABBCC" onChange={(e) => setTextProps({ color: e.target.value })} />
      {menu &&
        (phone ? (
          <SheetMenu entries={menuEntries} onClose={() => setMenu(null)} label={menu.kind === 'item' ? 'Options' : 'Canvas'} />
        ) : (
          <ContextMenu x={menu.x} y={menu.y} entries={menuEntries} onClose={() => setMenu(null)} label={menu.kind === 'item' ? 'Item menu' : 'Canvas menu'} />
        ))}

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

      <Modal open={dialog?.type === 'deleteSection'} onClose={() => setDialog(null)} title={`Delete section and its ${dialog?.count} item${dialog?.count === 1 ? '' : 's'}?`} subtitle="You can also keep the items and only remove the section." width={420}>
        <div className="cdialog">
          <div className="modal__actions">
            <button type="button" className="button button--light" data-autofocus onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button type="button" className="button button--light" onClick={() => { removeItems(dialog.ids, true); setDialog(null); }}>
              Keep items
            </button>
            <button type="button" className="button button--dark" onClick={() => { removeItems(dialog.ids, false); setDialog(null); }}>
              Delete all
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={phone && Boolean(ribbonEditId)} onClose={onRibbonCancel} title="Ribbon text" subtitle="Up to 3 short lines (4, 8 and 8 characters)." width={420}>
        {phone && ribbonEditId && (
          <form
            className="cdialog"
            onSubmit={(e) => {
              e.preventDefault();
              const it = itemsRef.current.find((x) => x.id === ribbonEditId);
              const values = [0, 1, 2].map((i) => e.currentTarget.elements[`rb-line-${i}`].value);
              if (it) onRibbonCommit(it, values);
            }}
          >
            {[0, 1, 2].map((i) => (
              <div className="field" key={i}>
                <label htmlFor={`rb-line-${i}`}>Line {i + 1}</label>
                <input id={`rb-line-${i}`} name={`rb-line-${i}`} type="text" maxLength={RIBBON_LIMITS[i]} defaultValue={itemsRef.current.find((x) => x.id === ribbonEditId)?.ribbon?.lines?.[i] || ''} data-autofocus={i === 0 ? true : undefined} />
              </div>
            ))}
            <div className="modal__actions">
              <button type="button" className="button button--light" onClick={onRibbonCancel}>
                Cancel
              </button>
              <button type="submit" className="button button--dark">
                Save
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(importing)} onClose={() => setImporting(null)} title="Replace your current board with this backup?" subtitle={importing ? `${importing.items.length} item${importing.items.length === 1 ? '' : 's'}, ${Object.keys(importing.blobs).length} image${Object.keys(importing.blobs).length === 1 ? '' : 's'}. This can't be undone.` : ''} width={420}>
        <div className="cdialog">
          <div className="modal__actions">
            <button type="button" className="button button--light" data-autofocus onClick={() => setImporting(null)}>
              Cancel
            </button>
            <button type="button" className="button button--dark" onClick={confirmImport}>
              Replace board
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
              commit(itemsRef.current.map((it) => (it.id === dialog.id ? { ...it, caption, url: url || undefined } : it)));
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

