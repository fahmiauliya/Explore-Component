import { useEffect, useRef } from 'react';
import { tabs } from '../data/references.js';
import { countItems } from '../lib/references.js';
import { SearchIcon, ShuffleIcon } from './Icons.jsx';
import { ModKbd, modKey } from './Kbd.jsx';

// Sticky top bar: logo, the 4 main tabs with counts, search pill, shuffle, Request.
export default function Header({ activeTab, onSelectTab, onLogo, onOpenSearch, onOpenRandom, onOpenRequest }) {
  const ref = useRef(null);

  // The header wraps to two or three rows on phones. Publish its real height as
  // a CSS variable so the sticky filter bar always sits right below it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="header" ref={ref}>
      <div className="header__inner container">
        <button type="button" className="logo" onClick={onLogo} aria-label="Rooted, go to the first tab">
          <span className="logo__mark" aria-hidden="true">R</span>
          <span className="logo__text">Rooted</span>
        </button>

        <nav className="tabs" aria-label="Main tabs">
          {tabs.map((tab, i) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                title={`press ${i + 1}`}
                onClick={() => onSelectTab(tab.id)}
              >
                {tab.label}
                <span className="tab__count">{countItems(tab)}</span>
              </button>
            );
          })}
        </nav>

        <button type="button" className="search-pill" onClick={onOpenSearch} aria-label="Search references">
          <SearchIcon />
          <span className="search-pill__label">Search references</span>
          <ModKbd k="K" />
        </button>

        <div className="header__actions">
          <button
            type="button"
            className="icon-button"
            onClick={onOpenRandom}
            aria-label={`Random reference (${modKey}E)`}
            title={`Random reference (${modKey}E)`}
          >
            <ShuffleIcon />
          </button>
          <button type="button" className="button button--dark" onClick={onOpenRequest}>
            Request
          </button>
        </div>
      </div>
    </header>
  );
}
