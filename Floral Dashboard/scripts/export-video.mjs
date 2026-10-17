import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { inflateSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Exact-time export of the Floral Dashboard bloom. The DialKit timeline is the loop's one clock, so every frame
// is a seek to its exact time, and the loop is as long as the timeline: the tuning saved in bloom.tuning.json.
// Run with the Vite dev server up on port 5192; `--poster` renders the first frame and checks the seam only;
// `--bg rose` exports the rose-tinted ground (`?bg=rose`), `--view dashboard` the dashboard view, with `-rose` or
// `-dashboard` in every output's name; `--url` points at
// another server, such as `vite preview` of a build, so editing the source meanwhile cannot reload the page under it.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const folder = join(root, 'exports');
const width = 2082, height = 1560, fps = 60;
const option = name => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : ''; };
const bg = option('--bg'), view = option('--view');
const base = option('--url') || 'http://127.0.0.1:5192/';
const variant = view || bg, suffix = variant ? `-${variant}` : '', query = view ? `?view=${view}` : bg ? `?bg=${bg}` : '';
const page = `${base}${query}`;
const output = join(folder, `floral-dashboard${suffix}-${width}x${height}-60fps.mp4`);
mkdirSync(folder, { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=9388',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'floral-dashboard-export-'))}`,
  '--no-first-run', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });
let ws, encoder;

// Enough of a PNG reader (8-bit RGB/RGBA, non-interlaced) to compare two frames.
function decode(buffer) {
  let pos = 8, width = 0, height = 0, channels = 4; const idat = [];
  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos), type = buffer.toString('ascii', pos + 4, pos + 8), body = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') { width = body.readUInt32BE(0); height = body.readUInt32BE(4); channels = { 2: 3, 6: 4 }[body[9]]; }
    else if (type === 'IDAT') idat.push(body);
    pos += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat)), stride = width * channels, pixels = new Uint8Array(stride * height);
  let previous = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), current = pixels.subarray(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? current[i - channels] : 0, b = previous[i], c = i >= channels ? previous[i - channels] : 0;
      let value = line[i];
      if (filter === 1) value += a; else if (filter === 2) value += b; else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      current[i] = value & 255;
    }
    previous = current;
  }
  return { width, height, channels, pixels };
}
// Styles are written per frame, so the compositor may re-raster a layer a hair differently: two frames agree
// when no channel differs by more than 2 levels and fewer than 0.5% of pixels differ at all.
function agree(a, b) {
  const x = decode(a), y = decode(b);
  if (x.width !== y.width || x.height !== y.height || x.channels !== y.channels) return { same: false, maxDifference: 255, differingPixels: 1 };
  let max = 0, differing = 0;
  for (let i = 0; i < x.pixels.length; i += x.channels) {
    let d = 0;
    for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(x.pixels[i + c] - y.pixels[i + c]));
    if (d) { differing++; if (d > max) max = d; }
  }
  const share = differing / (x.width * x.height);
  return { same: max <= 2 && share < .005, maxDifference: max, differingPixels: differing, differingShare: +share.toFixed(5) };
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { await (await fetch('http://127.0.0.1:9388/json/version')).json(); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 250)); }
  }
  if (!ready) throw Error('Export browser did not start');
  const tab = await (await fetch('http://127.0.0.1:9388/json/new?about:blank', { method: 'PUT' })).json();
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
  await send('Page.navigate', { url: page });
  await new Promise(resolve => setTimeout(resolve, 1500));
  const info = await evaluate(`(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
    const style = document.createElement('style');
    style.textContent = '#root{display:block;padding:0;width:1041px;height:780px;min-height:0}.preview{width:1041px;height:780px;aspect-ratio:auto}.artboard{transform:scale(1)!important}.dialkit-root,.dialkit-timeline{display:none}';
    document.head.append(style);
    // The dock's clock joins the capture: paused, and seeked to each frame's exact time.
    const floral = window.__floral;
    if (!floral) throw Error('The page exposes no __floral clock');
    floral.pause();
    window.__seek = floral.seek;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { duration: floral.duration(), holdAt: floral.holdAt(), width: document.querySelector('.artboard').getBoundingClientRect().width };
  })()`);
  const duration = info.duration, frames = Math.round(duration * fps);
  console.log('Preparing exact-time export:', { ...info, frames });
  if (Math.abs(frames / fps - duration) > 1e-6) throw Error(`The loop (${duration} s) is not a whole number of frames at ${fps} fps`);
  const render = async seconds => {
    await evaluate(`(async () => { window.__seek(${seconds}); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); })()`);
    return Buffer.from((await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64');
  };
  const start = await render(0), end = await render(duration), again = await render(0);
  const repeat = agree(start, again), seam = agree(start, end);
  if (!repeat.same) throw Error(`Frame 0 is not reproducible (${JSON.stringify(repeat)}); export stopped`);
  if (!seam.same) throw Error(`Loop boundary frames differ (${JSON.stringify(seam)}); export stopped`);
  console.log(`Frame 0 and the ${duration}-second boundary agree: ${JSON.stringify(seam)}.`);
  writeFileSync(join(folder, `poster${suffix}.png`), start);
  writeFileSync(join(folder, `poster-open${suffix}.png`), await render(Math.min(info.holdAt + 1, duration - 1 / fps)));
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
    if (stream.nb_read_frames !== String(frames) || stream.avg_frame_rate !== '60/1' || Math.abs(Number(stream.duration) - duration) > 1e-3 || stream.width !== width || stream.height !== height) throw Error('Unexpected export metadata: ' + probe.stdout);
    const check = spawnSync('/opt/homebrew/bin/ffmpeg', ['-v', 'error', '-xerror', '-i', output, '-f', 'null', '-'], { encoding: 'utf8' });
    if (check.status !== 0) throw Error('Decode verification failed: ' + check.stderr);
    writeFileSync(join(folder, `export-info${suffix}.json`), JSON.stringify({ ...metadata, loopSeconds: duration, loopBoundary: seam, decodedWithoutErrors: true }, null, 2));
    writeFileSync(join(folder, `preview${suffix}.html`), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Floral Dashboard — Video</title><style>
*{box-sizing:border-box}body{margin:0;background:#171313;color:#ddd;font:14px system-ui,sans-serif;min-height:100vh;display:grid;place-content:center;padding:24px;gap:16px}video{display:block;width:min(1041px,calc(100vw - 48px));max-height:calc(100vh - 100px);object-fit:contain}footer{display:flex;justify-content:space-between;gap:24px;color:#aaa}a{color:#d9c0cc}
</style></head><body><video src="floral-dashboard${suffix}-${width}x${height}-60fps.mp4" poster="poster${suffix}.png" autoplay loop muted playsinline controls></video><footer><span>Floral Dashboard${view ? ` · ${view} view` : bg ? ` · ${bg} ground` : ''} · ${duration} seconds · 60 fps</span><a href="floral-dashboard${suffix}-${width}x${height}-60fps.mp4" download>Download MP4</a></footer></body></html>
`);
    console.log('Verified:', probe.stdout);
    await send('Browser.close');
  }
} finally {
  ws?.close();
  if (encoder && encoder.exitCode === null) encoder.kill();
  if (chrome.exitCode === null) chrome.kill();
}
