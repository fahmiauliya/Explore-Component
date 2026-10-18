import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, ChevronRightIcon } from '../Icons.jsx';

// A white menu at (x, y) in screen pixels. Entries are
//   { label, icon?, shortcut?, onSelect, disabled?, danger?, checked?, submenu? }  or 'divider'.
// Closes on Esc, a click outside, scroll or wheel. Flips to stay inside the window.
// Arrow keys move between rows, Enter activates, Right opens a submenu, Left closes it.
export default function ContextMenu({ x, y, entries, onClose, label = 'Menu', above = false, depth = 0, onRootClose = onClose, searchable = false, placeholder = 'Filter…' }) {
  const [query, setQuery] = useState('');
  const filtered = searchable && query.trim() ? entries.filter((e) => e !== 'divider' && !e.keep && String(e.label).toLowerCase().includes(query.trim().toLowerCase())) : entries;
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const [active, setActive] = useState(-1);
  const [sub, setSub] = useState(null); // { index, x, y }

  const rows = filtered.map((e, i) => ({ entry: e, index: i })).filter(({ entry }) => entry !== 'divider');

  // Keep the menu inside the window.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = x;
    let top = above ? y - r.height : y;
    if (left + r.width > window.innerWidth - 8) left = Math.max(8, x - r.width);
    if (top + r.height > window.innerHeight - 8) top = Math.max(8, (above ? y : y - r.height));
    if (top < 8) top = 8;
    setPos({ left, top });
  }, [x, y, above]);

  // Close on outside click, scroll, wheel or Esc (Esc is handled in onKeyDown too).
  useEffect(() => {
    const onDown = (e) => {
      if (!ref.current?.contains(e.target) && !e.target.closest?.('.cmenu')) onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('wheel', onScroll, { passive: true, capture: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('wheel', onScroll, { capture: true });
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
  }, [onClose]);

  // Focus the menu while open; give focus back to whatever opened it afterwards.
  useEffect(() => {
    const opener = document.activeElement;
    if (searchable) ref.current?.querySelector('input')?.focus();
    else ref.current?.focus();
    return () => {
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, []);

  function activate(entry, index) {
    if (entry.disabled) return;
    if (entry.submenu) {
      openSub(index);
      return;
    }
    onRootClose();
    entry.onSelect?.();
  }

  function openSub(index) {
    const row = ref.current?.querySelector(`[data-row="${index}"]`);
    if (!row) return;
    const r = row.getBoundingClientRect();
    setSub({ index, x: r.right + 4, y: r.top - 8 });
  }

  function onKeyDown(e) {
    const pos = rows.findIndex((r) => r.index === active);
    if (searchable && e.target.tagName === 'INPUT' && !['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (sub) setSub(null);
      else onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(rows[(pos + 1) % rows.length].index);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(rows[(pos - 1 + rows.length) % rows.length].index);
    } else if (e.key === 'ArrowRight') {
      const entry = filtered[active];
      if (entry?.submenu && !entry.disabled) {
        e.preventDefault();
        openSub(active);
      }
    } else if (e.key === 'ArrowLeft') {
      if (depth > 0) {
        e.preventDefault();
        onClose();
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (active >= 0) activate(filtered[active], active);
      else if (searchable && rows.length) activate(filtered[rows[0].index], rows[0].index);
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  }

  return createPortal(
    <div
      ref={ref}
      className={`cmenu floating${depth ? ' cmenu--sub' : ''}`}
      style={pos}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {searchable && (
        <input
          className="cmenu__search"
          type="text"
          value={query}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
          }}
        />
      )}
      {filtered.map((entry, i) =>
        entry === 'divider' ? (
          <div key={`d${i}`} className="cmenu__divider" role="separator" />
        ) : (
          <button
            key={entry.label}
            type="button"
            role="menuitem"
            data-row={i}
            className={`cmenu__row${active === i ? ' is-active' : ''}${entry.danger ? ' is-danger' : ''}`}
            disabled={entry.disabled}
            aria-disabled={entry.disabled}
            aria-haspopup={entry.submenu ? 'menu' : undefined}
            aria-expanded={entry.submenu ? sub?.index === i : undefined}
            onMouseEnter={() => {
              setActive(i);
              if (entry.submenu && !entry.disabled) openSub(i);
              else if (sub) setSub(null);
            }}
            onClick={() => activate(entry, i)}
          >
            <span className="cmenu__icon">
              {entry.swatch ? <span className="cmenu__swatch" style={{ background: entry.swatch }} /> : entry.icon ? <entry.icon /> : null}
            </span>
            <span className="cmenu__label">{entry.label}</span>
            {entry.trailing !== undefined && <span className="cmenu__hint num">{entry.trailing}</span>}
            {entry.selected && <CheckIcon width={16} height={16} className="cmenu__check" />}
            {entry.checked !== undefined && <span className="cmenu__hint">{entry.checked ? 'On' : 'Off'}</span>}
            {entry.shortcut && <span className="cmenu__hint num">{entry.shortcut}</span>}
            {entry.submenu && <ChevronRightIcon width={16} height={16} />}
          </button>
        )
      )}
      {sub && filtered[sub.index]?.submenu && (
        <ContextMenu
          x={sub.x}
          y={sub.y}
          entries={filtered[sub.index].submenu}
          onClose={() => {
            setSub(null);
            ref.current?.focus();
          }}
          label={filtered[sub.index].label}
          depth={depth + 1}
          onRootClose={onRootClose}
        />
      )}
    </div>,
    document.body
  );
}
