import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon } from '../Icons.jsx';
import { LABEL_PRESETS_COLORS } from './labelColors.js';

// 3 × 3 swatches + Custom, shown above the selection bar's color dot.
// Rendered in a portal above the button (`anchor` = the button's rect), so the
// scrolling selection bar never clips it.
export default function ColorPopover({ active, onPick, onClose, presets = LABEL_PRESETS_COLORS, anchor }) {
  const ref = useRef(null);
  const colorInput = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);

  const isCustom = active && !presets.some((p) => p.id === active);

  const style = anchor ? { position: 'fixed', left: anchor.left + anchor.width / 2, bottom: window.innerHeight - anchor.top + 8, transform: 'translateX(-50%)' } : undefined;
  return createPortal(
    <div ref={ref} className="color-pop floating" role="dialog" aria-label="Color" style={style}>
      <div className="color-pop__grid">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`swatch${active === p.id ? ' is-active' : ''}`}
            style={{ background: p.bg, color: p.text, borderColor: p.id === 'black' || p.id === 'ink' ? '#111' : p.border }}
            onClick={() => onPick(p.id)}
            aria-label={p.name}
            aria-pressed={active === p.id}
            title={p.name}
          >
            {active === p.id && <CheckIcon width={12} height={12} />}
          </button>
        ))}
      </div>
      <button type="button" className={`color-pop__custom${isCustom ? ' is-active' : ''}`} onClick={() => colorInput.current?.click()}>
        <span className="swatch swatch--small" style={{ background: isCustom ? active : 'linear-gradient(135deg, #f87171, #facc15, #4ade80, #60a5fa, #c084fc)' }} aria-hidden="true" />
        Custom…
      </button>
      <input ref={colorInput} type="color" className="visually-hidden" tabIndex={-1} defaultValue={isCustom ? active : '#AABBCC'} onChange={(e) => onPick(e.target.value)} aria-hidden="true" />
    </div>,
    document.body
  );
}
