import { useEffect, useRef, useState } from 'react';
import { DialRoot, DialStore, DialTimeline, TimelineStore, useDialKitController, useDialTimeline } from 'dialkit';
import { CARDS } from './cards';
import { FPS, H, LH, LW, N, SCALE, W, drawFrame, fontsReady, fontsUsed, hoverAt, layoutOf, openCarousel, ratesFor, type Carousel, type Dials, type Theme } from './carousel';
import { DEFAULT_THEME, ILLUSTRATION, LAYOUT, MOTION, PAGE, POINTER, RANGES, STORAGE, THEMES, TYPE } from './config';
import { encoderFor } from './scene';
import { carryOver, resetToSaved, saveButtons, withSavedPanel } from './settings';
import { CARD_TIMELINE, TIMELINE_ID, sample, timelineNow } from './timeline';

const r = (v: number, range: readonly number[]) => [v, ...range] as [number, number, number, number?];
const PANEL_BASE = {
  Layout: {
    containerInset: r(LAYOUT.containerInset, RANGES.containerInset), innerPadding: r(LAYOUT.innerPadding, RANGES.innerPadding),
    blockGap: r(LAYOUT.blockGap, RANGES.blockGap), eyebrowGap: r(LAYOUT.eyebrowGap, RANGES.eyebrowGap), subGap: r(LAYOUT.subGap, RANGES.subGap),
    illustrationScale: r(ILLUSTRATION.scale, RANGES.illustrationScale),
  },
  Typography: {
    eyebrowSize: r(TYPE.eyebrow.size, RANGES.eyebrowSize), eyebrowTracking: r(TYPE.eyebrow.tracking, RANGES.eyebrowTracking),
    headlineSize: r(TYPE.headline.size, RANGES.headlineSize), subSize: r(TYPE.sub.size, RANGES.subSize), buttonSize: r(TYPE.button.size, RANGES.buttonSize),
  },
  Motion: {
    cardSpring: MOTION.cardSpring, slideDistance: r(MOTION.slideDistance, RANGES.slideDistance),
    pointerSpring: MOTION.pointerSpring, pressScale: r(MOTION.pressScale, RANGES.pressScale),
  },
  Pointer: { visible: POINTER.visible, size: r(POINTER.size, RANGES.pointerSize) },
  Playback: {
    theme: { type: 'select' as const, options: Object.keys(THEMES), default: DEFAULT_THEME },
    card: { type: 'select' as const, options: CARDS.map((c) => c.n), default: CARDS[0].n },
    loop: true,
    exportMp4: { type: 'action' as const, label: 'Export MP4' },
    resetAll: { type: 'action' as const, label: 'Reset All' },
  },
} satisfies Parameters<typeof useDialKitController>[1];
/** The panel's defaults: config.ts's values, with the saved settings over them. */
const PANEL = withSavedPanel(PANEL_BASE);

const PANEL_ID = STORAGE.panelId;
carryOver(); // before the panel loads its browser values
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** What the frame loop reads: the card on screen and the latest dials, outside React so a frame never waits on a render. */
const live = { card: 0, wraps: 0, time: 0, playing: false, busy: false, dials: null as Dials | null, setCard: (_: number) => {} };

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [note, setNote] = useState('Space play / pause · ← → card');
  const ctl = useDialKitController('Carousel', PANEL, { id: PANEL_ID, persist: true, onAction: (a) => actions.current(a) });
  const v = ctl.values;
  const dials: Dials = {
    ...v.Layout, ...v.Typography,
    slideDistance: v.Motion.slideDistance, pointerSpring: v.Motion.pointerSpring as Dials['pointerSpring'], pressScale: v.Motion.pressScale,
    pointer: v.Pointer.visible, pointerSize: v.Pointer.size, theme: v.Playback.theme as Theme,
  };
  live.dials = dials;
  live.setCard = (k) => { if (ctl.getValues().Playback.card !== CARDS[k].n) ctl.setValue('Playback.card', CARDS[k].n); };

  const tl = useDialTimeline('Card', CARD_TIMELINE, { id: TIMELINE_ID, persist: true, loop: v.Playback.loop, autoplay: !reduced });
  const carRef = useRef<Carousel | null>(null);

  // the panel's motion dials feed the timeline's clips, so the dock always shows what plays (not on mount, so a
  // value edited in the dock and persisted stays)
  useSync(() => DialStore.updateValues(TIMELINE_ID, { 'cardIn.from.x': v.Motion.slideDistance, 'cardOut.to.x': -v.Motion.slideDistance }), [v.Motion.slideDistance]);
  useSync(() => DialStore.updateValues(TIMELINE_ID, { 'cardIn.transition': v.Motion.cardSpring, 'cardOut.transition': v.Motion.cardSpring }), [JSON.stringify(v.Motion.cardSpring)]);
  useSync(() => DialStore.updateValue(TIMELINE_ID, 'pointerToNext.transition', v.Motion.pointerSpring), [JSON.stringify(v.Motion.pointerSpring)]);
  useSync(() => DialStore.updateValue(TIMELINE_ID, 'nextPress.step1.to.s', v.Motion.pressScale), [v.Motion.pressScale]);

  // the Card select: a jump to that card, just as it settles in
  useEffect(() => {
    const k = CARDS.findIndex((c) => c.n === v.Playback.card);
    if (k >= 0 && k !== live.card) goTo(k);
  }, [v.Playback.card]);

  useEffect(() => {
    document.documentElement.dataset.theme = dials.theme;
    // the room around the frame, from the theme's colours
    document.documentElement.style.setProperty('--room', THEMES[dials.theme].room);
    document.documentElement.style.setProperty('--muted', THEMES[dials.theme].muted);
    carRef.current?.setTheme(dials.theme);
  }, [dials.theme]);

  const actions = useRef<(a: string) => void>(() => {});
  actions.current = (a: string) => {
    if (a.endsWith('resetAll')) resetToSaved();
    if (a.endsWith('exportMp4')) exportMp4(setNote);
  };

  // the frame loop
  useEffect(() => {
    let stop = false, last = performance.now(), car: Carousel | null = null;
    const ctx = canvasRef.current!.getContext('2d')!;
    (async () => {
      await fontsReady(live.dials!);
      car = carRef.current = await openCarousel(live.dials!.theme);
      const frame = async (now: number) => {
        const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); // the first frame can be stamped a moment before the start
        last = now;
        try {
          if (!live.busy && live.dials) await step(car!, ctx, dt);
        } catch (e) {
          console.error('frame failed', e);
        } finally {
          if (!stop) requestAnimationFrame(frame); // a failed frame never stops the loop
        }
      };
      requestAnimationFrame(frame);
    })();
    return () => { stop = true; car?.close(); };
  }, []);

  // Space plays and pauses, ← → change card; not while typing into a control
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (live.busy || e.altKey || e.ctrlKey || e.metaKey || e.repeat || el.closest('input, textarea, select, [contenteditable], button, [role="slider"]')) return;
      if (e.key === ' ') { e.preventDefault(); const t = TimelineStore.getTransport(TIMELINE_ID); t.playing ? TimelineStore.pause(TIMELINE_ID) : TimelineStore.play(TIMELINE_ID); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(live.card + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(live.card - 1); }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []);

  // the clipboard buttons in the panel and the dock save both settings to settings.json
  useEffect(() => saveButtons(setNote), []);

  // the frame keeps clear of DialKit: above the dock, left of the panel, both followed as they open and close
  useEffect(() => {
    const room = document.documentElement.style, sizes = new ResizeObserver(fitRoom), seen = new Set<Element>();
    function fitRoom() {
      const dock = document.querySelector('.dialkit-timeline'), panel = document.querySelector('.dialkit-panel');
      const top = dock?.getBoundingClientRect().top ?? innerHeight, left = panel?.getBoundingClientRect().left ?? innerWidth;
      room.setProperty('--margin', `${PAGE.margin}px`);
      room.setProperty('--dock', `${Math.max(PAGE.margin, innerHeight - top + PAGE.clearance)}px`);
      room.setProperty('--panel', `${Math.max(PAGE.margin, innerWidth - left + PAGE.clearance)}px`);
      // the frame at actual size (540 × 675) where it fits, scaled down only where it does not, never up; its
      // pixels follow the screen's density so lines stay crisp
      const canvas = canvasRef.current;
      if (canvas) {
        const availW = left - 2 * PAGE.margin - PAGE.clearance, availH = top - PAGE.margin - PAGE.clearance - PAGE.note;
        const k = Math.min(1, availW / LW, availH / LH), cssW = Math.round(LW * k), cssH = Math.round(LH * k);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        const px = Math.round(cssW * devicePixelRatio);
        if (canvas.width !== px) { canvas.width = px; canvas.height = Math.round((px * LH) / LW); }
      }
      for (const el of [dock, panel]) if (el && !seen.has(el)) { seen.add(el); sizes.observe(el); }
    }
    const tree = new MutationObserver(fitRoom);
    tree.observe(document.body, { childList: true, subtree: true });
    addEventListener('resize', fitRoom);
    fitRoom();
    return () => { tree.disconnect(); sizes.disconnect(); removeEventListener('resize', fitRoom); };
  }, []);

  void tl;
  return (
    <>
      <main className="room">
        <canvas ref={canvasRef} id="frame" width={W} height={H} aria-label="The carousel" />
        <p className="note" aria-live="polite">{note}</p>
      </main>
      <DialRoot position="top-right" theme={dials.theme} productionEnabled />
      <DialTimeline theme={dials.theme} defaultOpen productionEnabled />
    </>
  );
}

/** An effect that skips its first run. */
function useSync(run: () => void, deps: unknown[]) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    run();
  }, deps);
}

function goTo(k: number) {
  live.card = ((k % N) + N) % N;
  live.setCard(live.card);
  // the new card just as it settles in, so it reads at once
  const st = timelineNow(), demo = st.clips.find((c) => c.key === 'demo');
  TimelineStore.seek(TIMELINE_ID, demo?.at ?? 0);
  live.wraps = 0;
}

/** One live frame: follow the timeline's playhead, move the card on at each wrap, run the demo, draw at the screen's density. */
async function step(car: Carousel, ctx: CanvasRenderingContext2D, dt: number) {
  const d = live.dials!, tr = TimelineStore.getTransport(TIMELINE_ID), st = timelineNow();
  // a wrap is the click on the next button landing: the next card arrives (a seek resets the count)
  if (tr.wraps > live.wraps) { live.card = (live.card + tr.wraps - live.wraps) % N; live.setCard(live.card); }
  live.wraps = tr.wraps;
  // with loop off the timeline stops at the end of a card: go on to the next one, and hold the last
  if (!tr.playing && live.playing && tr.time >= st.duration - 1e-6) {
    if (live.card < N - 1) { live.card++; live.setCard(live.card); TimelineStore.replay(TIMELINE_ID); }
    else TimelineStore.seek(TIMELINE_ID, st.clips.find((c) => c.key === 'pointerToNext')!.at);
  }
  const moved = Math.abs(tr.time - live.time);
  live.playing = tr.playing;
  live.time = tr.time;
  const s = sample(st, tr.time);
  await car.point(live.card, hoverAt(live.card, s, d));
  // the illustrations run on real time while playing; while scrubbing, on the distance scrubbed
  const run = tr.playing ? dt : Math.min(PAGE.scrubCap, moved);
  const rates = ratesFor(N * st.duration);
  for (let left = run; left > 1e-6; left -= 1 / FPS) car.advance(Math.min(left, 1 / FPS), rates);
  const px = ctx.canvas.width / LW;
  ctx.setTransform(px, 0, 0, px, 0, 0);
  await drawFrame(ctx, car, live.card, s, d, px);
}

/** The export: every card once, from card 01, at the timeline's exact timing, on fresh scenes, frame by frame. */
async function exportMp4(setNote: (s: string) => void) {
  if (live.busy || !live.dials) return;
  live.busy = true;
  const d = { ...live.dials }, wasPlaying = TimelineStore.getTransport(TIMELINE_ID).playing;
  TimelineStore.pause(TIMELINE_ID);
  const st = timelineNow(), F = Math.round(st.duration * FPS), total = N * F, rates = ratesFor(total / FPS);
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const octx = out.getContext('2d')!;
  let fresh: Carousel | null = null;
  try {
    fresh = await openCarousel(d.theme);
    const sink = await encoderFor(out, W, H, FPS);
    for (let i = 0; i < total; i++) {
      const card = Math.floor(i / F), s = sample(st, (i % F) / FPS);
      await fresh.point(card, hoverAt(card, s, d));
      fresh.advance(i ? 1 / FPS : 0, rates);
      octx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      await drawFrame(octx, fresh, card, s, d, SCALE);
      await sink.add(i);
      if (i % PAGE.progressEvery === 0) setNote(`Exporting… ${Math.floor(((i + 1) / total) * 100)}%`);
    }
    const blob = await sink.finish(), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url;
    a.download = `isometric-marketing-carousel-${d.theme}${d.pointer ? '' : '-no-pointer'}-${W}x${H}-${FPS}fps.mp4`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setNote(`Exported ${N} cards · ${(total / FPS).toFixed(2)} s · ${total} frames`);
  } catch (e) {
    setNote(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    fresh?.close();
    live.busy = false;
    if (wasPlaying) TimelineStore.play(TIMELINE_ID);
  }
}

// read by the checks
Object.assign(window, {
  carouselFonts: () => [...fontsUsed],
  carouselValues: () => ({ panel: DialStore.getValues(PANEL_ID), timeline: DialStore.getValues(TIMELINE_ID) }),
  carouselLayout: () => layoutOf(document.createElement('canvas').getContext('2d')!, live.dials!),
  carouselState: () => ({ card: live.card + 1, ...TimelineStore.getTransport(TIMELINE_ID), theme: live.dials?.theme }),
  carouselSet: (path: string, value: never) => DialStore.updateValue(PANEL_ID, path, value),
  carouselGo: (k: number, time?: number) => { goTo(k); if (time !== undefined) TimelineStore.seek(TIMELINE_ID, time); TimelineStore.pause(TIMELINE_ID); },
});
