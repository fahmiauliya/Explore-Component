import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { CheckIcon } from './Icons.jsx';

const PLACEHOLDERS = {
  request: 'What is it, and why should it be on Rooted? (optional)',
  feedback: 'What could be better, or what is missing?',
};

// The "Send a request" form. For now it does not send anything anywhere;
// it only shows the thank-you screen. See the TODO in `onSubmit`.
export default function RequestDialog({ open, onClose }) {
  const [type, setType] = useState('request');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      setType('request');
      setLink('');
      setMessage('');
      setEmail('');
      setSent(false);
    }
  }, [open]);

  function onSubmit(e) {
    e.preventDefault();
    // TODO: connect form service (e.g. Formspree, Web3Forms or an email API).
    // Send { type, link, message, email } here. For now we only show "Thanks".
    setSent(true);
  }

  if (sent) {
    return (
      <Modal open={open} onClose={onClose} label="Thanks for sending" width={420}>
        <div className="thanks">
          <span className="thanks__icon" aria-hidden="true"><CheckIcon width={20} height={20} /></span>
          <h3 className="modal__title">Thanks for sending</h3>
          <p className="modal__subtitle">Your message has been received.</p>
          <button type="button" className="button button--dark button--block" data-autofocus onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Send a request" subtitle="Suggest a reference or tell me how to make Rooted better." width={420}>
      <form onSubmit={onSubmit}>
        <div className="segmented" role="group" aria-label="Message type">
          <button type="button" className={`segmented__option${type === 'request' ? ' is-active' : ''}`} aria-pressed={type === 'request'} data-autofocus onClick={() => setType('request')}>
            Request a reference
          </button>
          <button type="button" className={`segmented__option${type === 'feedback' ? ' is-active' : ''}`} aria-pressed={type === 'feedback'} onClick={() => setType('feedback')}>
            Feedback
          </button>
        </div>

        <div className="fields">
          {type === 'request' && (
            <div className="field">
              <label htmlFor="req-link">Link</label>
              <input id="req-link" type="url" required placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label htmlFor="req-message">Message</label>
            <textarea id="req-message" rows={4} required={type === 'feedback'} placeholder={PLACEHOLDERS[type]} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="req-email">Your email (optional)</label>
            <input id="req-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <button type="submit" className="button button--dark button--block request__send">Send</button>
      </form>
    </Modal>
  );
}
