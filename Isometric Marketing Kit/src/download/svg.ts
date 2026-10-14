import { strToU8, zipSync, type Zippable } from 'fflate';
import type { Entry } from '../figures';
import { TOKENS, type Theme } from '../tokens';
import { cropOf, openScene, type Progress } from './scene';

/*
 * Clean, standalone SVG of a figure, for Figma, Illustrator and code: the SVG (.zip) download. Kept apart from the
 * video encoders so it loads only this.
 */

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pad = (n: number) => String(n).padStart(2, '0');

/** How long a state is given to come to rest before it is drawn. */
const SETTLE = 2.5;
/** Attributes kept from the drawing: geometry and structure only. Colours are written back from computed style. */
const KEEP = new Set(['d', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'points', 'transform', 'id', 'href', 'offset',
  'gradientUnits', 'gradientTransform', 'clipPathUnits', 'patternUnits', 'viewBox', 'preserveAspectRatio', 'stop-color', 'stop-opacity', 'fill-rule', 'clip-rule', 'clip-path', 'mask']);
/** Attributes whose numbers are rounded to 2 decimals. */
const NUMERIC = new Set(['d', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'points', 'transform', 'stroke-width', 'stroke-dasharray', 'opacity', 'fill-opacity', 'stroke-opacity']);
const round = (v: string) => v.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (n) => String(Math.round(Number(n) * 100) / 100));

/** The states an SVG download holds: rest, then each hover target. */
export const statesOf = (entry: Entry) => [
  { name: 'default', at: undefined as [number, number] | undefined },
  // a one-step-per-hover figure: each successive hover of its target is a state of its own
  ...(entry.repeat ? entry.repeat.map((label) => ({ name: slugify(label), at: entry.targets[0].at })) : entry.targets.map((t) => ({ name: `hover-${slugify(t.label)}`, at: t.at }))),
];

/** A colour from computed style as hex, with its alpha apart (rgba → #rrggbb + opacity). */
function hex(css: string): { color: string; alpha: number } | null {
  if (!css || css === 'none') return null;
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return { color: css, alpha: 1 };
  const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean);
  const h = (v: string) => Math.round(Number(v)).toString(16).padStart(2, '0');
  return { color: `#${h(r)}${h(g)}${h(b)}`.toUpperCase(), alpha: Number(a) };
}

const scaleOf = (m: DOMMatrix | null) => (m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1 : 1);

/**
 * A figure's svg as a clean, standalone SVG: a viewBox (the drawing's extent over every state plus 6%, the same for
 * every state so files line up), computed colours as plain hex attributes, strokes in the drawing's own units (1.5 at
 * its native size, however large it is shown), hidden layers dropped, no classes, styles, data or event attributes,
 * coordinates rounded to 2 decimals, and the background as its own deletable layer. `win` is the window it lives in.
 */
export function cleanSvg(svg: SVGSVGElement, win: Window, entry: Entry, theme: Theme, title: string) {
  const ns = 'http://www.w3.org/2000/svg', clone = svg.cloneNode(true) as SVGSVGElement;
  const from = [...svg.querySelectorAll('*')], to = [...clone.querySelectorAll('*')], drop: Element[] = [];
  // a non-scaling stroke is drawn in screen pixels; in the drawing's units it is that times the svg's own scale on
  // screen, over the element's
  const rootScale = scaleOf(svg.getScreenCTM());
  from.forEach((el, i) => {
    const out = to[i], cs = win.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) { drop.push(out); return; }
    for (const a of [...out.attributes]) if (!KEEP.has(a.name)) out.removeAttribute(a.name);
    if (el.tagName === 'g') { if (Number(cs.opacity) < 1) out.setAttribute('opacity', String(+Number(cs.opacity).toFixed(3))); return; }
    if (!(el instanceof (win as Window & typeof globalThis).SVGGeometryElement) && el.tagName !== 'use') return;
    const fill = hex(cs.fill), stroke = hex(cs.stroke);
    out.setAttribute('fill', fill ? fill.color : 'none');
    if (fill && fill.alpha * Number(cs.fillOpacity || 1) < 1) out.setAttribute('fill-opacity', String(fill.alpha * Number(cs.fillOpacity || 1)));
    if (stroke && parseFloat(cs.strokeWidth) > 0) {
      const factor = cs.vectorEffect === 'non-scaling-stroke' ? rootScale / scaleOf((el as SVGGraphicsElement).getScreenCTM()) : 1;
      out.setAttribute('stroke', stroke.color);
      out.setAttribute('stroke-width', String(parseFloat(cs.strokeWidth) * factor));
      if (stroke.alpha * Number(cs.strokeOpacity || 1) < 1) out.setAttribute('stroke-opacity', String(stroke.alpha * Number(cs.strokeOpacity || 1)));
      if (cs.strokeLinecap !== 'butt') out.setAttribute('stroke-linecap', cs.strokeLinecap);
      if (cs.strokeLinejoin !== 'miter') out.setAttribute('stroke-linejoin', cs.strokeLinejoin);
      if (cs.strokeDasharray && cs.strokeDasharray !== 'none') out.setAttribute('stroke-dasharray', cs.strokeDasharray.split(/[ ,]+/).map((d) => String(parseFloat(d) * factor)).join(' '));
    } else out.setAttribute('stroke', 'none');
    if (Number(cs.opacity) < 1) out.setAttribute('opacity', cs.opacity);
    for (const a of [...out.attributes]) if (NUMERIC.has(a.name)) out.setAttribute(a.name, round(a.value));
  });
  drop.forEach((el) => el.remove());
  for (const a of [...clone.attributes]) clone.removeAttribute(a.name);
  const [x, y, w, h] = cropOf(entry, 0.06);
  clone.setAttribute('xmlns', ns);
  clone.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const titleEl = document.createElementNS(ns, 'title');
  titleEl.textContent = title;
  const bg = document.createElementNS(ns, 'rect');
  for (const [k, v] of Object.entries({ id: 'background', x, y, width: w, height: h, fill: TOKENS[theme].bg })) bg.setAttribute(k, String(v));
  clone.prepend(titleEl, bg);
  const markup = new XMLSerializer().serializeToString(clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`;
}

/** Every state as its own SVG, in one ZIP. Each hover starts from rest, as a person's first hover would (a
 *  one-step-per-hover figure keeps its progress between them, so each file is the next step). */
export async function renderSvgStates(entry: Entry, theme: Theme, value: number, onProgress: Progress) {
  const scene = await openScene(entry, theme, value);
  try {
    const files: Zippable = {}, states = statesOf(entry), folder = `${entry.slug}-svg-${theme}`;
    for (const [i, state] of states.entries()) {
      await scene.point();
      scene.settle(SETTLE);
      if (state.at) { await scene.point(state.at); scene.settle(SETTLE); }
      files[`${folder}/${pad(i + 1)}-${state.name}.svg`] = strToU8(cleanSvg(scene.svg, scene.win, entry, theme, `${entry.name} · ${state.name.replace(/-/g, ' ')}`));
      onProgress((i + 1) / states.length);
    }
    return new Blob([zipSync(files)], { type: 'application/zip' });
  } finally {
    scene.close();
  }
}
