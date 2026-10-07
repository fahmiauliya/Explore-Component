import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const folder = join(root, 'exports');
const vertical = process.argv.includes('--vertical');
const closeup = process.argv.includes('--closeup');
const detail = process.argv.includes('--detail');
if ([vertical, closeup, detail].filter(Boolean).length > 1) throw Error('Choose one composition: --vertical, --closeup, or --detail.');
const suffix = detail ? '-detail' : closeup ? '-closeup' : vertical ? '-vertical' : '';
const width = vertical ? 1080 : 2082, height = vertical ? 1920 : 1560;
const output = join(folder, `space-signal-scan${detail ? '-detail' : closeup ? '-closeup' : ''}-${width}x${height}-60fps.mp4`);
const fps = 60, duration = 8, frames = fps * duration;
mkdirSync(folder, { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=9383',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'space-signal-export-'))}`,
  '--no-first-run', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });
let ws, encoder;
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { await (await fetch('http://127.0.0.1:9383/json/version')).json(); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 250)); }
  }
  if (!ready) throw Error('Export browser did not start');
  const tab = await (await fetch('http://127.0.0.1:9383/json/new?about:blank', { method: 'PUT' })).json();
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
  await send('Page.navigate', { url: `http://127.0.0.1:5187/${detail ? '?view=detail' : closeup ? '?view=closeup' : ''}` });
  await new Promise(resolve => setTimeout(resolve, 1200));
  console.log('Preparing exact-time export:', await evaluate(`(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
    // Expose the existing SVG animation to the capture clock without changing source files.
    const icon = document.querySelector('.scan-icon');
    const source = await (await fetch(icon.src)).text();
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    const svg = document.importNode(parsed.documentElement, true);
    svg.classList.add('scan-icon');
    svg.setAttribute('aria-hidden', 'true');
    icon.replaceWith(svg);
    const style = document.createElement('style');
    style.textContent = '#root{display:block;padding:0;width:1041px;height:780px;min-height:0}.preview{width:1041px;height:780px;aspect-ratio:auto}.artboard{transform:scale(1)!important}';
    document.head.append(style);
    if (${vertical}) {
      // Portrait composition only: preserve every internal card measurement.
      style.textContent = '#root{display:block;padding:0;width:540px;height:960px;min-height:0}.preview{width:540px;height:960px;aspect-ratio:auto}.artboard{width:600px;height:1066.6666667px;transform:scale(.9)!important}.signal-card{left:33.5px;top:265.5833333px}';
      const background = document.querySelector('.background-pattern');
      background.setAttribute('width', '600');
      background.setAttribute('height', '1066.6666667');
      const field = background.querySelector('rect');
      field.setAttribute('width', '600');
      field.setAttribute('height', '1066.6666667');
      const sky = background.querySelector('.night-sky');
      const template = sky.querySelector('use').cloneNode(true);
      sky.replaceChildren();
      const random = seed => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
      for (let i = 0; i < 10 * 18; i++) {
        const x = ((i % 10) * 8 + Math.floor(random(i + 1) * 8)) * 7.56;
        const y = (Math.floor(i / 10) * 8 + Math.floor(random(i + 501) * 8)) * 7.56;
        if (x > 596 || y > 1063 || (x > 10 && x < 590 && y > 242 && y < 825)) continue;
        const star = template.cloneNode(true);
        star.setAttribute('x', x); star.setAttribute('y', y);
        star.style.animationDelay = (-random(i + 1001) * 8) + 's';
        star.style.setProperty('--star-peak', .22 + random(i + 1501) * .32);
        sky.append(star);
      }
    }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (${detail}) {
      for (const selector of ['.presentation-cursor', '.inspect-face', '.inspect-loop']) {
        if (!document.querySelector(selector)?.getAnimations().length) throw Error('Missing button animation: ' + selector);
      }
    }
    window.__exportAnimations = document.getAnimations();
    window.__exportAnimations.forEach(animation => { animation.pause(); animation.currentTime = 0; });
    return { animations: window.__exportAnimations.length, radar: !!svg.querySelector('.radar-sweep'), width: document.querySelector('.artboard').getBoundingClientRect().width };
  })()`));
  const render = async seconds => {
    await evaluate(`window.__exportAnimations.forEach(a => {a.pause();a.currentTime=${seconds * 1000}});new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
    return Buffer.from((await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64');
  };
  const start = await render(0), end = await render(duration);
  if (!start.equals(end)) throw Error('Loop boundary screenshots differ; export stopped');
  console.log('All captured animations match exactly across the eight-second boundary.');
  writeFileSync(join(folder, `poster${suffix}.png`), start);
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
      if ((frame + 1) % 60 === 0) console.log(`Captured ${frame + 1}/${frames} frames`);
    }
    encoder.stdin.end();
    const [code] = await finished;
    if (code !== 0) throw Error(`Video encoder failed (${code})`);
    const probe = spawnSync('/opt/homebrew/bin/ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,avg_frame_rate,duration,nb_read_frames,pix_fmt', '-of', 'json', output], { encoding: 'utf8' });
    if (probe.status !== 0) throw Error(probe.stderr);
    const metadata = JSON.parse(probe.stdout);
    const stream = metadata.streams[0];
    if (stream.nb_read_frames !== '480' || stream.avg_frame_rate !== '60/1' || Number(stream.duration) !== 8 || stream.width !== width || stream.height !== height) throw Error('Unexpected export metadata: ' + probe.stdout);
    const decode = spawnSync('/opt/homebrew/bin/ffmpeg', ['-v', 'error', '-xerror', '-i', output, '-f', 'null', '-'], { encoding: 'utf8' });
    if (decode.status !== 0) throw Error('Decode verification failed: ' + decode.stderr);
    writeFileSync(join(folder, `export-info${suffix}.json`), JSON.stringify({ ...metadata, loopBoundaryIdentical: true, decodedWithoutErrors: true }, null, 2));
    console.log('Verified:', probe.stdout);
    await send('Browser.close');
  }
} finally {
  ws?.close();
  if (encoder && encoder.exitCode === null) encoder.kill();
  if (chrome.exitCode === null) chrome.kill();
}
