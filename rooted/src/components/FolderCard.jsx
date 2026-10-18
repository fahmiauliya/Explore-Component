import { FolderIcon } from './Icons.jsx';
import PreviewImage from './PreviewImage.jsx';
import SiteIcon from './SiteIcon.jsx';
import { folderCountLabel, folderPreviews, itemForNode } from '../lib/references.js';

// A macOS-style folder for the Bookmarks tab, back to front: a gray back
// panel with a tab on the top right, 2–3 bookmark thumbnails peeking out like
// papers, and a frosted front panel with the favicon of the first bookmark
// (or a folder glyph), the folder name and its count.
// Hover lifts and fans the papers and tilts the front panel; pressing scales
// the whole folder down. With prefers-reduced-motion only colors and shadows change.
export default function FolderCard({ folder, onOpen }) {
  const previews = folderPreviews(folder, 3).map(itemForNode).filter(Boolean);
  const first = previews[0];
  const count = folderCountLabel(folder);

  return (
    <button type="button" className="folder" onClick={onOpen} aria-label={`${folder.name} folder, ${count}`}>
      <span className="folder__back" aria-hidden="true" />
      <span className="folder__papers" aria-hidden="true">
        {previews.length ? (
          previews.map((item, i) => (
            <span key={item.key} className={`folder__paper folder__paper--${i}`}>
              <PreviewImage item={item} className="folder__shot" iconSize={16} />
            </span>
          ))
        ) : (
          <span className="folder__paper folder__paper--0 folder__paper--blank" />
        )}
      </span>
      <span className="folder__front">
        <span className="folder__icon" aria-hidden="true">
          {first ? <SiteIcon name={first.name} domain={first.domain} size={18} /> : <FolderIcon width={18} height={18} />}
        </span>
        <span className="folder__text">
          <span className="folder__name">{folder.name}</span>
          <span className="folder__count">{count}</span>
        </span>
      </span>
    </button>
  );
}
