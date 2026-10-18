import { useRef, useState } from 'react';
import { ChevronDownIcon, CloseIcon, FolderIcon, ImageIcon, LockIcon, PencilIcon, PlusIcon, RibbonIcon, TextSizeIcon, TrashIcon, UnlockIcon } from '../Icons.jsx';
import { FOLDER_PRESETS } from './folders.js';
import ContextMenu from './ContextMenu.jsx';
import SheetMenu from './SheetMenu.jsx';
import { alignEntries } from './alignEntries.jsx';
import ColorPopover from './ColorPopover.jsx';
import { LABEL_PRESETS_COLORS, LABEL_SIZES, labelColors } from './labelColors.js';

export const LABEL_PRESETS = ['Font', 'Color', 'Image style', 'Illustration style', 'Texture', 'Icon'];

// Bottom-center bar. Shows the add tools, or the selection tools while
// something is selected. On phones the menus open as bottom sheets.
export default function ToolBar({ selectionCount, canEdit, allLocked, labelColor, labelSize, folderColor, folderEntries, ribbonEntries, onRibbonMenu, phone, onPickColor, onPickSize, onAddLabel, onAddFolder, onUploadFiles, onEdit, onAlign, onToggleLock, onDelete, onClearSelection }) {
  const [menu, setMenu] = useState(null); // { x, y, kind: 'label' | 'align' | 'size' | 'color' }
  const [colorOpen, setColorOpen] = useState(false);
  const colorBtn = useRef(null);
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
    folder: [...LABEL_PRESETS.map((text) => ({ label: text, onSelect: () => onAddFolder(text) })), 'divider', { label: 'Custom…', onSelect: () => onAddFolder(null) }],
    folderMore: folderEntries || [],
    ribbon: ribbonEntries || [],
    align: alignEntries(selectionCount, onAlign),
    size: LABEL_SIZES.map((sz) => ({ label: `${sz.id} (${sz.fs})`, selected: labelSize === sz.fs, onSelect: () => onPickSize(sz.fs) })),
    color: (folderColor !== undefined ? FOLDER_PRESETS : LABEL_PRESETS_COLORS).map((p) => ({ label: p.name, swatch: p.bg, selected: (folderColor ?? labelColor) === p.id, onSelect: () => onPickColor(p.id) })),
  };
  const titles = { label: 'Add label', folder: 'Add folder', folderMore: 'Folder', ribbon: 'Ribbon', align: 'Align', size: 'Size', color: 'Color' };
  const ribbonBtn = useRef(null);
  const open = (kind, btn) => {
    if (phone) setMenu({ kind });
    else openMenu(kind, btn);
    if (kind === 'ribbon') onRibbonMenu?.(true);
  };
  const close = () => {
    if (menu?.kind === 'ribbon') onRibbonMenu?.(false);
    setMenu(null);
  };
  const colorValue = folderColor !== undefined ? folderColor : labelColor;
  const presets = folderColor !== undefined ? FOLDER_PRESETS : LABEL_PRESETS_COLORS;
  const folderBtn = useRef(null);
  const moreBtn = useRef(null);

  const LockOrUnlock = allLocked ? UnlockIcon : LockIcon;
  const selecting = selectionCount > 0;
  const isLabel = labelColor !== undefined || folderColor !== undefined;
  const colorBg = (presets.find((p) => p.id === colorValue) || {}).bg || (colorValue && colorValue.startsWith('#') ? colorValue : labelColors(colorValue).bg);

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
              <button ref={colorBtn} type="button" className="cbar__btn" onClick={() => (phone ? setMenu({ kind: 'color' }) : setColorOpen((o) => !o))} aria-label="Label color" title="Label color" aria-haspopup="dialog" aria-expanded={colorOpen}>
                <span className="color-dot" style={{ background: colorBg }} />
              </button>
              {colorOpen && !phone && <ColorPopover active={colorValue} presets={presets} anchor={colorBtn.current?.getBoundingClientRect()} onPick={(c) => { onPickColor(c); setColorOpen(false); }} onClose={() => setColorOpen(false)} />}
            </span>
          )}
          {isLabel && (
            <button ref={sizeBtn} type="button" className="cbar__btn" onClick={() => (phone ? setMenu({ kind: 'size' }) : openMenu('size', sizeBtn))} aria-label="Label size" title="Label size" aria-haspopup="menu" aria-expanded={menu?.kind === 'size'}>
              <TextSizeIcon />
            </button>
          )}
          {ribbonEntries && ribbonEntries.length > 0 && (
            <button ref={ribbonBtn} type="button" className="cbar__btn" onClick={() => open('ribbon', ribbonBtn)} aria-label="Ribbon" title="Ribbon (R)" aria-haspopup="menu" aria-expanded={menu?.kind === 'ribbon'}>
              <RibbonIcon />
            </button>
          )}
          {folderEntries && folderEntries.length > 0 && (
            <button ref={moreBtn} type="button" className="cbar__btn" onClick={() => (phone ? setMenu({ kind: 'folderMore' }) : openMenu('folderMore', moreBtn))} aria-label="Folder options" title="Folder options" aria-haspopup="menu" aria-expanded={menu?.kind === 'folderMore'}>
              <FolderIcon />
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
          <button ref={folderBtn} type="button" className="cbar__text" onClick={() => (phone ? setMenu({ kind: 'folder' }) : openMenu('folder', folderBtn))} aria-haspopup="menu" aria-expanded={menu?.kind === 'folder'} aria-label="Add folder" title="Add folder">
            <FolderIcon />
            <span className="cbar__word">Folder</span>
            <ChevronDownIcon width={12} height={12} className="cbar__word" />
          </button>
          <span className="cbar__divider" />
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
          <SheetMenu entries={entriesFor[menu.kind]} onClose={close} label={titles[menu.kind]} />
        ) : (
          <ContextMenu x={menu.x} y={menu.y} above entries={entriesFor[menu.kind]} onClose={close} label={titles[menu.kind]} />
        ))}
    </div>
  );
}
