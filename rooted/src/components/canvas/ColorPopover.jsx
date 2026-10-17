import { useEffect, useRef } from 'react';
import { CheckIcon } from '../Icons.jsx';
import { LABEL_PRESETS_COLORS } from './labelColors.js';

// 3 × 3 swatches + Custom, shown above the selection bar's color dot.
export default function ColorPopover({ active, onPick, onClose }) {
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

  const isCustom = active && !LABEL_PRESETS_COLORS.some((p) => p.id === active);

  return (
    <div ref={ref} className="color-pop floating" role="dialog" aria-label="Label color">
      <div className="color-pop__grid">
        {LABEL_PRESETS_COLORS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`swatch${active === p.id ? ' is-active' : ''}`}
            style={{ background: p.bg, color: p.text, borderColor: p.id === 'black' ? '#111' : undefined }}
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
    </div>
  );
}
