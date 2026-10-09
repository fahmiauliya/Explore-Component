import kernelSource from './vendor/hairline-kernel.js?raw';

export type Read = { textContent: string };
export type Handle = { set: (value: number) => void; destroy: () => void };
export type Figure = {
  name: string;
  means: string;
  rules: number[];
  range: [number, number, number];
  mount: (ctx: { stage: HTMLElement; svg: SVGSVGElement; read: Read }, value: number) => Handle;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Kernel = any;

type Realm = Window & typeof globalThis;

/** The hairline kernel, evaluated in a window: its frame loop, clock and DOM are that window's. */
export function loadKernel(win: Window = window): Kernel {
  return new (win as Realm).Function(`${kernelSource}\nreturn HL;`)();
}

/** A figure file, unchanged: it reads HL and hands its description to hairline(). */
export function loadFigure(source: string, HL: Kernel, win: Window = window): Figure {
  let figure: Figure | undefined;
  new (win as Realm).Function('HL', 'hairline', source)(HL, (f: Figure) => { figure = f; });
  if (!figure) throw new Error('The figure did not call hairline().');
  return figure;
}

/** The slider's 0–1 position as the figure's own number: two straight lines meeting at 0.5, as on the bench. */
export function valueAt(range: [number, number, number], i: number) {
  const [lo, mid, hi] = range;
  return Math.round((i <= 0.5 ? lo + (i / 0.5) * (mid - lo) : mid + ((i - 0.5) / 0.5) * (hi - mid)) * 1000) / 1000;
}

/** Mounts a figure into a host element the way the bench does: data-hairline, a 400 × 320 svg and a read-out. */
export function mountFigure(HL: Kernel, host: HTMLElement, figure: Figure, value: number, onRead: (text: string) => void): Handle {
  HL.inject(host.ownerDocument);
  host.setAttribute('data-hairline', figure.name);
  host.setAttribute('role', 'img');
  host.setAttribute('aria-label', figure.means);
  const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, host) as SVGSVGElement;
  let text = '';
  const read: Read = {
    get textContent() { return text; },
    set textContent(v: string) { text = v == null ? '' : String(v); onRead(text); },
  };
  const handle = figure.mount({ stage: host, svg, read }, value);
  if (!text) read.textContent = 'rest';
  return { set: (v) => handle.set(v), destroy: () => { handle.destroy(); svg.remove(); } };
}

/** A pointer event at a viewBox point of a stage, as the bench sends one. */
export function pointAt(stage: HTMLElement, type: 'pointermove' | 'pointerleave', at?: [number, number]) {
  const r = stage.getBoundingClientRect(), Ev = (stage.ownerDocument.defaultView as Realm).PointerEvent;
  const [x, y] = at ?? [-1, -1];
  stage.dispatchEvent(new Ev(type, {
    pointerType: 'mouse', pointerId: 1, bubbles: type === 'pointermove',
    clientX: r.left + (x / 400) * r.width, clientY: r.top + (y / 320) * r.height,
  }));
}
