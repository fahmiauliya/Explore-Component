import { socials } from '../data/references.js';
import { socialIcons } from './Icons.jsx';
import { modLabel } from '../lib/platform.js';

// Full-width footer (same container as the grid): two balanced rows.
export default function Footer() {
  const year = new Date().getFullYear();
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return (
    <footer className="footer container--wide">
      <div className="footer__inner">
        <div className="footer__row">
          <div className="footer__brand">
            <p className="footer__name">Rooted</p>
            <p className="footer__by">Curated by Fahmi Auliya</p>
          </div>
          <div className="socials">
            {socials.map((s) => {
              const Icon = socialIcons[s.id] || socialIcons.website;
              return (
                <a key={s.id} className="icon-button icon-button--lg" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>
        <div className="footer__row footer__row--meta">
          <p className="footer__small">© {year} Rooted</p>
          <div className="footer__right">
            <p className="footer__small">
              {modLabel('K')} search · 1–4 tabs · {modLabel('E')} random
            </p>
            <button type="button" className="footer__top" onClick={toTop}>
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
