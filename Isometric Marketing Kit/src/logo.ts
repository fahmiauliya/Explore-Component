import { GEIST_EM } from './logo-glyphs';

/*
 * Any SVG logo as line art, in the browser: every visible shape (path, rect, circle, ellipse, line, polyline, polygon,
 * and text, set in Geist Medium outlines at the browser's own character positions) with its transforms applied,
 * as one outline path in a unit square (x and y 0 to 1, y down), fitted and centred with its proportions kept.
 * Colours, gradients, filters, images and masks are dropped; holes are simply more outlines, so they stay empty;
 * shapes under 1.5% of the logo's size are dropped as noise. Only absolute M, L, C, Q and Z come out, which is all the
 * receipt printer's figure reads. Nothing leaves the browser: the file is parsed into a sandboxed frame that can't
 * run scripts.
 */

export const LOGO_MAX_BYTES = 1_000_000;
/** The default logo, the Compo mark: Geist Medium's "C" outline in the unit square (the receipt printer's own default). */
export const DEFAULT_LOGO = 'M0.511 1Q0.382 1 0.283 0.94Q0.185 0.88 0.13 0.768Q0.076 0.655 0.076 0.501L0.076 0.501Q0.076 0.349 0.13 0.236Q0.185 0.123 0.283 0.062Q0.382 0 0.512 0L0.512 0Q0.685 0 0.786 0.087Q0.886 0.174 0.918 0.336L0.918 0.336L0.765 0.344Q0.745 0.243 0.682 0.188Q0.62 0.134 0.512 0.134L0.512 0.134Q0.426 0.134 0.362 0.178Q0.297 0.223 0.262 0.305Q0.226 0.388 0.226 0.501L0.226 0.501Q0.226 0.615 0.262 0.697Q0.297 0.779 0.362 0.822Q0.426 0.866 0.511 0.866L0.511 0.866Q0.624 0.866 0.689 0.806Q0.753 0.747 0.772 0.636L0.772 0.636L0.924 0.644Q0.897 0.811 0.791 0.905Q0.685 1 0.511 1L0.511 1Z';
const MAX_D = 120_000, NOISE = 0.015;

type Pt = [number, number];
type Seg = { c: 'L' | 'C' | 'Q'; p: Pt[] };
type Sub = { start: Pt; segs: Seg[]; closed: boolean };

export type LogoResult = { ok: true; d: string; shapes: number } | { ok: false };
const FAIL: LogoResult = { ok: false };

export async function logoFromFile(file: File): Promise<LogoResult> {
  if (file.size > LOGO_MAX_BYTES || file.size === 0) return FAIL;
  if (!/\.svg$/i.test(file.name) && file.type !== 'image/svg+xml') return FAIL;
  try { return await logoFromText(await file.text()); } catch { return FAIL; }
}

export async function logoFromText(text: string): Promise<LogoResult> {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = doc.documentElement;
  if (doc.querySelector('parsererror') || root.localName !== 'svg') return FAIL;
  sanitise(doc);
  inlineUses(doc);

  // lay it out in a frame that can't run scripts (no allow-scripts), so transforms and styles can be read
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1000px;height:1000px;border:0;visibility:hidden;pointer-events:none;';
  if (!root.getAttribute('width') && !root.getAttribute('height')) { root.setAttribute('width', '1000'); root.setAttribute('height', '1000'); }
  frame.srcdoc = `<!doctype html><html><body style="margin:0">${new XMLSerializer().serializeToString(root)}</body></html>`;
  document.body.append(frame);
  try {
    await new Promise((r) => frame.addEventListener('load', r, { once: true }));
    const win = frame.contentWindow!, svg = frame.contentDocument!.querySelector('svg') as SVGSVGElement | null;
    if (!svg) return FAIL;
    const toRoot = svg.getScreenCTM()?.inverse();
    if (!toRoot) return FAIL;
    const shapes = [...svg.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,text')]
      .filter((el) => !el.closest('defs,clipPath,mask,symbol,pattern,marker,linearGradient,radialGradient,filter') && visible(el, win, svg));
    let subs: Sub[] = [];
    const vb = svg.viewBox.baseVal, area = vb && vb.width ? vb.width * vb.height : svg.width.baseVal.value * svg.height.baseVal.value;
    shapes.forEach((el, i) => {
      const m = toRoot.multiply((el as SVGGraphicsElement).getScreenCTM()!);
      const local = shapeOf(el as SVGGraphicsElement, win);
      // a page-sized pale rectangle first in line is the artboard's background, not the logo
      if (i === 0 && el.localName === 'rect' && shapes.length > 1) {
        const b = bounds(local.map((s) => xform(s, m))), fill = win.getComputedStyle(el).fill;
        if (area && (b[2] - b[0]) * (b[3] - b[1]) >= area * 0.95 && pale(fill)) return;
      }
      // a filled shape's outline is closed even where its path data doesn't close it
      const filled = win.getComputedStyle(el).fill !== 'none';
      subs.push(...local.map((s) => ({ ...xform(s, m), closed: s.closed || filled })));
    });
    if (!subs.length) return FAIL;
    // drop noise: subpaths smaller than 1.5% of the logo
    const all = bounds(subs), size = Math.max(all[2] - all[0], all[3] - all[1]);
    if (!(size > 0)) return FAIL;
    subs = subs.filter((s) => { const b = bounds([s]); return Math.max(b[2] - b[0], b[3] - b[1]) >= size * NOISE; });
    if (!subs.length) return FAIL;
    const d = unitPath(subs, 3);
    const out = d.length <= MAX_D ? d : unitPath(subs, 2);
    return out.length <= MAX_D ? { ok: true, d: out, shapes: subs.length } : FAIL;
  } finally {
    frame.remove();
  }
}

/* ---- safety: nothing that runs, loads or hides ---- */

function sanitise(doc: Document) {
  doc.querySelectorAll('script,foreignObject,iframe,image,video,audio,animate,animateMotion,animateTransform,set,a > script').forEach((n) => n.remove());
  for (const el of doc.querySelectorAll('*')) {
    for (const a of [...el.attributes]) {
      const n = a.name.toLowerCase();
      if (n.startsWith('on')) el.removeAttribute(a.name);
      else if ((n === 'href' || n === 'xlink:href') && !a.value.trim().startsWith('#')) el.removeAttribute(a.name);
      else if (n === 'style' && /url\s*\(|expression|@import/i.test(a.value)) el.setAttribute('style', a.value.replace(/url\s*\([^)]*\)/gi, 'none').replace(/@import[^;]*;?/gi, ''));
    }
  }
  doc.querySelectorAll('style').forEach((s) => { s.textContent = (s.textContent ?? '').replace(/@import[^;]*;?/gi, '').replace(/url\s*\([^)]*\)/gi, 'none'); });
}

/** <use href="#id"> becomes a copy of what it points at, so its shapes count like any other. */
function inlineUses(doc: Document) {
  for (let pass = 0; pass < 5; pass++) {
    const uses = [...doc.querySelectorAll('use')];
    if (!uses.length) return;
    for (const use of uses) {
      const id = (use.getAttribute('href') ?? use.getAttribute('xlink:href') ?? '').slice(1);
      const ref = id ? doc.getElementById(id) : null;
      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      for (const a of [...use.attributes]) if (!['href', 'xlink:href', 'x', 'y', 'width', 'height', 'transform'].includes(a.name)) g.setAttribute(a.name, a.value);
      g.setAttribute('transform', `${use.getAttribute('transform') ?? ''} translate(${use.getAttribute('x') ?? 0} ${use.getAttribute('y') ?? 0})`);
      if (ref && !ref.contains(use)) {
        const copy = ref.cloneNode(true) as Element;
        copy.removeAttribute('id');
        if (copy.localName === 'symbol') { const inner = doc.createElementNS('http://www.w3.org/2000/svg', 'g'); while (copy.firstChild) inner.append(copy.firstChild); g.append(inner); } else g.append(copy);
      }
      use.replaceWith(g);
    }
  }
}

function visible(el: Element, win: Window, svg: Element) {
  const cs = win.getComputedStyle(el);
  const paints = (cs.fill !== 'none' && Number(cs.fillOpacity) > 0) || (cs.stroke !== 'none' && Number(cs.strokeOpacity) > 0 && parseFloat(cs.strokeWidth) > 0);
  if (!paints) return false;
  for (let n: Element | null = el; n && n !== svg.parentElement; n = n.parentElement) {
    const s = win.getComputedStyle(n);
    if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse' || Number(s.opacity) === 0) return false;
  }
  return true;
}

function pale(fill: string) {
  const m = fill.match(/rgba?\(([^)]+)\)/);
  if (!m) return fill === 'none';
  const [r, g, b] = m[1].split(/[ ,/]+/).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 230;
}

/* ---- shapes as subpaths in their own coordinates ---- */

const K = 0.5522847498; // a quarter circle as a cubic

function ellipseSubs(cx: number, cy: number, rx: number, ry: number): Sub[] {
  if (!(rx > 0 && ry > 0)) return [];
  const kx = rx * K, ky = ry * K;
  return [{ start: [cx + rx, cy], closed: true, segs: [
    { c: 'C', p: [[cx + rx, cy + ky], [cx + kx, cy + ry], [cx, cy + ry]] },
    { c: 'C', p: [[cx - kx, cy + ry], [cx - rx, cy + ky], [cx - rx, cy]] },
    { c: 'C', p: [[cx - rx, cy - ky], [cx - kx, cy - ry], [cx, cy - ry]] },
    { c: 'C', p: [[cx + kx, cy - ry], [cx + rx, cy - ky], [cx + rx, cy]] },
  ] }];
}

function shapeOf(el: SVGGraphicsElement, win: Window): Sub[] {
  const n = (v: SVGAnimatedLength) => v.baseVal.value;
  switch (el.localName) {
    case 'path': return parsePath(el.getAttribute('d') ?? '');
    case 'rect': {
      const r = el as SVGRectElement, x = n(r.x), y = n(r.y), w = n(r.width), h = n(r.height);
      if (!(w > 0 && h > 0)) return [];
      let rx = n(r.rx), ry = n(r.ry);
      if (!r.hasAttribute('rx')) rx = ry; if (!r.hasAttribute('ry')) ry = rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!(rx > 0 && ry > 0)) return [{ start: [x, y], closed: true, segs: [{ c: 'L', p: [[x + w, y]] }, { c: 'L', p: [[x + w, y + h]] }, { c: 'L', p: [[x, y + h]] }] }];
      const kx = rx * K, ky = ry * K;
      return [{ start: [x + rx, y], closed: true, segs: [
        { c: 'L', p: [[x + w - rx, y]] }, { c: 'C', p: [[x + w - rx + kx, y], [x + w, y + ry - ky], [x + w, y + ry]] },
        { c: 'L', p: [[x + w, y + h - ry]] }, { c: 'C', p: [[x + w, y + h - ry + ky], [x + w - rx + kx, y + h], [x + w - rx, y + h]] },
        { c: 'L', p: [[x + rx, y + h]] }, { c: 'C', p: [[x + rx - kx, y + h], [x, y + h - ry + ky], [x, y + h - ry]] },
        { c: 'L', p: [[x, y + ry]] }, { c: 'C', p: [[x, y + ry - ky], [x + rx - kx, y], [x + rx, y]] },
      ] }];
    }
    case 'circle': { const c = el as SVGCircleElement; return ellipseSubs(n(c.cx), n(c.cy), n(c.r), n(c.r)); }
    case 'ellipse': { const e = el as SVGEllipseElement; return ellipseSubs(n(e.cx), n(e.cy), n(e.rx), n(e.ry)); }
    case 'line': { const l = el as SVGLineElement; return [{ start: [n(l.x1), n(l.y1)], closed: false, segs: [{ c: 'L', p: [[n(l.x2), n(l.y2)]] }] }]; }
    case 'polyline': case 'polygon': {
      const pts = [...(el as SVGPolylineElement).points].map((p) => [p.x, p.y] as Pt);
      return pts.length > 1 ? [{ start: pts[0], closed: el.localName === 'polygon', segs: pts.slice(1).map((p) => ({ c: 'L' as const, p: [p] })) }] : [];
    }
    case 'text': return textSubs(el as SVGTextElement, win);
  }
  return [];
}

/** Text as Geist Medium outlines, each character at the browser's own position for it, at the text's font size. */
function textSubs(el: SVGTextElement, win: Window): Sub[] {
  const out: Sub[] = [], text = el.textContent ?? '';
  let count = 0;
  try { count = el.getNumberOfChars(); } catch { return out; }
  for (let i = 0; i < count && i < 200; i++) {
    const ch = text[i] ?? '', glyph = GEIST_EM[ch] ?? GEIST_EM[ch.toUpperCase()];
    if (!glyph) continue;
    let at: DOMPoint, size = 16;
    try { at = el.getStartPositionOfChar(i); size = parseFloat(win.getComputedStyle(el).fontSize) || 16; } catch { continue; }
    out.push(...parsePath(glyph[1]).map((s) => mapSub(s, ([x, y]) => [at.x + x * size, at.y + y * size])));
  }
  return out;
}

/* ---- path data: every command to absolute M, L, C, Q, Z (arcs to cubics) ---- */

function parsePath(d: string): Sub[] {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
  const subs: Sub[] = [];
  let i = 0, cmd = '', cur: Pt = [0, 0], start: Pt = [0, 0], sub: Sub | null = null, lastC: Pt | null = null, lastQ: Pt | null = null;
  const num = () => Number(tokens[i++]);
  const isNum = () => i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i]);
  const begin = (p: Pt) => { sub = { start: p, segs: [], closed: false }; subs.push(sub); start = p; };
  const seg = (s: Seg) => { if (!sub) begin(cur); sub!.segs.push(s); };
  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++];
    else if (!cmd) { i++; continue; }
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const pt = (): Pt => { const x = num(), y = num(); return rel ? [cur[0] + x, cur[1] + y] : [x, y]; };
    if (C === 'Z') { if (sub) { (sub as Sub).closed = true; } cur = start; sub = null; lastC = lastQ = null; continue; }
    if (!isNum()) continue;
    if (C === 'M') { cur = pt(); begin(cur); cmd = rel ? 'l' : 'L'; lastC = lastQ = null; continue; }
    if (C === 'L') { cur = pt(); seg({ c: 'L', p: [cur] }); lastC = lastQ = null; }
    else if (C === 'H') { const x = num(); cur = [rel ? cur[0] + x : x, cur[1]]; seg({ c: 'L', p: [cur] }); lastC = lastQ = null; }
    else if (C === 'V') { const y = num(); cur = [cur[0], rel ? cur[1] + y : y]; seg({ c: 'L', p: [cur] }); lastC = lastQ = null; }
    else if (C === 'C') { const a = pt(), b = pt(), e = pt(); seg({ c: 'C', p: [a, b, e] }); lastC = b; lastQ = null; cur = e; }
    else if (C === 'S') { const a: Pt = lastC ? [2 * cur[0] - lastC[0], 2 * cur[1] - lastC[1]] : cur, b = pt(), e = pt(); seg({ c: 'C', p: [a, b, e] }); lastC = b; lastQ = null; cur = e; }
    else if (C === 'Q') { const a = pt(), e = pt(); seg({ c: 'Q', p: [a, e] }); lastQ = a; lastC = null; cur = e; }
    else if (C === 'T') { const a: Pt = lastQ ? [2 * cur[0] - lastQ[0], 2 * cur[1] - lastQ[1]] : cur, e = pt(); seg({ c: 'Q', p: [a, e] }); lastQ = a; lastC = null; cur = e; }
    else if (C === 'A') {
      const rx = num(), ry = num(), rot = num(), large = num(), sweep = num(), e = pt();
      for (const c of arcToCubics(cur, rx, ry, rot, !!large, !!sweep, e)) seg({ c: 'C', p: c });
      cur = e; lastC = lastQ = null;
    } else { i++; }
  }
  return subs.filter((s) => s.segs.length);
}

function arcToCubics(p0: Pt, rx: number, ry: number, rotDeg: number, large: boolean, sweep: boolean, p1: Pt): Pt[][] {
  if (!rx || !ry) return [[p0, p1, p1]];
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = (rotDeg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (p0[0] - p1[0]) / 2, dy = (p0[1] - p1[1]) / 2, x1 = cos * dx + sin * dy, y1 = -sin * dx + cos * dy;
  const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1, den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const co = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cx1 = (co * rx * y1) / ry, cy1 = (-co * ry * x1) / rx;
  const cx = cos * cx1 - sin * cy1 + (p0[0] + p1[0]) / 2, cy = sin * cx1 + cos * cy1 + (p0[1] + p1[1]) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
  let t1 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry), dt = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI; else if (sweep && dt < 0) dt += 2 * Math.PI;
  const parts = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2))), step = dt / parts, out: Pt[][] = [];
  const at = (t: number): Pt => [cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos];
  const der = (t: number): Pt => [-rx * Math.sin(t) * cos - ry * Math.cos(t) * sin, -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos];
  const k = (4 / 3) * Math.tan(step / 4);
  for (let j = 0; j < parts; j++) {
    const a = t1 + j * step, b = a + step, pa = at(a), pb = at(b), da = der(a), db = der(b);
    out.push([[pa[0] + k * da[0], pa[1] + k * da[1]], [pb[0] - k * db[0], pb[1] - k * db[1]], j === parts - 1 ? p1 : pb]);
  }
  return out;
}

/* ---- geometry ---- */

const mapSub = (s: Sub, f: (p: Pt) => Pt): Sub => ({ start: f(s.start), closed: s.closed, segs: s.segs.map((g) => ({ c: g.c, p: g.p.map(f) })) });
const xform = (s: Sub, m: DOMMatrix) => mapSub(s, ([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);

function bounds(subs: Sub[]): [number, number, number, number] {
  let b: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const s of subs) for (const p of [s.start, ...s.segs.flatMap((g) => g.p)]) b = [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])];
  return b;
}

/** All subpaths fitted into the unit square, proportions kept, centred; absolute M, L, C, Q, Z with `dp` decimals. */
function unitPath(subs: Sub[], dp: number) {
  const [x0, y0, x1, y1] = bounds(subs), s = 1 / Math.max(x1 - x0, y1 - y0);
  const ox = (1 - (x1 - x0) * s) / 2, oy = (1 - (y1 - y0) * s) / 2, f = 10 ** dp;
  const p = ([x, y]: Pt) => `${Math.round(((x - x0) * s + ox) * f) / f} ${Math.round(((y - y0) * s + oy) * f) / f}`;
  return subs.map((sub) => `M${p(sub.start)}${sub.segs.map((g) => g.c + g.p.map(p).join(' ')).join('')}${sub.closed ? 'Z' : ''}`).join('');
}
