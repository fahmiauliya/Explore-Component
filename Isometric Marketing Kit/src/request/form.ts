/*
 * The request form's fields and rules, shared by the modal (src/RequestModal.tsx) and the function that emails it
 * (api/request.ts), so both accept exactly the same things.
 */

export const LIMITS = { message: 2000, email: 254, about: 160 } as const;
/** A request sent faster than this after the page opened is a bot. */
export const MIN_FILL_MS = 1500;

export type RequestValues = {
  /** What to draw next: required, any length up to LIMITS.message. */
  message: string;
  /** Optional: where to reply. */
  email: string;
  /** Optional: the illustration it was sent from, e.g. "Funnel (/illustrations/marketing/funnel)". */
  about: string;
  /** Left empty by people; bots fill it. */
  website: string;
};
export type Errors = Partial<Record<'message' | 'email', string>>;

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const text = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/\r\n?/g, '\n').trim().slice(0, max) : '');

/** Untrusted input as well-formed values: trimmed and cut to length. */
export function normalise(input: unknown): RequestValues {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  return { message: text(o.message, LIMITS.message), email: text(o.email, LIMITS.email).toLowerCase(), about: text(o.about, LIMITS.about).replace(/\s+/g, ' '), website: text(o.website, 200) };
}

/** Only two rules: say something, and an email (if given) must be one. */
export function validate(v: RequestValues): Errors {
  const e: Errors = {};
  if (!v.message) e.message = 'Tell us what to draw.';
  if (v.email && !EMAIL.test(v.email)) e.email = 'Enter a valid email, or leave it empty.';
  return e;
}
