import { useEffect, useMemo, useRef, useState } from 'react';
import { searchItems } from '../lib/references.js';
import Modal from './Modal.jsx';
import SiteIcon from './SiteIcon.jsx';
import Kbd from './Kbd.jsx';
import { SearchIcon } from './Icons.jsx';

function openSite(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ⌘K search across every tab. Arrows move the highlight, Enter opens it.
export default function SearchDialog({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const results = useMemo(() => searchItems(query, 12), [query]);

  // Start fresh every time it opens.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  // Keep the highlighted row in view.
  useEffect(() => {
    const row = listRef.current?.children[active];
    row?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      openSite(results[active].url);
    }
  }

  return (
    <Modal open={open} onClose={onClose} label="Search references" position="top" width={560}>
      <div className="search">
        <div className="search__field">
          <SearchIcon />
          <input
            data-autofocus
            className="search__input"
            type="text"
            value={query}
            placeholder="Search websites, components, fonts…"
            aria-label="Search references"
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `search-opt-${active}` : undefined}
            autoComplete="off"
            spellCheck="false"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <Kbd>Esc</Kbd>
        </div>

        {results.length === 0 ? (
          <p className="search__empty">No references match “{query.trim()}”.</p>
        ) : (
          <ul className="search__results" id="search-results" role="listbox" ref={listRef}>
            {results.map((item, i) => (
              <li key={item.key} id={`search-opt-${i}`} role="option" aria-selected={i === active}>
                <a
                  className={`search__row${i === active ? ' is-active' : ''}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="list-card__icon">
                    <SiteIcon name={item.name} domain={item.domain} />
                  </span>
                  <span className="list-card__text">
                    <span className="list-card__name">{item.name}</span>
                    <span className="list-card__desc">{item.description}</span>
                  </span>
                  <span className="tag">{item.tabLabel}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
