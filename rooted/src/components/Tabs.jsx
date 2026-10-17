import { useEffect, useRef, useState } from 'react';
import { tabs } from '../data/references.js';
import { countItems } from '../lib/references.js';

// Segmented switch for the 4 main tabs. It sticks under the header pill when
// scrolled past and turns into a floating pill there. Keys 1–4 also switch.
export default function Tabs({ activeTab, onSelectTab, floating = false }) {
  const ref = useRef(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (floating) return undefined;
    const el = ref.current;
    const check = () => setStuck(el.getBoundingClientRect().top <= 68.5);
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [floating]);

  return (
    <div className="tabs-bar container" ref={ref}>
      <nav className={`segments${stuck || floating ? ' floating' : ''}`} aria-label="Main tabs">
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
