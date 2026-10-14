import kernelSource from '../vendor/hairline-kernel.js?raw';
import type { Entry } from '../figures';
import type { Figure } from '../hairline';
import { FIGURE_CSS, hairlineVars } from '../tokens';
import { lower } from '../meta';

/** A self-contained React component: the kernel, the figure, both themes. It depends only on React. */
/** `custom`: the Customize block's current values, which become those props' defaults (the box's letter). */
export function componentSource(entry: Entry, figure: Figure, intensity: number, custom: Record<string, string> = {}) {
  const [lo, , hi] = figure.range;
  const extra = (entry.props ?? []).map((p) => ({ ...p, fallback: custom[p.name] || p.fallback }));
  const jarsOf = (v: string) => v.split('|').map((s) => { const [label = '', percent = '0'] = s.split(':'); return { label, percent: Number(percent) || 0 }; });
  const extraDocs = extra.map((p) => `\n *   ${p.name.padEnd(12)} ${p.type.padEnd(18)} ${p.doc}. ${p.kind === 'jars' ? `Default ${JSON.stringify(jarsOf(p.fallback))}.` : p.kind === 'toggle' || p.kind === 'stepper' ? `Default ${p.fallback}.` : p.optional && !p.fallback ? 'Optional.' : `Default "${p.fallback}".`}`).join('');
  const extraParams = extra.map((p) => `, ${p.name} = ${p.kind === 'toggle' ? String(p.fallback !== 'false') : p.kind === 'stepper' ? String(Number(p.fallback)) : p.kind === 'jars' ? JSON.stringify(jarsOf(p.fallback)) : JSON.stringify(p.fallback)}`).join('');
  // the jars travel as one attribute, "LABEL:PERCENT|…", the way the figure reads them
  const extraAttrs = extra.map((p) => `\n      data-${p.attr ?? p.name}={${p.kind === 'toggle' ? `String(${p.name})` : p.kind === 'jars' ? `(${p.name} || []).map((j) => j.label + ":" + j.percent).join("|")` : p.name}}`).join('');
  const tokens = JSON.stringify({ dark: hairlineVars('dark'), light: hairlineVars('light') }, null, 2).replace(/\n/g, '\n');
  return `/**
 * ${entry.component} — ${entry.n} ${entry.name} · ${entry.topic}
 * ${figure.means}
 *
 * An interactive isometric line illustration from Compo. Self-contained: the drawing
 * kernel, the figure, its spring motion and hover logic, and the colour tokens for both themes are all in this
 * file. It depends only on React.
 *
 * Props
 *   theme        "dark" | "light"   colour tokens to draw with. Default "dark".
 *   intensity    number             the figure's own strength (its slider), from ${lo} to ${hi}. Default ${intensity}.
 *   interactive  boolean            whether hover and tap drive it. Default true.
 *   className    string             added to the wrapper element, a 5:4 box that fills its width.${extraDocs}
 *
 * The current state ("rest", or the hovered part) is mirrored on the wrapper as data-status.
 *
 * Usage
 *   import { ${entry.component} } from "./${entry.component}";
 *
 *   export default function Page() {
 *     return <${entry.component} theme="light" intensity={${intensity}} className="hero-art" />;
 *   }
 */
import { useEffect, useRef } from "react";

const TOKENS = ${tokens};

/* ---- the hairline drawing kernel, unchanged ---- */
${kernelSource.trim()}

/* ---- the figure, unchanged ---- */
const FIGURE = (() => {
  let figure;
  const hairline = (f) => { figure = f; };
${entry.source.trim().split('\n').map((line) => (line ? '  ' + line : line)).join('\n')}
  return figure;
})();

export function ${entry.component}({ theme = "dark", intensity = ${intensity}, interactive = true, className${extraParams} }) {
  const host = useRef(null);
  const handle = useRef(null);
  const first = useRef(intensity);

  useEffect(() => {
    const stage = host.current;
    HL.inject(stage.ownerDocument);
    if (!stage.ownerDocument.querySelector("style[data-figure-css]")) {
      const style = stage.ownerDocument.createElement("style");
      style.setAttribute("data-figure-css", "");
      style.textContent = ${JSON.stringify(FIGURE_CSS)};
      stage.ownerDocument.head.append(style);
    }
    const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
    let text = "";
    const read = {
      get textContent() { return text; },
      set textContent(v) { text = v == null ? "" : String(v); stage.dataset.status = text; },
    };
    handle.current = FIGURE.mount({ stage, svg, read }, first.current);
    if (!text) read.textContent = "rest";
    return () => { handle.current.destroy(); handle.current = null; svg.remove(); };
  }, []);

  useEffect(() => { if (handle.current) handle.current.set(intensity); }, [intensity]);

  const t = TOKENS[theme] || TOKENS.dark;
  return (
    <div
      ref={host}
      data-hairline={FIGURE.name}
      role="img"
      aria-label="${`${entry.name} illustration: ${lower(entry.topic)}`.replace(/"/g, '&quot;')}"
      className={className}${extraAttrs}
      style={{
        "--hairline-plate": t.plate, "--hairline-lo": t.lo, "--hairline-mid": t.mid, "--hairline-edge": t.edge, "--hairline-hi": t.hi, "--hairline-tint": t.tint,
        background: t.plate,
        pointerEvents: interactive ? undefined : "none",
      }}
    />
  );
}

export default ${entry.component};
`;
}
