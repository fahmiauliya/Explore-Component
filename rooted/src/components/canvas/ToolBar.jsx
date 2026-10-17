import { useRef, useState } from 'react';
import { ChevronDownIcon, CloseIcon, ImageIcon, LockIcon, PencilIcon, PlusIcon, TrashIcon, UnlockIcon } from '../Icons.jsx';
import ContextMenu from './ContextMenu.jsx';
import { alignEntries } from './alignEntries.jsx';

export const LABEL_PRESETS = ['Font', 'Color', 'Image style', 'Illustration style', 'Texture', 'Icon'];

// Bottom-center bar. Shows the add tools, or the selection tools while
// something is selected (the switch crossfades).
export default function ToolBar({ selectionCount, canEdit, allLocked, onAddLabel, onUploadFiles, onEdit, onAlign, onToggleLock, onDelete, onClearSelection }) {
  const [menu, setMenu] = useState(null); // { x, y, kind: 'label' | 'align' }
  const fileRef = useRef(null);
  const labelBtn = useRef(null);
  const alignBtn = useRef(null);

  function openMenu(kind, btn) {
    const r = btn.current.getBoundingClientRect();
    setMenu({ x: r.left, y: r.top - 4, kind });
  }

  const labelEntries = [
    ...LABEL_PRESETS.map((text) => ({ label: text, onSelect: () => onAddLabel(text) })),
    'divider',
    { label: 'Custom…', onSelect: () => onAddLabel(null) },
  ];
  const LockOrUnlock = allLocked ? UnlockIcon : LockIcon;
  const selecting = selectionCount > 0;

  return (
    <div className="cbar cbar--tools floating" role="toolbar" aria-label={selecting ? 'Selection' : 'Add'}>
      {selecting ? (
        <div className="cbar__fade" key="sel">
          <span className="cbar__count num">{selectionCount} selected</span>
          <span className="cbar__divider" />
          <button type="button" className="cbar__btn" onClick={onEdit} disabled={!canEdit} aria-label="Edit" title="Edit">
            <PencilIcon />
          </button>
          <button ref={alignBtn} type="button" className="cbar__btn cbar__text" onClick={() => openMenu('align', alignBtn)} disabled={selectionCount < 2} aria-label="Align" title="Align" aria-haspopup="menu" aria-expanded={menu?.kind === 'align'}>
            Align
            <ChevronDownIcon width={12} height={12} />
          </button>
          <button type="button" className="cbar__btn" onClick={onToggleLock} aria-label={allLocked ? 'Unlock' : 'Lock'} title={allLocked ? 'Unlock' : 'Lock'}>
            <LockOrUnlock />
          </button>
          <button type="button" className="cbar__btn cbar__btn--danger" onClick={onDelete} aria-label="Delete" title="Delete">
            <TrashIcon />
          </button>
          <span className="cbar__divider" />
          <button type="button" className="cbar__btn" onClick={onClearSelection} aria-label="Clear selection" title="Clear selection (Esc)">
            <CloseIcon />
          </button>
        </div>
      ) : (
        <div className="cbar__fade" key="add">
          <button ref={labelBtn} type="button" className="cbar__text" onClick={() => openMenu('label', labelBtn)} aria-haspopup="menu" aria-expanded={menu?.kind === 'label'}>
            <PlusIcon />
            Label
            <ChevronDownIcon width={12} height={12} />
          </button>
          <span className="cbar__divider" />
          <button type="button" className="cbar__text" onClick={() => fileRef.current?.click()}>
            <ImageIcon />
            Upload image
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        id="canvas-file-input"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          onUploadFiles([...e.target.files]);
          e.target.value = '';
        }}
      />
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          above
          entries={menu.kind === 'label' ? labelEntries : alignEntries(selectionCount, onAlign)}
          onClose={() => setMenu(null)}
          label={menu.kind === 'label' ? 'Add label' : 'Align'}
        />
      )}
    </div>
  );
}
