import Card from './Card.jsx';

// A section label (title left, item count right) followed by its grid of cards.
export default function ReferenceSection({ section, items }) {
  return (
    <section className="ref-section" aria-labelledby={`section-${section.id}`}>
      <div className="ref-section__label">
        <h2 id={`section-${section.id}`}>{section.title}</h2>
        <span className="ref-section__count num">{items.length}</span>
      </div>
      <div className="card-grid">
        {items.map((item) => (
          <Card key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}
