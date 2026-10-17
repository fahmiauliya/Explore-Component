import { socials } from '../data/references.js';
import { socialIcons } from './Icons.jsx';
import { modLabel } from '../lib/platform.js';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer container">
      <div className="footer__inner">
        <p className="footer__label">Connect</p>
        <p>Rooted is curated by Fahmi Auliya. Say hi or follow along for new references.</p>
        <div className="socials">
          {socials.map((s) => {
            const Icon = socialIcons[s.id] || socialIcons.website;
            return (
              <a
                key={s.id}
                className="icon-button"
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
              >
                <Icon />
              </a>
            );
          })}
        </div>
        <p className="footer__small">
          {modLabel('K')} search · 1–4 switch tabs · {modLabel('E')} random · Esc close
        </p>
        <p className="footer__small">© {year} Rooted</p>
      </div>
    </footer>
  );
}
