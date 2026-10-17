import { useCallback, useEffect, useRef, useState } from 'react';
import { DialStore, useDialKitController, useDialTimeline } from 'dialkit';
import { PANEL, type Values } from './bird/dial';
import { useDensityPreset } from './bird/density';
import { PANEL_ID, SEQUENCE_ID, SEQUENCE_TIMELINE_ID, saveToFile } from './bird/tuning';
import { makeBirdSubject } from './bird/subject';
import { STILL, poseAt, FLAP, type Story } from './bird/motion';
import { makeMantaSubject } from './manta/subject';
import { makeHorseSubject } from './horse/subject';
import { makeFoxSubject } from './fox/subject';
import { makeButterflySubject } from './butterfly/subject';
import { DISSOLVE_PATHS, SEQUENCE_PANEL, SEQUENCE_TIMELINE, type SequenceValues } from './sequence/dial';
import { ANIMALS, NAMES, nextIncludedAt, nextTransitionAt, orderOf, phaseAt, type Animal, type Phase, type SequenceTimeline } from './sequence/phase';
import { DotRenderer, type Subject, type Tones } from './dot/renderer';
import { drawDots } from './dot/dots';
import { FLOOR, dissolve, noiseField } from './dot/dissolve';
import { note, reduced, sameGrid, startStepper } from './dot/stepper';
import { CYCLES, calibrate } from './dot/calibrate';
import { CycleClock } from './dot/wave';
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
 * showing is moved on by the step since the last update (its own cycle clock, so strokes vary a little), rendered
 * through the shared dot renderer, and through a dissolve its cells are masked, dots only switching off or on.
 * On its first showing a subject is calibrated: poses across its whole loop are rendered and the box of their
 * cells sets its zoom and centre, so every animal fills the frame alike. The density, tone and colours are the
 * "Dot Bird" panel's; the "Dot Sequence" panel holds the animals' toggles, sizes, the manta, the strides, the
 * transition and the actions. With `tab` Sky, the same shapes in white over a sky; the chrome is on both tabs.
 */
const noise = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// The shared controls: the bird panel without its actions, since this view has its own.
const SHARED = Object.fromEntries(Object.entries(PANEL).filter(([key]) => key !== 'Actions')) as Omit<typeof PANEL, 'Actions'>;
type Shared = Omit<Values, 'Actions'>;
const FLAPPING: Story = { power: 1, spread: 0, bank: 0, glideAt: 0 };   // the bird's story in the sequence: it just flaps
type Driver = { subject: Subject & { dispose: () => void; readonly ready?: boolean }; span: () => number; travel: () => number; seek: (time: number) => void; update: (time: number, step: number) => void };
const PACE = .6;                                                     // the clouds' extra pace while a runner is on: this many stride-seconds' worth a second
declare global { interface Window { __dotSequence?: { play: () => void; pause: () => void; seek: (seconds: number) => void; time: () => number; playing: () => boolean; duration: () => number; phase: () => Phase; nodes: () => { x: number; y: number; label: string }[]; strides?: () => unknown; crossings?: () => number; stats?: () => { updates: number; identical: number } } } }

/** An effect that skips its first run: the panel's sliders write into the timeline only when moved. */
function useSync(run: () => void, deps: unknown[]) {
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } run(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export function DotSequence({ sky, tab = 'Current', tracking = null }: { sky: SkyValues; tab?: Tab; tracking?: TrackingValues | null }) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef<{ shared: Shared; values: SequenceValues; timeline: SequenceTimeline; sky: SkyValues; tab: Tab; tracking: TrackingValues | null } | null>(null);
  const dirty = useRef(true), seeds = useRef(0), overlay = useRef(new TrackingOverlay());
  const [travel, setTravel] = useState(1);                        // the clouds' pace while a running animal is on, from its stride
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
    const shared = () => latest.current!.shared, values = () => latest.current!.values;
    const birdSubject = makeBirdSubject(), butterfly = makeButterflySubject(), manta = makeMantaSubject(), horse = makeHorseSubject(), fox = makeFoxSubject();
    if (window.__dotSequence) window.__dotSequence.strides = () => ({ horse: horse.strides(), fox: fox.strides() });
    // The bird flaps on its own clock here, each flap a little different, with the pass's variation on top.
    const flap = new CycleClock(.4, .05, 1);
    let pass = 0;
    const birdPose = (time: number, amplitude: number) => birdSubject.pose(reduced.matches ? STILL : poseAt(time, flap.u * flap.period, FLAPPING, shared().Motion, (noise(pass) - .5) * FLAP.variation + (amplitude - 1)));
    const drivers: Record<Animal, Driver> = {
      bird: { subject: birdSubject, span: () => shared().Motion.flapDuration * CYCLES, travel: () => 1, seek: t => { flap.period = shared().Motion.flapDuration; flap.seek(t); birdPose(t, 1 + FLAP.variation / 2 + .05); }, /* calibrated at its biggest stroke */ update: (t, step) => { flap.period = shared().Motion.flapDuration; if (step >= 0 && step < .5) flap.advance(step); else flap.seek(t); birdPose(t, flap.amplitude()); } },
      butterfly: { subject: butterfly, span: () => butterfly.span * CYCLES, travel: () => 1, seek: t => butterfly.seek(t), update: (t, step) => butterfly.update(t, step) },
      manta: { subject: manta, span: () => values().Manta.waveDuration * CYCLES, travel: () => 1, seek: t => manta.seek(t, values().Manta), update: (t, step) => manta.update(t, step, values().Manta) },
      horse: { subject: horse, span: () => values().Stride.horse * CYCLES, travel: () => 1 + PACE / values().Stride.horse, seek: t => horse.seek(t, values().Stride.horse), update: (t, step) => horse.update(t, step, values().Stride.horse) },
      fox: { subject: fox, span: () => values().Stride.fox * CYCLES, travel: () => 1 + PACE / values().Stride.fox, seek: t => fox.seek(t, values().Stride.fox), update: (t, step) => fox.update(t, step, values().Stride.fox) },
    };
    const calibrated = new Set<Animal>();
    let previous = 0, pausedByUs = false, before: Uint8Array | null = null, updates = 0, travelling = 1, identical = 0;
    if (window.__dotSequence) { window.__dotSequence.crossings = () => presenter.crossings; window.__dotSequence.stats = () => ({ updates, identical }); }
    let field: Float32Array | null = null, fieldKey = '';
    const trackersOf = (subject: Subject, t: TrackingValues) => (subject.trackers ?? []).slice(0, Math.round(t.Points.count));
    const overlayOn = () => { const { tab, tracking } = latest.current!; return !!tracking?.Overlay.tracking && (tab === 'Sky' || tracking.Overlay.showOnCurrent); };
    const tonesOf = (s: Shared): Tones => ({ empty: s.Tone.emptyLight, light: s.Tone.light, mid: s.Tone.mid, dark: s.Tone.dark });
    const stop = startStepper({
      element: root.current!, canvas: canvas.current!, dirty,
      rate: () => shared().Motion.updateRate,
      columns: () => shared().Density.columns,
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
        const driver = drivers[phase.subject], subject = driver.subject;
        if (subject.ready === false) { previous = t; return; }                         // a model still loading: nothing new to draw
        const tones = tonesOf(shared);
        // The first showing: the subject's whole loop sets its size and centre; then back to the playhead.
        if (!calibrated.has(phase.subject)) { calibrated.add(phase.subject); const c = calibrate(subject, renderer, grid, tones, shared.Tone.lightAngle, driver.span(), driver.seek); subject.studio.calibrate(c); driver.seek(t); console.debug('DotSequence calibrated', phase.subject, JSON.stringify(c)); }
        subject.studio.size(1 + values.Size[phase.subject] / 100);
        driver.update(t, wrapped ? t + timeline.duration - previous : step);           // already moving while it builds in
        const pace = driver.travel(); if (pace !== travelling) { travelling = pace; setTravel(pace); }
        let cells = renderer.render(subject, tones, shared.Tone.lightAngle);
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
        if (step > 0 && step < 1.5 / shared.Motion.updateRate && sameGrid(before, cells)) { identical++; console.warn(`DotSequence: the grid did not change between updates at ${previous.toFixed(3)} s and ${t.toFixed(3)} s`); }
        before = cells.slice();
        previous = t;
        // The overlay's pins: the same posed frame, projected and tested for occlusion, each locked to the nearest dot of these very cells.
        if (overlayOn()) pins.setPoints(project(trackersOf(subject, tracking!), subject.studio.camera, grid, [subject.studio.scene]), cells, grid);
        presenter.shape(cells, bounds, { name: NAMES[phase.subject], index: orderOf(timeline).indexOf(phase.subject) + 1, total: ANIMALS.length, rate: shared.Motion.updateRate }, grid, subject.studio.loopBox());
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
    return () => { stop(); Object.values(drivers).forEach(driver => driver.subject.dispose()); renderer.dispose(); };
  }, []);

  return <div ref={root} className={`dot-bird${tab === 'Sky' ? ' dot-sky' : ''}`} role="img" aria-label="Animated dot-matrix animals: bird, butterfly, manta ray, horse and fox">{tab === 'Sky' && <SkyBackground sky={sky.Sky} extras={sky.Extras} still={reduced.matches} travel={travel} />}<canvas ref={canvas} aria-hidden="true" /></div>;
}
