import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type { Entry } from '../figures';
import type { Theme } from '../tokens';
import { drawScene, openScene, playDemo, type Progress } from './scene';

const SIZE = 1080, FPS = 60;
// only the drawing, on the plain background: its extent over every state fills the middle 70% of the frame
const SAFE = 0.7;

/**
 * A scripted demo loop of one illustration as an MP4: rest, each hover target in turn, then rest again. Only the
 * drawing: no frame, no labels, centred on the plain background. Every one of the 60 frames a second is exact, and
 * the frames are encoded in the browser (WebCodecs H.264 into an MP4 container).
 */
export async function renderVideo(entry: Entry, theme: Theme, intensity: number, onProgress: Progress): Promise<Blob> {
  const scene = await openScene(entry, theme, intensity);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const sink = await encoderFor(canvas);
  try {
    await playDemo(scene, entry, FPS, async (i, frames) => {
      await drawScene(ctx, scene, entry, theme, SAFE, true);
      await sink.add(i);
      onProgress((i + 1) / frames);
    });
    return await sink.finish();
  } finally {
    scene.close();
  }
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
