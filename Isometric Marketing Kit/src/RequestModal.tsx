import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { LIMITS, normalise, validate, type Errors } from './request/form';

/*
 * "Request an illustration": a centred modal (a bottom sheet below 640px) opened from the header's "Request" button.
 * One text field, an optional email, Send; checked only on Send; sent through /api/request, which emails it. Opened
 * from an illustration's page it carries a removable "About:" tag. Focus stays inside while it's open (the page behind
 * is inert and doesn't scroll); Esc, the ×, or the backdrop close it, asking first when there's unsent text.
 */

export type About = { name: string; path: string };
type Phase = 'form' | 'sending' | 'sent';

const OPEN_MS = 160, CLOSE_MS = 120;

export function RequestModal({ open, about, onClose }: { open: boolean; about: About | null; onClose: () => void }) {
  // mounted lags `open` by the close animation, so the dialog can fade out before it leaves
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) { setMounted(true); const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true))); return () => cancelAnimationFrame(r); }
    setShown(false);
    const t = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(t);
  }, [open]);
  return mounted ? <Dialog shown={shown} about={about} onClose={onClose} /> : null;
}

function Dialog({ shown, about, onClose }: { shown: boolean; about: About | null; onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [tag, setTag] = useState<About | null>(about);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<Phase>('form');
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const opened = useRef(Date.now());
  const box = useRef<HTMLDivElement>(null), text = useRef<HTMLTextAreaElement>(null), keep = useRef<HTMLButtonElement>(null);

  // the page behind doesn't scroll; focus starts in the text field
  useEffect(() => {
    const html = document.documentElement, was = html.style.overflow;
    html.style.overflow = 'hidden';
    text.current?.focus();
    return () => { html.style.overflow = was; };
  }, []);
  useEffect(() => { if (confirming) keep.current?.focus(); }, [confirming]);

  // after "Thanks", close on its own; the form starts empty next time
  useEffect(() => {
    if (phase !== 'sent') return;
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [phase, onClose]);

  const dirty = phase === 'form' && (message.trim() !== '' || email.trim() !== '');
  const requestClose = () => { if (dirty) setConfirming(true); else onClose(); };

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (phase !== 'form') return;
    const v = normalise({ message, email, website, about: tag ? `${tag.name} (${tag.path})` : '' }), problems = validate(v);
    setErrors(problems);
    setFailed(false);
    if (problems.message || problems.email) {
      box.current?.querySelector<HTMLElement>(problems.message ? '#rq-message' : '#rq-email')?.focus();
      return;
    }
    setPhase('sending');
    try {
      const res = await fetch('/api/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...v, elapsed: Date.now() - opened.current }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) { setPhase('sent'); return; }
      if (res.status === 422 && body.errors) setErrors(body.errors); else setFailed(true);
    } catch {
      setFailed(true);
    }
    setPhase('form');
  }

  // Tab and Shift+Tab cycle inside the dialog; Esc closes (asking first when there's text)
  function keys(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); if (confirming) { setConfirming(false); requestAnimationFrame(() => text.current?.focus()); } else requestClose(); return; }
    if (e.key !== 'Tab' || !box.current) return;
    const items = [...box.current.querySelectorAll<HTMLElement>('button, input:not([tabindex="-1"]), textarea, [href]')].filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  return (
    <div className={`rq-layer${shown ? ' shown' : ''}`} style={{ ['--rq-in' as string]: `${OPEN_MS}ms`, ['--rq-out' as string]: `${CLOSE_MS}ms` }}>
      <div className="rq-backdrop" onMouseDown={requestClose} aria-hidden="true" />
      <div ref={box} className="rq-dialog" role="dialog" aria-modal="true" aria-labelledby="rq-title" aria-describedby="rq-subtitle" onKeyDown={keys}>
        <h2 id="rq-title">Request an illustration</h2>
        {phase === 'sent' ? (
          <p id="rq-subtitle" className="rq-thanks" role="status">Thanks, we got it.</p>
        ) : (
          <>
            <p id="rq-subtitle" className="muted">Tell us what to draw next.</p>
            {confirming ? (
              <div className="rq-confirm" role="alertdialog" aria-labelledby="rq-confirm-text">
                <p id="rq-confirm-text">Discard your request?</p>
                <div className="rq-confirm-actions">
                  <button type="button" className="button rq-small" onClick={onClose}>Discard</button>
                  <button ref={keep} type="button" className="button rq-small primary-ish" onClick={() => { setConfirming(false); requestAnimationFrame(() => text.current?.focus()); }}>Keep editing</button>
                </div>
              </div>
            ) : (
              <form className="rq-form" onSubmit={send} noValidate>
                {tag && (
                  <span className="rq-tag mono">
                    About: {tag.name}
                    <button type="button" aria-label={`Remove “About: ${tag.name}”`} onClick={() => { setTag(null); text.current?.focus(); }}>×</button>
                  </span>
                )}
                <div className={`rq-field${errors.message ? ' invalid' : ''}`}>
                  <label htmlFor="rq-message" className="sr-only">What should we draw next?</label>
                  <textarea ref={text} id="rq-message" rows={4} maxLength={LIMITS.message} placeholder="e.g. A piggy bank that fills up as you hover" value={message}
                    aria-invalid={!!errors.message} aria-describedby={errors.message ? 'rq-message-error' : undefined}
                    onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors(({ message: _, ...r }) => r); setFailed(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }} />
                  <p id="rq-message-error" className="rq-error" aria-live="polite">{errors.message ?? ''}</p>
                </div>
                <div className={`rq-field${errors.email ? ' invalid' : ''}`}>
                  <label htmlFor="rq-email" className="sr-only">Your email (optional)</label>
                  <input id="rq-email" type="email" inputMode="email" autoComplete="email" spellCheck={false} maxLength={LIMITS.email} placeholder="Email (optional)" value={email}
                    aria-invalid={!!errors.email} aria-describedby={errors.email ? 'rq-email-error' : undefined}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(({ email: _, ...r }) => r); setFailed(false); }} />
                  <p id="rq-email-error" className="rq-error" aria-live="polite">{errors.email ?? ''}</p>
                </div>
                {/* people never see this; bots fill it in */}
                <div className="trap" aria-hidden="true"><label>Website<input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label></div>
                <button type="submit" className="button rq-send" disabled={phase === 'sending'}>{phase === 'sending' ? 'Sending…' : 'Send'}</button>
                <p className="rq-error rq-failed" aria-live="polite">{failed ? 'Couldn’t send. Please try again.' : ''}</p>
              </form>
            )}
          </>
        )}
        {/* last in the tab order, first on screen: top right */}
        <button type="button" className="rq-close" aria-label="Close" onClick={requestClose}>×</button>
      </div>
    </div>
  );
}
