import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tabs } from './data/references.js';
import { countItems, flattenItems, tabFromHash } from './lib/references.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import FilterBar from './components/FilterBar.jsx';
import ReferenceSection from './components/ReferenceSection.jsx';
import Footer from './components/Footer.jsx';
import CursorPreview, { PreviewProvider } from './components/CursorPreview.jsx';
import SearchDialog from './components/SearchDialog.jsx';
import RandomDialog from './components/RandomDialog.jsx';
import RequestDialog from './components/RequestDialog.jsx';

const allItems = flattenItems();

export default function App() {
  // The active tab follows the URL hash (#websites, #components, ...).
  const [tabId, setTabId] = useState(() => tabFromHash(window.location.hash));
  const [sectionId, setSectionId] = useState(null); // null = "All"
  const [dialog, setDialog] = useState(null); // null | 'search' | 'random' | 'request'
  const previewRef = useRef(null);
  const contentRef = useRef(null);

  const tab = tabs.find((t) => t.id === tabId) || tabs[0];
  const total = countItems(tab);
  const visibleSections = useMemo(
    () => tab.sections.map((section, i) => ({ section, number: i + 1 })).filter(({ section }) => !sectionId || section.id === sectionId),
    [tab, sectionId]
  );
  const shown = visibleSections.reduce((sum, { section }) => sum + section.items.length, 0);

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

  // Switch tab: update the hash (so back/forward works) and jump to the content
  // if the reader has already scrolled past the hero.
  const selectTab = useCallback((id) => {
    const target = tabs.some((t) => t.id === id) ? id : tabs[0].id;
    if (window.location.hash !== `#${target}`) {
      window.location.hash = target;
    } else {
      setTabId(target);
      setSectionId(null);
    }
    const top = contentRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) {
      contentRef.current.scrollIntoView({ block: 'start' });
    }
  }, []);

  // Hash -> state (handles back/forward and direct links).
  useEffect(() => {
    const onHash = () => {
      setTabId(tabFromHash(window.location.hash));
      setSectionId(null);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Hide the hover preview whenever a dialog opens.
  useEffect(() => {
    if (dialog) previewRef.current?.hide();
  }, [dialog]);

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
        setDialog((d) => {
          if (d) return null;
          setSectionId(null);
          return d;
        });
        return;
      }
      if (!mod && !e.altKey && /^[1-4]$/.test(e.key) && !typing && !dialog) {
        const next = tabs[Number(e.key) - 1];
        if (next) selectTab(next.id);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog, selectTab]);

  function goHome() {
    selectTab(tabs[0].id);
    window.scrollTo({ top: 0 });
  }

  const closeDialog = () => setDialog(null);

  return (
    <PreviewProvider previewRef={previewRef}>
      <Header
        activeTab={tab.id}
        onSelectTab={selectTab}
        onLogo={goHome}
        onOpenSearch={() => setDialog('search')}
        onOpenRandom={() => setDialog('random')}
        onOpenRequest={() => setDialog('request')}
      />

      <main>
        <Hero onOpenRequest={() => setDialog('request')} />

        <div ref={contentRef} className="content-anchor" />
        <FilterBar tab={tab} activeSection={sectionId} onSelectSection={setSectionId} shown={shown} total={total} />

        <div className="content container">
          {visibleSections.map(({ section, number }) => (
            <ReferenceSection key={section.id} section={section} number={number} items={itemsBySection.get(section.id) || []} />
          ))}
        </div>
      </main>

      <Footer onSelectTab={selectTab} />

      <CursorPreview ref={previewRef} />
      <SearchDialog open={dialog === 'search'} onClose={closeDialog} />
      <RandomDialog open={dialog === 'random'} onClose={closeDialog} />
      <RequestDialog open={dialog === 'request'} onClose={closeDialog} />
    </PreviewProvider>
  );
}
