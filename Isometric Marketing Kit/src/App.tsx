import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
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
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, Send, Sliders, Socials } from './icons';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const pathOf = () => location.pathname.slice(BASE.length).replace(/^\/+|\/+$/g, '');
const ROLE = 'Interactive line illustrations';
const LICENSE = 'Free for personal and commercial use.';
/** The footer's "Made by Fahmi" link: empty shows plain text until there is one. */
const MADE_BY_URL = '';
/** Compo's sections, in the header after "Compo". Illustrations is the first; more are added here as plain items. */
const SECTIONS = [{ key: 'illustrations', label: 'Illustrations' }] as const;
const ILLUSTRATIONS = SECTIONS[0].key;
/** The old request page: its address leads to the gallery. */
const REQUEST = 'request';

/** The gallery's chips: All (the default), then each category. In All, Fintech comes first. */
export type Chip = 'all' | Category;
const ORDER: Category[] = ['fintech', 'marketing'];
const CHIPS: Chip[] = ['all', ...ORDER];
const chipLabel = (c: Chip) => (c === 'all' ? 'All' : categoryOf(c)!.label);
const chipOf = (search: string): Chip => { const c = new URLSearchParams(search).get('c'); return c && categoryOf(c) ? (c as Category) : 'all'; };
const listOf = (chip: Chip): Entry[] => (chip === 'all' ? ORDER.flatMap((k) => categoryOf(k)!.entries) : categoryOf(chip)!.entries);
const withChip = (path: string, chip: Chip) => (chip === 'all' ? path : `${path}?c=${chip}`);
/** Where things live: /illustrations[?c=<category>] and /illustrations/<category>/<slug>[?c=<chip>]; the chip rides along. */
const galleryAt = (chip: Chip) => withChip(ILLUSTRATIONS, chip);
const pageOf = (e: Entry, chip: Chip = 'all') => withChip(`${ILLUSTRATIONS}/${e.category}/${e.slug}`, chip);
const pad = (n: number) => String(n).padStart(2, '0');
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
/** The newest illustrations (each replaced an older one): their cards say "(new)". */
const FRESH = new Set(Object.values(REPLACED));

/** Whether these categories' figure files are in; starts loading them if not, and re-renders once they arrive. */
function useCategories(keys: Category[]) {
  const [, arrived] = useState(0);
  const key = keys.join();
  useEffect(() => { keys.forEach((k) => { if (!isLoaded(k)) loadCategory(k).then(() => arrived((n) => n + 1), () => {}); }); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return keys.every(isLoaded);
}

function useRoute() {
  const read = () => `${pathOf()}${location.search}`;
  const [at, setAt] = useState(read);
  useEffect(() => {
    const sync = () => setAt(read());
    addEventListener('popstate', sync);
    return () => removeEventListener('popstate', sync);
  }, []);
  // `keep` leaves the scroll where it is (switching chips); `replace` rewrites the address instead of adding to history
  const go = useCallback((to: string, { keep = false, replace = false } = {}) => {
    history[replace ? 'replaceState' : 'pushState'](null, '', `${BASE}/${to}`);
    setAt(read());
    if (!keep) scrollTo(0, 0);
  }, []);
  return [at, go] as const;
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('imk-theme', theme); } catch { /* the choice just isn't remembered */ }
  }, [theme]);
  return [theme, setTheme] as const;
}

type Go = (to: string, options?: { keep?: boolean; replace?: boolean }) => void;
const plain = (e: MouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

/** A link that moves inside the site without a reload, and still opens a new tab on a modified click. */
function Link({ to, go, className, children, label, current, style }: { to: string; go: Go; className?: string; children: ReactNode; label?: string; current?: boolean; style?: CSSProperties }) {
  const click = (e: MouseEvent) => { if (!plain(e)) return; e.preventDefault(); go(to); };
  return <a href={`${BASE}/${to}`} className={className} style={style} onClick={click} aria-label={label} aria-current={current ? 'page' : undefined}>{children}</a>;
}

type Route =
  | { kind: 'home' }
  | { kind: 'gallery'; chip: Chip }
  | { kind: 'detail'; entry: Entry; chip: Chip }
  | { kind: 'missing' };

/**
 * What an address shows, and where it moved to if it is an old one: / is the home page, /illustrations[?c=…] the
 * gallery, /illustrations/<category>/<slug>[?c=…] a detail page. The older addresses (/illustrations/<category>,
 * /<category>, /<category>/<slug>, the first site's /<slug>, /request) are rewritten to these.
 */
function resolve(at: string): { route: Route; to?: string } {
  const [path, search = ''] = at.split('?');
  const [first, ...rest] = path ? path.split('/') : [];
  const chip = chipOf(search);
  const moved = (to: string) => ({ ...resolve(to), to });
  if (!first) return { route: { kind: 'home' } };
  if (first === ILLUSTRATIONS) {
    const [cat, slug, ...extra] = rest;
    if (extra.length) return { route: { kind: 'missing' } };
    if (!cat) return { route: { kind: 'gallery', chip } };
    if (!categoryOf(cat)) return { route: { kind: 'missing' } };
    if (!slug) return moved(galleryAt(cat as Category));
    const entry = find(cat, slug);
    if (!entry && cat === 'fintech' && REPLACED[slug]) return moved(withChip(`${ILLUSTRATIONS}/${cat}/${REPLACED[slug]}`, chip));
    return { route: entry ? { kind: 'detail', entry, chip } : { kind: 'missing' } };
  }
  if (first === REQUEST && !rest.length) return moved(ILLUSTRATIONS);
  if (categoryOf(first) && rest.length <= 1) return moved(rest.length ? `${ILLUSTRATIONS}/${first}/${rest[0]}` : galleryAt(first as Category));
  const old = !rest.length && find(CATEGORIES[0].key, first);
  return old ? moved(pageOf(old)) : { route: { kind: 'missing' } };
}

export function App() {
  const [at, go] = useRoute();
  const [theme, setTheme] = useTheme();
  // the request modal: opened from the header or the home page; focus goes back to whichever opened it
  const [requesting, setRequesting] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const openRequest = useCallback(() => { opener.current = document.activeElement as HTMLElement | null; setRequesting(true); }, []);
  const closeRequest = useCallback(() => { setRequesting(false); requestAnimationFrame(() => opener.current?.focus()); }, []);
  const { route, to } = resolve(at);
  // an old address shows its new page at once, and the address is rewritten in place
  useEffect(() => { if (to) go(to, { replace: true, keep: true }); }, [to, go]);
  const entry = route.kind === 'detail' ? route.entry : undefined;
  const chip = route.kind === 'gallery' || route.kind === 'detail' ? route.chip : 'all';
  // the tab title, description and share image follow the page (the built pages carry the same in their HTML)
  useEffect(() => {
    setMeta(route.kind === 'detail' ? { entry: route.entry } : route.kind === 'gallery' ? { gallery: route.chip } : route.kind === 'home' ? { home: true } : { missing: true });
  }, [route.kind, entry, chip]);

  return (
    <>
      <div className="page" inert={requesting}>
        <header className="bar">
          <div className="bar-row">
            <nav className="bar-left" aria-label="Primary navigation">
              <Link to="" go={go} className="brand" current={route.kind === 'home'}>Compo</Link>
              {SECTIONS.map((s) => (
                <Link key={s.key} to={s.key} go={go} className="bar-tab" current={route.kind === 'gallery' || route.kind === 'detail'}>{s.label}</Link>
              ))}
            </nav>
            <div className="bar-right">
              <button type="button" className="pill dark compact" aria-haspopup="dialog" onClick={openRequest}>Request <Send /></button>
              <div className="theme-toggle" role="group" aria-label="Theme">
                {(['dark', 'light'] as const).map((t) => (
                  <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>{t === 'dark' ? 'Dark' : 'Light'}</button>
                ))}
              </div>
            </div>
          </div>
        </header>
        {entry ? <Detail key={pageOf(entry, chip)} entry={entry} chip={chip} go={go} theme={theme} />
          : route.kind === 'gallery' ? <Gallery chip={route.chip} go={go} />
          : route.kind === 'home' ? <Home go={go} onRequest={openRequest} /> : <Missing go={go} />}
        <footer className="site-footer">
          <Socials />
          <p className="made">Compo · {new Date().getFullYear()} · {MADE_BY_URL ? <a href={MADE_BY_URL} target="_blank" rel="noopener">Made by Fahmi</a> : 'Made by Fahmi'}</p>
        </footer>
      </div>
      <RequestModal open={requesting} onClose={closeRequest} about={entry ? { name: entry.name, path: `/${pageOf(entry)}` } : null} />
    </>
  );
}

/** The home page: the intro in the narrow column between the guide lines. */
function Home({ go, onRequest }: { go: Go; onRequest: () => void }) {
  return (
    <main className="home">
      <div className="intro-panel">
        <div className="intro-body">
          <div className="intro-content">
            <div className="identity">
              <h1>Compo</h1>
              <p>{ROLE}</p>
            </div>
            <div className="copy">
              <p className="lead">Twenty line illustrations for marketing and fintech products, each one moving when you point at it.</p>
              <p>Change a label, a code or a logo, then take it as a React component, or as SVG, PNG, GIF or video for slides and docs.</p>
              <p>{LICENSE} Missing one you need? Ask for it, and it may be next.</p>
            </div>
            <div className="actions">
              <button type="button" className="pill dark" aria-haspopup="dialog" onClick={onRequest}>Request <Send /></button>
              <Link to={ILLUSTRATIONS} go={go} className="pill light">Browse <ArrowRight /></Link>
              <Socials className="intro-socials" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/** The gallery: the chips (All, Fintech, Marketing) above the cards. A chip changes the address and the grid at once, without scrolling. */
function Gallery({ chip, go }: { chip: Chip; go: Go }) {
  const ready = useCategories(chip === 'all' ? ORDER : [chip]);
  const entries = listOf(chip);
  const prefetch = () => CATEGORIES.forEach((c) => { loadCategory(c.key).catch(() => {}); });
  return (
    <main className="gallery">
      <h1 className="sr-only">Illustrations</h1>
      <nav className="chips" aria-label="Filter illustrations" onPointerEnter={prefetch} onFocus={prefetch}>
        {CHIPS.map((c) => (
          <Link key={c} to={galleryAt(c)} go={(to) => go(to, { keep: true })} className={`pill compact chip ${c === chip ? 'dark' : 'light'}`} current={c === chip}>
            {chipLabel(c)} <span className="chip-count">{listOf(c).length}</span>
          </Link>
        ))}
      </nav>
      <ul className="works-grid">
        {entries.map((e) => <Cell key={pageOf(e)} entry={e} chip={chip} go={go} ready={ready} />)}
      </ul>
    </main>
  );
}

/** One card: its caption above, the tile under it; the whole card links to the detail page; a touch on the drawing is a hover. */
function Cell({ entry, chip, go, ready }: { entry: Entry; chip: Chip; go: Go; ready: boolean }) {
  const touchedArt = useRef(false);
  const click = (e: MouseEvent) => {
    if (touchedArt.current) { e.preventDefault(); return; }
    if (!plain(e)) return;
    e.preventDefault();
    go(pageOf(entry, chip));
  };
  const fresh = FRESH.has(entry.slug);
  const label = [chip === 'all' ? categoryOf(entry.category)!.label : '', entry.n, entry.topic].filter(Boolean).join(' · ');
  return (
    <li className="card-item">
      <a
        className="card"
        href={`${BASE}/${pageOf(entry, chip)}`}
        aria-label={`${entry.name}, ${label}${fresh ? ', new' : ''}`}
        onPointerDown={(e) => { touchedArt.current = e.pointerType !== 'mouse' && !!(e.target as Element).closest('.stage'); }}
        onClick={click}
      >
        <span className="card-meta">
          <span className="card-title">{entry.name}{entry.props?.length ? <Sliders className="card-icon" /> : null}</span>
          <span className="card-sub"><span className="card-topic">{label}</span>{fresh && <span className="card-label">(new)</span>}</span>
        </span>
        <span className="tile cell">
          {ready && <Illustration entry={entry} value={valueAt(figureOf(entry).range, 0.5)} aspect={300 / 343} lazy />}
        </span>
      </a>
    </li>
  );
}

function Detail({ entry, chip, go, theme }: { entry: Entry; chip: Chip; go: Go; theme: Theme }) {
  const ready = useCategories([entry.category]);
  const figure = ready ? figureOf(entry) : null;
  const value = figure ? valueAt(figure.range, 0.5) : 0;
  // the Customize block's values (the box's letter): the illustration, every download and the snippet use them
  const [custom, setCustom] = useState<Record<string, string>>(() => Object.fromEntries((entry.props ?? []).map((p) => [p.name, p.fallback])));
  const attrs = dataOf(entry.props, custom);
  useEffect(() => { customOf.set(entry.slug, dataOf(entry.props, custom)); }, [entry.slug, custom]);
  useEffect(() => () => { customOf.delete(entry.slug); }, [entry.slug]);
  // prev / next and the counter stay within the chip the page was opened from (All: all 20)
  const list = listOf(chip), i = list.indexOf(entry), prev = list[(i + list.length - 1) % list.length], next = list[(i + 1) % list.length];
  const at = (e: Entry) => pageOf(e, chip);

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
  }, [go, prev, next]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="detail">
      <nav className="detail-bar" aria-label="Illustrations">
        <Link to={galleryAt(chip)} go={go} className="pill light back"><ArrowLeft />All illustrations</Link>
        <div className="steps">
          <Link to={at(prev)} go={go} className="round light" label={`Previous: ${prev.name}`}><ChevronLeft /></Link>
          <span className="count">{pad(i + 1)} / {pad(list.length)}</span>
          <Link to={at(next)} go={go} className="round light" label={`Next: ${next.name}`}><ChevronRight /></Link>
        </div>
      </nav>
      <div className="split">
        <div className="view tile">
          {figure && <Illustration entry={entry} value={value} aspect="box" keyboard data={attrs} box={boxOf(entry, attrs)} />}
        </div>
        <aside className="side">
          <p className="eyebrow">{categoryOf(entry.category)!.label} · {entry.n} · {entry.topic}</p>
          <h1>{entry.name}</h1>
          <p className="means">{figure ? figure.means : ' '}</p>
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
      <button type="button" className="pill dark block" onClick={() => run(react)} disabled={busy !== null}>{react.format} <Download /></button>
      <details className="formats">
        <summary className="pill light block">More formats</summary>
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
    const s = (p.max === 1 ? chars.slice(-1) : chars.slice(0, p.max)).join('');
    return p.shape ? p.shape(s) : s;
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
                <span className="logo-preview" aria-hidden="true">{(v || !p.blank) && <svg viewBox="-0.08 -0.08 1.16 1.16"><path d={v || DEFAULT_LOGO} /></svg>}</span>
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
    <main className="missing">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="muted">This page doesn’t exist, or it has moved.</p>
      <Link to={ILLUSTRATIONS} go={go} className="pill light back"><ArrowLeft />Back to Illustrations</Link>
    </main>
  );
}
