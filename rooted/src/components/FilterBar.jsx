import { CloseIcon } from './Icons.jsx';

// Sticky row under the header: "All" + one pill per section, and the "X of Y" counter.
export default function FilterBar({ tab, activeSection, onSelectSection, shown, total }) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__inner container">
        <div className="pills" role="group" aria-label="Filter by section">
          <button
            type="button"
            className={`pill${activeSection === null ? ' is-active' : ''}`}
            aria-pressed={activeSection === null}
            onClick={() => onSelectSection(null)}
          >
            All
          </button>
          {tab.sections.map((section) => {
            const active = section.id === activeSection;
            return (
              <button
                key={section.id}
                type="button"
                className={`pill${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => onSelectSection(active ? null : section.id)}
              >
                {section.title}
                {active && <CloseIcon width={12} height={12} />}
              </button>
            );
          })}
        </div>
        <p className="filter-bar__count" aria-live="polite">
          <span className="num">{shown}</span> of <span className="num">{total}</span>
        </p>
      </div>
    </div>
  );
}
