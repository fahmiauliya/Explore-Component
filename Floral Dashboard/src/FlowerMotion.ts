import { useEffect, useRef, type RefObject } from 'react';
import { DialStore, TimelineStore, useDialTimeline, type DialConfig, type ResolvedValues } from 'dialkit';
import { BLOOM_TIMELINE, clipOf, startOf, stateAt, timelineNow, type Static } from './bloom/timeline';
import { PANEL_ID, TIMELINE_ID } from './bloom/tuning';

// ── The Bloom panel: what is not a clip's timing or value. Sliders are [default, min, max, step]. ──
export const BLOOM_PANEL = {
  Bud: {
    perspective: [1000, 300, 3000, 50], // px; the petals hinge in 3D about the flower centre
    shade: [.82, .3, 1, .01],           // brightness of a folded petal, as if in shadow…
    desaturate: [.9, 0, 1, .01],        // …and its saturation
  },
  Bloom: {
    spacing: [.1, 0, .5, .01],          // s; the next petal clockwise starts this much later
    randomness: [1, 0, 1, .05],         // 0–1: delay ±40 ms, duration ±10 %, overshoot 1–2°, sway speed
    sheenSweep: [10, 0, 40, 1],         // px the petal highlight slides toward the tip while unfolding
  },
  Open: {
    tilt: [1.5, 0, 6, .1],              // degrees of sway while open: about the hinge…
    turn: [1, 0, 6, .1],                // …and turning
  },
  Close: { spacing: [.1, 0, .5, .01] },  // s; inner petals first, then outward
  Light: {
    pulse: [.03, 0, .1, .005],          // bud light pulse: scale amplitude (brightness holds)…
    pulseHz: [.6, .1, 2, .05],          // …and rate
  },
  Actions: { saveToFile: { type: 'action', label: 'Save to file' }, resetToFile: { type: 'action', label: 'Reset to file' } },
} satisfies DialConfig;
export type BloomValues = ResolvedValues<typeof BLOOM_PANEL>;

const BLOOM_FROM = -90;                 // the petal the spiral starts from, degrees clockwise from the top
const TAU = Math.PI * 2;
const fract = (value: number) => value - Math.floor(value);
const random = (seed: number) => fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453);
const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
const smooth = (p: number) => { p = clamp(p); return p * p * (3 - 2 * p); };
// 0 at a marker's ends, 1 inside it, with 0.5 s ramps.
const inside = (progress: number, duration: number) => smooth(progress * duration / .5) * smooth((1 - progress) * duration / .5);
const fmt = (value: number) => Number(value.toFixed(3));
const order = (angle: number) => (((angle - BLOOM_FROM) % 360 + 360) % 360) / 45;

type Petal = { pivot: HTMLElement; piece: HTMLElement; sheens: HTMLElement[]; angle: number; k: number };
type Parts = { bloom: HTMLElement; petals: Petal[]; glow: HTMLElement; sparkle: HTMLElement; rings: { pivot: HTMLElement; lobe: number }[] };
const collect = (flower: HTMLElement): Parts => ({
  bloom: flower.querySelector('[data-motion="bloom"]')!,
  petals: [...flower.querySelectorAll<HTMLElement>('.petal')].map(pivot => ({ pivot, piece: pivot.firstElementChild as HTMLElement, angle: Number(pivot.dataset.angle), k: order(Number(pivot.dataset.angle)),
    // The highlight sweeps along the petal as it opens: the sheen and the half-petal gradient, inside their clips.
    sheens: [...pivot.querySelectorAll<HTMLElement>('[data-name="Mask group_2"] > [data-name], [data-name="Ellipse 43693"] > .layer-gradient')] })),
  glow: flower.querySelector('[data-motion="glow"]')!,
  sparkle: flower.querySelector('[data-motion="sparkle"]')!,
  rings: [...flower.querySelectorAll<HTMLElement>('.ring')].map(pivot => ({ pivot, lobe: Number(pivot.dataset.lobe) })),
});

// ── One frame: every style from the clips' values at the playhead, plus the per-petal offsets. ──
function draw(parts: Parts, st: Static, t: number, v: BloomValues) {
  const vary = (seed: number, amount: number) => (random(seed) * 2 - 1) * amount * v.Bloom.randomness;
  const hold = stateAt(clipOf(st, 'openHold'), t), bud = stateAt(clipOf(st, 'budHold'), t);
  const sway = hold.active ? inside(hold.progress, hold.duration) : 0, beat = bud.active ? inside(bud.progress, bud.duration) : 0;

  // Petals: the spiral is an offset into one petal's clip; outer petals open first, inner petals close first.
  const open = [clipOf(st, 'bloom.outerPetals'), clipOf(st, 'bloom.innerPetals')], close = [clipOf(st, 'close.outerPetals'), clipOf(st, 'close.innerPetals')];
  const rest = open.map(startOf);
  for (const { pivot, piece, sheens, angle, k } of parts.petals) {
    const group = k < 4 ? 0 : 1, j = k % 4, stretch = 1 + vary(k + 10, .1);
    const at = (clip: { at: number }, offset: number) => clip.at + (t - clip.at - offset) / stretch;
    const o = stateAt(open[group], at(open[group], j * v.Bloom.spacing + vary(k, .04)));
    const c = stateAt(close[group], at(close[group], (3 - j) * v.Close.spacing + vary(k + 30, .04)));
    // This petal's own bud fold: outermost to innermost across the clip's value, and its own overshoot.
    const budFold = mix(rest[0].fold, rest[1].fold, k / 7), ratio = budFold / rest[group].fold, over = 1 + random(k + 20) * v.Bloom.randomness;
    let fold: number, twist: number, scale: number;
    if (c.started) { fold = budFold * c.current.fold; twist = rest[group].twist * c.current.twist; scale = mix(1, rest[group].scale, c.current.scale); }
    else { fold = o.current.fold * (o.current.fold > 0 ? ratio : over); twist = o.current.twist; scale = o.current.scale; }
    const folded = clamp(fold / budFold);
    if (sway) {
      const speed = .35 + .25 * random(k + 40), phase = TAU * random(k + 50), u = hold.progress * hold.duration;
      fold += v.Open.tilt * sway * Math.sin(TAU * speed * u + phase);
      twist += v.Open.turn * (.5 + random(k + 60)) * sway * Math.sin(TAU * speed * 1.3 * u + phase + 1);
    }
    pivot.style.transform = `rotateX(${fmt(fold)}deg)`;
    pivot.style.rotate = `${fmt(angle + twist)}deg`;
    pivot.style.scale = `${fmt(scale)}`;
    // Always a filter list, never `none`: switching a filter on or off can drop the layer for a frame.
    piece.style.filter = `brightness(${fmt(mix(1, v.Bud.shade, folded))}) saturate(${fmt(mix(1, v.Bud.desaturate, folded))})`;
    for (const sheen of sheens) sheen.style.translate = `0px ${fmt(v.Bloom.sheenSweep * folded)}px`;
  }

  // Light: the bud's rest values are the pressure clip's start; the pullback returns to them by amount, so the
  // loop's end is its start whatever the dock sets. The glow never blurs and its filter is never switched off.
  const pressure = clipOf(st, 'pressure'), spill = stateAt(clipOf(st, 'lightSpill'), t), pull = stateAt(clipOf(st, 'lightPullback'), t);
  const resting = startOf(pressure);
  let light = spill.started ? spill.current : stateAt(pressure, t).current;
  if (pull.started) light = Object.fromEntries(Object.keys(resting).map(key => [key, mix(1, resting[key], pull.current.light)]));
  const pulse = 1 + v.Light.pulse * beat * Math.sin(TAU * v.Light.pulseHz * bud.progress * bud.duration);
  parts.glow.style.scale = `${fmt(light.glow * pulse)}`;
  parts.glow.style.filter = `brightness(${fmt(light.glowBright)})`;
  parts.sparkle.style.scale = `${fmt(light.stars * pulse)}`;
  parts.sparkle.style.filter = `brightness(${fmt(light.starsBright)})`;

  // Ripples: each circle its own clip out, pulled back in by amount with the light.
  for (const { pivot, lobe } of parts.rings) {
    const ripple = clipOf(st, `ripples.r${lobe}`), out = stateAt(ripple, t).current.scale;
    pivot.style.scale = `${fmt(pull.started ? mix(1, startOf(ripple).scale, pull.current[`r${lobe}`]) : out)}`;
  }
}

// Back to the design as rendered: a pivot's `rotate` is the petal's own angle, set inline by the component.
const clear = (parts: Parts) => {
  parts.bloom.style.perspective = '';
  for (const { pivot, piece, sheens, angle } of parts.petals) { pivot.style.transform = pivot.style.scale = ''; pivot.style.rotate = angle ? `${angle}deg` : ''; piece.style.filter = ''; sheens.forEach(sheen => { sheen.style.translate = ''; }); }
  for (const element of [parts.glow, parts.sparkle]) element.style.scale = element.style.filter = '';
  for (const { pivot } of parts.rings) pivot.style.scale = '';
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// For the exporter: the loop's clock, reachable from a plain page script on the dev server or a built preview.
declare global { interface Window { __floral?: { pause: () => void; seek: (seconds: number) => void; duration: () => number; holdAt: () => number } } }
window.__floral = { pause: () => TimelineStore.pause(TIMELINE_ID), seek: seconds => TimelineStore.seek(TIMELINE_ID, seconds),
  duration: () => TimelineStore.getTimeline(TIMELINE_ID)?.duration ?? 0, holdAt: () => Number(DialStore.getValues(TIMELINE_ID)['openHold.at'] ?? 3.5) };

/** The timeline itself: registered here so its frame updates never re-render the flower. */
export function BloomClock() {
  useDialTimeline('Bloom', BLOOM_TIMELINE, { id: TIMELINE_ID, persist: true, loop: true, autoplay: !reduced.matches });
  return null;
}

/** Draws the flower from the timeline's playhead: on every tick, seek, clip edit and panel change. */
export function useFlowerMotion(ref: RefObject<HTMLElement | null>, values?: BloomValues) {
  const latest = useRef(values);
  latest.current = values;
  useEffect(() => {
    if (!latest.current) return; // a still flower: nothing drives it
    const parts = collect(ref.current!);
    const render = () => {
      if (reduced.matches) return;
      parts.bloom.style.perspective = `${latest.current!.Bud.perspective}px`;
      draw(parts, timelineNow(), TimelineStore.getTransport(TIMELINE_ID).time, latest.current!);
    };
    const onReduced = () => reduced.matches ? clear(parts) : render();
    const unsubscribe = [TimelineStore.subscribe(TIMELINE_ID, render), DialStore.subscribe(TIMELINE_ID, render), DialStore.subscribe(PANEL_ID, render)];
    reduced.addEventListener('change', onReduced);
    onReduced();
    return () => { unsubscribe.forEach(stop => stop()); reduced.removeEventListener('change', onReduced); clear(parts); };
  }, [ref]);
}
