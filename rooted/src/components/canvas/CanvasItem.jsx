import { useEffect, useLayoutEffect, useRef } from 'react';
import Card from '../Card.jsx';
import { LockIcon } from '../Icons.jsx';
import { labelColors, labelMetrics } from './labelColors.js';
import { FOLDER_RADIUS, FOLDER_STRIP, darken, folderColors, tabMetrics, tabPath, tabText } from './folders.js';

// One thing on the board: a label, a link card or an uploaded image.
// Positioning is done by the parent (world coordinates); this only draws it.
export default function CanvasItem({ item, selected, editing, imageUrl, dragging, visible = true, childCount = 0, flash = false, onPointerDown, onDoubleClick, onContextMenu, onMeasure, onEditCommit, onEditCancel, onOpen }) {
  const ref = useRef(null);
  const editRef = useRef(null);

  // Labels size themselves to their text and link cards to their content;
  // report the real size back so selection and snapping use it.
  useLayoutEffect(() => {
    if (item.type === 'image' || item.type === 'folder' || !ref.current) return;
    const w = ref.current.offsetWidth;
    const h = ref.current.offsetHeight;
    if (Math.abs(w - item.w) > 0.5 || Math.abs(h - item.h) > 0.5) onMeasure(item.id, w, h);
  }, [item.type, item.text, item.w, item.h, item.id, item.fontSize, item.fixedW, onMeasure, editing]);

  // Focus and select the text when inline editing starts. The editable span
  // owns its text from here on, so re-renders never move the caret.
  useEffect(() => {
    if (!editing || !editRef.current) return;
    const el = editRef.current;
    el.textContent = item.type === 'folder' ? item.title || '' : item.text;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const label = item.type === 'label' ? item.text : item.type === 'link' ? item.name : item.type === 'folder' ? `${item.title || 'Folder'} folder` : item.caption || 'Image';

  function onKeyDown(e) {
    if (editing) return;
    if (e.key === 'Enter' && item.url) {
      e.preventDefault();
      onOpen(item);
    }
  }

  const chip = item.type === 'label' ? labelColors(item.color) : null;
  const metrics = item.type === 'label' ? labelMetrics(item.fontSize || 14) : null;
  const folder = item.type === 'folder' ? { ...folderColors(item.color), tab: tabMetrics(item) } : null;
  const style = {
    transform: `translate(${item.x}px, ${item.y}px)`,
    width: item.type === 'label' ? (item.fixedW ? item.w : 'auto') : item.w,
    height: item.type === 'image' ? item.h : item.type === 'folder' ? (item.collapsed ? FOLDER_STRIP : item.h) : 'auto',
    zIndex: dragging ? 100000 : item.z,
    ...(folder
      ? {
          background: folder.bg,
          borderRadius: item.collapsed ? `0 0 ${FOLDER_RADIUS}px ${FOLDER_RADIUS}px` : FOLDER_RADIUS,
          boxShadow: flash ? `inset 0 0 0 2px ${darken(folder.bg)}, 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)` : undefined,
        }
      : {}),
    ...(chip
      ? {
          background: chip.bg,
          color: chip.text,
          borderColor: chip.border,
          fontSize: metrics.fontSize,
          lineHeight: metrics.lineHeight,
          padding: `${metrics.padY}px ${metrics.padX}px`,
          borderRadius: metrics.radius,
        }
      : {}),
  };

  return (
    <div
      ref={ref}
      className={`citem citem--${item.type}${selected ? ' is-selected' : ''}${item.locked ? ' is-locked' : ''}${editing ? ' is-editing' : ''}`}
      style={style}
      role="group"
      aria-label={label}
      tabIndex={0}
      data-item-id={item.id}
      onPointerDown={(e) => onPointerDown(e, item)}
      onDoubleClick={(e) => onDoubleClick(e, item)}
      onContextMenu={(e) => onContextMenu(e, item)}
      onKeyDown={onKeyDown}
    >
      {item.type === 'label' &&
        (editing ? (
          <span
            ref={editRef}
            className="citem__label-edit"
            contentEditable
            suppressContentEditableWarning
            spellCheck="false"
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault();
                onEditCommit(item, editRef.current.textContent.trim());
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onEditCancel();
              }
            }}
            onBlur={() => onEditCommit(item, editRef.current?.textContent.trim() ?? item.text)}
            onPointerDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="citem__label">{item.text}</span>
        ))}

      {item.type === 'link' && <Card item={{ ...item, key: item.id }} interactive={false} showImage={visible} />}

      {item.type === 'image' && (
        <>
          {imageUrl && visible ? (
            <img className="citem__img" src={imageUrl} alt={item.caption || ''} draggable={false} />
          ) : (
            <span className="citem__img citem__img--missing" />
          )}
          {item.caption && <span className="citem__caption">{item.caption}</span>}
        </>
      )}

      {folder && (
        <>
          <svg
            className={`folder__tab folder__tab--${item.tabSide === 'right' ? 'right' : 'left'}`}
            width={folder.tab.width + 2 * folder.tab.curve}
            height={folder.tab.height + 1}
            viewBox={`0 0 ${folder.tab.width + 2 * folder.tab.curve} ${folder.tab.height + 1}`}
            style={{ top: -folder.tab.height, [item.tabSide === 'right' ? 'right' : 'left']: folder.tab.inset - folder.tab.curve }}
            aria-hidden="true"
            data-tab
          >
            <path d={tabPath(folder.tab.width, folder.tab.height + 1, folder.tab.curve, folder.tab.radius)} fill={folder.bg} />
          </svg>
          <span
            className="folder__title"
            style={{ top: -folder.tab.height, height: folder.tab.height, width: folder.tab.width, [item.tabSide === 'right' ? 'right' : 'left']: folder.tab.inset, fontSize: folder.tab.fs, color: folder.text }}
            data-tab
          >
            {editing ? (
              <span
                ref={editRef}
                className="folder__edit citem__label-edit"
                contentEditable
                suppressContentEditableWarning
                spellCheck="false"
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onEditCommit(item, editRef.current.textContent.trim());
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onEditCancel();
                  }
                }}
                onBlur={() => onEditCommit(item, editRef.current?.textContent.trim() ?? item.title)}
                onPointerDown={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="folder__text" data-tab-text>
                {tabText(item, childCount)}
              </span>
            )}
          </span>
        </>
      )}

      {item.locked && (
        <span className="citem__lock" aria-hidden="true">
          <LockIcon width={12} height={12} />
        </span>
      )}
    </div>
  );
}
