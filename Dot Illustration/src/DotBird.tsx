import { useCallback, useEffect, useRef } from 'react';
import { useDialKitController, useDialTimeline } from 'dialkit';
import { CLIPS, PANEL, TIMELINE, type Values } from './bird/dial';
import { useDensityPreset } from './bird/density';
import { PANEL_ID, TIMELINE_ID, saveToFile } from './bird/tuning';
import { makeBirdSubject } from './bird/subject';
import { STILL, flapRate, poseAt, storyAt, FLAP } from './bird/motion';
import { DotRenderer } from './dot/renderer';
import { drawDots } from './dot/dots';
import { note, reduced, sameGrid, startStepper } from './dot/stepper';
import { CYCLES, calibrate } from './dot/calibrate';
import { unit } from './dot/wave';
import { SkyBackground } from './sky/SkyBackground';
import { SkyPresenter, boundsOf } from './sky/presenter';
import type { SkyValues, Tab } from './sky/dial';
import { TrackingOverlay } from './tracking/overlay';
import { project } from './tracking/points';
import type { TrackingValues } from './tracking/dial';
import './dot-bird.css';

/*
 * <DotBird />: a bird in flight as a dot matrix, filling its parent. Each update, the 3D bird is rendered small
 * and hidden, read back and classified cell by cell, and the cells are drawn flat on the visible canvas. Updates
 * come at the panel's rate, 24 a second by default, and the dots hold still between them, so the flight is
 * stop-motion: no tweening, no fading, nothing animates opacity. The "Dot Bird" timeline is the clock and the
 * story; the "Dot Bird" panel holds everything else. Both persist, and the panel's actions pause, step and save.
 * With `sky`, the Sky version: the same shape updates, drawn as shimmering white squares over a sky with a
 * tracking grid; the instance, and so the timeline's time, is the same, so switching is instant.
 */
const noise = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

type Transport = { time: number; playing: boolean; duration: number; play: () => void; pause: () => void; seek: (seconds: number) => void };
declare global { interface Window { __dotBird?: { play: () => void; pause: () => void; seek: (seconds: number) => void; time: () => number; playing: () => boolean; duration: () => number } } }

export function DotBird({ sky, tab = 'Current', tracking = null }: { sky: SkyValues; tab?: Tab; tracking?: TrackingValues | null }) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef<{ values: Values; timeline: Transport & Record<(typeof CLIPS)[number], { at: number; started: boolean; current: Record<string, number> }>; sky: SkyValues; tab: Tab; tracking: TrackingValues | null } | null>(null);
  const dirty = useRef(true);
  const onAction = useCallback((path: string) => {
    const { values, timeline } = latest.current!;
    if (path.endsWith('.pause')) timeline.playing ? timeline.pause() : timeline.play();
    else if (path.endsWith('.step')) { timeline.pause(); timeline.seek((timeline.time + 1 / values.Motion.updateRate) % timeline.duration); }
    else if (path.endsWith('.saveToFile')) saveToFile().then(() => note('Save to file', 'Saved')).catch(error => note('Save to file', `Save failed: ${error instanceof Error ? error.message : error}`));
  }, []);
  const dial = useDialKitController('Dot Bird', PANEL, { id: PANEL_ID, persist: true, onAction });
  useDensityPreset(dial);
  const timeline = useDialTimeline('Dot Bird', TIMELINE, { id: TIMELINE_ID, persist: true, loop: true, autoplay: !reduced.matches });
  latest.current = { values: dial.values, timeline, sky, tab, tracking };
  // The transport for scripts (and an exporter): the dock's own play, pause and seek.
  useEffect(() => { window.__dotBird = { play: () => latest.current!.timeline.play(), pause: () => latest.current!.timeline.pause(), seek: seconds => latest.current!.timeline.seek(seconds), time: () => latest.current!.timeline.time, playing: () => latest.current!.timeline.playing, duration: () => latest.current!.timeline.duration }; return () => { delete window.__dotBird; }; }, []);
  // Any change of the dials or the playhead asks for an update at the next tick; the ticks themselves keep the rate.
  const signature = JSON.stringify([dial.values, sky, tab, tracking]);
  useEffect(() => { dirty.current = true; }, [signature]);
  useEffect(() => { if (!reduced.matches) dirty.current = true; }, [timeline.time]);

  useEffect(() => {
    const renderer = new DotRenderer(), bird = makeBirdSubject(), presenter = new SkyPresenter(), overlay = new TrackingOverlay();
    presenter.overlay = overlay;
    let pass = 0, previous = 0, flapTime = 0, pausedByUs = false, before: Uint8Array | null = null, calibrated = false;
    const tones = (v: Values) => ({ empty: v.Tone.emptyLight, light: v.Tone.light, mid: v.Tone.mid, dark: v.Tone.dark });
    const FLAPPING = { power: 1, spread: 0, bank: 0, glideAt: 0 };
    const overlayOn = () => { const { tab, tracking } = latest.current!; return !!tracking?.Overlay.tracking && (tab === 'Sky' || tracking.Overlay.showOnCurrent); };
    const trackers = (t: TrackingValues) => (bird.trackers ?? []).slice(0, Math.round(t.Points.count));
    const stop = startStepper({
      element: root.current!, canvas: canvas.current!, dirty,
      rate: () => latest.current!.values.Motion.updateRate,
      columns: () => latest.current!.values.Density.columns,
      grid: g => { if (renderer.cols !== g.cols || renderer.rows !== g.rows) renderer.grid(g.cols, g.rows); },
      tick: (ctx, grid) => {
        const { values, timeline } = latest.current!;
        const t = timeline.time, step = t - previous, wrapped = step < 0 && previous > timeline.duration - .5 && t < .5;
        if (wrapped) pass++;
        const story = storyAt(CLIPS.map(key => ({ key, at: timeline[key].at, started: timeline[key].started, current: timeline[key].current })), pass % Math.round(values.Motion.glideEvery) !== 0);
        // The flap's own time runs slower through a glide: integrated over playback, carried across the loop's wrap,
        // and restarted at the playhead by a seek.
        // Each flap runs a little faster or slower than the last, ±5%, seeded by the flap's number.
        const cycle = Math.floor(flapTime / values.Motion.flapDuration), pace = 1 + .05 * (unit(cycle + 1) * 2 - 1);
        if (step >= 0 && step < .5) flapTime += step * flapRate(story) * pace;
        else if (wrapped) flapTime += (t + timeline.duration - previous) * flapRate(story) * pace;
        else flapTime = t;
        // The first update: the whole flap loop sets the bird's size and centre in the frame.
        if (!calibrated) { calibrated = true; bird.studio.calibrate(calibrate(bird, renderer, grid, tones(values), values.Tone.lightAngle, values.Motion.flapDuration * CYCLES, time => bird.pose(poseAt(time, time, FLAPPING, values.Motion, FLAP.variation / 2 + .05)))); }   // at its biggest stroke
        bird.pose(reduced.matches ? STILL : poseAt(t, flapTime, story, values.Motion, (noise(pass) - .5) * FLAP.variation + .05 * (unit(cycle * 7 + 4) * 2 - 1)));
        const cells = renderer.render(bird, tones(values), values.Tone.lightAngle);

        // A flying bird is never still: two updates in a row (one step apart; seeks and stalls are not steps) with the same grid are a bug worth a warning.
        if (step > 0 && step < 1.5 / values.Motion.updateRate && sameGrid(before, cells)) console.warn(`DotBird: the grid did not change between updates at ${previous.toFixed(3)} s and ${t.toFixed(3)} s`);
        before = cells.slice();
        previous = t;
        // The overlay's pins: the same posed frame, projected, each locked to the nearest dot.
        if (overlayOn()) overlay.setPoints(project(trackers(latest.current!.tracking!), bird.studio.camera, grid, [bird.studio.scene]), cells, grid);
        presenter.shape(cells, boundsOf(cells, grid.cols), { name: 'BIRD', index: 1, total: 1, rate: values.Motion.updateRate }, grid, bird.studio.loopBox());
        if (latest.current!.tab !== 'Sky') drawDots(ctx, cells, grid, { ...values.Colors, dotSize: values.Density.dotSize, navyWidth: values.Density.navyWidth });
      },
      every: (ctx, grid, now) => {
        const { sky, tab, values, tracking } = latest.current!, shapes = { dotSize: values.Density.dotSize, navyWidth: values.Density.navyWidth };
        presenter.tracking = overlayOn() ? tracking : null;
        if (tab === 'Sky') presenter.frame(ctx, grid, now, sky, shapes, reduced.matches);
        else if (before) {
          // The Current tab: the dots again (stepped, from the last update), then the same grid, texts and pins as the Sky version, in solid navy and white.
          drawDots(ctx, before, grid, { ...values.Colors, ...shapes });
          presenter.chrome(ctx, grid, now, sky, reduced.matches, { ink: values.Colors.navy, solid: true });
        }
      },
      // Off screen the clock waits; it resumes only if this paused it.
      shown: on => { const { timeline } = latest.current!; if (!on) { if (timeline.playing) { pausedByUs = true; timeline.pause(); } } else if (pausedByUs) { pausedByUs = false; timeline.play(); } },
      motion: () => { const { timeline } = latest.current!; if (reduced.matches) timeline.pause(); else timeline.play(); },
    });
    return () => { stop(); bird.dispose(); renderer.dispose(); };
  }, []);

  return <div ref={root} className={`dot-bird${tab === 'Sky' ? ' dot-sky' : ''}`} role="img" aria-label="Animated dot-matrix bird in flight">{tab === 'Sky' && <SkyBackground sky={sky.Sky} extras={sky.Extras} still={reduced.matches} />}<canvas ref={canvas} aria-hidden="true" /></div>;
}
