import { FrameIcon, GridIcon, MinusIcon, PlusIcon } from '../Icons.jsx';
import { modLabel } from '../../lib/platform.js';

// Bottom-right pill: − | zoom % | + | grid snap | fit to content.
// On phones only "%" (tap = fit) and the grid toggle; pinch handles zooming.
export default function ZoomBar({ zoom, snap, phone, onZoomIn, onZoomOut, onReset, onToggleSnap, onFit }) {
  const pct = `${Math.round(zoom * 100)}%`;
  return (
    <div className="cbar cbar--zoom floating" role="toolbar" aria-label="Zoom">
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
