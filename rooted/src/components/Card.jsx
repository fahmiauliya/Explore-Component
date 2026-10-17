import PreviewImage from './PreviewImage.jsx';

// The inside of a card: screenshot box, name, description and a tag line.
// Used by the grid (wrapped in a link) and by the Visuals canvas (wrapped in a draggable item).
export function CardBody({ item }) {
  const tags = (item.tags || []).slice(0, 3);
  return (
    <>
      <span className="card__media">
        <PreviewImage item={item} className="card__img" iconSize={24} />
      </span>
      <span className="card__text">
        <span className="card__name">{item.name}</span>
        <span className="card__desc">{item.description}</span>
        {tags.length > 0 && <span className="card__tags">{tags.join(' · ')}</span>}
      </span>
    </>
  );
}

// One reference in the grid. The whole card is a link that opens the site in a new tab.
export default function Card({ item }) {
  return (
    <a className="card" href={item.url} target="_blank" rel="noopener noreferrer">
      <CardBody item={item} />
    </a>
  );
}
