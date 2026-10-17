import { DialStore } from 'dialkit';
import saved from './dot-bird.tuning.json';

/*
 * Saved tuning: the Dot Bird panel's values and its timeline's timings, transitions and values, the Dot Sequence
 * panel's and timeline's, and the Sky and Tracking panels', written to dot-bird.tuning.json by a panel's "Save to file" action (through the
 * dev server's /__save-tuning). They load as the defaults, so the tuning is part of the code once saved; what
 * DialKit keeps in the browser still wins.
 */
export const PANEL_ID = 'dot-bird';
export const TIMELINE_ID = 'dot-bird-timeline';
export const SEQUENCE_ID = 'dot-sequence';
export const SEQUENCE_TIMELINE_ID = 'dot-sequence-timeline';
export const SKY_ID = 'dot-sky';
export const TRACKING_ID = 'dot-tracking';
const SAVED = { panel: PANEL_ID, timeline: TIMELINE_ID, sequence: SEQUENCE_ID, sequenceTimeline: SEQUENCE_TIMELINE_ID, sky: SKY_ID, tracking: TRACKING_ID } as const;
type Section = keyof typeof SAVED;
type Flat = Record<string, unknown>;
const SECTIONS = Object.keys(SAVED) as Section[];
const sections = (file: Partial<Record<Section, Flat>>) => Object.fromEntries(SECTIONS.map(k => [k, { ...(file[k] ?? {}) }])) as Record<Section, Flat>;
let current = sections(saved as never);
// A save rewrites the file: take the new one in place, without reloading the page.
import.meta.hot?.accept('./dot-bird.tuning.json', next => { if (next?.default) current = sections(next.default); });

const isMap = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isAction = (v: unknown) => isMap(v) && v.type === 'action';

/** Writes saved values into a DialKit config as its defaults: a slider's first entry, a colour, a clip's `at`, a
 * track's `from`, a step's leg. Paths are DialKit's flat ones: `glide.step1.to.spread` names the clip `glide`,
 * its first step and that step's `spread`; `toManta.dissolveOut.duration` a clip in a group. */
function apply<T>(config: T, values: Flat): T {
  const out = structuredClone(config) as Record<string, unknown>;
  for (const [path, value] of Object.entries(values)) {
    if (path.endsWith('.__mode')) continue;
    const segs = path.split('.');
    let node: unknown = out;
    for (const seg of segs.slice(0, -1)) {
      const step = /^step(\d+)$/.exec(seg);
      if (!isMap(node)) break;
      if (step && Array.isArray(node.steps)) node = node.steps[Number(step[1]) - 1];
      else if (seg in node) node = node[seg];
      else if (isMap(node.props) && seg in node.props) node = node.props[seg];
      else { node = undefined; break; }
    }
    if (!isMap(node)) continue;
    const key = segs[segs.length - 1], have = node[key];
    if (Array.isArray(have) && typeof value === 'number') have[0] = value;
    else if (!isAction(have)) node[key] = value;
  }
  return out as T;
}
export const withSavedPanel = <T>(config: T) => apply(config, current.panel);
export const withSavedTimeline = <T>(config: T) => apply(config, current.timeline);
export const withSavedSequence = <T>(config: T) => apply(config, current.sequence);
export const withSavedSequenceTimeline = <T>(config: T) => apply(config, current.sequenceTimeline);
export const withSavedSky = <T>(config: T) => apply(config, current.sky);
export const withSavedTracking = <T>(config: T) => apply(config, current.tracking);

/** Bump when the code's clip timings must replace what browsers kept from before; the browser's copy of a timeline
 * wins over the code's defaults otherwise, so a retimed story would never reach a browser that had loaded the old one. */
export const DEFAULTS_VERSION = '2026-10-17b';
const VERSION_KEY = 'dot-bird-defaults';

/** Before a timeline registers: its stored copy is dropped when it is from an older defaults version or lacks a
 * clip the code has (a story that grew while the browser kept the old one), so DialKit loads the code's clips, with
 * the saved file over them as their defaults. Called at module load, since DialKit reads the store when the hook
 * registers; a reset after that leaves the running timeline's clips where they were until a reload. Panels are
 * never touched. `clips` are the code's clip paths, like `butterfly.at`. */
export function healStoredTimeline(id: string, clips: string[]) {
  try {
    const stale = localStorage.getItem(VERSION_KEY) !== DEFAULTS_VERSION, key = `dialkit:${id}`;
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null') as { values?: Flat } | null;
    const missing = !!stored?.values && clips.some(path => !(path in stored.values!));
    if (stored && (stale || missing)) localStorage.removeItem(key);
    return stale || missing;
  } catch { return false; }
}

/** After every timeline has had its chance to heal (both register on their pages): the version marker, for the next bump. */
export function markDefaults() { try { localStorage.setItem(VERSION_KEY, DEFAULTS_VERSION); } catch { /* no storage */ } }

const strip = (values: Flat) => Object.fromEntries(Object.entries(values).filter(([k, v]) => !k.endsWith('.__mode') && !isAction(v)));

/** "Save to file": every registered panel's and timeline's values to src/bird/dot-bird.tuning.json; the sections of
 * what is not registered in this view keep the file's values. */
export async function saveToFile() {
  const body = Object.fromEntries(SECTIONS.map(k => [k, DialStore.getPanel(SAVED[k]) ? strip(DialStore.getValues(SAVED[k])) : current[k]])) as Record<Section, Flat>;
  const res = await fetch('/__save-tuning', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
  current = body;
}
