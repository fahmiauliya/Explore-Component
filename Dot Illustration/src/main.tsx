import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DialRoot, DialTimeline, useDialKitController } from 'dialkit';
import 'dialkit/styles.css';
import { DotBird } from './DotBird';
import { DotSequence } from './DotSequence';
import { SKY_ID, SKY_PANEL, TABS, type Tab } from './sky/dial';
import { useOpacityVariant } from './sky/variant';
import { TRACKING_ID, TRACKING_PANEL } from './tracking/dial';
import { markDefaults, saveToFile } from './bird/tuning';
import { note } from './dot/stepper';
import './styles.css';

/* The preview: a 1200 × 800 (6:4) frame scaled to the viewport, holding the animal sequence, or with
 * `?view=bird` the bird alone; the DialKit panels and the timeline dock render in development only, and the
 * frame keeps clear of them. */
export const FRAME = { width: 1200, height: 800 };
const view = new URLSearchParams(location.search).get('view') === 'bird' ? 'bird' : 'sequence';
markDefaults();                                   // both timelines' configs have loaded and healed their stores by now

/** The Sky and Tracking panels' "Save to file": every registered panel's and timeline's values into the tuning file. */
const onAction = (path: string) => { if (path.endsWith('saveToFile')) saveToFile().then(() => note('Save to file', 'Saved')).catch(error => note('Save to file', `Save failed: ${error instanceof Error ? error.message : error}`)); };

/** The frame scaled to the preview's width. */
function useArtboardScale(ref: React.RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / FRAME.width));
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, [ref]);
  return scale;
}

/** The frame keeps clear of the DialKit panel and the timeline dock, followed as they open, close and move. */
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

function Preview() {
  const ref = useRef<HTMLElement>(null);
  const scale = useArtboardScale(ref);
  useDialKitClearance();
  // The Sky panel holds the tab too, so the choice persists with the rest; the tabs above the frame set it.
  const sky = useDialKitController('Sky', SKY_PANEL, { id: SKY_ID, persist: true, onAction });
  useOpacityVariant(sky);
  const tracking = useDialKitController('Tracking', TRACKING_PANEL, { id: TRACKING_ID, persist: true, onAction });
  const tab = sky.values.View.tab as Tab;
  return <>
    <div className="stage">
      <div className="tabs" role="tablist" aria-label="Version">
        {TABS.map(name => <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => sky.setValues({ View: { tab: name } })}>{name}</button>)}
      </div>
      <main ref={ref} className="preview" aria-label={view === 'sequence' ? 'Dot Illustration sequence preview' : 'Dot Illustration preview'}>
        <div className="artboard" style={{ transform: `scale(${scale})` }}>{view === 'sequence' ? <DotSequence sky={sky.values} tab={tab} tracking={tracking.values} /> : <DotBird sky={sky.values} tab={tab} tracking={tracking.values} />}</div>
      </main>
    </div>
    <DialRoot position="top-right" theme="dark" />
    <DialTimeline theme="dark" defaultOpen defaultVisible />
  </>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
