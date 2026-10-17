import ListRow from './ListRow.jsx';

// A section label (title left, item count right) followed by its rows.
export default function ReferenceSection({ section, items }) {
  return (
    <section className="ref-section" aria-labelledby={`section-${section.id}`}>
      <div className="ref-section__label">
        <h2 id={`section-${section.id}`}>{section.title}</h2>
        <span className="ref-section__count num">{items.length}</span>
      </div>
      <div className="rows">
        {items.map((item) => (
          <ListRow key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}
