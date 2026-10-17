import { createContext, useContext } from 'react';
import PreviewImage from './PreviewImage.jsx';
import { isNew, tagSlug } from '../lib/references.js';

// The active tag filter, shared with every card on the list pages.
// { tag: 'gallery' | null, setTag(slug | null) }
export const TagFilterContext = createContext({ tag: null, setTag: () => {} });

// One reference as a gray tile: tag chips on top, the screenshot floating in
// the middle, and the name and description at the bottom.
// Stretched-link pattern: the name is the link and covers the whole card;
// the tag buttons sit above it. On the canvas (`interactive={false}`) the
// tags are plain text and the card has no link overlay.
export default function Card({ item, interactive = true }) {
  const tags = (item.tags || []).slice(0, 3);
  const filter = useContext(TagFilterContext);
  const fresh = isNew(item.added);

  return (
    <article className={`card${interactive ? '' : ' card--static'}`}>
      {(tags.length > 0 || fresh) && (
        <div className="card__tags">
          {tags.map((tag) => {
            const slug = tagSlug(tag);
            const active = filter.tag === slug;
            return interactive ? (
              <button
                key={tag}
                type="button"
                className={`card__tag${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => filter.setTag(active ? null : slug)}
                title={active ? 'Clear filter' : `Show only "${tag}"`}
              >
                {tag}
              </button>
            ) : (
              <span key={tag} className={`card__tag${active ? ' is-active' : ''}`}>
                {tag}
              </span>
            );
          })}
          {fresh && <span className="card__new">New</span>}
        </div>
      )}
      <span className="card__frame">
        <PreviewImage item={item} className="card__img" iconSize={24} />
      </span>
      <div className="card__text">
        {interactive ? (
          <a className="card__name" href={item.url} target="_blank" rel="noopener noreferrer">
            {item.name}
          </a>
        ) : (
          <span className="card__name">{item.name}</span>
        )}
        <span className="card__desc">{item.description}</span>
      </div>
    </article>
  );
}
