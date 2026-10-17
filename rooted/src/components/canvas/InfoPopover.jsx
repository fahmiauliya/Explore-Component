import { useEffect, useRef, useState } from 'react';
import { socials } from '../../data/references.js';
import { InfoIcon, socialIcons } from '../Icons.jsx';
import { modLabel } from '../../lib/platform.js';

// Bottom-left "i" button with a small popover: credit, socials, shortcuts, copyright.
export default function InfoPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="cbar cbar--info floating">
      <button type="button" className="cbar__btn" onClick={() => setOpen((o) => !o)} aria-label="About Rooted" title="About Rooted" aria-expanded={open} aria-haspopup="dialog">
        <InfoIcon width={18} height={18} />
      </button>
      {open && (
        <div className="info-pop floating" role="dialog" aria-label="About Rooted">
          <p>Rooted is curated by Fahmi Auliya.</p>
          <div className="socials">
            {socials.map((s) => {
              const Icon = socialIcons[s.id] || socialIcons.website;
              return (
                <a key={s.id} className="icon-button" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                  <Icon />
                </a>
              );
            })}
          </div>
          <p className="info-pop__shortcuts hide-on-touch">
            Drag to pan · {modLabel('')}+ scroll to zoom · Right-click for options · {modLabel('Z')} undo
          </p>
          <p className="info-pop__shortcuts show-on-touch">Drag to move · Pinch to zoom · Long-press for options</p>
          <p className="footer__small">© {year} Rooted</p>
        </div>
      )}
    </div>
  );
}
