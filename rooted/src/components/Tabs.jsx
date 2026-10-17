import { tabs } from '../data/references.js';
import { countItems } from '../lib/references.js';

// Sticky segmented switch for the 4 main tabs. Keys 1–4 also switch (see App.jsx).
export default function Tabs({ activeTab, onSelectTab }) {
  return (
    <div className="tabs-bar">
      <div className="container">
        <nav className="segments" aria-label="Main tabs">
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
    </div>
  );
}
