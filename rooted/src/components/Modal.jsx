import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons.jsx';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])';
const phoneQuery = () => window.matchMedia('(max-width: 640px)');

// Shared dialog shell: backdrop, scroll lock, focus handling and an optional
// header (title + subtitle on the left, close button on the right).
// On phones it becomes a bottom sheet: drag the handle down or tap the
// backdrop to close; it stays above the keyboard via the visualViewport API.
export default function Modal({ open, onClose, label, labelledBy, title, subtitle, position = 'center', width = 440, minHeight, flush = false, children }) {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);
  const [phone, setPhone] = useState(() => phoneQuery().matches);
  const [dragY, setDragY] = useState(0);
  const drag = useRef(null);
  const titleId = labelledBy || (title ? `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-title` : undefined);

  useEffect(() => {
    const mq = phoneQuery();
    const onChange = () => setPhone(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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

  // Keep the sheet above the on-screen keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !phone || !vv) return undefined;
    const apply = () => {
      const bottom = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      document.documentElement.style.setProperty('--sheet-bottom', `${bottom}px`);
      document.documentElement.style.setProperty('--sheet-max', `${Math.round(vv.height * 0.9)}px`);
      const active = document.activeElement;
      if (active && panelRef.current?.contains(active) && typeof active.scrollIntoView === 'function') active.scrollIntoView({ block: 'nearest' });
    };
    apply();
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    return () => {
      vv.removeEventListener('resize', apply);
      vv.removeEventListener('scroll', apply);
      document.documentElement.style.removeProperty('--sheet-bottom');
      document.documentElement.style.removeProperty('--sheet-max');
    };
  }, [open, phone]);

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

  // Drag the handle down to close the sheet.
  function onHandleDown(e) {
    drag.current = { startY: e.clientY, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onHandleMove(e) {
    if (!drag.current) return;
    setDragY(Math.max(0, e.clientY - drag.current.startY));
  }
  function onHandleUp(e) {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.startY;
    drag.current = null;
    setDragY(0);
    if (dy > 80) onClose();
  }

  const sheet = phone;
  return createPortal(
    <div className={`modal-backdrop modal-backdrop--${position}${sheet ? ' modal-backdrop--sheet' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className={`modal${flush ? ' modal--flush' : ''}${sheet ? ' modal--sheet' : ''}${sheet && position === 'top' ? ' modal--tall' : ''}`}
        style={{ maxWidth: sheet ? undefined : width, minHeight, transform: dragY ? `translateY(${dragY}px)` : undefined, transition: dragY ? 'none' : undefined }}
        role="dialog"
        aria-modal="true"
        aria-label={titleId ? undefined : label}
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        {sheet && (
          <div className="modal__grip" onPointerDown={onHandleDown} onPointerMove={onHandleMove} onPointerUp={onHandleUp} onPointerCancel={onHandleUp} aria-hidden="true">
            <span className="modal__handle" />
          </div>
        )}
        {title && (
          <div className="modal__head">
            <div>
              <h3 className="modal__title" id={titleId}>{title}</h3>
              {subtitle && <p className="modal__subtitle">{subtitle}</p>}
            </div>
            <button type="button" className="icon-button icon-button--touch" onClick={onClose} aria-label="Close">
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
