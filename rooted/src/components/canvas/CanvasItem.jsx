import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Card from '../Card.jsx';
import { LockIcon } from '../Icons.jsx';
import { labelColors, labelMetrics } from './labelColors.js';
import { FOLDER_PAD, darken, folderColors, folderPath, tabText } from './folders.js';
import { RIBBON_BASE_W, RIBBON_FOLD, RIBBON_LIMITS, ribbonLayout, ribbonPath, ribbonStatus, ribbonWidth } from './ribbon.js';

// One thing on the board: a label, a link card or an uploaded image.
// Positioning is done by the parent (world coordinates); this only draws it.
export default function CanvasItem({ item, selected, editing, imageUrl, dragging, visible = true, childCount = 0, flash = false, dimmed = false, ribbonEditing = false, geom = null, children = null, onPointerDown, onDoubleClick, onContextMenu, onMeasure, onEditCommit, onEditCancel, onOpen, onRibbonCommit, onRibbonCancel }) {
  const [tip, setTip] = useState(false);
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
  const folder = item.type === 'folder' && geom ? { ...folderColors(item.color), g: geom } : null;
  // Children sit inside their folder's padded body; everything else uses world coordinates.
  const pos = item.parentId ? { x: FOLDER_PAD + (item.cx || 0), y: FOLDER_PAD + (item.cy || 0) } : { x: item.x, y: item.y };
  const style = folder
    ? {
        transform: `translate(${folder.g.x}px, ${folder.g.y - folder.g.tabH}px)`,
        width: folder.g.w,
        height: folder.g.tabH + folder.g.h,
        // In the stack, paint order follows the stack (back → front), not z.
        zIndex: dragging ? 100000 : folder.g.animate ? folder.g.index : item.z,
      }
    : {
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        width: item.type === 'label' ? (item.fixedW ? item.w : 'auto') : item.w,
        height: item.type === 'image' ? item.h : 'auto',
        zIndex: dragging ? 100000 : item.z,
      };
  Object.assign(style, {
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
  });

  return (
    <div
      ref={ref}
      className={`citem citem--${item.type}${selected ? ' is-selected' : ''}${item.locked ? ' is-locked' : ''}${editing ? ' is-editing' : ''}${dimmed ? ' is-dimmed' : ''}${folder?.g.back ? ' is-back' : ''}${folder?.g.animate ? ' is-animated' : ''}${flash ? ' is-flash' : ''}`}
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
          {item.ribbon && <Ribbon item={item} editing={ribbonEditing} tip={tip} setTip={setTip} onCommit={onRibbonCommit} onCancel={onRibbonCancel} />}
        </>
      )}

      {folder && (
        <>
          <svg
            className="folder__svg"
            width={folder.g.w}
            height={folder.g.tabH + folder.g.h}
            viewBox={`0 0 ${folder.g.w} ${folder.g.tabH + folder.g.h}`}
            aria-hidden="true"
            data-tab
          >
            <path d={folderPath(folder.g.w, folder.g.h, folder.g.tabH, folder.g.tabX, folder.g.tabW, folder.g.curve, folder.g.corner)} fill={folder.bg} stroke={flash ? darken(folder.bg) : 'rgba(0,0,0,0.06)'} strokeWidth={flash ? 2 : 1} />
          </svg>
          <span
            className="folder__title"
            style={{ top: 0, left: folder.g.tabX, height: folder.g.tabH, width: folder.g.tabW, fontSize: folder.g.fs, color: folder.text }}
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
          <div className="folder__body" style={{ top: folder.g.tabH, width: folder.g.w, height: folder.g.h, overflow: item.collapsed || folder.g.back ? 'hidden' : 'visible' }}>
            {children}
          </div>
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


// The metal bookmark ribbon over an image's top edge. One SVG path, scaled with
// the image (width = clamp(48, image width × 0.22, 96)).
function Ribbon({ item, editing, tip, setTip, onCommit, onCancel }) {
  const r = item.ribbon;
  const status = ribbonStatus(r.status);
  const lines = r.lines && r.lines.length ? r.lines : ['New'];
  const width = ribbonWidth(item.w);
  const scale = width / RIBBON_BASE_W;
  const layout = ribbonLayout(lines);
  const height = layout.height * scale;
  const uid = `rb-${item.id.replace(/[^a-z0-9]/gi, '')}`;
  const sideStyle = r.side === 'left' ? { left: 24 * scale } : { right: 24 * scale };
  const path = ribbonPath(layout.height);
  const inputs = useRef([]);

  // Inline editor: three stacked inputs in the ribbon shape.
  useEffect(() => {
    if (!editing) return undefined;
    const first = inputs.current[0];
    first?.focus();
    first?.select();
    const onDown = (e) => {
      if (!e.target.closest?.(`[data-ribbon-edit="${item.id}"]`)) onCommit(item, inputs.current.map((i) => i?.value ?? ''));
    };
    const t = setTimeout(() => document.addEventListener('pointerdown', onDown, true), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [editing, item, onCommit]);

  return (
    <span className="ribbon" style={{ width, height, top: -RIBBON_FOLD * scale, ...sideStyle }} data-ribbon onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)} title={undefined}>
      <svg className="ribbon__svg" width={width} height={height} viewBox={`0 0 ${RIBBON_BASE_W} ${layout.height}`} aria-label={`${status.name} ribbon: ${lines.join(' ')}`} role="img">
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={status.light} />
            <stop offset="1" stopColor={status.dark} />
          </linearGradient>
          <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-fold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0.12" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <path d={path} />
          </clipPath>
        </defs>
        <path d={path} fill={`url(#${uid}-fill)`} />
        <g clipPath={`url(#${uid}-clip)`}>
          <rect x="0" y="0" width={RIBBON_BASE_W / 3} height={layout.height} fill={`url(#${uid}-shine)`} />
          <rect x="0" y="0" width={RIBBON_BASE_W} height={RIBBON_FOLD} fill={`url(#${uid}-fold)`} />
          <path d={path} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
        </g>
        <path d={path} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        {!editing && (
          <g fill={status.text} fontFamily="Geist, system-ui, sans-serif" fontWeight="500" textAnchor="middle">
            <text x={RIBBON_BASE_W / 2} y={layout.line1Y} fontSize="20" letterSpacing="-0.2">
              {lines[0]}
            </text>
            {lines.length > 1 && <line x1={RIBBON_BASE_W * 0.15} x2={RIBBON_BASE_W * 0.85} y1={layout.dividerY} y2={layout.dividerY} stroke="currentColor" strokeOpacity="0.3" style={{ color: status.text }} />}
            {lines.slice(1).map((l, i) => (
              <text key={i} x={RIBBON_BASE_W / 2} y={layout.lineYs[i]} fontSize="12">
                {l}
              </text>
            ))}
          </g>
        )}
      </svg>
      {editing && (
        <span className="ribbon__edit" data-ribbon-edit={item.id} style={{ paddingTop: (RIBBON_FOLD + 4) * scale, color: status.text }} onPointerDown={(e) => e.stopPropagation()}>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              className={`ribbon__input${i === 0 ? ' ribbon__input--big' : ''}`}
              style={{ fontSize: (i === 0 ? 20 : 12) * scale, height: (i === 0 ? 24 : 15.6) * scale, marginTop: i === 1 ? 13 * scale : 0 }}
              defaultValue={lines[i] || ''}
              maxLength={RIBBON_LIMITS[i]}
              placeholder={i === 0 ? 'Ref' : ''}
              aria-label={`Ribbon line ${i + 1} (max ${RIBBON_LIMITS[i]} characters)`}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCommit(item, inputs.current.map((x) => x?.value ?? ''));
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancel();
                }
              }}
            />
          ))}
        </span>
      )}
      {tip && !editing && <span className="ribbon__tip floating">{status.name}</span>}
    </span>
  );
}
