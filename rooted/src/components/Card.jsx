import PreviewImage from './PreviewImage.jsx';

// One reference as a gray tile: tag pills on top, the screenshot floating in
// the middle, and the name and description at the bottom.
// The whole card is a link that opens the site in a new tab.
export default function Card({ item }) {
  const tags = (item.tags || []).slice(0, 3);
  return (
    <a className="card" href={item.url} target="_blank" rel="noopener noreferrer">
      {tags.length > 0 && (
        <span className="card__tags">
          {tags.map((tag) => (
            <span key={tag} className="card__tag">
              {tag}
            </span>
          ))}
        </span>
      )}
      <span className="card__frame">
        <PreviewImage item={item} className="card__img" iconSize={24} />
      </span>
      <span className="card__text">
        <span className="card__name">{item.name}</span>
        <span className="card__desc">{item.description}</span>
      </span>
    </a>
  );
}
