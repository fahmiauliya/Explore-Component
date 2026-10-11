import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import kernelSource from './vendor/hairline-kernel.js?raw';

/*
 * One illustration in a hidden same-origin frame whose clock, frame loop and colour transitions advance only when
 * told to. The figure file and the kernel are evaluated unchanged inside it, so drawing and motion are the originals.
 */
type Realm = Window & typeof globalThis;
type Figure = {
  name: string;
  range: [number, number, number];
  mount: (ctx: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string } }, value: number) => { set(v: number): void; destroy(): void };
};
export type Palette = { plate: string; lo: string; mid: string; edge: string; hi: string; tint: string };

export async function openScene(source: string, palette: Palette) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  // on screen, so the kernel's visibility check passes, but invisible and out of the way
  frame.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:320px;border:0;opacity:0;pointer-events:none;z-index:-1;';
  frame.srcdoc = '<!doctype html><html><body style="margin:0"></body></html>';
  document.body.append(frame);
  await new Promise((r) => frame.addEventListener('load', r, { once: true }));
  const win = frame.contentWindow as Realm, doc = frame.contentDocument!;

  let now = 0, ids = 1;
  const queue = new Map<number, FrameRequestCallback>();
  Object.assign(win, {
    requestAnimationFrame: (cb: FrameRequestCallback) => { queue.set(ids, cb); return ids++; },
    cancelAnimationFrame: (id: number) => { queue.delete(id); },
  });
  Object.defineProperty(win.performance, 'now', { value: () => now, configurable: true });

  const HL = new win.Function(`${kernelSource}\nreturn HL;`)();
  let figure: Figure | undefined;
  new win.Function('HL', 'hairline', source)(HL, (f: Figure) => { figure = f; });
  const stage = doc.createElement('div');
  stage.style.width = '400px';
  const style = doc.createElement('style');
  style.textContent = '[data-hairline] > svg .dot.off { fill: var(--hairline-tint); }';
  doc.head.append(style);
  doc.body.append(stage);
  const setPalette = (p: Palette) => { for (const [k, v] of Object.entries(p)) stage.style.setProperty(`--hairline-${k}`, v); };
  setPalette(palette);

  HL.inject(doc);
  stage.setAttribute('data-hairline', figure!.name);
  const svg = HL.mk('svg', { viewBox: '0 0 400 320' }, stage) as SVGSVGElement;
  let status = 'rest';
  const read = { get textContent() { return status; }, set textContent(v: string) { status = v || 'rest'; } };
  const [lo, mid, hi] = figure!.range; void lo; void hi;
  const handle = figure!.mount({ stage, svg, read }, mid);
  // let the kernel's visibility observer see the stage before the clock starts
  for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 60));

  const started = new Map<Animation, number>();
  let changed = true;
  const watch = new win.MutationObserver(() => { changed = true; });
  watch.observe(stage, { subtree: true, attributes: true, childList: true, characterData: true });

  return {
    stage,
    get status() { return status; },
    /** Moves the clock to ms: runs the frame loop once, then sets every colour transition to its own elapsed time. */
    advance(ms: number) {
      now = Math.max(now, ms);
      const due = [...queue.values()];
      queue.clear();
      due.forEach((cb) => cb(now));
      for (const a of doc.getAnimations()) {
        if (!started.has(a)) started.set(a, now);
        a.pause();
        a.currentTime = now - started.get(a)!;
      }
    },
    /** True once after anything in the drawing changed. */
    takeChange() { const c = changed || watch.takeRecords().length > 0 || doc.getAnimations().length > 0; changed = false; return c; },
    setPalette(p: Palette) { setPalette(p); changed = true; },
    /** A pointer event at a viewBox point, as the bench sends one; with no point, the pointer leaves. */
    point(at?: [number, number]) {
      const r = stage.getBoundingClientRect(), [x, y] = at ?? [-1, -1];
      stage.dispatchEvent(new win.PointerEvent(at ? 'pointermove' : 'pointerleave', {
        pointerType: 'mouse', pointerId: 1, bubbles: !!at, clientX: r.left + (x / 400) * r.width, clientY: r.top + (y / 320) * r.height,
      }));
    },
    /**
     * The drawing as a standalone svg of w × h: every shape carries its computed colours, every stroke the given
     * width in viewBox units (so 1.5 frame pixels at any scale), dashes scaled with it.
     */
    snapshot(w: number, h: number, stroke: number) {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      const from = svg.querySelectorAll('*'), to = clone.querySelectorAll('*');
      from.forEach((el, i) => {
        const cs = win.getComputedStyle(el), out = to[i] as SVGElement, dash = cs.getPropertyValue('stroke-dasharray');
        let css = PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';') + `;vector-effect:none;stroke-width:${stroke}`;
        if (dash && dash !== 'none') css += `;stroke-dasharray:${dash.split(/[ ,]+/).map((d) => (parseFloat(d) * stroke).toFixed(4)).join(' ')}`;
        out.setAttribute('style', css);
        out.removeAttribute('class');
      });
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', String(w));
      clone.setAttribute('height', String(h));
      return new XMLSerializer().serializeToString(clone);
    },
    close() { watch.disconnect(); handle.destroy(); frame.remove(); },
  };
}
export type Scene = Awaited<ReturnType<typeof openScene>>;

const PROPS = ['fill', 'stroke', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity', 'display', 'visibility'];

/** H.264 in an MP4 with exact timestamps (WebCodecs + mp4-muxer), at constant quality where the browser offers it. */
export async function encoderFor(canvas: HTMLCanvasElement, W: number, H: number, fps: number) {
  if (!('VideoEncoder' in window)) throw new Error('This browser cannot encode video frame by frame (no WebCodecs). Try a recent Chrome, Edge, Safari or Firefox.');
  let config: VideoEncoderConfig | null = null;
  for (const mode of ['quantizer', 'variable'] as BitrateMode[]) {
    for (const codec of ['avc1.64002A', 'avc1.4D002A', 'avc1.42002A', 'avc1.640033']) {
      const c = { codec, width: W, height: H, bitrate: 16_000_000, bitrateMode: mode, framerate: fps, avc: { format: 'avc' } } as VideoEncoderConfig;
      if ((await VideoEncoder.isConfigSupported(c).catch(() => ({ supported: false }))).supported) { config = c; break; }
    }
    if (config) break;
  }
  if (!config) throw new Error('This browser has no H.264 encoder.');
  const quantized = config.bitrateMode === 'quantizer';
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H, frameRate: fps }, fastStart: 'in-memory' });
  let failure: Error | null = null;
  const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { failure = e; } });
  encoder.configure(config);
  return {
    async add(i: number) {
      if (failure) throw failure;
      // from the raw pixels, so every frame, the first included, takes the same colour conversion
      const pixels = canvas.getContext('2d')!.getImageData(0, 0, W, H).data;
      const frame = new VideoFrame(pixels, { format: 'RGBA', codedWidth: W, codedHeight: H, timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      encoder.encode(frame, quantized ? ({ keyFrame: i % fps === 0, avc: { quantizer: 16 } } as VideoEncoderEncodeOptions) : { keyFrame: i % fps === 0 });
      frame.close();
      while (encoder.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 4));
    },
    async finish() {
      await encoder.flush();
      if (failure) throw failure;
      encoder.close();
      muxer.finalize();
      return new Blob([muxer.target.buffer], { type: 'video/mp4' });
    },
  };
}
