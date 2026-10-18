import { useRef, useState } from 'react';
import { AlignTextCenterIcon, AlignTextLeftIcon, AlignTextRightIcon, ChevronDownIcon, CloseIcon, SectionIcon, ImageIcon, LockIcon, PencilIcon, RibbonIcon, TextIcon, TextSizeIcon, TrashIcon, UnlockIcon } from '../Icons.jsx';
import { TEXT_COLOR_PRESETS, TEXT_SIZE_IDS } from './text.js';
import { SECTION_PRESETS } from './sections.js';
import ContextMenu from './ContextMenu.jsx';
import SheetMenu from './SheetMenu.jsx';
import { alignEntries } from './alignEntries.jsx';
import { LABEL_PRESETS_COLORS, LABEL_SIZES, labelColors } from './labelColors.js';

export const LABEL_PRESETS = ['Font', 'Color', 'Image style', 'Illustration style', 'Texture', 'Icon'];

// Bottom-center bar. Shows the add tools, or the selection tools while
// something is selected. On phones the menus open as bottom sheets.
export default function ToolBar({ selectionCount, canEdit, allLocked, labelColor, labelSize, sectionColor, sectionEntries, ribbonEntries, textProps, onText, onRibbonMenu, phone, onPickColor, onPickSize, onAddText, onAddSection, onUploadFiles, onEdit, onAlign, onToggleLock, onDelete, onClearSelection }) {
  const [menu, setMenu] = useState(null); // { x, y, kind: 'label' | 'align' | 'size' | 'color' }
  const colorBtn = useRef(null);
  const fileRef = useRef(null);
  const alignBtn = useRef(null);
  const sizeBtn = useRef(null);

  function openMenu(kind, btn) {
    const r = btn.current.getBoundingClientRect();
    setMenu({ x: r.left, y: r.top - 4, kind });
  }

  const entriesFor = {
    sectionMore: sectionEntries || [],
    ribbon: ribbonEntries || [],
    textColor: textProps
      ? [...(textProps.fill === 'filled' ? SECTION_PRESETS : TEXT_COLOR_PRESETS).map((p) => ({ label: p.name, swatch: p.bg, selected: textProps.color === p.id, onSelect: () => onText({ color: p.id }) })), 'divider', { label: 'Custom…', onSelect: () => onText({ color: '__custom' }) }]
      : [],
    textSize: textProps ? TEXT_SIZE_IDS.map((id) => ({ label: `${id} (${{ S: 14, M: 20, L: 28, XL: 40 }[id]})`, selected: textProps.size === id, onSelect: () => onText({ size: id }) })) : [],
    align: alignEntries(selectionCount, onAlign),
    size: LABEL_SIZES.map((sz) => ({ label: `${sz.id} (${sz.fs})`, selected: labelSize === sz.fs, onSelect: () => onPickSize(sz.fs) })),
    color: [...(sectionColor !== undefined ? SECTION_PRESETS : LABEL_PRESETS_COLORS).map((p) => ({ label: p.name, swatch: p.bg, selected: (sectionColor ?? labelColor) === p.id, onSelect: () => onPickColor(p.id) })), 'divider', { label: 'Custom…', onSelect: () => onPickColor('__custom') }],
  };
  const titles = { sectionMore: 'Section', ribbon: 'Ribbon', align: 'Align', size: 'Size', color: 'Color', textColor: 'Text color', textSize: 'Text size' };
  const textColorBtn = useRef(null);
  const textSizeBtn = useRef(null);
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
  const colorValue = sectionColor !== undefined ? sectionColor : labelColor;
  const presets = sectionColor !== undefined ? SECTION_PRESETS : LABEL_PRESETS_COLORS;
  const moreBtn = useRef(null);

  const LockOrUnlock = allLocked ? UnlockIcon : LockIcon;
  const selecting = selectionCount > 0;
  const isLabel = labelColor !== undefined || sectionColor !== undefined;
  const colorBg = (presets.find((p) => p.id === colorValue) || {}).bg || (colorValue && colorValue.startsWith('#') ? colorValue : labelColors(colorValue).bg);

  return (
    <div className="cbar cbar--tools floating" role="toolbar" aria-label={selecting ? 'Selection' : 'Add'}>
      {selecting ? (
        <div className="cbar__fade cbar__scroll" key="sel">
          <span className="cbar__count num">{selectionCount} selected</span>
          <span className="cbar__divider" />
          {canEdit && (
            <button type="button" className="cbar__btn" onClick={onEdit} aria-label="Edit" title="Edit">
              <PencilIcon />
            </button>
          )}
          {textProps && (
            <>
              <span className="cbar__seg" role="group" aria-label="Fill">
                <button type="button" className={`cbar__seg-btn${textProps.fill === 'filled' ? ' is-active' : ''}`} onClick={() => onText({ fill: 'filled' })} aria-pressed={textProps.fill === 'filled'} title="Filled background">
                  Filled
                </button>
                <button type="button" className={`cbar__seg-btn${textProps.fill !== 'filled' ? ' is-active' : ''}`} onClick={() => onText({ fill: 'transparent' })} aria-pressed={textProps.fill !== 'filled'} title="Transparent background">
                  Transparent
                </button>
              </span>
              <button ref={textColorBtn} type="button" className="cbar__btn" onClick={() => open('textColor', textColorBtn)} aria-label="Text color" title="Color" aria-haspopup="menu" aria-expanded={menu?.kind === 'textColor'}>
                <span className="color-dot" style={{ background: textProps.swatch }} />
              </button>
              <button ref={textSizeBtn} type="button" className="cbar__btn cbar__text" onClick={() => open('textSize', textSizeBtn)} aria-label="Text size" title="Size" aria-haspopup="menu" aria-expanded={menu?.kind === 'textSize'}>
                {textProps.size}
              </button>
              <span className="cbar__seg" role="group" aria-label="Weight">
                <button type="button" className={`cbar__seg-btn${textProps.weight === 400 ? ' is-active' : ''}`} onClick={() => onText({ weight: 400 })} aria-pressed={textProps.weight === 400} title="Regular">
                  Regular
                </button>
                <button type="button" className={`cbar__seg-btn${textProps.weight !== 400 ? ' is-active' : ''}`} onClick={() => onText({ weight: 500 })} aria-pressed={textProps.weight !== 400} title="Medium">
                  Medium
                </button>
              </span>
              <button type="button" className={`cbar__btn${textProps.align === 'left' || !textProps.align ? ' is-active' : ''}`} onClick={() => onText({ align: 'left' })} aria-label="Align text left" title="Align left">
                <AlignTextLeftIcon />
              </button>
              <button type="button" className={`cbar__btn${textProps.align === 'center' ? ' is-active' : ''}`} onClick={() => onText({ align: 'center' })} aria-label="Align text center" title="Align center">
                <AlignTextCenterIcon />
              </button>
              <button type="button" className={`cbar__btn${textProps.align === 'right' ? ' is-active' : ''}`} onClick={() => onText({ align: 'right' })} aria-label="Align text right" title="Align right">
                <AlignTextRightIcon />
              </button>
            </>
          )}
          {isLabel && (
            <span className="cbar__color">
              <button ref={colorBtn} type="button" className="cbar__btn" onClick={() => open('color', colorBtn)} aria-label="Color" title="Color" aria-haspopup="menu" aria-expanded={menu?.kind === 'color'}>
                <span className="color-dot" style={{ background: colorBg }} />
              </button>
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
          {sectionEntries && sectionEntries.length > 0 && (
            <button ref={moreBtn} type="button" className="cbar__btn" onClick={() => (phone ? setMenu({ kind: 'sectionMore' }) : openMenu('sectionMore', moreBtn))} aria-label="Section options" title="Section options" aria-haspopup="menu" aria-expanded={menu?.kind === 'sectionMore'}>
              <SectionIcon />
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
          <button type="button" className="cbar__text" onClick={() => onAddSection()} aria-label="Add section" title="Add a section">
            <SectionIcon />
            <span className="cbar__word">+ Section</span>
          </button>
          <span className="cbar__divider" />
          <button type="button" className="cbar__text" onClick={() => onAddText()} aria-label="Add text" title="Add text">
            <TextIcon />
            <span className="cbar__word">+ Text</span>
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
