import React, { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { DialRoot, DialTimeline, useDialKitController } from 'dialkit';
import 'dialkit/styles.css';
import { FloralDashboard } from './FloralDashboard';
import { Dashboard } from './Dashboard';
import { BLOOM_PANEL } from './FlowerMotion';
import { AGENT_PANEL } from './DashboardMotion';
import { AGENT_ID, PANEL_ID, applyFileIfNew, resetToFile, saveToFile, withSavedAgent, withSavedPanel } from './bloom/tuning';
import backgroundMono from './assets/background.png';
import backgroundRose from './assets/background-rose.png';

// The ground: Figma's photo as it places it, a rectangle larger than the artboard and cropped by it.
// `?bg=rose` picks the rose-tinted version (486:2906); the default is the monochrome one (488:25191).
const BACKGROUNDS = {
  mono: { src: backgroundMono, left: -23, top: -333, width: 1087, height: 1446 },
  rose: { src: backgroundRose, left: -24, top: -401, width: 1089, height: 1445 },
};
const params = new URLSearchParams(location.search);
export const background = BACKGROUNDS[params.get('bg') === 'rose' ? 'rose' : 'mono'];
// `?view=dashboard` shows the app window with the flower as its rail icon (483:23065) instead of the flower card.
const view = params.get('view') === 'dashboard' ? 'dashboard' : 'flower';
import './styles.css';

/** The panels' defaults: the code's values with the saved tuning over them. */
const PANEL = withSavedPanel(BLOOM_PANEL), AGENT = withSavedAgent(AGENT_PANEL);

/** The two file actions, shared by both panels. */
const onAction = (path: string) => {
  if (path.endsWith('saveToFile')) saveToFile().then(() => note('Save to file', 'Saved')).catch(error => note('Save to file', `Save failed: ${error instanceof Error ? error.message : error}`));
  if (path.endsWith('resetToFile')) { resetToFile(); note('Reset to file', 'Reset'); }
};

/** A short note beside a panel action button, for about 1.5 s. */
function note(action: string, text: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>('.dialkit-root button')].find(b => b.textContent?.trim() === action);
  button?.parentElement?.querySelector('.dial-note')?.remove();
  const span = Object.assign(document.createElement('span'), { className: 'dial-note', role: 'status', textContent: text });
  (button ?? document.body).insertAdjacentElement(button ? 'afterend' : 'beforeend', span);
  setTimeout(() => span.remove(), 1500);
}

/** The 1041 × 780 artboard scaled to the preview's width. */
function useArtboardScale(ref: React.RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1041));
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, [ref]);
  return scale;
}

/** The artboard keeps clear of the DialKit panel and the timeline dock, followed as they open, close and move. */
function useDialKitClearance() {
  useEffect(() => {
    const room = document.documentElement.style, sizes = new ResizeObserver(fit), seen = new Set<Element>();
    function fit() {
      const panel = document.querySelector('.dialkit-panel'), dock = document.querySelector('.dialkit-timeline');
      // A hidden panel or dock has an empty rect at the origin: it takes no room.
      const edge = (element: Element | null, side: 'left' | 'top', fallback: number) => { const rect = element?.getBoundingClientRect(); return rect?.width && rect.height ? rect[side] : fallback; };
      const left = edge(panel, 'left', innerWidth), top = edge(dock, 'top', innerHeight);
      room.setProperty('--panel', `${Math.max(24, innerWidth - left + 16)}px`);
      room.setProperty('--dock', `${Math.max(24, innerHeight - top + 16)}px`);
      for (const element of [panel, dock]) if (element && !seen.has(element)) { seen.add(element); sizes.observe(element); }
    }
    const tree = new MutationObserver(fit);
    tree.observe(document.body, { childList: true, subtree: true });
    addEventListener('resize', fit);
    fit();
    return () => { tree.disconnect(); sizes.disconnect(); removeEventListener('resize', fit); };
  }, []);
}

function DashboardPreview() {
  const ref = useRef<HTMLElement>(null);
  const scale = useArtboardScale(ref);
  const dial = useDialKitController('Agent', AGENT, { id: AGENT_ID, persist: true, onAction });
  useEffect(() => { applyFileIfNew(); }, []);
  useDialKitClearance();
  return <>
    <main ref={ref} className="preview" aria-label="Floral Dashboard app preview">
      <div className="artboard artboard-dashboard" style={{ transform: `scale(${scale})`, '--device-scale': scale * devicePixelRatio } as CSSProperties}><Dashboard agent={dial.values} /></div>
    </main>
    <DialRoot position="top-right" theme="dark" />
    <DialTimeline theme="dark" defaultOpen />
  </>;
}

function Preview() {
  const ref = useRef<HTMLElement>(null);
  const scale = useArtboardScale(ref);
  const dial = useDialKitController('Bloom', PANEL, { id: PANEL_ID, persist: true, onAction });
  // The panel and the timeline (registered by the flower's BloomClock, a child, so before this) take a new file's values.
  useEffect(() => { applyFileIfNew(); }, []);
  useDialKitClearance();
  return <>
    <main ref={ref} className="preview" aria-label="Floral Dashboard design preview">
      <div className="artboard" style={{ transform: `scale(${scale})`, '--device-scale': scale * devicePixelRatio } as CSSProperties}>
        <img className="scene-background" src={background.src} alt="" aria-hidden="true" style={{ left: background.left, top: background.top, width: background.width, height: background.height }} />
        <FloralDashboard motion={dial.values} />
      </div>
    </main>
    <DialRoot position="top-right" theme="dark" />
    <DialTimeline theme="dark" defaultOpen />
  </>;
}
createRoot(document.getElementById('root')!).render(view === 'dashboard' ? <DashboardPreview /> : <Preview />);
