import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Exact-time export of the Training Capacity card. The card loops every 8 s and the background
// video every 20 s, so the video loop is their common period, 40 s: five card loops, two video loops.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const folder = join(root, 'exports');
const width = 2082, height = 1560;
const output = join(folder, `training-capacity-${width}x${height}-60fps.mp4`);
const fps = 60, duration = 40, frames = fps * duration, videoFps = 30, videoFrames = 600;
mkdirSync(folder, { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=9384',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'training-capacity-export-'))}`,
  '--no-first-run', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank',
], { stdio: 'ignore' });
let ws, encoder;
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { await (await fetch('http://127.0.0.1:9384/json/version')).json(); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 250)); }
  }
  if (!ready) throw Error('Export browser did not start');
  const tab = await (await fetch('http://127.0.0.1:9384/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await once(ws, 'open');
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const request = pending.get(message.id);
    if (message.error) request?.reject(Error(JSON.stringify(message.error)));
    else request?.resolve(message.result);
    pending.delete(message.id);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id;
    pending.set(next, { resolve, reject });
    ws.send(JSON.stringify({ id: next, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: width / 2, height: height / 2, deviceScaleFactor: 2, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Page.navigate', { url: 'http://127.0.0.1:5188/' });
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log('Preparing exact-time export:', await evaluate(`(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
    const style = document.createElement('style');
    style.textContent = '#root{display:block;padding:0;width:1041px;height:780px;min-height:0}.preview{width:1041px;height:780px;aspect-ratio:auto}.artboard{transform:scale(1)!important}';
    document.head.append(style);
    // The background video joins the capture clock: paused, and stepped to the source frame for each instant.
    const video = document.querySelector('.scene-background');
    video.removeAttribute('autoplay');
    video.pause();
    if (video.readyState < 2) await new Promise(resolve => video.addEventListener('loadeddata', resolve, { once: true }));
    window.__seek = seconds => new Promise(resolve => {
      const target = ((Math.floor(seconds * ${videoFps} + 1e-6) % ${videoFrames}) + .5) / ${videoFps};
      if (Math.abs(video.currentTime - target) < 1e-4) return resolve();
      const timeout = setTimeout(resolve, 3000);
      video.requestVideoFrameCallback(() => { clearTimeout(timeout); resolve(); });
      video.currentTime = target;
    });
    await window.__seek(0);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.__exportAnimations = document.getAnimations();
    window.__exportAnimations.forEach(animation => { animation.pause(); animation.currentTime = 0; });
    return { animations: window.__exportAnimations.length, video: [video.videoWidth, video.videoHeight, video.duration], width: document.querySelector('.artboard').getBoundingClientRect().width };
  })()`));
  const render = async seconds => {
    await evaluate(`(async () => {
      window.__exportAnimations.forEach(a => {a.pause();a.currentTime=${seconds * 1000}});
      await window.__seek(${seconds});
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    })()`);
    return Buffer.from((await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64');
  };
  const start = await render(0), end = await render(duration), again = await render(0);
  if (!start.equals(again)) throw Error('Frame 0 is not reproducible; export stopped');
  if (!start.equals(end)) throw Error('Loop boundary screenshots differ; export stopped');
  console.log(`Card and background match exactly across the ${duration}-second boundary.`);
  writeFileSync(join(folder, 'poster.png'), start);
  if (process.argv.includes('--poster')) { await send('Browser.close'); process.exitCode = 0; }
  else {
    encoder = spawn('/opt/homebrew/bin/ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps),
      '-vcodec', 'png', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-fps_mode', 'cfr', output,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const finished = once(encoder, 'close');
    for (let frame = 0; frame < frames; frame++) {
      const png = frame === 0 ? start : await render(frame / fps);
      if (!encoder.stdin.write(png)) await once(encoder.stdin, 'drain');
      if ((frame + 1) % 120 === 0) console.log(`Captured ${frame + 1}/${frames} frames`);
    }
    encoder.stdin.end();
    const [code] = await finished;
    if (code !== 0) throw Error(`Video encoder failed (${code})`);
    const probe = spawnSync('/opt/homebrew/bin/ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,avg_frame_rate,duration,nb_read_frames,pix_fmt', '-of', 'json', output], { encoding: 'utf8' });
    if (probe.status !== 0) throw Error(probe.stderr);
    const metadata = JSON.parse(probe.stdout);
    const stream = metadata.streams[0];
    if (stream.nb_read_frames !== String(frames) || stream.avg_frame_rate !== '60/1' || Number(stream.duration) !== duration || stream.width !== width || stream.height !== height) throw Error('Unexpected export metadata: ' + probe.stdout);
    const decode = spawnSync('/opt/homebrew/bin/ffmpeg', ['-v', 'error', '-xerror', '-i', output, '-f', 'null', '-'], { encoding: 'utf8' });
    if (decode.status !== 0) throw Error('Decode verification failed: ' + decode.stderr);
    writeFileSync(join(folder, 'export-info.json'), JSON.stringify({ ...metadata, loopBoundaryIdentical: true, decodedWithoutErrors: true }, null, 2));
    console.log('Verified:', probe.stdout);
    await send('Browser.close');
  }
} finally {
  ws?.close();
  if (encoder && encoder.exitCode === null) encoder.kill();
  if (chrome.exitCode === null) chrome.kill();
}
