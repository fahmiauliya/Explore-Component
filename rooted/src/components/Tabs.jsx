import { useLayoutEffect, useRef, useState } from 'react';
import { tabs } from '../data/references.js';
import { countItems } from '../lib/references.js';

// Floating segmented switch under the header pill. It sits in the same spot on
// every tab; only the white "thumb" behind the active tab slides (200ms).
export default function Tabs({ activeTab, onSelectTab }) {
  const trackRef = useRef(null);
  const [thumb, setThumb] = useState(null); // { x, w }

  useLayoutEffect(() => {
    const track = trackRef.current;
    const place = () => {
      const btn = track?.querySelector('[aria-current="page"]');
      if (!btn) return;
      setThumb({ x: btn.offsetLeft, w: btn.offsetWidth });
    };
    place();
    const ro = new ResizeObserver(place);
    if (track) ro.observe(track);
    return () => ro.disconnect();
  }, [activeTab]);

  return (
    <div className="tabs-bar">
      <nav className="segments floating" aria-label="Main tabs" ref={trackRef}>
        {thumb && <span className="segments__thumb" style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }} aria-hidden="true" />}
        {tabs.map((tab, i) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              className={`segment${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              title={`press ${i + 1}`}
              onClick={() => onSelectTab(tab.id)}
            >
              {tab.label}
              <span className="segment__count num">{countItems(tab)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
