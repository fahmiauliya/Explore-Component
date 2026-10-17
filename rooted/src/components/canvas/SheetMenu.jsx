import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BackIcon, CheckIcon, ChevronRightIcon, CloseIcon } from '../Icons.jsx';

// Phone version of the context menu: a bottom sheet with 48px rows.
// Submenus (Align, Color, Size) open as their own sheet with a back button.
export default function SheetMenu({ entries, onClose, label = 'Options' }) {
  const [stack, setStack] = useState([]);
  const current = stack.length ? stack[stack.length - 1] : { entries, title: label };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  function activate(entry) {
    if (entry.disabled) return;
    if (entry.submenu) {
      setStack((st) => [...st, { entries: entry.submenu, title: entry.label }]);
      return;
    }
    onClose();
    entry.onSelect?.();
  }

  return createPortal(
    <div className="sheet-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet floating" role="menu" aria-label={current.title}>
        <span className="sheet__handle" aria-hidden="true" />
        <div className="sheet__head">
          {stack.length > 0 ? (
            <button type="button" className="icon-button icon-button--touch" onClick={() => setStack((st) => st.slice(0, -1))} aria-label="Back">
              <BackIcon />
            </button>
          ) : (
            <span className="icon-button icon-button--touch" />
          )}
          <span className="sheet__title">{current.title}</span>
          <button type="button" className="icon-button icon-button--touch" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="sheet__list">
          {current.entries.map((entry, i) =>
            entry === 'divider' ? (
              <div key={`d${i}`} className="cmenu__divider" role="separator" />
            ) : (
              <button
                key={entry.label}
                type="button"
                role="menuitem"
                className={`sheet__row${entry.danger ? ' is-danger' : ''}`}
                disabled={entry.disabled}
                onClick={() => activate(entry)}
              >
                <span className="sheet__icon">
                  {entry.swatch ? <span className="sheet__swatch" style={{ background: entry.swatch }} /> : entry.icon ? <entry.icon width={18} height={18} /> : null}
                </span>
                <span className="cmenu__label">{entry.label}</span>
                {entry.selected && <CheckIcon width={16} height={16} />}
                {entry.checked !== undefined && <span className="cmenu__hint">{entry.checked ? 'On' : 'Off'}</span>}
                {entry.submenu && <ChevronRightIcon width={16} height={16} />}
              </button>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
