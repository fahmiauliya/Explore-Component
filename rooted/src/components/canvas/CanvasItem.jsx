import { useEffect, useLayoutEffect, useRef } from 'react';
import Card from '../Card.jsx';
import { LockIcon } from '../Icons.jsx';
import { labelColors } from './labelColors.js';

// One thing on the board: a label, a link card or an uploaded image.
// Positioning is done by the parent (world coordinates); this only draws it.
export default function CanvasItem({ item, selected, editing, imageUrl, dragging, onPointerDown, onDoubleClick, onContextMenu, onMeasure, onEditCommit, onEditCancel, onOpen }) {
  const ref = useRef(null);
  const editRef = useRef(null);

  // Labels size themselves to their text and link cards to their content;
  // report the real size back so selection and snapping use it.
  useLayoutEffect(() => {
    if (item.type === 'image' || !ref.current) return;
    const w = ref.current.offsetWidth;
    const h = ref.current.offsetHeight;
    if (Math.abs(w - item.w) > 0.5 || Math.abs(h - item.h) > 0.5) onMeasure(item.id, w, h);
  }, [item.type, item.text, item.w, item.h, item.id, onMeasure, editing]);

  // Focus and select the text when inline editing starts. The editable span
  // owns its text from here on, so re-renders never move the caret.
  useEffect(() => {
    if (!editing || !editRef.current) return;
    const el = editRef.current;
    el.textContent = item.text;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const label = item.type === 'label' ? item.text : item.type === 'link' ? item.name : item.caption || 'Image';

  function onKeyDown(e) {
    if (editing) return;
    if (e.key === 'Enter' && item.url) {
      e.preventDefault();
      onOpen(item);
    }
  }

  const chip = item.type === 'label' ? labelColors(item.color) : null;
  const style = {
    transform: `translate(${item.x}px, ${item.y}px)`,
    width: item.type === 'label' ? 'auto' : item.w,
    height: item.type === 'image' ? item.h : 'auto',
    zIndex: dragging ? 100000 : item.z,
    ...(chip ? { background: chip.bg, color: chip.text } : {}),
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

      {item.type === 'link' && <Card item={{ ...item, key: item.id }} interactive={false} />}

      {item.type === 'image' && (
        <>
          {imageUrl ? (
            <img className="citem__img" src={imageUrl} alt={item.caption || ''} draggable={false} />
          ) : (
            <span className="citem__img citem__img--missing" />
          )}
          {item.caption && <span className="citem__caption">{item.caption}</span>}
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
