import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tabs } from './data/references.js';
import { flattenItems, tabFromHash, tagLabel, tagSlug } from './lib/references.js';
import { TagFilterContext } from './components/Card.jsx';
import { CloseIcon } from './components/Icons.jsx';
import Header from './components/Header.jsx';
import Intro from './components/Intro.jsx';
import Tabs from './components/Tabs.jsx';
import ReferenceSection from './components/ReferenceSection.jsx';
import Footer from './components/Footer.jsx';
import SearchDialog from './components/SearchDialog.jsx';
import RandomDialog from './components/RandomDialog.jsx';
import RequestDialog from './components/RequestDialog.jsx';
import VisualsCanvas from './components/canvas/VisualsCanvas.jsx';

const allItems = flattenItems();

export default function App() {
  // The active tab follows the URL hash (#websites, #components, ...).
  const [tabId, setTabId] = useState(() => tabFromHash(window.location.hash));
  const [dialog, setDialog] = useState(null); // null | 'search' | 'random' | 'request'
  // Tag filter for the current tab, mirrored in the URL as ?tag=slug.
  const [tag, setTagState] = useState(() => new URLSearchParams(window.location.search).get('tag') || null);
  const setTag = useCallback((slug) => {
    setTagState(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set('tag', slug);
    else url.searchParams.delete('tag');
    window.history.replaceState(null, '', url);
  }, []);
  const contentRef = useRef(null);

  const tab = tabs.find((t) => t.id === tabId) || tabs[0];
  const isCanvas = tab.id === 'visuals';

  // The Visuals canvas fills the window: lock page scrolling while it's shown.
  useEffect(() => {
    document.body.classList.toggle('is-canvas', isCanvas);
    return () => document.body.classList.remove('is-canvas');
  }, [isCanvas]);

  // Items for the current tab, already flattened and tagged.
  const itemsBySection = useMemo(() => {
    const map = new Map();
    for (const item of allItems) {
      if (item.tabId !== tab.id) continue;
      if (!map.has(item.sectionId)) map.set(item.sectionId, []);
      map.get(item.sectionId).push(item);
    }
    return map;
  }, [tab]);

  // Switch tab: update the hash (so back/forward works) and jump to the list
  // if the reader has already scrolled past the intro.
  const selectTab = useCallback((id) => {
    // eslint-disable-next-line no-use-before-define
    const target = tabs.some((t) => t.id === id) ? id : tabs[0].id;
    setTag(null);
    if (window.location.hash !== `#${target}`) {
      window.location.hash = target;
    } else {
      setTabId(target);
    }
    if (window.scrollY > 0) window.scrollTo({ top: 0 });
  }, []);

  // Hash -> state (handles back/forward and direct links).
  useEffect(() => {
    const onHash = () => setTabId(tabFromHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKeyDown(e) {
      const mod = e.metaKey || e.ctrlKey;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setDialog((d) => (d === 'search' ? null : 'search'));
        return;
      }
      if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setDialog('random');
        return;
      }
      if (e.key === 'Escape') {
        if (dialog) setDialog(null);
        else if (tag && !e.target?.closest?.('[data-canvas]')) setTag(null);
        return;
      }
      // 1–4 switch tabs, except while typing or while the Visuals canvas has focus.
      const inCanvas = Boolean(e.target?.closest?.('[data-canvas]'));
      if (!mod && !e.altKey && /^[1-4]$/.test(e.key) && !typing && !dialog && !inCanvas) {
        const next = tabs[Number(e.key) - 1];
        if (next) selectTab(next.id);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog, selectTab, tag, setTag]);

  function goHome() {
    selectTab(tabs[0].id);
    window.scrollTo({ top: 0 });
  }

  const closeDialog = () => setDialog(null);

  // Fade behind the floating pills once the list page has scrolled a little.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sections of the current tab, filtered by the active tag (empty ones hidden).
  const sections = tab.sections
    .map((section) => ({ section, items: (itemsBySection.get(section.id) || []).filter((it) => !tag || (it.tags || []).some((t) => tagSlug(t) === tag)) }))
    .filter(({ items }) => items.length > 0);

  // Push the page down while the filter chip is shown.
  useEffect(() => {
    document.body.classList.toggle('has-filter', Boolean(tag) && !isCanvas);
    return () => document.body.classList.remove('has-filter');
  }, [tag, isCanvas]);

  return (
    <TagFilterContext.Provider value={{ tag, setTag }}>
      <Header
        onLogo={goHome}
        onOpenSearch={() => setDialog('search')}
        onOpenRandom={() => setDialog('random')}
        onOpenRequest={() => setDialog('request')}
      />

      {!isCanvas && <div className={`scroll-fade${scrolled ? ' is-visible' : ''}`} aria-hidden="true" />}

      <main>
        {!isCanvas && <Intro onOpenRequest={() => setDialog('request')} />}

        <div ref={contentRef} className="content-anchor" />
        <Tabs activeTab={tab.id} onSelectTab={selectTab} />

        {tag && !isCanvas && (
          <div className="tag-chip floating" role="status">
            <span>
              Tag: <strong className="tag-chip__name">{tagLabel(tag)}</strong>
            </span>
            <button type="button" className="icon-button" onClick={() => setTag(null)} aria-label="Clear tag filter (Esc)" title="Clear filter (Esc)">
              <CloseIcon width={14} height={14} />
            </button>
          </div>
        )}

        {isCanvas ? (
          <VisualsCanvas />
        ) : (
          <div className="content container--wide">
            {sections.map(({ section, items }) => (
              <ReferenceSection key={section.id} section={section} items={items} />
            ))}
            {sections.length === 0 && <p className="content__empty">No references with this tag in {tab.label}.</p>}
          </div>
        )}
      </main>

      {!isCanvas && <Footer />}

      <SearchDialog open={dialog === 'search'} onClose={closeDialog} />
      <RandomDialog open={dialog === 'random'} onClose={closeDialog} />
      <RequestDialog open={dialog === 'request'} onClose={closeDialog} />
    </TagFilterContext.Provider>
  );
}
