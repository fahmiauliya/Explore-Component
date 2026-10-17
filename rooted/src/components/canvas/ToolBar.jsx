import { useRef, useState } from 'react';
import { ChevronDownIcon, CloseIcon, ImageIcon, LockIcon, PencilIcon, PlusIcon, TextSizeIcon, TrashIcon, UnlockIcon } from '../Icons.jsx';
import ContextMenu from './ContextMenu.jsx';
import SheetMenu from './SheetMenu.jsx';
import { alignEntries } from './alignEntries.jsx';
import ColorPopover from './ColorPopover.jsx';
import { LABEL_PRESETS_COLORS, LABEL_SIZES, labelColors } from './labelColors.js';

export const LABEL_PRESETS = ['Font', 'Color', 'Image style', 'Illustration style', 'Texture', 'Icon'];

// Bottom-center bar. Shows the add tools, or the selection tools while
// something is selected. On phones the menus open as bottom sheets.
export default function ToolBar({ selectionCount, canEdit, allLocked, labelColor, labelSize, phone, onPickColor, onPickSize, onAddLabel, onUploadFiles, onEdit, onAlign, onToggleLock, onDelete, onClearSelection }) {
  const [menu, setMenu] = useState(null); // { x, y, kind: 'label' | 'align' | 'size' | 'color' }
  const [colorOpen, setColorOpen] = useState(false);
  const fileRef = useRef(null);
  const labelBtn = useRef(null);
  const alignBtn = useRef(null);
  const sizeBtn = useRef(null);

  function openMenu(kind, btn) {
    const r = btn.current.getBoundingClientRect();
    setMenu({ x: r.left, y: r.top - 4, kind });
  }

  const entriesFor = {
    label: [...LABEL_PRESETS.map((text) => ({ label: text, onSelect: () => onAddLabel(text) })), 'divider', { label: 'Custom…', onSelect: () => onAddLabel(null) }],
    align: alignEntries(selectionCount, onAlign),
    size: LABEL_SIZES.map((sz) => ({ label: `${sz.id} (${sz.fs})`, selected: labelSize === sz.fs, onSelect: () => onPickSize(sz.fs) })),
    color: LABEL_PRESETS_COLORS.map((p) => ({ label: p.name, swatch: p.bg, selected: labelColor === p.id, onSelect: () => onPickColor(p.id) })),
  };
  const titles = { label: 'Add label', align: 'Align', size: 'Label size', color: 'Label color' };

  const LockOrUnlock = allLocked ? UnlockIcon : LockIcon;
  const selecting = selectionCount > 0;
  const isLabel = labelColor !== undefined;

  return (
    <div className="cbar cbar--tools floating" role="toolbar" aria-label={selecting ? 'Selection' : 'Add'}>
      {selecting ? (
        <div className="cbar__fade cbar__scroll" key="sel">
          <span className="cbar__count num">{selectionCount} selected</span>
          <span className="cbar__divider" />
          <button type="button" className="cbar__btn" onClick={onEdit} disabled={!canEdit} aria-label="Edit" title="Edit">
            <PencilIcon />
          </button>
          {isLabel && (
            <span className="cbar__color">
              <button type="button" className="cbar__btn" onClick={() => (phone ? setMenu({ kind: 'color' }) : setColorOpen((o) => !o))} aria-label="Label color" title="Label color" aria-haspopup="dialog" aria-expanded={colorOpen}>
                <span className="color-dot" style={{ background: labelColors(labelColor).bg }} />
              </button>
              {colorOpen && !phone && <ColorPopover active={labelColor} onPick={(c) => { onPickColor(c); setColorOpen(false); }} onClose={() => setColorOpen(false)} />}
            </span>
          )}
          {isLabel && (
            <button ref={sizeBtn} type="button" className="cbar__btn" onClick={() => (phone ? setMenu({ kind: 'size' }) : openMenu('size', sizeBtn))} aria-label="Label size" title="Label size" aria-haspopup="menu" aria-expanded={menu?.kind === 'size'}>
              <TextSizeIcon />
            </button>
          )}
          {selectionCount >= 2 && (
            <>
              <span className="cbar__divider" />
              <button ref={alignBtn} type="button" className="cbar__btn cbar__text" onClick={() => (phone ? setMenu({ kind: 'align' }) : openMenu('align', alignBtn))} aria-label="Align" title="Align" aria-haspopup="menu" aria-expanded={menu?.kind === 'align'}>
                Align
                <ChevronDownIcon width={12} height={12} />
              </button>
            </>
          )}
          <span className="cbar__divider" />
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
          <button ref={labelBtn} type="button" className="cbar__text" onClick={() => (phone ? setMenu({ kind: 'label' }) : openMenu('label', labelBtn))} aria-haspopup="menu" aria-expanded={menu?.kind === 'label'} aria-label="Add label" title="Add label">
            <PlusIcon />
            <span className="cbar__word">Label</span>
            <ChevronDownIcon width={12} height={12} className="cbar__word" />
          </button>
          <span className="cbar__divider" />
          <button type="button" className="cbar__text" onClick={() => fileRef.current?.click()} aria-label="Upload image" title="Upload image">
            <ImageIcon />
            <span className="cbar__word">Upload image</span>
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
      {menu &&
        (phone ? (
          <SheetMenu entries={entriesFor[menu.kind]} onClose={() => setMenu(null)} label={titles[menu.kind]} />
        ) : (
          <ContextMenu x={menu.x} y={menu.y} above entries={entriesFor[menu.kind]} onClose={() => setMenu(null)} label={titles[menu.kind]} />
        ))}
    </div>
  );
}
