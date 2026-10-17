import { createContext, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { getSlug } from '../lib/references.js';
import SiteIcon from './SiteIcon.jsx';

// ------------------------------------------------------------
// Where the preview image comes from, in order:
//   1. item.image (manual override in the data file)
//   2. /previews/<slug>.webp (made by `npm run previews`)
//   3. thum.io screenshot service (backup only, limited free quota)
//   4. nothing -> the placeholder
// The result is remembered per item, so failed URLs are never retried.
// ------------------------------------------------------------
const sourceCache = new Map(); // item.key -> Promise<string | null>

export const PREVIEW_W = 320;
export const PREVIEW_H = 200;

function tryLoad(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function resolvePreviewSource(item) {
  if (!sourceCache.has(item.key)) {
    const candidates = [
      item.image,
      `/previews/${getSlug(item.url)}.webp`,
      `https://image.thum.io/get/width/640/crop/750/${item.url}`,
    ].filter(Boolean);

    const run = (async () => {
      for (const src of candidates) {
        const ok = await tryLoad(src);
        if (ok) return ok;
      }
      return null; // placeholder
    })();
    sourceCache.set(item.key, run);
  }
  return sourceCache.get(item.key);
}

// React hook: returns { src, loading } for an item. Used by the cursor preview
// and by the Random dialog so both show the same image.
export function usePreviewImage(item) {
  const [state, setState] = useState({ key: null, src: null, loading: false });
  useEffect(() => {
    if (!item) return undefined;
    let alive = true;
    setState({ key: item.key, src: null, loading: true });
    resolvePreviewSource(item).then((src) => {
      if (alive) setState({ key: item.key, src, loading: false });
    });
    return () => {
      alive = false;
    };
  }, [item]);
  return state.key === item?.key ? state : { key: null, src: null, loading: true };
}

// The gray box shown when there is no image.
export function PreviewPlaceholder({ item }) {
  return (
    <div className="preview-placeholder">
      <span className="preview-placeholder__icon">
        <SiteIcon name={item.name} domain={item.domain} size={32} />
      </span>
      <span className="preview-placeholder__domain">{item.domain}</span>
    </div>
  );
}

// ------------------------------------------------------------
// Context: list cards call `preview.show / move / hide` without re-rendering.
// ------------------------------------------------------------
const PreviewContext = createContext({ enabled: false, show() {}, move() {}, hide() {} });
export const usePreview = () => useContext(PreviewContext);

export function PreviewProvider({ previewRef, children }) {
  // Only real mouse devices get the floating preview.
  const enabled = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    []
  );
  const api = useMemo(
    () => ({
      enabled,
      show: (item, x, y) => enabled && previewRef.current?.show(item, x, y),
      move: (item, x, y) => enabled && previewRef.current?.move(item, x, y),
      hide: () => previewRef.current?.hide(),
    }),
    [enabled, previewRef]
  );
  return <PreviewContext.Provider value={api}>{children}</PreviewContext.Provider>;
}

// ------------------------------------------------------------
// The one floating preview element for the whole page.
// Position updates happen with refs + requestAnimationFrame, never via React state.
// ------------------------------------------------------------
const OFFSET = 20;
const EDGE = 8;

const CursorPreview = forwardRef(function CursorPreview(_, ref) {
  const [item, setItem] = useState(null);
  const [visible, setVisible] = useState(false);
  const { src, loading } = usePreviewImage(item);

  const el = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  const visibleRef = useRef(false);
  const itemKeyRef = useRef(null);
  const hideTimer = useRef(0);

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Where the box should sit for a cursor at (x, y): right/below by default,
  // flipped to left/above when it would leave the window.
  function placeFor(x, y) {
    let px = x + OFFSET;
    let py = y + OFFSET;
    if (px + PREVIEW_W > window.innerWidth - EDGE) px = x - OFFSET - PREVIEW_W;
    if (py + PREVIEW_H > window.innerHeight - EDGE) py = y - OFFSET - PREVIEW_H;
    return { x: Math.max(EDGE, px), y: Math.max(EDGE, py) };
  }

  function paint() {
    if (!el.current) return;
    el.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
  }

  function tick() {
    const ease = reduceMotion ? 1 : 0.2;
    const dx = target.current.x - current.current.x;
    const dy = target.current.y - current.current.y;
    current.current.x += dx * ease;
    current.current.y += dy * ease;
    paint();
    const settled = Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1;
    if (settled && !visibleRef.current) {
      frame.current = 0;
      return;
    }
    if (settled) {
      current.current = { ...target.current };
      paint();
      frame.current = 0;
      return;
    }
    frame.current = requestAnimationFrame(tick);
  }

  function ensureLoop() {
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  }

  function show(nextItem, x, y) {
    clearTimeout(hideTimer.current);
    target.current = placeFor(x, y);
    if (!visibleRef.current) {
      // Appear at the cursor instead of sliding in from the last position.
      current.current = { ...target.current };
      paint();
    }
    visibleRef.current = true;
    itemKeyRef.current = nextItem.key;
    setItem((prev) => (prev?.key === nextItem.key ? prev : nextItem));
    setVisible(true);
    ensureLoop();
  }

  useImperativeHandle(ref, () => ({
    show,
    move(item, x, y) {
      // If the browser skipped the enter event (e.g. the card appeared under a
      // resting cursor), treat the first move as an enter.
      if (!visibleRef.current || itemKeyRef.current !== item.key) {
        show(item, x, y);
        return;
      }
      target.current = placeFor(x, y);
      ensureLoop();
    },
    hide() {
      // A tiny delay lets "leave card A, enter card B" swap without a blink.
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        visibleRef.current = false;
        setVisible(false);
      }, 40);
    },
  }));

  // Hide on scroll and when the window loses focus.
  useEffect(() => {
    const hide = () => {
      clearTimeout(hideTimer.current);
      visibleRef.current = false;
      setVisible(false);
    };
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('blur', hide);
    return () => {
      window.removeEventListener('scroll', hide, { capture: true });
      window.removeEventListener('blur', hide);
      cancelAnimationFrame(frame.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  return createPortal(
    <div
      ref={el}
      className={`cursor-preview${visible ? ' is-visible' : ''}${reduceMotion ? ' is-reduced' : ''}`}
      aria-hidden="true"
    >
      {item && (src ? (
        <img className="cursor-preview__img" src={src} alt="" width={PREVIEW_W} height={PREVIEW_H} />
      ) : (
        <div className={`cursor-preview__fallback${loading ? ' is-loading' : ''}`}>
          <PreviewPlaceholder item={item} />
        </div>
      ))}
    </div>,
    document.body
  );
});

export default CursorPreview;
