import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { ENTRIES, bySlug, type Entry } from './figures';
import { Illustration, figureOf } from './Illustration';
import { valueAt } from './hairline';
import { componentSource } from './download/component';
import { renderVideo } from './download/video';
import type { Theme } from './tokens';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const pathOf = () => location.pathname.slice(BASE.length).replace(/^\/+|\/+$/g, '');
const DESCRIPTION = 'Ten interactive line illustrations for marketing ideas. Hover to explore, open one to download it as a React component or MP4.';

function useRoute() {
  const [path, setPath] = useState(pathOf);
  useEffect(() => {
    const sync = () => setPath(pathOf());
    addEventListener('popstate', sync);
    return () => removeEventListener('popstate', sync);
  }, []);
  const go = useCallback((to: string) => {
    history.pushState(null, '', `${BASE}/${to}`);
    setPath(to);
    scrollTo(0, 0);
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

type Go = (to: string) => void;
const plain = (e: MouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

/** A link that moves inside the site without a reload, and still opens a new tab on a modified click. */
function Link({ to, go, className, children, label }: { to: string; go: Go; className?: string; children: ReactNode; label?: string }) {
  const click = (e: MouseEvent) => { if (!plain(e)) return; e.preventDefault(); go(to); };
  return <a href={`${BASE}/${to}`} className={className} onClick={click} aria-label={label}>{children}</a>;
}

export function App() {
  const [path, go] = useRoute();
  const [theme, setTheme] = useTheme();
  const entry = path ? bySlug(path) : undefined;
  useEffect(() => { document.title = entry ? `${entry.name} · Isometric Marketing Kit` : 'Isometric Marketing Kit'; }, [entry]);

  return (
    <>
      <header className="bar">
        <div className="row">
          <Link to="" go={go} className="brand">Isometric Marketing Kit</Link>
          <span className="mono muted count">10 illustrations</span>
          <div className="toggle" role="group" aria-label="Theme">
            {(['dark', 'light'] as const).map((t) => (
              <button key={t} type="button" className="mono" aria-pressed={theme === t} onClick={() => setTheme(t)}>{t}</button>
            ))}
          </div>
        </div>
      </header>
      {entry ? <Detail key={entry.slug} entry={entry} go={go} theme={theme} /> : path ? <Missing go={go} /> : <Gallery go={go} />}
      {!path && <footer className="foot"><div className="row mono muted">Isometric Marketing Kit · 10 illustrations · {new Date().getFullYear()}</div></footer>}
    </>
  );
}

function Gallery({ go }: { go: Go }) {
  return (
    <main>
      <section className="row intro">
        <h1>Isometric Marketing Kit</h1>
        <p className="muted">{DESCRIPTION}</p>
      </section>
      <div className="row">
        <ul className="grid">
          {ENTRIES.map((e) => <Cell key={e.slug} entry={e} go={go} />)}
        </ul>
      </div>
    </main>
  );
}

/** One gallery cell: the whole cell links to the detail page; a touch on the drawing is a hover, not a click. */
function Cell({ entry, go }: { entry: Entry; go: Go }) {
  const [status, setStatus] = useState('rest');
  const touchedArt = useRef(false);
  const value = valueAt(figureOf(entry).range, 0.5);
  const click = (e: MouseEvent) => {
    if (touchedArt.current) { e.preventDefault(); return; }
    if (!plain(e)) return;
    e.preventDefault();
    go(entry.slug);
  };
  return (
    <li>
      <a
        className="cell"
        data-active={status !== 'rest' || undefined}
        href={`${BASE}/${entry.slug}`}
        aria-label={`${entry.n} ${entry.name}, ${entry.topic}`}
        onPointerDown={(e) => { touchedArt.current = e.pointerType !== 'mouse' && !!(e.target as Element).closest('.stage'); }}
        onClick={click}
      >
        <Illustration entry={entry} value={value} onRead={setStatus} aspect={5 / 4} />
        <span className="corner tl mono muted">{entry.n} · {entry.topic}</span>
        <span className="corner tr status mono" aria-hidden="true">{status}</span>
        <span className="corner bl name">{entry.name}</span>
        <span className="corner br mono open" aria-hidden="true">Open →</span>
      </a>
    </li>
  );
}

function Detail({ entry, go, theme }: { entry: Entry; go: Go; theme: Theme }) {
  const figure = figureOf(entry);
  const [status, setStatus] = useState('rest');
  const value = valueAt(figure.range, 0.5);
  const i = ENTRIES.indexOf(entry), prev = ENTRIES[(i + ENTRIES.length - 1) % ENTRIES.length], next = ENTRIES[(i + 1) % ENTRIES.length];

  // the left and right arrow keys step through the illustrations, unless a text field has them
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowLeft') go(prev.slug);
      if (e.key === 'ArrowRight') go(next.slug);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [go, prev, next]);

  return (
    <main className="row detail">
      <nav className="navrow mono" aria-label="Illustrations">
        <Link to="" go={go} className="muted">← All illustrations</Link>
        <div className="steps">
          <Link to={prev.slug} go={go} className="muted" label={`Previous: ${prev.name}`}>← Prev</Link>
          <span>{entry.n} / {String(ENTRIES.length).padStart(2, '0')}</span>
          <Link to={next.slug} go={go} className="muted" label={`Next: ${next.name}`}>Next →</Link>
        </div>
      </nav>
      <div className="split">
        <div className="view">
          <Illustration entry={entry} value={value} onRead={setStatus} aspect="box" keyboard />
          <span className="corner tr mono" aria-live="polite">{status}</span>
        </div>
        <aside className="side">
          <p className="mono muted">{entry.n} · {entry.topic}</p>
          <h1>{entry.name}</h1>
          <p className="means">{figure.means}</p>
          <div className="downloads">
            <ComponentButton entry={entry} value={value} />
            <VideoButton entry={entry} value={value} theme={theme} />
          </div>
          <p className="note muted">Downloads use the current theme.</p>
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

function ComponentButton({ entry, value }: { entry: Entry; value: number }) {
  const download = () => save(new Blob([componentSource(entry, figureOf(entry), value)], { type: 'text/javascript' }), `${entry.component}.jsx`);
  return <button type="button" className="button mono" onClick={download}>Download React (.jsx)</button>;
}

function VideoButton({ entry, value, theme }: { entry: Entry; value: number; theme: Theme }) {
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const run = async () => {
    setError('');
    setBusy(0);
    try {
      const blob = await renderVideo(entry, theme, value, (f) => setBusy(Math.floor(f * 100)));
      save(blob, `${entry.slug}-${theme}-1080x1080-60fps.mp4`);
    } catch (e) {
      setError(`The video could not be rendered: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <button type="button" className="button mono" onClick={run} disabled={busy !== null} aria-live="polite">
        {busy === null ? 'Download video (.mp4)' : `Rendering… ${busy}%`}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </>
  );
}

function Missing({ go }: { go: Go }) {
  return (
    <main className="row detail">
      <nav className="navrow mono"><Link to="" go={go} className="muted">← All illustrations</Link></nav>
      <p className="means">There is no illustration here.</p>
    </main>
  );
}
