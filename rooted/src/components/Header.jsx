import { SearchIcon, ShuffleIcon } from './Icons.jsx';
import { modLabel } from '../lib/platform.js';

// Sticky 56px bar: logo on the left; search, shuffle and Request on the right.
export default function Header({ onLogo, onOpenSearch, onOpenRandom, onOpenRequest }) {
  return (
    <header className="header floating">
      <div className="header__inner">
        <button type="button" className="logo" onClick={onLogo} aria-label="Rooted, go to the first tab">
          <span className="logo__mark" aria-hidden="true">R</span>
          <span className="logo__text">Rooted</span>
        </button>

        <div className="header__actions">
          <button type="button" className="search-button" onClick={onOpenSearch} aria-label={`Search references (${modLabel('K')})`}>
            <SearchIcon />
            <span className="search-button__hint hide-on-touch" aria-hidden="true">{modLabel('K')}</span>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onOpenRandom}
            aria-label={`Random reference (${modLabel('E')})`}
            title={`Random reference (${modLabel('E')})`}
          >
            <ShuffleIcon />
          </button>
          <button type="button" className="button button--dark button--small" onClick={onOpenRequest}>
            Request
          </button>
        </div>
      </div>
    </header>
  );
}
