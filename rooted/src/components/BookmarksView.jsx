import { Fragment, useMemo } from 'react';
import Card from './Card.jsx';
import FolderCard from './FolderCard.jsx';
import { countItems, folderBookmarks, folderChildren, folderCountLabel, folderPath, itemForNode, tagSlug, walkBookmarks } from '../lib/references.js';

// The Bookmarks tab. A breadcrumb (Bookmarks / Galleries / Awards, every part
// clickable) sits above one grid with the current folder's subfolders first and
// its bookmarks after them. While a tag filter is on, every bookmark under the
// current folder that carries the tag is listed instead.
export default function BookmarksView({ tab, folderIds, tag, tagLabel, onOpenFolder }) {
  const path = folderPath(tab, folderIds);
  const current = path.length ? path[path.length - 1] : tab;
  const folders = folderChildren(current);
  const bookmarks = folderBookmarks(current).map(itemForNode);
  const tagged = useMemo(
    () => (tag ? [...walkBookmarks(current.children)].map(({ node }) => itemForNode(node)).filter((it) => (it.tags || []).some((t) => tagSlug(t) === tag)) : null),
    [current, tag]
  );
  const count = current === tab ? `${countItems(tab)} bookmarks` : folderCountLabel(current);
  const parts = [{ id: null, name: tab.label }, ...path];

  return (
    <>
      <nav className="crumbs" aria-label="Folder path">
        <div className="crumbs__path">
          {parts.map((part, i) => {
            const last = i === parts.length - 1;
            return (
              <Fragment key={part.id || 'root'}>
                {i > 0 && (
                  <span className="crumbs__sep" aria-hidden="true">
                    /
                  </span>
                )}
                <button type="button" className={`crumbs__part${last ? ' is-current' : ''}`} aria-current={last ? 'page' : undefined} onClick={() => onOpenFolder(folderIds.slice(0, i))}>
                  {part.name}
                </button>
              </Fragment>
            );
          })}
        </div>
        <span className="crumbs__count num">{tag ? `${tagged.length} tagged` : count}</span>
      </nav>

      {tag ? (
        tagged.length ? (
          <div className="card-grid">
            {tagged.map((it) => (
              <Card key={it.key} item={it} />
            ))}
          </div>
        ) : (
          <p className="content__empty">
            No bookmarks tagged “{tagLabel}” in {current.name || tab.label}.
          </p>
        )
      ) : folders.length + bookmarks.length ? (
        <div className="card-grid">
          {folders.map((f) => (
            <FolderCard key={f.id} folder={f} onOpen={() => onOpenFolder([...folderIds, f.id])} />
          ))}
          {bookmarks.map((it) => (
            <Card key={it.key} item={it} />
          ))}
        </div>
      ) : (
        <p className="content__empty">This folder is empty.</p>
      )}
    </>
  );
}
