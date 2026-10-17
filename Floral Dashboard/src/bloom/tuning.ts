import { DialStore } from 'dialkit';
import saved from './bloom.tuning.json';

/*
 * Saved tuning: the Bloom panel's values and the timeline's timings, transitions and values, written to
 * bloom.tuning.json by the panel's "Save to file" action (through the dev server's /__save-tuning). They load as
 * the defaults, so the tuning is part of the code once saved; what DialKit keeps in the browser still wins until
 * "Reset to file".
 */
export const PANEL_ID = 'bloom-panel';
export const TIMELINE_ID = 'bloom-timeline';
export const AGENT_ID = 'agent-panel';
export const AGENT_TIMELINE_ID = 'agent-timeline';
const SAVED = { panel: PANEL_ID, timeline: TIMELINE_ID, agent: AGENT_ID, agentTimeline: AGENT_TIMELINE_ID } as const;

type Flat = Record<string, unknown>;
const sections = (file: { panel?: Flat; timeline?: Flat; agent?: Flat; agentTimeline?: Flat }) => ({ panel: { ...(file.panel ?? {}) }, timeline: { ...(file.timeline ?? {}) }, agent: { ...(file.agent ?? {}) }, agentTimeline: { ...(file.agentTimeline ?? {}) } });
let current = { savedAt: saved.savedAt as string | null, ...sections(saved as never) };
const APPLIED = 'bloom-tuning-applied';
// A save rewrites the file: take the new one in place, without reloading the page. The browser's values already
// are the file's, so that save counts as applied.
import.meta.hot?.accept('./bloom.tuning.json', next => {
  if (!next?.default) return;
  current = { savedAt: next.default.savedAt, ...sections(next.default) };
  try { if (current.savedAt) localStorage.setItem(APPLIED, current.savedAt); } catch { /* no storage */ }
});

const isMap = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isAction = (v: unknown) => isMap(v) && v.type === 'action';

/** Writes saved values into a DialKit config as its defaults: a slider's first entry, a clip's `at`, a track's
 * `from`, a step's leg. Paths are DialKit's flat ones: `bloom.outerPetals.fold.step1.to` names the clip
 * `outerPetals` in group `bloom`, its `fold` track (under `props`) and that track's first step. */
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
export const withSavedAgent = <T>(config: T) => apply(config, current.agent);
export const withSavedAgentTimeline = <T>(config: T) => apply(config, current.agentTimeline);

const strip = (values: Flat) => Object.fromEntries(Object.entries(values).filter(([k, v]) => !k.endsWith('.__mode') && !isAction(v)));

/** "Save to file": the Bloom panel's values, the timeline's and the Agent panel's, to src/bloom/bloom.tuning.json.
 * A view saves what it has registered; the other sections keep the file's values. */
export async function saveToFile() {
  const section = (key: keyof typeof SAVED) => DialStore.getPanel(SAVED[key]) ? strip(DialStore.getValues(SAVED[key])) : current[key];
  const body = { panel: section('panel'), timeline: section('timeline'), agent: section('agent'), agentTimeline: section('agentTimeline') };
  const res = await fetch('/__save-tuning', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
  current = { ...current, ...body }; // the file's new savedAt arrives through the hot update above
}

/** "Reset to file": back to the saved tuning (the code's own values where nothing is saved). */
export function resetToFile() {
  for (const key of Object.keys(SAVED) as (keyof typeof SAVED)[]) {
    if (!DialStore.getPanel(SAVED[key])) continue;
    DialStore.resetValues(SAVED[key]);
    if (Object.keys(current[key]).length) DialStore.updateValues(SAVED[key], current[key] as never);
  }
  try { if (current.savedAt) localStorage.setItem(APPLIED, current.savedAt); } catch { /* no storage */ }
}

/** A file this browser has not seen yet (saved elsewhere, or edited by hand) applies itself once, over the
 * values the browser kept from before it. Call once both the panel and the timeline are registered. */
export function applyFileIfNew() {
  try { if (!current.savedAt || localStorage.getItem(APPLIED) === current.savedAt) return false; } catch { return false; }
  resetToFile();
  return true;
}
