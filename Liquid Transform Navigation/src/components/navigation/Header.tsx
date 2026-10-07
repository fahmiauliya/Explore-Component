import { type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import aboutIcon from '../../assets/icons/nav-about.svg';
import homeIcon from '../../assets/icons/logo.svg';
import contactIcon from '../../assets/icons/nav-contact.svg';
import worksIcon from '../../assets/icons/nav-works.svg';
import NavigationMaterial from './NavigationMaterial';
const CONTACT_TELEGRAM = '#';
import { materialPath } from './navigationMotion';
import { setWorkTab, useWorkTab, type WorkTab } from './workTab';

const NAVIGATION_CONTROL_HEIGHT = 28;
// Two 121px project tabs (--nav-tab-width in global.css).
const TAB_TRACK_WIDTH = 242;

export default function Header({ progress }: { progress: number }) {
  const isAboutPage = false;
  const activeTab = useWorkTab();
  const centerLeft = 110 - 46 * progress;
  const centerWidth = 155 + 92 * progress;
  const aboutLeft = 186.5 + 128.5 * progress;
  const labelProgress = Math.min(1, progress / 0.55);
  const collapse = labelProgress * labelProgress * (3 - 2 * labelProgress);
  const aboutWidth = 74 - 46 * collapse;
  const labelWidth = 36 * (1 - collapse);
  const aboutCenter = aboutLeft + (aboutWidth - labelWidth) / 2;
  const projectsOpacity = Math.max(0, Math.min(1, (progress - 0.3) / 0.4));
  const worksOpacity = Math.max(0, 1 - progress / 0.35);
  const contentClip = Math.max(0, TAB_TRACK_WIDTH - (aboutLeft - centerLeft - 7));
  const isIntroSettled = progress === 0;
  const isWorksSettled = progress === 1;
  const navigationStyle = {
    '--navigation-control-height': `${NAVIGATION_CONTROL_HEIGHT}px`,
    '--navigation-rim-top': 'var(--color-control-stroke-top)',
    '--navigation-rim-bottom': 'var(--color-control-stroke-bottom)',
    '--navigation-progress': progress,
  } as CSSProperties;

  // Already on the home page, "Works" glides down to the grid instead of the browser's
  // instant jump to #works (the navigation morphs along with the scroll). From another
  // page the link keeps its normal behaviour (the page transition, useSiteTransition.ts).
  const scrollToWorks = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const works = document.getElementById('works');
    if (window.location.pathname !== '/' || !works) return;
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    works.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    if (window.location.hash !== '#works') history.pushState(history.state, '', '/#works');
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let nextTab: WorkTab | undefined;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      nextTab = event.currentTarget.id === 'nav-tab-selected' ? 'recent' : 'selected';
    } else if (event.key === 'Home') {
      nextTab = 'selected';
    } else if (event.key === 'End') {
      nextTab = 'recent';
    }
    if (!nextTab) return;
    event.preventDefault();
    setWorkTab(nextTab);
    document.getElementById(`nav-tab-${nextTab}`)?.focus();
  };

  return (
    <header className="site-header">
      {/* The SVG material is the one persistent surface for the pill and the About bubble,
          at rest and mid-morph, so their fill, border, shadow and highlight never swap
          renderers or restart; only the geometry animates, in both directions. */}
      <nav className="site-nav" data-state={progress < 0.5 ? 'intro' : 'works'} data-works-settled={isWorksSettled || undefined} style={navigationStyle} aria-label="Primary navigation">
        <NavigationMaterial path={materialPath(centerLeft, centerWidth, aboutCenter, progress, NAVIGATION_CONTROL_HEIGHT / 2)} />

        <a className="nav-link nav-home" style={{ transform: `translateX(${78 - 46 * progress}px)` }} href="/" aria-label="Back to introduction">
          <span className="nav-circle nav-surface">
            <span className="nav-icon nav-icon--logo" aria-hidden="true">
              <span><img src={homeIcon} alt="" /></span>
            </span>
          </span>
        </a>

        <div className="nav-segments" style={{ width: centerWidth, transform: `translateX(${centerLeft}px)` }}>
          <div className="nav-segments-content nav-segments-content--intro" style={{ opacity: worksOpacity }} aria-hidden={worksOpacity === 0}>
            <a href="/#works" onClick={scrollToWorks} tabIndex={isIntroSettled ? 0 : -1} style={{ pointerEvents: isIntroSettled ? 'auto' : 'none' }}>
              <span className="nav-icon nav-icon--works" aria-hidden="true">
                <span><img src={worksIcon} alt="" /></span>
              </span>
              <span>Works</span>
            </a>
          </div>
          <div className="nav-segments-content nav-segments-content--works" data-active={activeTab} role="tablist" aria-label="Work categories" style={{ opacity: projectsOpacity, clipPath: `inset(0 ${contentClip}px 0 0)` }} aria-hidden={projectsOpacity === 0}>
            <span className="nav-tab-indicator" aria-hidden="true" />
            <button id="nav-tab-selected" className="nav-project-tab" type="button" role="tab" aria-controls="works-panel" aria-selected={activeTab === 'selected'} tabIndex={isWorksSettled && activeTab === 'selected' ? 0 : -1} onClick={() => setWorkTab('selected')} onKeyDown={handleTabKeyDown}>Selected Project</button>
            <button id="nav-tab-recent" className="nav-project-tab" type="button" role="tab" aria-controls="works-panel" aria-selected={activeTab === 'recent'} tabIndex={isWorksSettled && activeTab === 'recent' ? 0 : -1} onClick={() => setWorkTab('recent')} onKeyDown={handleTabKeyDown}>Recent Work</button>
          </div>
        </div>

        {/* This link and its icon remain mounted and visible through the entire morph. */}
        <a className="nav-about" href="/about/" aria-label="About" aria-current={isAboutPage ? 'page' : undefined} style={{ width: aboutWidth, transform: `translateX(${aboutLeft}px)` }}>
          <span className="nav-icon nav-icon--about" aria-hidden="true">
            <span><img src={aboutIcon} alt="" /></span>
          </span>
          <span className="nav-about-label" aria-hidden="true" style={{ width: labelWidth, opacity: 1 - collapse }}><span>About</span></span>
        </a>

        <a className="nav-link nav-email" style={{ transform: `translateX(${269 + 78 * progress}px)` }} href={CONTACT_TELEGRAM} target="_blank" rel="noopener noreferrer" aria-label="Message Fahmi on Telegram">
          <span className="nav-circle nav-surface">
            <span className="nav-icon nav-icon--contact" aria-hidden="true"><img src={contactIcon} alt="" /></span>
          </span>
        </a>
      </nav>
    </header>
  );
}
