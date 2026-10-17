import { useEffect, useRef, useState } from 'react';
import Modal from './Modal.jsx';
import { CheckIcon, ChevronDownIcon } from './Icons.jsx';
import { allItems, normalizeUrl } from '../lib/references.js';

const MAX_MESSAGE = 1000;
const TOPICS = ['Idea', 'Bug', 'Content', 'Other'];
const PLACEHOLDERS = {
  request: 'What is it, and why should it be on Rooted? (optional)',
  feedback: 'What could be better, or what is missing?',
};

const EMPTY = { link: '', topic: '', message: '', email: '' };

// ---- validation (returns an error string or '') ----
function normalizeLink(raw) {
  const v = raw.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function validateLink(raw) {
  const v = normalizeLink(raw);
  if (!v) return 'Add a link.';
  let u;
  try {
    u = new URL(v);
  } catch {
    return 'Enter a valid link.';
  }
  if (!u.hostname.includes('.')) return 'Enter a valid link.';
  const existing = allItems.find((it) => normalizeUrl(it.url) === normalizeUrl(v));
  if (existing) return `Already on Rooted as ${existing.name}.`;
  return '';
}

function validateEmail(v) {
  const t = v.trim();
  if (!t) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? '' : 'Enter a valid email.';
}

function validate(type, values) {
  const errors = {};
  if (type === 'request') {
    errors.link = validateLink(values.link);
    errors.message = values.message.length > MAX_MESSAGE ? `Keep it under ${MAX_MESSAGE} characters.` : '';
  } else {
    errors.topic = values.topic ? '' : 'Choose a topic.';
    const m = values.message.trim();
    errors.message = !m ? 'Add a message.' : m.length < 10 ? 'Write at least 10 characters.' : values.message.length > MAX_MESSAGE ? `Keep it under ${MAX_MESSAGE} characters.` : '';
  }
  errors.email = validateEmail(values.email);
  return errors;
}

function Field({ id, label, error, children, extra }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      <div className="field__below">
        {error ? (
          <span className="field__error" id={`${id}-error`}>
            {error}
          </span>
        ) : (
          <span />
        )}
        {extra}
      </div>
    </div>
  );
}

// The "Send a request" form. Validates, then shows a short sending state and
// the thank-you screen. It still doesn't send anything (see the TODO).
export default function RequestDialog({ open, onClose }) {
  const [type, setType] = useState('request');
  const [values, setValues] = useState({ request: { ...EMPTY }, feedback: { ...EMPTY } });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [stage, setStage] = useState('form'); // 'form' | 'sending' | 'sent'
  const [trap, setTrap] = useState('');
  const [panelHeight, setPanelHeight] = useState(undefined); // keeps the Thanks screen the same height
  const timer = useRef(0);

  useEffect(() => {
    if (open) {
      setType('request');
      setValues({ request: { ...EMPTY }, feedback: { ...EMPTY } });
      setTouched({});
      setSubmitted(false);
      setStage('form');
      setTrap('');
      setPanelHeight(undefined);
    }
    return () => clearTimeout(timer.current);
  }, [open]);

  const v = values[type];
  const errors = validate(type, v);
  const show = (name) => (touched[name] || submitted) && errors[name] ? errors[name] : '';
  const set = (name, value) => setValues((prev) => ({ ...prev, [type]: { ...prev[type], [name]: value } }));
  const blur = (name) => setTouched((t) => ({ ...t, [name]: true }));

  function switchType(next) {
    setType(next);
    setTouched({});
    setSubmitted(false);
  }

  function onSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    const invalid = Object.keys(errors).find((k) => errors[k]);
    if (invalid && !trap) {
      document.getElementById(`req-${invalid}`)?.focus();
      return;
    }
    // TODO: connect form service (e.g. Formspree, Web3Forms or an email API).
    // Send { type, ...values[type] } here, unless `trap` (the hidden spam field) is filled.
    setPanelHeight(e.currentTarget.closest('.modal')?.offsetHeight);
    setStage('sending');
    timer.current = setTimeout(() => setStage('sent'), 600);
  }

  const errorProps = (name) => ({ 'aria-invalid': show(name) ? 'true' : undefined, 'aria-describedby': show(name) ? `req-${name}-error` : undefined });

  return (
    <Modal open={open} onClose={onClose} title={stage === 'sent' ? undefined : 'Send a request'} subtitle="Suggest a reference or share feedback." label="Thanks for sending" width={420} minHeight={panelHeight}>
      <div className="request">
        {stage === 'sent' ? (
          <div className="thanks">
            <span className="thanks__icon" aria-hidden="true"><CheckIcon width={20} height={20} /></span>
            <h3 className="modal__title">Thanks for sending</h3>
            <p className="modal__subtitle">Your message has been received.</p>
            <button type="button" className="button button--dark button--block" data-autofocus onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <div className="segmented" role="group" aria-label="Message type">
              <button type="button" className={`segmented__option${type === 'request' ? ' is-active' : ''}`} aria-pressed={type === 'request'} data-autofocus onClick={() => switchType('request')}>
                Request a reference
              </button>
              <button type="button" className={`segmented__option${type === 'feedback' ? ' is-active' : ''}`} aria-pressed={type === 'feedback'} onClick={() => switchType('feedback')}>
                Feedback
              </button>
            </div>

            <div className="fields">
              {type === 'request' ? (
                <Field id="req-link" label="Link" error={show('link')}>
                  <input id="req-link" type="url" placeholder="https://" value={v.link} onChange={(e) => set('link', e.target.value)} onBlur={() => blur('link')} {...errorProps('link')} />
                </Field>
              ) : (
                <Field id="req-topic" label="Topic" error={show('topic')}>
                  <span className="select-wrap">
                    <select id="req-topic" value={v.topic} onChange={(e) => set('topic', e.target.value)} onBlur={() => blur('topic')} {...errorProps('topic')}>
                      <option value="">Choose a topic</option>
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="select-wrap__icon" width={14} height={14} />
                  </span>
                </Field>
              )}

              <Field id="req-message" label="Message" error={show('message')} extra={<span className={`field__count num${v.message.length > MAX_MESSAGE ? ' is-over' : ''}`}>{v.message.length} / {MAX_MESSAGE}</span>}>
                <textarea id="req-message" rows={4} placeholder={PLACEHOLDERS[type]} value={v.message} onChange={(e) => set('message', e.target.value)} onBlur={() => blur('message')} {...errorProps('message')} />
              </Field>

              <Field id="req-email" label="Your email (optional)" error={show('email')}>
                <input id="req-email" type="email" placeholder="you@example.com" value={v.email} onChange={(e) => set('email', e.target.value)} onBlur={() => blur('email')} {...errorProps('email')} />
              </Field>
            </div>

            {/* Spam trap: hidden from people, filled by bots. */}
            <div className="visually-hidden" aria-hidden="true">
              <label htmlFor="req-website">Website</label>
              <input id="req-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
            </div>

            <button type="submit" className="button button--dark button--block request__send" disabled={stage === 'sending'} aria-busy={stage === 'sending'}>
              {stage === 'sending' ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                'Send'
              )}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
