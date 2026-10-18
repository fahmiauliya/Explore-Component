import { FrameIcon, GridIcon, MinusIcon, PlusIcon } from '../Icons.jsx';
import { modLabel } from '../../lib/platform.js';

// Bottom-right pill: Stack | Spread · − | zoom % | + | grid snap | fit.
// On phones only the view toggle, "%" (tap = fit) and the grid toggle.
export default function ZoomBar({ zoom, snap, phone, mode, onMode, onZoomIn, onZoomOut, onReset, onToggleSnap, onFit }) {
  const pct = `${Math.round(zoom * 100)}%`;
  return (
    <div className="cbar cbar--zoom floating" role="toolbar" aria-label="View and zoom">
      <span className="cbar__seg" role="group" aria-label="Folder view">
        <button type="button" className={`cbar__seg-btn${mode === 'stack' ? ' is-active' : ''}`} onClick={() => onMode('stack')} aria-pressed={mode === 'stack'} title="Stack the folders">
          Stack
        </button>
        <button type="button" className={`cbar__seg-btn${mode === 'spread' ? ' is-active' : ''}`} onClick={() => onMode('spread')} aria-pressed={mode === 'spread'} title="Spread the folders out">
          Spread
        </button>
      </span>
      <span className="cbar__divider" />
      {!phone && (
        <button type="button" className="cbar__btn" onClick={onZoomOut} aria-label={`Zoom out (${modLabel('−')})`} title={`Zoom out (${modLabel('−')})`}>
          <MinusIcon />
        </button>
      )}
      <button type="button" className="cbar__zoom num" onClick={phone ? onFit : onReset} aria-label={phone ? `Zoom ${pct}, tap to fit content` : `Zoom ${pct}, click to reset to 100% (${modLabel('0')})`} title={phone ? 'Fit to content' : `Reset to 100% (${modLabel('0')})`}>
        {pct}
      </button>
      {!phone && (
        <button type="button" className="cbar__btn" onClick={onZoomIn} aria-label={`Zoom in (${modLabel('+')})`} title={`Zoom in (${modLabel('+')})`}>
          <PlusIcon />
        </button>
      )}
      <span className="cbar__divider" />
      <button type="button" className={`cbar__btn${snap ? ' is-active' : ''}`} onClick={onToggleSnap} aria-pressed={snap} aria-label="Snap to grid" title="Snap to grid">
        <GridIcon />
      </button>
      {!phone && (
        <button type="button" className="cbar__btn" onClick={onFit} aria-label="Fit to content" title="Fit to content">
          <FrameIcon />
        </button>
      )}
    </div>
  );
}
