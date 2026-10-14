/*
 * POST /api/request: "Request an illustration" from the header's modal, emailed through Resend.
 *
 * Environment (Vercel → Project → Settings → Environment Variables; .env.local for the dev server):
 *   RESEND_API_KEY   the Resend API key (required)
 *   REQUEST_TO       where requests go, e.g. you@yourdomain.com (required)
 *   REQUEST_FROM     the sender (optional). Defaults to Resend's test sender, onboarding@resend.dev, which only
 *                    delivers to the Resend account's own address; set it to an address on a domain verified in
 *                    Resend to send anywhere.
 * When the requester leaves an email it is the reply-to, so replying answers them. Without the keys nothing is
 * pretended: the request is refused with "not connected", and the page says so.
 */
// the function runs on Node; only its environment is needed here
declare const process: { env: Record<string, string | undefined> };

import { MIN_FILL_MS, normalise, validate } from '../src/request/form';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function POST(request: Request): Promise<Response> {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return json(415, { error: 'Send the request as JSON.' });
  const raw = await request.text();
  if (raw.length > 10_000) return json(413, { error: 'That request is too long.' });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'That request could not be read.' }); }

  const v = normalise(body);
  const elapsed = Number((body as { elapsed?: unknown })?.elapsed);
  // a bot: it filled the hidden field or sent faster than a person can; it is told all went well and nothing is sent
  if (v.website || !(elapsed >= MIN_FILL_MS)) return json(200, { ok: true });

  const errors = validate(v);
  if (Object.keys(errors).length) return json(422, { errors });

  const firstLine = v.message.split('\n')[0];
  const subject = `Compo request: ${firstLine.length > 70 ? `${firstLine.slice(0, 69)}…` : firstLine}`;
  const from = v.email || 'no email given', origin = new URL(request.url).origin;
  const about = v.about ? `About: ${v.about.replace(/\((\/[^)]*)\)/, `(${origin}$1)`)}\n` : '';
  const text = `${v.message}\n\n${about}From: ${from}\nSent from: ${origin}`;
  const html = `<div style="font:14px/1.6 -apple-system,Segoe UI,sans-serif"><p style="white-space:pre-wrap;margin:0 0 16px">${escape(v.message)}</p>`
    + (about ? `<p style="color:#6B6D6A;margin:0">${escape(about.trim())}</p>` : '') + `<p style="color:#6B6D6A;margin:0">From: ${escape(from)}</p></div>`;

  const key = process.env.RESEND_API_KEY, to = process.env.REQUEST_TO;
  if (!key || !to) {
    console.error(`[request] not sent: RESEND_API_KEY or REQUEST_TO is not set. It said:\n${text}\n`);
    return json(503, { error: 'Requests aren’t connected yet.' });
  }
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.REQUEST_FROM || 'Compo <onboarding@resend.dev>', to: [to], ...(v.email ? { reply_to: v.email } : {}), subject, text, html }),
  }).catch(() => null);
  if (!sent?.ok) {
    console.error('[request] Resend refused:', sent?.status, await sent?.text().catch(() => ''));
    return json(502, { error: 'It couldn’t be sent just now.' });
  }
  return json(200, { ok: true });
}
