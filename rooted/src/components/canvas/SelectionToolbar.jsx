import { useRef, useState } from 'react';
import { ChevronDownIcon, LockIcon, PencilIcon, TrashIcon, UnlockIcon } from '../Icons.jsx';
import ContextMenu from './ContextMenu.jsx';
import { alignEntries } from './alignEntries.jsx';

// Floating pill at the bottom of the canvas while something is selected.
export default function SelectionToolbar({ count, canEdit, allLocked, onEdit, onAlign, onToggleLock, onDelete }) {
  const [menu, setMenu] = useState(null);
  const alignBtn = useRef(null);

  function openAlign() {
    const r = alignBtn.current.getBoundingClientRect();
    setMenu({ x: r.left, y: r.top - 4, above: true });
  }

  const LockOrUnlock = allLocked ? UnlockIcon : LockIcon;

  return (
    <div className="sel-toolbar" role="toolbar" aria-label="Selection">
      <span className="sel-toolbar__count num">{count} selected</span>
      <span className="cbar__divider" />
      <button type="button" className="cbar__btn" onClick={onEdit} disabled={!canEdit} aria-label="Edit" title="Edit">
        <PencilIcon />
      </button>
      <button
        ref={alignBtn}
        type="button"
        className="cbar__btn cbar__btn--wide"
        onClick={openAlign}
        disabled={count < 2}
        aria-label="Align"
        title="Align"
        aria-haspopup="menu"
        aria-expanded={!!menu}
      >
        <span className="sel-toolbar__text">Align</span>
        <ChevronDownIcon width={12} height={12} />
      </button>
      <button type="button" className="cbar__btn" onClick={onToggleLock} aria-label={allLocked ? 'Unlock' : 'Lock'} title={allLocked ? 'Unlock' : 'Lock'}>
        <LockOrUnlock />
      </button>
      <button type="button" className="cbar__btn cbar__btn--danger" onClick={onDelete} aria-label="Delete" title="Delete">
        <TrashIcon />
      </button>
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} above={menu.above} entries={alignEntries(count, onAlign)} onClose={() => setMenu(null)} label="Align" />
      )}
    </div>
  );
}
