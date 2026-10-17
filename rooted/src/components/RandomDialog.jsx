import { useEffect, useState } from 'react';
import { randomItem } from '../lib/references.js';
import Modal from './Modal.jsx';
import { PreviewPlaceholder, usePreviewImage } from './CursorPreview.jsx';

// ⌘E: one random reference with its preview image.
export default function RandomDialog({ open, onClose }) {
  const [item, setItem] = useState(null);
  const { src } = usePreviewImage(item);

  useEffect(() => {
    if (open) setItem(randomItem(null));
  }, [open]);

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} labelledBy="random-title" width={380}>
      <div className="random">
        <div className="random__image">
          {src ? <img src={src} alt="" /> : <PreviewPlaceholder item={item} />}
        </div>
        <p className="random__path">{item.tabLabel} · {item.sectionTitle}</p>
        <h3 className="modal__title" id="random-title">{item.name}</h3>
        <p className="random__desc">{item.description}</p>
        <div className="modal__actions">
          <button type="button" className="button button--light" data-autofocus onClick={() => setItem((cur) => randomItem(cur?.key))}>
            Another one
          </button>
          <a className="button button--dark" href={item.url} target="_blank" rel="noopener noreferrer">
            Visit site
          </a>
        </div>
      </div>
    </Modal>
  );
}
