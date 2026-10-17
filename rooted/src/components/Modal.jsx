import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons.jsx';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

// Shared dialog shell: backdrop, scroll lock, focus handling and an optional
// header (title + subtitle on the left, close button on the right).
// `position` is 'top' (search) or 'center'. `flush` removes the panel padding.
// Esc is handled once, globally, in App.jsx; this only handles the backdrop click.
export default function Modal({ open, onClose, label, labelledBy, title, subtitle, position = 'center', width = 440, flush = false, children }) {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);
  const titleId = labelledBy || (title ? `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-title` : undefined);

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const first = panel?.querySelector('[data-autofocus]') || panel?.querySelector(FOCUSABLE);
    const frame = requestAnimationFrame(() => first?.focus());
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = prevOverflow;
      const back = returnFocusRef.current;
      if (back && typeof back.focus === 'function') back.focus();
    };
  }, [open]);

  if (!open) return null;

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
        className={`modal${flush ? ' modal--flush' : ''}`}
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={titleId ? undefined : label}
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        {title && (
          <div className="modal__head">
            <div>
              <h3 className="modal__title" id={titleId}>{title}</h3>
              {subtitle && <p className="modal__subtitle">{subtitle}</p>}
            </div>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
