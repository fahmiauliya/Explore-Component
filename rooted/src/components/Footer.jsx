import { socials, tabs } from '../data/references.js';
import { socialIcons } from './Icons.jsx';
import Kbd, { ModKbd } from './Kbd.jsx';

export default function Footer({ onSelectTab }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__brand">
          <p className="footer__name">Rooted</p>
          <p className="footer__tagline">Free design references, curated by Fahmi Auliya.</p>
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
          <p className="footer__copy">© {year} Rooted</p>
        </div>

        <div className="footer__col">
          <p className="footer__label">Shortcuts</p>
          <ul className="footer__list">
            <li><ModKbd k="K" /> Search</li>
            <li><Kbd>1</Kbd>–<Kbd>4</Kbd> Switch tabs</li>
            <li><ModKbd k="E" /> Random reference</li>
            <li><Kbd>Esc</Kbd> Clear filter or close</li>
          </ul>
        </div>

        <div className="footer__col">
          <p className="footer__label">Browse</p>
          <ul className="footer__list">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button type="button" className="text-button" onClick={() => onSelectTab(tab.id)}>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
