import { usePreview } from './CursorPreview.jsx';

// One reference as a plain text row: name on the left, description on the right.
// Hovering it (with a mouse) shows the floating preview.
export default function ListRow({ item }) {
  const preview = usePreview();
  const hoverProps = preview.enabled
    ? {
        onMouseEnter: (e) => preview.show(item, e.clientX, e.clientY),
        onMouseMove: (e) => preview.move(item, e.clientX, e.clientY),
        onMouseLeave: () => preview.hide(),
      }
    : {};

  return (
    <a className="row" href={item.url} target="_blank" rel="noopener noreferrer" {...hoverProps}>
      <span className="row__name">{item.name}</span>
      <span className="row__desc">{item.description}</span>
    </a>
  );
}
