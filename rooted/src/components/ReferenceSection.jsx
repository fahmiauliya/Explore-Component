import ListCard from './ListCard.jsx';

// A numbered section heading followed by its list cards.
export default function ReferenceSection({ section, number, items }) {
  const label = String(number).padStart(2, '0');
  return (
    <section className="ref-section" aria-labelledby={`section-${section.id}`}>
      <div className="ref-section__head">
        <span className="ref-section__num num">{label}</span>
        <h2 className="ref-section__title" id={`section-${section.id}`}>{section.title}</h2>
        <p className="ref-section__desc">{section.description}</p>
      </div>
      <div className="card-grid">
        {items.map((item) => (
          <ListCard key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}
