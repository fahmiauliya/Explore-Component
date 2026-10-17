import { useEffect, useRef, useState } from 'react';
import { startFrames } from '../dot/stepper';
import { noise2p, unit } from './noise';
import type { SkyValues } from './dial';

/*
 * <SkyBackground />: the Sky version's ground, filling its parent behind the dots. Three sources: "dummy", a sky
 * drawn in code, a saturated blue lighter toward the top with soft white clouds drifting right to left on three
 * layers of different size and speed; "image", a picture; "video", muted, looping, inline, covering the box. A
 * source that fails to load falls back to the dummy sky. Stars, when on, are drawn over any source. Under reduced
 * motion the clouds and the video stand still.
 */
type Props = { sky: SkyValues['Sky']; extras: SkyValues['Extras']; still: boolean; travel?: boolean };  // travel: a running animal is on, the clouds stream past faster
const TRAVEL = { pace: 3, ease: .8 };             // the clouds' speed while travelling, × the drift, and the seconds to ease there and back
const TILE = { width: 384, height: 192, period: 8 };  // a cloud tile: periodic across, so it scrolls without a seam
// The cloud layers: each draws its tile this wide (× the frame's width) and tall (× its height), from this top
// (× its height), drifting at this speed (CSS px a second at 585 px wide, × cloudSpeed), at this opacity.
const LAYERS = [
  { seed: 3, width: 2.6, height: 1.0, top: -.05, speed: 3, alpha: .75 },
  { seed: 5, width: 1.8, height: .75, top: .1, speed: 6, alpha: .7 },
  { seed: 9, width: 1.2, height: .55, top: 0, speed: 10, alpha: .6 },
];
const STARS = 70;

/** A cloud tile: three octaves of periodic noise, cut softly at a threshold the cloud amount lowers, fading at the tile's top and bottom. */
function cloudTile(seed: number, amount: number) {
  const canvas = document.createElement('canvas');
  canvas.width = TILE.width; canvas.height = TILE.height;
  const ctx = canvas.getContext('2d')!, image = ctx.createImageData(TILE.width, TILE.height), data = image.data;
  const threshold = .8 - .32 * amount;                 // the noise level a cloud starts at: lower with more cloud
  const soft = (n: number) => { const t = Math.min(1, Math.max(0, (n - threshold + .06) / .22)); return t * t * (3 - 2 * t); };
  for (let y = 0; y < TILE.height; y++) for (let x = 0; x < TILE.width; x++) {
    const u = x / TILE.width * TILE.period, w = y / TILE.height * TILE.period * .75;   // lattice cells wider than tall: clouds are
    const n = .5 * noise2p(seed, u, w, TILE.period) + .3 * noise2p(seed + 1, u * 2, w * 2, TILE.period * 2) + .2 * noise2p(seed + 2, u * 4, w * 4, TILE.period * 4);
    const edge = Math.min(1, y / (TILE.height * .15), (TILE.height - 1 - y) / (TILE.height * .15));
    const i = (y * TILE.width + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = 255;
    data[i + 3] = Math.round(255 * soft(n) * edge);
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** A hex colour mixed toward white; any other colour string is returned as it is. */
function lighten(color: string, amount: number) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!hex) return color;
  const channel = (at: number) => Math.round(parseInt(hex[1].slice(at, at + 2), 16) * (1 - amount) + 255 * amount);
  return `rgb(${channel(0)},${channel(2)},${channel(4)})`;
}

export function SkyBackground({ sky, extras, still, travel = false }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null), video = useRef<HTMLVideoElement>(null);
  const wanted = useRef(travel);
  wanted.current = travel;
  const [failed, setFailed] = useState<string | null>(null);
  const media = sky.source !== 'dummy' && failed !== sky.path ? sky.source : 'dummy';
  useEffect(() => { const v = video.current; if (!v) return; if (still) v.pause(); else v.play().catch(() => { /* autoplay refused: the poster frame stays */ }); }, [still, media, sky.path]);
  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext('2d')!;
    const tiles = LAYERS.map(layer => cloudTile(layer.seed, sky.cloudAmount));
    const stars = Array.from({ length: STARS }, (_, k) => ({ x: unit(k * 2 + 1), y: unit(k * 2 + 2), r: .6 + unit(k * 3 + 7) }));
    const top = lighten(sky.color, .22);
    let t0 = 0, pace = 1, scrolled = 0, lastNow = 0;
    const draw = (now: number) => {
      const rect = c.getBoundingClientRect(), px = devicePixelRatio, w = Math.max(1, Math.round(rect.width * px)), h = Math.max(1, Math.round(rect.height * px));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (media === 'dummy') {
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, top); gradient.addColorStop(1, sky.color);
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
        if (!t0) t0 = now;
        // The drift accumulates at the current pace, which eases toward the travel pace and back.
        const dt = lastNow && !still ? Math.min(.1, (now - lastNow) / 1000) : 0;
        lastNow = now;
        pace += ((wanted.current ? TRAVEL.pace : 1) - pace) * (1 - Math.exp(-dt / TRAVEL.ease));
        scrolled += dt * pace;
        LAYERS.forEach((layer, k) => {
          const W = w * layer.width, H = h * layer.height, y = h * layer.top, speed = layer.speed * sky.cloudSpeed * w / 585;
          const offset = ((scrolled * speed) % W + W) % W;
          ctx.globalAlpha = layer.alpha;
          ctx.drawImage(tiles[k], -offset, y, W, H);
          ctx.drawImage(tiles[k], W - offset, y, W, H);
        });
        ctx.globalAlpha = 1;
      }
      if (extras.stars) { ctx.fillStyle = 'rgba(255,255,255,.85)'; for (const s of stars) { ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r * px * .6, 0, Math.PI * 2); ctx.fill(); } }
    };
    if (still) { draw(performance.now()); const sizes = new ResizeObserver(() => draw(performance.now())); sizes.observe(c); return () => sizes.disconnect(); }
    return startFrames(c, draw);
  }, [media, sky.color, sky.cloudSpeed, sky.cloudAmount, extras.stars, still]);
  return <div className="sky" aria-hidden="true">
    {media === 'image' && <img src={sky.path} alt="" onError={() => setFailed(sky.path)} />}
    {media === 'video' && <video ref={video} src={sky.path} muted loop playsInline autoPlay={!still} onError={() => setFailed(sky.path)} />}
    <canvas ref={canvas} />
  </div>;
}
