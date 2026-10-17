import { useCallback, useEffect, useRef } from 'react';
import { DialStore, useDialKitController, useDialTimeline } from 'dialkit';
import { PANEL, type Values } from './bird/dial';
import { useDensityPreset } from './bird/density';
import { PANEL_ID, SEQUENCE_ID, SEQUENCE_TIMELINE_ID, saveToFile } from './bird/tuning';
import { makeBirdSubject } from './bird/subject';
import { STILL, poseAt, FLAP } from './bird/motion';
import { makeMantaSubject } from './manta/subject';
import { makeHorseSubject } from './horse/subject';
import { makeFoxSubject } from './fox/subject';
import { makeButterflySubject } from './butterfly/subject';
import { DISSOLVE_PATHS, SEQUENCE_PANEL, SEQUENCE_TIMELINE, type SequenceValues } from './sequence/dial';
import { ANIMALS, NAMES, nextIncludedAt, nextTransitionAt, orderOf, phaseAt, type Phase, type SequenceTimeline } from './sequence/phase';
import { DotRenderer, type Subject } from './dot/renderer';
import { drawDots } from './dot/dots';
import { FLOOR, dissolve, noiseField } from './dot/dissolve';
import { note, reduced, sameGrid, startStepper } from './dot/stepper';
import { SkyBackground } from './sky/SkyBackground';
import { SkyPresenter, boundsOf } from './sky/presenter';
import type { SkyValues, Tab } from './sky/dial';
import { TrackingOverlay } from './tracking/overlay';
import { project } from './tracking/points';
import type { TrackingValues } from './tracking/dial';
import './dot-bird.css';

/*
 * <DotSequence />: the animals taking turns as a dot matrix, filling its parent. The "Dot Sequence" timeline is
 * the loop: a clip per animal and, between every pair, a dissolve out and a build-in. Each update the subject
 * showing is rendered through the shared dot renderer, and through a dissolve its cells are masked, dots only
 * switching off or on. The density, tone and colours are the "Dot Bird" panel's, so every animal matches; the
 * "Dot Sequence" panel holds the animals' toggles, the manta, the models, the transition and the actions. With
 * `sky`, the Sky version draws the same shapes in white over a sky, with the tracking grid and the texts; with
 * `tracking`, the overlay's pins, locked to the dots of the same update.
 */
const noise = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// The shared controls: the bird panel without its actions, since this view has its own.
const SHARED = Object.fromEntries(Object.entries(PANEL).filter(([key]) => key !== 'Actions')) as Omit<typeof PANEL, 'Actions'>;
type Shared = Omit<Values, 'Actions'>;
declare global { interface Window { __dotSequence?: { play: () => void; pause: () => void; seek: (seconds: number) => void; time: () => number; playing: () => boolean; duration: () => number; phase: () => Phase; nodes: () => { x: number; y: number; label: string }[]; strides?: () => unknown } } }

/** An effect that skips its first run: the panel's sliders write into the timeline only when moved. */
function useSync(run: () => void, deps: unknown[]) {
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } run(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export function DotSequence({ sky, tab = 'Current', tracking = null }: { sky: SkyValues; tab?: Tab; tracking?: TrackingValues | null }) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef<{ shared: Shared; values: SequenceValues; timeline: SequenceTimeline; sky: SkyValues; tab: Tab; tracking: TrackingValues | null } | null>(null);
  const dirty = useRef(true), seeds = useRef(0), overlay = useRef(new TrackingOverlay());
  const onAction = useCallback((path: string) => {
    const { shared, timeline } = latest.current!;
    if (path.endsWith('.pause')) timeline.playing ? timeline.pause() : timeline.play();
    else if (path.endsWith('.step')) { timeline.pause(); timeline.seek((timeline.time + 1 / shared.Motion.updateRate) % timeline.duration); }
    else if (path.endsWith('.skip')) { timeline.seek(nextTransitionAt(timeline, timeline.time)); timeline.play(); }
    else if (path.endsWith('.newSeed')) { seeds.current++; dirty.current = true; }
    else if (path.endsWith('.saveToFile')) saveToFile().then(() => note('Save to file', 'Saved')).catch(error => note('Save to file', `Save failed: ${error instanceof Error ? error.message : error}`));
  }, []);
  const bird = useDialKitController('Dot Bird', SHARED, { id: PANEL_ID, persist: true });
  useDensityPreset(bird);
  const dial = useDialKitController('Dot Sequence', SEQUENCE_PANEL, { id: SEQUENCE_ID, persist: true, onAction });
  const timeline = useDialTimeline('Dot Sequence', SEQUENCE_TIMELINE, { id: SEQUENCE_TIMELINE_ID, persist: true, loop: true, autoplay: !reduced.matches });
  latest.current = { shared: bird.values as Shared, values: dial.values, timeline: timeline as unknown as SequenceTimeline, sky, tab, tracking };
  // The transport for scripts: the dock's own play, pause and seek, where the loop is, and the overlay's pins.
  useEffect(() => {
    const tl = () => latest.current!.timeline;
    window.__dotSequence = { play: () => tl().play(), pause: () => tl().pause(), seek: seconds => tl().seek(seconds), time: () => tl().time, playing: () => tl().playing, duration: () => tl().duration, phase: () => phaseAt(tl(), latest.current!.values.Transition.emptyUpdates, latest.current!.shared.Motion.updateRate), nodes: () => overlay.current.nodes };
    return () => { delete window.__dotSequence; };
  }, []);
  // Any change of the dials or the playhead asks for an update at the next tick; the ticks themselves keep the rate.
  const signature = JSON.stringify([bird.values, dial.values, sky, tab, tracking]);
  useEffect(() => { dirty.current = true; }, [signature]);
  useEffect(() => { if (!reduced.matches) dirty.current = true; }, [timeline.time]);
  // The Transition panel's durations write into every dissolve clip, the dock's one source of their timing.
  const { outDuration, inDuration } = dial.values.Transition;
  useSync(() => DialStore.updateValues(SEQUENCE_TIMELINE_ID, Object.fromEntries(DISSOLVE_PATHS('dissolveOut').map(path => [path, outDuration])) as never), [outDuration]);
  useSync(() => DialStore.updateValues(SEQUENCE_TIMELINE_ID, Object.fromEntries(DISSOLVE_PATHS('dissolveIn').map(path => [path, inDuration])) as never), [inDuration]);

  useEffect(() => {
    const renderer = new DotRenderer(), presenter = new SkyPresenter(), pins = overlay.current;
    presenter.overlay = pins;
    const subjects = { bird: makeBirdSubject(), butterfly: makeButterflySubject(), manta: makeMantaSubject(), horse: makeHorseSubject(), fox: makeFoxSubject() };
    if (window.__dotSequence) window.__dotSequence.strides = () => ({ horse: subjects.horse.strides(), fox: subjects.fox.strides() });
    let pass = 0, previous = 0, flapTime = 0, pausedByUs = false, before: Uint8Array | null = null, updates = 0;
    let field: Float32Array | null = null, fieldKey = '';
    const trackersOf = (subject: Subject, t: TrackingValues) => (subject.trackers ?? []).slice(0, Math.round(t.Points.count));
    const overlayOn = () => { const { tab, tracking } = latest.current!; return !!tracking?.Overlay.tracking && (tab === 'Sky' || tracking.Overlay.showOnCurrent); };
    const stop = startStepper({
      element: root.current!, canvas: canvas.current!, dirty,
      rate: () => latest.current!.shared.Motion.updateRate,
      columns: () => latest.current!.shared.Density.columns,
      grid: g => { if (renderer.cols !== g.cols || renderer.rows !== g.rows) renderer.grid(g.cols, g.rows); },
      tick: (ctx, grid) => {
        const { shared, values, timeline, tracking } = latest.current!;
        const t = timeline.time, step = t - previous, wrapped = step < 0 && previous > timeline.duration - .5 && t < .5;
        if (wrapped) pass++;
        // Under reduced motion: the bird, one still pose, no transitions.
        const phase: Phase = reduced.matches ? { subject: 'bird', kept: 1, transition: 0 } : phaseAt(timeline, values.Transition.emptyUpdates, shared.Motion.updateRate);
        // An animal left out of the loop: on to the next one's build-in (its own dissolve-out has already played).
        if (!reduced.matches && !values.Animals[phase.subject]) {
          const at = nextIncludedAt(timeline, phase.subject, values.Animals);
          if (at !== null && Math.abs(at - t) > 1e-3) { previous = t; timeline.seek(at); return; }
        }
        const subject = subjects[phase.subject];
        if ('ready' in subject && !subject.ready) { previous = t; return; }           // a model still loading: nothing new to draw
        // The models' ink can be shifted before the thresholds, so they show all three tones.
        const shift = phase.subject === 'horse' ? values.Models.horseTone : phase.subject === 'fox' ? values.Models.foxTone : 0;
        const thresholds = { empty: Math.max(0, shared.Tone.emptyLight - shift), light: Math.max(0, shared.Tone.lightMid - shift), mid: Math.max(0, shared.Tone.midDark - shift) };
        if (phase.subject === 'bird') {
          // The bird flaps on through its era and through both dissolves; its flap time runs with the playhead.
          if (step >= 0 && step < .5) flapTime += step; else if (wrapped) flapTime += t + timeline.duration - previous; else flapTime = t;
          subjects.bird.pose(reduced.matches ? STILL : poseAt(t, flapTime, { power: 1, spread: 0, bank: 0, glideAt: 0 }, shared.Motion, (noise(pass) - .5) * FLAP.variation));
        } else if (phase.subject === 'manta') subjects.manta.update(t, values.Manta);
        else subjects[phase.subject].update(t);                                    // already moving while it builds in
        let cells = renderer.render(subject, thresholds, shared.Tone.lightAngle);
        const bounds = boundsOf(cells, grid.cols);                                   // the whole subject: the grid follows it through a dissolve
        if (phase.kept < 1) {
          // A new noise field for each transition (and for the New seed button), at the panel's clump size.
          const seed = pass * 10 + phase.transition + seeds.current * 1000, clump = values.Transition.clumpSize, key = `${grid.cols}:${grid.rows}:${clump}:${seed}`;
          if (!field || key !== fieldKey) { field = noiseField(grid.cols, grid.rows, clump, seed); fieldKey = key; }
          // Through the empty moment the few dots kept alternate between the floor and half as many again, so no two updates match.
          cells = dissolve(cells, grid.cols, grid.rows, field, values.Transition.edgePriority, phase.kept <= FLOOR + 1e-9 ? FLOOR * (1 + .5 * (updates % 2)) : phase.kept);
        }
        updates++;
        // No animal is ever still: two updates in a row (one step apart; seeks and stalls are not steps) with the same grid are a bug worth a warning.
        if (step > 0 && step < 1.5 / shared.Motion.updateRate && sameGrid(before, cells)) console.warn(`DotSequence: the grid did not change between updates at ${previous.toFixed(3)} s and ${t.toFixed(3)} s`);
        before = cells.slice();
        previous = t;
        // The overlay's pins: the same posed frame, projected and tested for occlusion, each locked to the nearest dot of these very cells.
        if (overlayOn()) pins.setPoints(project(trackersOf(subject, tracking!), subject.studio.camera, grid, [subject.studio.scene]), cells, grid);
        presenter.shape(cells, bounds, { name: NAMES[phase.subject], index: orderOf(timeline).indexOf(phase.subject) + 1, total: ANIMALS.length, rate: shared.Motion.updateRate });
        if (latest.current!.tab !== 'Sky') drawDots(ctx, cells, grid, { ...shared.Colors, dotSize: shared.Density.dotSize, navyWidth: shared.Density.navyWidth });
      },
      every: (ctx, grid, now) => {
        const { sky, tab, shared, tracking } = latest.current!, shapes = { dotSize: shared.Density.dotSize, navyWidth: shared.Density.navyWidth };
        presenter.tracking = overlayOn() ? tracking : null;
        if (tab === 'Sky') presenter.frame(ctx, grid, now, sky, shapes, reduced.matches);
        else if (before) {
          // The Current tab: the dots again (stepped, from the last update), then the same grid, texts and pins as the Sky version, in solid navy and white.
          drawDots(ctx, before, grid, { ...shared.Colors, ...shapes });
          presenter.chrome(ctx, grid, now, sky, reduced.matches, { ink: shared.Colors.navy, solid: true });
        }
      },
      // Off screen the clock waits; it resumes only if this paused it.
      shown: on => { const { timeline } = latest.current!; if (!on) { if (timeline.playing) { pausedByUs = true; timeline.pause(); } } else if (pausedByUs) { pausedByUs = false; timeline.play(); } },
      motion: () => { const { timeline } = latest.current!; if (reduced.matches) timeline.pause(); else timeline.play(); },
    });
    return () => { stop(); Object.values(subjects).forEach(subject => subject.dispose()); renderer.dispose(); };
  }, []);

  return <div ref={root} className={`dot-bird${tab === 'Sky' ? ' dot-sky' : ''}`} role="img" aria-label="Animated dot-matrix animals: bird, butterfly, manta ray, horse and fox">{tab === 'Sky' && <SkyBackground sky={sky.Sky} extras={sky.Extras} still={reduced.matches} />}<canvas ref={canvas} aria-hidden="true" /></div>;
}
