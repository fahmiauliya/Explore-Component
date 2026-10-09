import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type { Entry } from '../figures';
import { loadFigure, loadKernel, mountFigure, pointAt } from '../hairline';
import { TOKENS, hairlineVars, type Theme } from '../tokens';

const SIZE = 1080, FPS = 60, LEAD = 0.6, TAIL = 2;
// only the drawing, on the plain background: its extent over every state fills the middle 70% of the frame
const SAFE = 0.7;
const PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity', 'display', 'visibility'];

type Progress = (fraction: number) => void;

/**
 * A scripted demo loop of one illustration as an MP4: rest, each hover target in turn, then rest again. Only the
 * drawing: no frame, no labels, centred on the plain background.
 * The figure runs in a hidden frame on a virtual clock, so every one of the 60 frames a second is exact,
 * and the frames are encoded in the browser (WebCodecs H.264 into an MP4 container).
 */
export async function renderVideo(entry: Entry, theme: Theme, intensity: number, onProgress: Progress): Promise<Blob> {
  const seconds = entry.seconds ?? 8, frames = Math.round(seconds * FPS);
  const stops = entry.targets.map((t) => t.at);
  if (entry.returnTo) stops.push(entry.targets.find((t) => t.label === entry.returnTo)!.at);
  const dwell = (seconds - LEAD - TAIL) / stops.length;
  const script: { t: number; at?: [number, number] }[] = [...stops.map((at, i) => ({ t: LEAD + i * dwell, at })), { t: seconds - TAIL }];

  const scene = await openScene(entry, theme, intensity);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const sink = await encoderFor(canvas);
  try {
    let next = 0;
    for (let i = 0; i < frames; i++) {
      const t = i / FPS;
      while (next < script.length && script[next].t <= t + 1e-9) {
        const s = script[next++];
        pointAt(scene.stage, s.at ? 'pointermove' : 'pointerleave', s.at);
        await new Promise((r) => setTimeout(r, 0)); // a mouse leave lands on the next task
      }
      scene.advance(t * 1000);
      await drawFrame(ctx, scene, theme, entry);
      await sink.add(i);
      onProgress((i + 1) / frames);
    }
    return await sink.finish();
  } finally {
    scene.close();
  }
}

/** The figure in a hidden same-origin frame whose clock, frame loop and transitions advance only when told to. */
async function openScene(entry: Entry, theme: Theme, intensity: number) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  // on screen (so the kernel's visibility check passes) but invisible and out of the way
  frame.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:320px;border:0;opacity:0;pointer-events:none;z-index:-1;';
  frame.srcdoc = '<!doctype html><html><body style="margin:0"></body></html>';
  document.body.append(frame);
  await new Promise((r) => frame.addEventListener('load', r, { once: true }));
  const win = frame.contentWindow!, doc = frame.contentDocument!;

  let now = 0, ids = 1;
  const queue = new Map<number, FrameRequestCallback>();
  Object.assign(win, {
    requestAnimationFrame: (cb: FrameRequestCallback) => { queue.set(ids, cb); return ids++; },
    cancelAnimationFrame: (id: number) => { queue.delete(id); },
  });
  Object.defineProperty(win.performance, 'now', { value: () => now, configurable: true });

  const HL = loadKernel(win), figure = loadFigure(entry.source, HL, win);
  const stage = doc.createElement('div');
  stage.style.width = '400px';
  for (const [k, v] of Object.entries(hairlineVars(theme))) stage.style.setProperty(`--hairline-${k}`, v);
  const tint = doc.createElement('style');
  tint.textContent = '[data-hairline] > svg .dot.off { fill: var(--hairline-tint); }';
  doc.head.append(tint);
  doc.body.append(stage);
  let status = 'rest';
  const handle = mountFigure(HL, stage, figure, intensity, (text) => { status = text; });
  // let the kernel's visibility observer see the stage before the clock starts
  for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 60));

  const started = new Map<Animation, number>();
  return {
    stage,
    get status() { return status; },
    svg: stage.querySelector('svg') as SVGSVGElement,
    win,
    /** Moves the clock to ms: runs the frame loop once, then sets every colour transition to its own elapsed time. */
    advance(ms: number) {
      now = ms;
      const due = [...queue.values()];
      queue.clear();
      due.forEach((cb) => cb(now));
      for (const a of doc.getAnimations()) {
        if (!started.has(a)) started.set(a, now);
        a.pause();
        a.currentTime = now - started.get(a)!;
      }
    },
    close() { handle.destroy(); frame.remove(); },
  };
}

type Scene = Awaited<ReturnType<typeof openScene>>;

/** The svg as a standalone image: every shape carries its computed colours, and strokes scale with the frame. */
function snapshot(scene: Scene, w: number, h: number) {
  const { svg, win } = scene;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const from = svg.querySelectorAll('*'), to = clone.querySelectorAll('*');
  from.forEach((el, i) => {
    const cs = win.getComputedStyle(el), out = to[i] as SVGElement;
    out.setAttribute('style', PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';') + ';vector-effect:none');
    out.removeAttribute('class');
  });
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  return new XMLSerializer().serializeToString(clone);
}

async function drawFrame(ctx: CanvasRenderingContext2D, scene: Scene, theme: Theme, entry: Entry) {
  const [x0, y0, x1, y1] = entry.box, k = (SIZE * SAFE) / Math.max(x1 - x0, y1 - y0);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(snapshot(scene, 400 * k, 320 * k));
  await img.decode();
  ctx.fillStyle = TOKENS[theme].bg;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(img, SIZE / 2 - ((x0 + x1) / 2) * k, SIZE / 2 - ((y0 + y1) / 2) * k, 400 * k, 320 * k);
}

/** H.264 in an MP4, with exact timestamps. Where WebCodecs is missing, MediaRecorder records MP4 in real time. */
async function encoderFor(canvas: HTMLCanvasElement) {
  if ('VideoEncoder' in window) {
    const codecs = ['avc1.64002A', 'avc1.4D002A', 'avc1.42002A', 'avc1.640033'];
    // constant quality where the browser offers it, so the very first keyframe is as clean as the rest
    let config: VideoEncoderConfig | null = null;
    for (const mode of ['quantizer', 'variable'] as BitrateMode[]) {
      for (const codec of codecs) {
        const c = { codec, width: SIZE, height: SIZE, bitrate: 16_000_000, bitrateMode: mode, framerate: FPS, avc: { format: 'avc' } } as VideoEncoderConfig;
        if ((await VideoEncoder.isConfigSupported(c).catch(() => ({ supported: false }))).supported) { config = c; break; }
      }
      if (config) break;
    }
    const quantized = config?.bitrateMode === 'quantizer';
    if (config) {
      const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: SIZE, height: SIZE, frameRate: FPS }, fastStart: 'in-memory' });
      let failure: Error | null = null;
      const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { failure = e; } });
      encoder.configure(config);
      return {
        async add(i: number) {
          if (failure) throw failure;
          // from the raw pixels, so every frame, the first included, takes the same colour conversion
          const pixels = canvas.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;
          const frame = new VideoFrame(pixels, { format: 'RGBA', codedWidth: SIZE, codedHeight: SIZE, timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
          encoder.encode(frame, quantized ? ({ keyFrame: i % FPS === 0, avc: { quantizer: 16 } } as VideoEncoderEncodeOptions) : { keyFrame: i % FPS === 0 });
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
  }
  const type = ['video/mp4;codecs=avc1', 'video/mp4'].find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m));
  if (!type) throw new Error('This browser cannot encode MP4 video. Try a recent Chrome, Edge, Safari or Firefox.');
  const stream = canvas.captureStream(0), track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
  const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 10_000_000 });
  const parts: Blob[] = [];
  recorder.ondataavailable = (e) => parts.push(e.data);
  recorder.start();
  let clock = performance.now();
  return {
    async add() {
      track.requestFrame();
      clock += 1000 / FPS; // real time: MediaRecorder stamps frames as they arrive
      const wait = clock - performance.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    },
    async finish() {
      const stopped = new Promise((r) => (recorder.onstop = r));
      recorder.stop();
      await stopped;
      return new Blob(parts, { type: 'video/mp4' });
    },
  };
}
