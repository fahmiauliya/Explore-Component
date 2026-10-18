import { socials } from '../data/references.js';
import { socialIcons } from './Icons.jsx';
import { modLabel } from '../lib/platform.js';

// Footer in the same 600px column as the intro, with the intro's text styles.
export default function Footer() {
  const year = new Date().getFullYear();
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return (
    <footer className="footer container">
      <div className="footer__inner">
        <p className="footer__kicker">Curated by Fahmi Auliya</p>
        <p className="footer__text">New references are added regularly. Follow along or say hi.</p>
        <div className="socials">
          {socials.map((s) => {
            const Icon = socialIcons[s.id] || socialIcons.website;
            return (
              <a key={s.id} className="icon-button icon-button--lg icon-button--touch" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                <Icon width={18} height={18} />
              </a>
            );
          })}
        </div>
        <p className="footer__meta footer__shortcuts hide-on-touch">
          {modLabel('K')} search · 1–4 tabs · {modLabel('E')} random
        </p>
        <div className="footer__row">
          <p className="footer__meta">© {year} Rooted</p>
          <button type="button" className="footer__top" onClick={toTop}>
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
