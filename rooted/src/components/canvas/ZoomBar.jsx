import { FrameIcon, GridIcon, MinusIcon, PlusIcon } from '../Icons.jsx';
import { modLabel } from '../../lib/platform.js';

// Top-right pill: − | zoom % | + | grid snap | fit to content.
export default function ZoomBar({ zoom, snap, onZoomIn, onZoomOut, onReset, onToggleSnap, onFit }) {
  return (
    <div className="cbar cbar--zoom" role="toolbar" aria-label="Zoom">
      <button type="button" className="cbar__btn" onClick={onZoomOut} aria-label={`Zoom out (${modLabel('−')})`} title={`Zoom out (${modLabel('−')})`}>
        <MinusIcon />
      </button>
      <button type="button" className="cbar__zoom num" onClick={onReset} aria-label={`Zoom ${Math.round(zoom * 100)}%, click to reset to 100% (${modLabel('0')})`} title={`Reset to 100% (${modLabel('0')})`}>
        {Math.round(zoom * 100)}%
      </button>
      <button type="button" className="cbar__btn" onClick={onZoomIn} aria-label={`Zoom in (${modLabel('+')})`} title={`Zoom in (${modLabel('+')})`}>
        <PlusIcon />
      </button>
      <span className="cbar__divider" />
      <button type="button" className={`cbar__btn${snap ? ' is-active' : ''}`} onClick={onToggleSnap} aria-pressed={snap} aria-label="Snap to grid" title="Snap to grid">
        <GridIcon />
      </button>
      <button type="button" className="cbar__btn" onClick={onFit} aria-label="Fit to content" title="Fit to content">
        <FrameIcon />
      </button>
    </div>
  );
}
