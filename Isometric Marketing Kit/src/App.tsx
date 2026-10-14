import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { CATEGORIES, boxOf, categoryOf, dataOf, find, isLoaded, loadCategory, type Category, type CustomProp, type Entry } from './figures';
import { REPLACED } from './fintech';
import { Illustration, figureOf } from './Illustration';
import { pointAt, valueAt } from './hairline';
import { customOf } from './download/scene';
import { componentSource } from './download/component';
import { FORMAT_INFO } from './download/info';
import type { Theme } from './tokens';
import { RequestModal } from './RequestModal';
import { DEFAULT_LOGO, logoFromFile } from './logo';
import { setMeta } from './meta';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const pathOf = () => location.pathname.slice(BASE.length).replace(/^\/+|\/+$/g, '');
const TAGLINE = 'Interactive components for product teams. Starting with line illustrations.';
const LICENSE = 'Free for personal and commercial use.';
/** The footer's "Made by Fahmi" link: empty shows plain text until there is one. */
const MADE_BY_URL = '';
/** Compo's sections, in the header nav. Illustrations is the first; more are added here as plain items. */
const SECTIONS = [{ key: 'illustrations', label: 'Illustrations' }] as const;
const ILLUSTRATIONS = SECTIONS[0].key;
/** The old request page: it moved to the bottom of the gallery, so its address leads there. */
const REQUEST = 'request';
/** Where things live: /illustrations/<category> and /illustrations/<category>/<slug>. */
const galleryAt = (c: Category) => `${ILLUSTRATIONS}/${c}`;
const pageOf = (e: Entry) => `${ILLUSTRATIONS}/${e.category}/${e.slug}`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Whether a tab's figure files are in; starts loading them if not, and re-renders once they arrive. */
function useCategory(key: Category) {
  const [, arrived] = useState(0);
  useEffect(() => { if (!isLoaded(key)) loadCategory(key).then(() => arrived((n) => n + 1), () => {}); }, [key]);
  return isLoaded(key);
}

function useRoute() {
  const [path, setPath] = useState(pathOf);
  useEffect(() => {
    const sync = () => setPath(pathOf());
    addEventListener('popstate', sync);
    return () => removeEventListener('popstate', sync);
  }, []);
  // `keep` leaves the scroll where it is (switching tabs); `replace` rewrites the address instead of adding to history
  const go = useCallback((to: string, { keep = false, replace = false } = {}) => {
    history[replace ? 'replaceState' : 'pushState'](null, '', `${BASE}/${to}`);
    setPath(pathOf()); // from the address, so a query (?kind=change…) never reaches the route
    if (!keep) scrollTo(0, 0);
  }, []);
  return [path, go] as const;
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('imk-theme', theme); } catch { /* the choice just isn't remembered */ }
  }, [theme]);
  return [theme, setTheme] as const;
}

type Go = (to: string, options?: { keep?: boolean; replace?: boolean }) => void;
const plain = (e: MouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

/** A link that moves inside the site without a reload, and still opens a new tab on a modified click. */
function Link({ to, go, className, children, label, current }: { to: string; go: Go; className?: string; children: ReactNode; label?: string; current?: boolean }) {
  const click = (e: MouseEvent) => { if (!plain(e)) return; e.preventDefault(); go(to); };
  return <a href={`${BASE}/${to}`} className={className} onClick={click} aria-label={label} aria-current={current ? 'page' : undefined}>{children}</a>;
}

type Route =
  | { kind: 'gallery'; category: Category }
  | { kind: 'detail'; entry: Entry }
  | { kind: 'missing' };

/**
 * What an address shows, and where it moved to if it is an old one:
 * /illustrations[/<category>] is the gallery, /illustrations/<category>/<slug> a detail page. / and the older
 * addresses (/<category>, /<category>/<slug>, and the first site's /<slug>) are rewritten to these.
 */
function resolve(path: string): { route: Route; to?: string } {
  const [first, ...rest] = path ? path.split('/') : [];
  if (first === ILLUSTRATIONS) {
    const [cat, slug, ...extra] = rest;
    if (extra.length) return { route: { kind: 'missing' } };
    if (!cat) return { route: { kind: 'gallery', category: CATEGORIES[0].key } };
    if (!categoryOf(cat)) return { route: { kind: 'missing' } };
    if (!slug) return { route: { kind: 'gallery', category: cat as Category } };
    const entry = find(cat, slug);
    if (!entry && cat === 'fintech' && REPLACED[slug]) return { ...resolve(`${ILLUSTRATIONS}/${cat}/${REPLACED[slug]}`), to: `${ILLUSTRATIONS}/${cat}/${REPLACED[slug]}` };
    return { route: entry ? { kind: 'detail', entry } : { kind: 'missing' } };
  }
  const moved = (to: string) => ({ ...resolve(to), to });
  if (!first || (first === REQUEST && !rest.length)) return moved(ILLUSTRATIONS);
  if (categoryOf(first) && rest.length <= 1) return moved([ILLUSTRATIONS, first, ...rest].join('/'));
  const old = !rest.length && find(CATEGORIES[0].key, first);
  return old ? moved(pageOf(old)) : { route: { kind: 'missing' } };
}

export function App() {
  const [path, go] = useRoute();
  const [theme, setTheme] = useTheme();
  // the request modal: opened from the header on any page; on an illustration's page it's "About" that one
  const [requesting, setRequesting] = useState(false);
  const requestButton = useRef<HTMLButtonElement>(null);
  const closeRequest = useCallback(() => { setRequesting(false); requestAnimationFrame(() => requestButton.current?.focus()); }, []);
  const { route, to } = resolve(path);
  // an old address shows its new page at once, and the address is rewritten in place
  useEffect(() => { if (to) go(to, { replace: true, keep: true }); }, [to, go]);
  const entry = route.kind === 'detail' ? route.entry : undefined;
  // the tab title, description and share image follow the page (the built pages carry the same in their HTML)
  useEffect(() => { setMeta(route.kind === 'detail' ? { entry: route.entry } : route.kind === 'gallery' ? { category: route.category } : { missing: true }); }, [route.kind, entry, route.kind === 'gallery' ? route.category : '']);

  return (
    <>
      <div className="page" inert={requesting}>
      <header className="bar">
        <div className="row">
          <Link to={ILLUSTRATIONS} go={go} className="brand">Compo</Link>
          <nav className="sections mono" aria-label="Sections">
            {SECTIONS.map((s) => <Link key={s.key} to={s.key} go={go} className="tab" current={route.kind !== 'missing'}>{s.label}</Link>)}
          </nav>
          <button ref={requestButton} type="button" className="request-button mono" aria-haspopup="dialog" onClick={() => setRequesting(true)}>Request</button>
          <div className="toggle" role="group" aria-label="Theme">
            {(['dark', 'light'] as const).map((t) => (
              <button key={t} type="button" className="mono" aria-pressed={theme === t} onClick={() => setTheme(t)}>{t}</button>
            ))}
          </div>
        </div>
      </header>
      {entry ? <Detail key={pageOf(entry)} entry={entry} go={go} theme={theme} />
        : route.kind === 'gallery' ? <Gallery category={route.category} go={go} /> : <Missing go={go} />}
      <footer className="foot">
        <div className="row mono muted">
          Compo · {new Date().getFullYear()} · {MADE_BY_URL ? <a href={MADE_BY_URL} target="_blank" rel="noopener">Made by Fahmi</a> : 'Made by Fahmi'}
        </div>
      </footer>
      </div>
      <RequestModal open={requesting} onClose={closeRequest} about={entry ? { name: entry.name, path: `/${pageOf(entry)}` } : null} />
    </>
  );
}

/** The gallery: a tab per category above the grid; switching fades the grid out and the other in, with no reload. */
function Gallery({ category, go }: { category: Category; go: Go }) {
  const [shown, setShown] = useState(category);
  const [fading, setFading] = useState(false);
  const ready = useCategory(shown);
  useEffect(() => {
    if (category === shown) return;
    // the new tab's figures load while the grid fades out (they are usually in already: the tabs prefetch them)
    let live = true;
    const swap = () => { if (live) { setShown(category); setFading(false); } };
    const loaded = loadCategory(category).catch(() => {});
    if (reducedMotion()) loaded.then(swap);
    else { setFading(true); Promise.all([loaded, new Promise((r) => setTimeout(r, 100))]).then(swap); }
    return () => { live = false; };
  }, [category, shown]);
  const entries = categoryOf(shown)!.entries;
  const prefetch = () => CATEGORIES.forEach((c) => { loadCategory(c.key).catch(() => {}); });
  return (
    <main>
      <section className="row intro">
        <h1>Compo</h1>
        <p className="muted">{TAGLINE}</p>
        <p className="license muted">{LICENSE}</p>
      </section>
      <div className="row">
        <nav className="tabs mono" aria-label="Categories" onPointerEnter={prefetch} onFocus={prefetch}>
          {CATEGORIES.map((c) => (
            <Link key={c.key} to={galleryAt(c.key)} go={(to) => go(to, { keep: true })} className="tab" current={c.key === category}>
              {c.label} <span className="muted">{c.entries.length}</span>
            </Link>
          ))}
        </nav>
        <ul className="grid" data-fading={fading || undefined}>
          {entries.map((e) => <Cell key={pageOf(e)} entry={e} go={go} ready={ready} />)}
        </ul>
      </div>
    </main>
  );
}

/** One gallery cell: the whole cell links to the detail page; a touch on the drawing is a hover, not a click. */
function Cell({ entry, go, ready }: { entry: Entry; go: Go; ready: boolean }) {
  const touchedArt = useRef(false);
  const click = (e: MouseEvent) => {
    if (touchedArt.current) { e.preventDefault(); return; }
    if (!plain(e)) return;
    e.preventDefault();
    go(pageOf(entry));
  };
  return (
    <li>
      <a
        className="cell"
        href={`${BASE}/${pageOf(entry)}`}
        aria-label={`${entry.n} ${entry.name}, ${entry.topic}`}
        onPointerDown={(e) => { touchedArt.current = e.pointerType !== 'mouse' && !!(e.target as Element).closest('.stage'); }}
        onClick={click}
      >
        {ready && <Illustration entry={entry} value={valueAt(figureOf(entry).range, 0.5)} aspect={5 / 4} lazy />}
        <span className="corner tl mono muted">{entry.n} · {entry.topic}</span>
        <span className="corner bl name">{entry.name}</span>
      </a>
      <span className="corner br open mono" aria-hidden="true">Open →</span>
    </li>
  );
}

function Detail({ entry, go, theme }: { entry: Entry; go: Go; theme: Theme }) {
  const ready = useCategory(entry.category);
  const figure = ready ? figureOf(entry) : null;
  const value = figure ? valueAt(figure.range, 0.5) : 0;
  // the Customize block's values (the box's letter): the illustration, every download and the snippet use them
  const [custom, setCustom] = useState<Record<string, string>>(() => Object.fromEntries((entry.props ?? []).map((p) => [p.name, p.fallback])));
  const attrs = dataOf(entry.props, custom);
  useEffect(() => { customOf.set(entry.slug, dataOf(entry.props, custom)); }, [entry.slug, custom]);
  useEffect(() => () => { customOf.delete(entry.slug); }, [entry.slug]);
  const list = categoryOf(entry.category)!.entries, i = list.indexOf(entry), prev = list[(i + list.length - 1) % list.length], next = list[(i + 1) % list.length];
  const at = pageOf;

  // the left and right arrow keys step through the illustrations, unless a text field has them
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      // a control that uses the arrows itself (a field, the stepper, a segmented control) keeps them
      if (e.defaultPrevented || (e.target as HTMLElement).closest('input, textarea, select, [contenteditable], [role="spinbutton"], [role="radiogroup"]')) return;
      if (e.key === 'ArrowLeft') go(at(prev));
      if (e.key === 'ArrowRight') go(at(next));
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [go, prev, next]);

  return (
    <main className="row detail">
      <nav className="navrow mono" aria-label="Illustrations">
        <Link to={galleryAt(entry.category)} go={go} className="muted">← All illustrations</Link>
        <div className="steps">
          <Link to={at(prev)} go={go} className="muted" label={`Previous: ${prev.name}`}>← Prev</Link>
          <span>{entry.n} / {String(list.length).padStart(2, '0')}</span>
          <Link to={at(next)} go={go} className="muted" label={`Next: ${next.name}`}>Next →</Link>
        </div>
      </nav>
      <div className="split">
        <div className="view">
          {figure && <Illustration entry={entry} value={value} aspect="box" keyboard data={attrs} box={boxOf(entry, attrs)} />}
        </div>
        <aside className="side">
          <p className="mono muted">{entry.n} · {entry.topic}</p>
          <h1>{entry.name}</h1>
          <p className="means">{figure ? figure.means : '\u00a0'}</p>
          {figure && entry.props?.length ? <Customize entry={entry} values={custom} onChange={setCustom} /> : null}
          {figure && <Downloads entry={entry} value={value} theme={theme} custom={custom} />}
          <UseIt entry={entry} theme={theme} custom={custom} />
        </aside>
      </div>
    </main>
  );
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

type Job = (onProgress: (fraction: number) => void) => Promise<{ blob: Blob; name: string } | null>;
type Row = { key: string; format: string; hint: string; job: Job };

/** The downloads: React first, the other formats folded under "More formats". One renders at a time; its row shows the progress. */
function Downloads({ entry, value, theme, custom }: { entry: Entry; value: number; theme: Theme; custom: Record<string, string> }) {
  const [busy, setBusy] = useState<{ key: string; pct: number } | null>(null);
  const [error, setError] = useState('');
  const { gif, alpha, png } = FORMAT_INFO, states = entry.repeat ? entry.repeat.length : entry.targets.length;
  // the encoders load on the first download, not with the page
  const formats = () => import('./download/formats'), video = () => import('./download/video'), svg = () => import('./download/svg');
  const svgZip: Row = { key: 'svg', format: 'SVG (.zip)', hint: `Default + ${plural(states, 'hover state')}`,
    job: async (p) => ({ blob: await (await svg()).renderSvgStates(entry, theme, value, p), name: `${entry.slug}-svg-${theme}.zip` }) };
  const react: Row = { key: 'jsx', format: 'Download React (.jsx)', hint: '',
    job: async () => ({ blob: new Blob([componentSource(entry, figureOf(entry), value, custom)], { type: 'text/javascript' }), name: `${entry.component}.jsx` }) };
  const more: Row[] = [
    svgZip,
    { key: 'png', format: 'PNG', hint: `${png.side} px, for slides`, job: async () => (await formats()).renderPng(entry, theme, value) },
    { key: 'mp4', format: 'MP4', hint: '1080 × 1080, 60 fps',
      job: async (p) => ({ blob: await (await video()).renderVideo(entry, theme, value, p), name: `${entry.slug}-${theme}-1080x1080-60fps.mp4` }) },
    { key: 'gif', format: 'GIF', hint: `${gif.size} px loop, Notion and email`,
      job: async (p) => ({ blob: await (await formats()).renderGif(entry, theme, value, p), name: `${entry.slug}-${theme}-${gif.size}x${gif.size}-${gif.fps}fps.gif` }) },
    { key: 'webm', format: 'WebM', hint: 'Transparent, for the web',
      job: async (p) => ({ blob: await (await formats()).renderTransparentWebm(entry, theme, value, p), name: `${entry.slug}-${theme}-transparent-${alpha.size}x${alpha.size}-${alpha.webmFps}fps.webm` }) },
    { key: 'seq', format: 'PNG sequence (.zip)', hint: 'Transparent, for video editors',
      job: async (p) => ({ blob: await (await formats()).renderPngSequence(entry, theme, value, p), name: `${entry.slug}-${theme}-transparent-${alpha.size}-${alpha.sequenceFps}fps-png.zip` }) },
  ];
  async function run(row: Row): Promise<void> {
    setError('');
    setBusy({ key: row.key, pct: 0 });
    try {
      const out = await row.job((f) => setBusy({ key: row.key, pct: Math.floor(f * 100) }));
      if (out) save(out.blob, out.name);
    } catch (e) {
      setError(`The ${row.format} could not be made: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="downloads">
      <button type="button" className="button primary block" onClick={() => run(react)} disabled={busy !== null}>{react.format}</button>
      <details className="formats">
        <summary className="mono">More formats</summary>
        <div className="dl-group">
          {more.map((row) => (
            <button key={row.key} type="button" className="button dl" onClick={() => run(row)} disabled={busy !== null} aria-live="polite">
              <span className="mono">{row.format}</span>
              <span className="dl-hint">{busy?.key === row.key ? `Rendering… ${busy.pct}%` : row.hint}</span>
            </button>
          ))}
          <p className="note muted">These use the current theme.</p>
        </div>
      </details>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

/**
 * "Customize": the figure's own settings (the box's letter, the receipt's name and total). Each field keeps to its
 * prop's length and characters; empty falls back to the default. Each change updates the illustration at once and
 * opens it for a moment (customHold), so the change is seen.
 */
function Customize({ entry, values, onChange }: { entry: Entry; values: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const [typed, setTyped] = useState<Record<string, string>>(values);
  const [logoError, setLogoError] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = () => {
    const stage = document.querySelector<HTMLElement>('.view [data-hairline]');
    if (!stage) return;
    clearTimeout(timer.current);
    pointAt(stage, 'pointermove', entry.targets[0].at);
    // let go once the change has been seen, unless the real pointer is on the drawing by then
    timer.current = window.setTimeout(() => { if (!stage.matches(':hover')) pointAt(stage, 'pointerleave'); }, entry.customHold ?? 2000);
  };
  const clean = (p: CustomProp, raw: string) => {
    const allowed = new RegExp(p.allow);
    const chars = Array.from(p.upper ? raw.toUpperCase() : raw).filter((c) => allowed.test(c));
    return (p.max === 1 ? chars.slice(-1) : chars.slice(0, p.max)).join('');
  };
  return (
    <section className="customize" aria-labelledby="customize-title">
      <h2 id="customize-title" className="mono muted">Customize</h2>
      {(entry.props ?? []).map((p) => {
        const v = typed[p.name] ?? '', square = p.max === 1, id = `custom-${p.name}`;
        // a field for one choice only shows while that choice is made (the stamp's Text under TEXT)
        if (p.when && (values[p.when.prop] || entry.props!.find((q) => q.name === p.when!.prop)?.fallback) !== p.when.is) return null;
        if (p.kind === 'jars') {
          return <JarsField key={p.name} p={p} value={values[p.name] || p.fallback} onCommit={(v) => { onChange({ ...values, [p.name]: v }); requestAnimationFrame(show); }} />;
        }
        if (p.kind === 'segment') {
          const opts = p.options ?? [], cur = opts.includes(values[p.name]) ? values[p.name] : p.fallback;
          const pick = (o: string) => { if (o === cur) return; setTyped((t) => ({ ...t, [p.name]: o })); onChange({ ...values, [p.name]: o }); requestAnimationFrame(show); };
          return (
            <div key={p.name} className="custom-field segment-row">
              <span id={`${id}-label`}>{p.label}</span>
              <div className="segment" role="radiogroup" aria-labelledby={`${id}-label`}
                onKeyDown={(e) => {
                  const by = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                  if (!by) return;
                  e.preventDefault();
                  const next = opts[(opts.indexOf(cur) + by + opts.length) % opts.length], group = e.currentTarget;
                  pick(next);
                  requestAnimationFrame(() => group.querySelector<HTMLElement>(`[data-option="${next}"]`)?.focus());
                }}>
                {opts.map((o) => (
                  <button key={o} type="button" role="radio" aria-checked={o === cur} tabIndex={o === cur ? 0 : -1} data-option={o} className="mono" onClick={() => pick(o)}>{o}</button>
                ))}
              </div>
            </div>
          );
        }
        if (p.kind === 'stepper') {
          const [lo, hi] = p.range ?? [0, 99], n = Math.min(hi, Math.max(lo, Number(typed[p.name] ?? p.fallback) || Number(p.fallback)));
          const step = (to: number) => {
            const next = String(Math.min(hi, Math.max(lo, to)));
            if (next === String(n)) return;
            setTyped((t) => ({ ...t, [p.name]: next }));
            onChange({ ...values, [p.name]: next });
            requestAnimationFrame(show);
          };
          return (
            <div key={p.name} className="custom-field stepper-row">
              <span id={`${id}-label`}>{p.label}</span>
              <div className="stepper" role="group" aria-labelledby={`${id}-label`}>
                <button type="button" aria-label={`Fewer ${p.label.toLowerCase()}`} disabled={n <= lo} onClick={() => step(n - 1)}>–</button>
                <span role="spinbutton" tabIndex={0} className="stepper-value" aria-labelledby={`${id}-label`} aria-valuemin={lo} aria-valuemax={hi} aria-valuenow={n}
                  onKeyDown={(e) => {
                    const by: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 3, PageDown: -3 };
                    if (e.key in by) { e.preventDefault(); step(n + by[e.key]); }
                    else if (e.key === 'Home') { e.preventDefault(); step(lo); }
                    else if (e.key === 'End') { e.preventDefault(); step(hi); }
                  }}>{n}</span>
                <button type="button" aria-label={`More ${p.label.toLowerCase()}`} disabled={n >= hi} onClick={() => step(n + 1)}>+</button>
              </div>
            </div>
          );
        }
        if (p.kind === 'toggle') {
          const on = (typed[p.name] ?? p.fallback) !== 'false';
          return (
            <div key={p.name} className="custom-field switch-row">
              <span id={`${id}-label`}>{p.label}</span>
              <button type="button" role="switch" aria-checked={on} aria-labelledby={`${id}-label`} className="switch"
                onClick={() => {
                  const next = on ? 'false' : 'true';
                  setTyped((t) => ({ ...t, [p.name]: next }));
                  onChange({ ...values, [p.name]: next });
                  requestAnimationFrame(show);
                }}>
                <span className="knob" aria-hidden="true" />
              </button>
            </div>
          );
        }
        if (p.kind === 'svg') {
          const set = (d: string) => { setTyped((t) => ({ ...t, [p.name]: d })); onChange({ ...values, [p.name]: d }); requestAnimationFrame(show); };
          return (
            <div key={p.name} className="custom-field logo">
              <span className="logo-label">{p.label}</span>
              <div className="logo-row">
                <span className="logo-preview" aria-hidden="true"><svg viewBox="-0.08 -0.08 1.16 1.16"><path d={v || DEFAULT_LOGO} /></svg></span>
                <label className="button small upload">
                  Upload SVG
                  <input id={id} type="file" accept=".svg,image/svg+xml" className="sr-only" aria-describedby={`${id}-hint${logoError ? ` ${id}-error` : ''}`}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      const r = await logoFromFile(file);
                      if (r.ok) { setLogoError(false); set(r.d); } else setLogoError(true);
                    }} />
                </label>
                {v && <button type="button" className="link mono" onClick={() => { setLogoError(false); set(''); }}>Reset</button>}
              </div>
              <span id={`${id}-hint`} className="custom-hint muted">SVG only. Processed in your browser, never uploaded.</span>
              {logoError && <span id={`${id}-error`} className="field-error" role="alert">Couldn’t read this SVG. Try a simpler file.</span>}
            </div>
          );
        }
        const hint = p.hint ?? (square ? `A–Z or 0–9. Empty uses “${p.fallback}”.` : p.optional ? 'Optional.' : `Empty uses “${p.fallback}”.`);
        return (
          <div key={p.name} className={`custom-field${square ? '' : p.max <= 4 ? ' wide short' : ' wide'}`}>
            <label htmlFor={id}>{p.label}{p.optional && <span className="muted"> (optional)</span>}</label>
            <input id={id} type="text" inputMode={p.inputMode ?? 'text'} pattern={p.inputMode === 'numeric' ? '[0-9]*' : undefined} maxLength={p.max} autoComplete="off" autoCapitalize={p.upper ? 'characters' : 'off'} spellCheck={false} value={v}
              placeholder={p.fallback || p.example || ''} aria-describedby={hint ? `${id}-hint` : undefined}
              onChange={(e) => {
                const next = clean(p, e.target.value);
                setTyped((t) => ({ ...t, [p.name]: next }));
                // an exact field (the safe's 4-digit code) keeps its last full value until the new one is complete
                if (p.exact && Array.from(next).length !== p.max) return;
                onChange({ ...values, [p.name]: next || p.fallback });
                requestAnimationFrame(show);
              }} />
            {p.max > 4 && <span className="custom-count mono muted" aria-hidden="true">{Array.from(v).length} / {p.max}</span>}
            {hint && <span id={`${id}-hint`} className="custom-hint muted">{hint}</span>}
          </div>
        );
      })}
      {entry.customNote && <p className="custom-hint muted">{entry.customNote}</p>}
    </section>
  );
}

type Jar = { label: string; percent: string };
const parseJars = (v: string): Jar[] => v.split('|').map((s) => { const [label = '', percent = '0'] = s.split(':'); return { label, percent }; });
const jarsValue = (jars: Jar[]) => jars.map((j) => `${j.label}:${Number(j.percent) || 0}`).join('|');

/**
 * The jars' budget: a Label and a % per jar. The split only reaches the illustration when the percents add up to 100;
 * until then the last valid split stays and the total says what's wrong.
 */
function JarsField({ p, value, onCommit }: { p: CustomProp; value: string; onCommit: (v: string) => void }) {
  const [rows, setRows] = useState<Jar[]>(() => parseJars(value));
  const total = rows.reduce((sum, r) => sum + (Number(r.percent) || 0), 0), ok = total === 100;
  const update = (i: number, part: Partial<Jar>) => {
    const next = rows.map((r, j) => (j === i ? { ...r, ...part } : r));
    setRows(next);
    if (next.reduce((sum, r) => sum + (Number(r.percent) || 0), 0) === 100) onCommit(jarsValue(next));
  };
  const reset = () => { const d = parseJars(p.fallback); setRows(d); onCommit(jarsValue(d)); };
  return (
    <div className="custom-field jars">
      {rows.map((r, i) => (
        <div key={i} className="jar-row">
          <span className="jar-n mono muted" aria-hidden="true">{i + 1}</span>
          <label className="sr-only" htmlFor={`jar-${i}-label`}>Jar {i + 1} label</label>
          <input id={`jar-${i}-label`} type="text" className="jar-label" maxLength={6} autoComplete="off" spellCheck={false} autoCapitalize="characters" value={r.label}
            onChange={(e) => update(i, { label: e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 6) })} />
          <label className="sr-only" htmlFor={`jar-${i}-pct`}>Jar {i + 1} percent</label>
          <span className="jar-pct">
            <input id={`jar-${i}-pct`} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} autoComplete="off" value={r.percent}
              onChange={(e) => { const d = e.target.value.replace(/[^0-9]/g, '').slice(0, 3); update(i, { percent: d === '' ? '' : String(Math.min(100, Number(d))) }); }} />
            <span className="muted" aria-hidden="true">%</span>
          </span>
        </div>
      ))}
      <div className="jar-foot">
        <span className={`jar-total${ok ? ' muted' : ' bad'}`} aria-live="polite">{ok ? 'Total: 100%' : `Total: ${total}%. Must equal 100%.`}</span>
        <button type="button" className="link mono" onClick={reset}>Reset to 50/30/20</button>
      </div>
    </div>
  );
}

/** "Use it": the two lines that put the downloaded component on a page, with a copy button, and its props. */
function UseIt({ entry, theme, custom }: { entry: Entry; theme: Theme; custom: Record<string, string> }) {
  const [copied, setCopied] = useState('');
  const value = (name: string) => custom[name] || entry.props?.find((q) => q.name === name)?.fallback || '';
  const set = (entry.props ?? []).map((p) => [p, value(p.name)] as const)
    .filter(([p, v]) => (!p.when || value(p.when.prop) === p.when.is) && (p.kind === 'toggle' ? v !== p.fallback : v));
  // a logo's path data is long: shown cut short with "…", copied in full; a switch shows only when it's off
  const attrs = (short: boolean) => set.map(([p, v]) => (p.kind === 'jars' ? ` ${p.name}={[\n${parseJars(v).map((j) => `  { label: '${j.label}', percent: ${Number(j.percent) || 0} },`).join('\n')}\n]}` : p.kind === 'toggle' ? ` ${p.name}={${v === 'true'}}` : p.kind === 'stepper' ? ` ${p.name}={${v}}`
    : ` ${p.name}="${short && v.length > 28 ? `${v.slice(0, 24)}…` : v.replace(/"/g, '&quot;')}"`)).join('');
  const name = entry.component, head = `import { ${name} } from './${name}'\n<${name} theme="${theme}"`;
  const code = `${head}${attrs(false)} />`, shown = `${head}${attrs(true)} />`;
  const copy = async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(code); ok = true; } catch { /* not allowed */ }
    setCopied(ok ? 'Copied' : 'Couldn’t copy');
    setTimeout(() => setCopied(''), 1500);
  };
  return (
    <section className="use" aria-labelledby="use-title">
      <div className="use-head">
        <h2 id="use-title" className="mono muted">Use it</h2>
        <button type="button" className="copy-code mono" onClick={copy} aria-live="polite" aria-label={copied || 'Copy the snippet'}>{copied || 'Copy'}</button>
      </div>
      <div className="snippet">
        <pre><code>{shown}</code></pre>
      </div>
      <table className="props">
        <caption className="sr-only">Props</caption>
        <tbody>
          <tr><th scope="row" className="mono">theme</th><td className="mono muted">"dark" | "light"</td></tr>
          <tr><th scope="row" className="mono">interactive</th><td className="mono muted">boolean</td></tr>
          <tr><th scope="row" className="mono">className</th><td className="mono muted">string</td></tr>
          {entry.props?.map((p) => <tr key={p.name}><th scope="row" className="mono">{p.name}</th><td className="mono muted">{p.kind === 'jars' ? `{ label, percent }[3], default ${parseJars(p.fallback).map((j) => `${j.label} ${j.percent}`).join(' · ')}` : p.kind === 'segment' ? `${(p.options ?? []).map((o) => `"${o}"`).join(' | ')}, default "${p.fallback}"` : p.type}{p.kind === 'segment' || p.kind === 'jars' ? '' : p.kind === 'svg' ? ' (path data), optional' : p.kind === 'stepper' ? ` ${p.range?.join('–')}, default ${p.fallback}` : p.kind === 'toggle' ? `, default ${p.fallback}` : p.optional ? ', optional' : `, default "${p.fallback}"`}</td></tr>)}
        </tbody>
      </table>
    </section>
  );
}

function Missing({ go }: { go: Go }) {
  return (
    <main className="row missing">
      <p className="mono muted">404</p>
      <h1>Page not found</h1>
      <p className="muted">This page doesn’t exist, or it has moved.</p>
      <Link to={ILLUSTRATIONS} go={go} className="more mono">← Back to Illustrations</Link>
    </main>
  );
}
