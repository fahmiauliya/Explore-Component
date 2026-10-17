import { usePreview } from './CursorPreview.jsx';
import SiteIcon from './SiteIcon.jsx';

// One reference: favicon square, name and a one-line description.
// Hovering it (with a mouse) shows the floating preview.
export default function ListCard({ item }) {
  const preview = usePreview();
  const hoverProps = preview.enabled
    ? {
        onMouseEnter: (e) => preview.show(item, e.clientX, e.clientY),
        onMouseMove: (e) => preview.move(item, e.clientX, e.clientY),
        onMouseLeave: () => preview.hide(),
      }
    : {};

  return (
    <a className="list-card" href={item.url} target="_blank" rel="noopener noreferrer" {...hoverProps}>
      <span className="list-card__icon">
        <SiteIcon name={item.name} domain={item.domain} />
      </span>
      <span className="list-card__text">
        <span className="list-card__name">{item.name}</span>
        <span className="list-card__desc">{item.description}</span>
      </span>
    </a>
  );
}
