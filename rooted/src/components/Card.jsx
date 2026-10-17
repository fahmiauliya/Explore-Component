import PreviewImage from './PreviewImage.jsx';

// One reference as a screenshot card: image on top, name and description below.
// The whole card is a link that opens the site in a new tab.
export default function Card({ item }) {
  return (
    <a className="card" href={item.url} target="_blank" rel="noopener noreferrer">
      <span className="card__media">
        <span className="card__frame">
          <PreviewImage item={item} className="card__img" iconSize={24} />
        </span>
      </span>
      <span className="card__text">
        <span className="card__name">{item.name}</span>
        <span className="card__desc">{item.description}</span>
      </span>
    </a>
  );
}
