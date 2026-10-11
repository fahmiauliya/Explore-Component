import { DialStore } from 'dialkit';
import saved from '../settings.json';
import { STORAGE } from './config';

/*
 * Saved settings: the DialKit panel and timeline values written to settings.json by the save button (the clipboard
 * icon in the panel and in the dock). They become the defaults: they load before config.ts's own values, survive a
 * cleared browser, and Reset All returns to them. What DialKit keeps in the browser still wins until then.
 */
type Flat = Record<string, unknown>;
let current = { panel: { ...(saved.panel as Flat) }, timeline: { ...(saved.timeline as Flat) } };
// a save rewrites settings.json: take the new file in place, without reloading the page
import.meta.hot?.accept('../settings.json', (next) => {
  if (next?.default) current = { panel: { ...next.default.panel }, timeline: { ...next.default.timeline } };
});

/** Paths never saved: the card on screen is where you are, not a setting. */
const SKIP = new Set(['Playback.card', 'Playback.exportMp4', 'Playback.resetAll']);

const isMap = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Writes saved values into a DialKit config, as its defaults: a slider's first entry, a select's default, a step's leg. */
function apply<T>(config: T, values: Flat): T {
  const out = structuredClone(config) as Record<string, unknown>;
  for (const [path, value] of Object.entries(values)) {
    if (path.endsWith('.__mode') || SKIP.has(path)) continue;
    const segs = path.split('.');
    let node: unknown = out;
    for (const seg of segs.slice(0, -1)) {
      const step = /^step(\d+)$/.exec(seg);
      node = step && isMap(node) && Array.isArray(node.steps) ? node.steps[Number(step[1]) - 1] : isMap(node) ? node[seg] : undefined;
      if (!isMap(node)) break;
    }
    if (!isMap(node)) continue;
    const key = segs[segs.length - 1], have = node[key];
    if (Array.isArray(have) && typeof value === 'number') have[0] = value;
    else if (isMap(have) && have.type === 'select' && typeof value === 'string') have.default = value;
    else if (have !== undefined && !(isMap(have) && have.type === 'action')) node[key] = value;
  }
  return out as T;
}
export const withSavedPanel = <T>(config: T) => apply(config, current.panel);
export const withSavedTimeline = <T>(config: T) => apply(config, current.timeline);

/** Panel values saved in the browser under an earlier panel id carry over, minus those whose defaults changed. */
export function carryOver() {
  try {
    const key = (id: string) => `dialkit:${id}`;
    if (localStorage.getItem(key(STORAGE.panelId))) return;
    for (const id of STORAGE.previousPanelIds) {
      const raw = localStorage.getItem(key(id));
      if (!raw) continue;
      const state = JSON.parse(raw);
      for (const path of STORAGE.changedDefaults) delete state.values?.[path];
      localStorage.setItem(key(STORAGE.panelId), JSON.stringify(state));
      return;
    }
  } catch { /* no storage: nothing to carry */ }
}

const strip = (values: Flat) => Object.fromEntries(Object.entries(values).filter(([k, v]) => !k.endsWith('.__mode') && !SKIP.has(k) && !(isMap(v) && v.type === 'action')));

/** Saves both: the panel's values and the timeline's, to settings.json. */
export async function saveBoth() {
  const body = { panel: strip(DialStore.getValues(STORAGE.panelId)), timeline: strip(DialStore.getValues(STORAGE.timelineId)) };
  const res = await fetch('/__save-settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
  current = body;
}

/** Reset All: back to the saved settings (config.ts's values where nothing is saved). */
export function resetToSaved() {
  DialStore.resetValues(STORAGE.panelId);
  DialStore.resetValues(STORAGE.timelineId);
  const panel = Object.fromEntries(Object.entries(current.panel).filter(([k]) => !SKIP.has(k)));
  if (Object.keys(panel).length) DialStore.updateValues(STORAGE.panelId, panel as never);
  if (Object.keys(current.timeline).length) DialStore.updateValues(STORAGE.timelineId, current.timeline as never);
}

/** DialKit's clipboard buttons, in the panel and the dock, become one save of both. */
export function saveButtons(onDone: (message: string) => void) {
  const label = 'Save panel and timeline settings';
  const mark = () => document.querySelectorAll<HTMLButtonElement>('.dialkit-root button[title="Copy parameters"]').forEach((b) => { b.title = label; b.setAttribute('aria-label', label); b.dataset.save = ''; });
  const click = (e: MouseEvent) => {
    const button = (e.target as Element | null)?.closest?.('.dialkit-root button[data-save]');
    if (!button) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    saveBoth()
      .then(() => onDone(`Saved panel and timeline settings · ${new Date().toLocaleTimeString()}`))
      .catch((err) => onDone(`Save failed: ${err instanceof Error ? err.message : String(err)}`));
  };
  // DialKit sets the title back as it re-renders, so the buttons are marked again whenever the tree changes
  const tree = new MutationObserver(mark);
  tree.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['title', 'aria-label'] });
  addEventListener('click', click, true);
  mark();
  return () => { tree.disconnect(); removeEventListener('click', click, true); };
}
