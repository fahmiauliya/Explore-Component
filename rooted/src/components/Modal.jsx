import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

// Shared dialog shell: backdrop, scroll lock, focus handling.
// `position` is 'top' (search) or 'center' (random, request).
// Esc is handled once, globally, in App.jsx, so this only handles the backdrop click.
export default function Modal({ open, onClose, label, labelledBy, position = 'center', width = 440, children }) {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

  // Lock page scrolling and move focus into the dialog while it's open.
  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const first = panel?.querySelector('[data-autofocus]') || panel?.querySelector(FOCUSABLE);
    // Wait one frame so the element is painted before focusing.
    const frame = requestAnimationFrame(() => first?.focus());

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = prevOverflow;
      const back = returnFocusRef.current;
      if (back && typeof back.focus === 'function') back.focus();
    };
  }, [open]);

  if (!open) return null;

  // Keep Tab inside the dialog.
  function onKeyDown(e) {
    if (e.key !== 'Tab') return;
    const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div className={`modal-backdrop modal-backdrop--${position}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className="modal"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
