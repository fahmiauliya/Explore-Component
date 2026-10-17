import { useEffect, useRef, type RefObject } from 'react';
import { DialStore, TimelineStore, useDialTimeline, type DialConfig, type ResolvedValues } from 'dialkit';
import { AGENT_TIMELINE, clipOf, stateAt, timelineNow, type Static } from './agent/timeline';
import { AGENT_ID, AGENT_TIMELINE_ID } from './bloom/tuning';

/*
 * The dashboard view's motion, drawn from the "Agent Icon" timeline (agent/timeline.ts) at its playhead: the
 * camera's zoom, and the flower icon as the agent's status. `working` sways, breathes and turns on the timeline's
 * swing tracks; `complete` is the still, fully open flower. The green dot is always there, fixed, and pulses once
 * as the agent finishes. Nothing fades (no opacity) and the light never changes. The Status select jumps the
 * playhead to the matching part of the loop.
 */
export type AgentStatus = 'working' | 'complete';

// ── The Agent panel. Sliders are [default, min, max, step]; dot sizes are fractions of the flower's width W. ──
export const AGENT_PANEL = {
  Status: { status: { type: 'select', options: ['working', 'complete'], default: 'working' } },
  Icon: {
    glowStrength: [.8, 0, 1, .05],      // the dark pink haze behind the flower and the faint discs
    petalWidth: [.98, .5, 1, .01],      // petals narrowed across; Figma's render has them all but touching
    sparkleSize: [1, .3, 2, .05],       // the centre star
  },
  Dot: {
    size: [.30, .1, .6, .01],           // diameter, × W
    ring: [.11, 0, .3, .01],            // the dark ring around it, × W
    offsetX: [.42, 0, 1, .01],          // centre, right of the flower's centre, × W
    offsetY: [.40, 0, 1, .01],          // centre, above the flower's centre, × W
  },
  Pulse: { scale: [1.4, 1, 2, .01], duration: [.51, .2, 1.5, .01] },  // the dot's one pulse as the agent finishes
  Actions: { saveToFile: { type: 'action', label: 'Save to file' }, resetToFile: { type: 'action', label: 'Reset to file' } },
} satisfies DialConfig;
export type AgentValues = ResolvedValues<typeof AGENT_PANEL>;

// ── The camera's two framings: 489:2919 is the 483:23065 window 3.2951× larger with its corner moved. ──
const ZOOM = 108.007 / 32.778;
const WIDE = { left: 174, top: 91 }, CLOSE = { left: 303, top: -826 };
// Both are the window scaled about one fixed point of the artboard, the point that maps to the same window
// point in both; scaling about it (even outside the window) lands exactly on the close framing.
const ratio = 1 / ZOOM;
const FOCUS = { x: (WIDE.left - ratio * CLOSE.left) / (1 - ratio), y: (WIDE.top - ratio * CLOSE.top) / (1 - ratio) };
export const ZOOM_ORIGIN = { x: FOCUS.x - WIDE.left, y: FOCUS.y - WIDE.top };

// ── The icon: the flower's frame, its width W (petal tip to petal tip) and its size in the rail. ──
export const FLOWER_FRAME = 442.986, FLOWER_W = 389.8, ICON_PX = 32.778;
export const ICON_SCALE = ICON_PX / FLOWER_FRAME;
// Each petal samples the sway track at its own speed and phase: whole cycles per loop keep the seam, 3–7 of them.
const PETAL_SPEED = [1, 1.2, .8, 1.4, .6, 1.2, .8, 1];
const PETAL_PHASE = [0, .37, .71, .14, .52, .88, .25, .63];
const TILT = .4;                        // the petals also tip about their hinges, this much of their sway

const fmt = (value: number) => Number(value.toFixed(3));

/** The dot's geometry for the icon, in the flower's units, rounded to whole pixels at icon size so it stays sharp. */
export function dotStyle(dot: AgentValues['Dot']) {
  const px = (fraction: number) => Math.round(fraction * FLOWER_W * ICON_SCALE) / ICON_SCALE;
  const size = px(dot.size), ring = px(dot.ring), frame = size + 2 * ring, centre = FLOWER_FRAME / 2;
  return { '--status-dot': `${fmt(size)}px`, '--status-frame': `${fmt(frame)}px`, '--status-left': `${fmt(centre + px(dot.offsetX) - frame / 2)}px`, '--status-top': `${fmt(centre - px(dot.offsetY) - frame / 2)}px` };
}

type Parts = { window: HTMLElement; bloom: HTMLElement; petals: { pivot: HTMLElement; angle: number }[]; dot: HTMLElement | null };
const collect = (window_: HTMLElement): Parts => ({
  window: window_,
  bloom: window_.querySelector<HTMLElement>('.flower-icon [data-motion="bloom"]')!,
  petals: [...window_.querySelectorAll<HTMLElement>('.flower-icon .petal')].map(pivot => ({ pivot, angle: Number(pivot.dataset.angle) })),
  dot: window_.querySelector<HTMLElement>('.flower-icon .flower-status'),
});

/** The status the playhead is in: complete from the settle's start to the sway's return. */
export const statusAt = (st: Static, t: number): AgentStatus => t >= clipOf(st, 'settle').at && t < clipOf(st, 'resume').at ? 'complete' : 'working';

// One frame from the clips' values at time t. Looping tracks fold against continuous time, so a petal can run
// at its own speed and phase of the same sway track. The dot is 1 except through its pulse.
function draw(parts: Parts, st: Static, t: number) {
  const closeness = stateAt(clipOf(st, 'camera'), t).current.closeness;
  parts.window.style.transform = `scale(${fmt(ZOOM ** closeness)})`;
  const working = clipOf(st, 'working'), settle = stateAt(clipOf(st, 'settle'), t), resume = stateAt(clipOf(st, 'resume'), t);
  const amount = resume.started ? resume.current.amount : settle.started ? settle.current.amount : 1;
  const whole = stateAt(working, t, t).current;
  parts.bloom.style.rotate = `${fmt(whole.rotate * amount)}deg`;
  parts.bloom.style.scale = `${fmt(1 + (whole.breathing - 1) * amount)}`;
  parts.petals.forEach(({ pivot, angle }, k) => {
    const own = t * PETAL_SPEED[k % PETAL_SPEED.length] + PETAL_PHASE[k % PETAL_PHASE.length] * working.duration;
    const sway = stateAt(working, own, own).current.petalSway * amount;
    pivot.style.transform = `rotateX(${fmt(sway * TILT)}deg)`;
    pivot.style.rotate = `${fmt(angle + sway)}deg`;
  });
  if (parts.dot) { const pulse = stateAt(clipOf(st, 'donePulse'), t); parts.dot.style.scale = `${fmt(pulse.started ? pulse.current.scale : 1)}`; }
}

// The design as rendered: no camera, no sway; the dot at its size.
function still(parts: Parts) {
  parts.window.style.transform = '';
  parts.bloom.style.rotate = parts.bloom.style.scale = '';
  parts.petals.forEach(({ pivot, angle }) => { pivot.style.transform = ''; pivot.style.rotate = angle ? `${angle}deg` : ''; });
  if (parts.dot) parts.dot.style.scale = '1';
}

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

/** The timeline itself: registered here, as a child of the dashboard, so its frame updates never re-render it. */
export function AgentClock() {
  useDialTimeline('Agent Icon', AGENT_TIMELINE, { id: AGENT_TIMELINE_ID, persist: true, loop: true, autoplay: !reduced.matches });
  return null;
}

/** An effect that skips its first run: the panel's sliders write into the timeline only when moved. */
function useSync(run: () => void, deps: unknown[]) {
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } run(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Draws the view from the playhead on every tick, seek, clip edit and panel change; reports the status it is in. */
export function useDashboardMotion(ref: RefObject<HTMLElement | null>, agent: AgentValues, onStatus: (status: AgentStatus) => void) {
  const latest = useRef(agent);
  latest.current = agent;
  const reported = useRef<AgentStatus>('working');
  const syncing = useRef(false);
  useEffect(() => {
    const parts = collect(ref.current!);
    parts.window.style.transformOrigin = `${fmt(ZOOM_ORIGIN.x)}px ${fmt(ZOOM_ORIGIN.y)}px`;
    parts.bloom.style.perspective = '1000px';
    const report = (status: AgentStatus) => {
      if (status === reported.current) return;
      reported.current = status;
      onStatus(status);
      // The Status select follows the playhead; its own changes are seeks, below.
      syncing.current = true;
      DialStore.updateValue(AGENT_ID, 'Status.status', status);
      syncing.current = false;
    };
    const render = () => {
      // Under reduced motion the Status select is the status itself; the store has it before React re-renders.
      if (reduced.matches) { const status = (DialStore.getValue(AGENT_ID, 'Status.status') ?? latest.current.Status.status) as AgentStatus; still(parts); report(status); return; }
      const st = timelineNow(), t = TimelineStore.getTransport(AGENT_TIMELINE_ID).time;
      draw(parts, st, t);
      report(statusAt(st, t));
    };
    const unsubscribe = [TimelineStore.subscribe(AGENT_TIMELINE_ID, render), DialStore.subscribe(AGENT_TIMELINE_ID, render), DialStore.subscribe(AGENT_ID, render)];
    reduced.addEventListener('change', render);
    render();
    // The exporter's clock: the dock's, paused and seeked to exact times.
    window.__floral = { pause: () => TimelineStore.pause(AGENT_TIMELINE_ID), seek: seconds => TimelineStore.seek(AGENT_TIMELINE_ID, seconds), duration: () => timelineNow().duration, holdAt: () => clipOf(timelineNow(), 'complete').at + 1 };
    return () => { unsubscribe.forEach(stop => stop()); reduced.removeEventListener('change', render); parts.window.style.transformOrigin = ''; parts.bloom.style.perspective = ''; still(parts); if (parts.dot) parts.dot.style.scale = ''; };
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps -- onStatus is read through the closure once
  // The Status select: a jump to where the loop enters that state (not when it is only following the playhead).
  useEffect(() => {
    if (syncing.current || reduced.matches) return;
    const st = timelineNow(), status = agent.Status.status as AgentStatus;
    if (statusAt(st, TimelineStore.getTransport(AGENT_TIMELINE_ID).time) === status) return;
    TimelineStore.seek(AGENT_TIMELINE_ID, clipOf(st, status === 'complete' ? 'settle' : 'resume').at);
    TimelineStore.play(AGENT_TIMELINE_ID);
  }, [agent.Status.status]);
  // The Pulse sliders write into the pulse clip's steps, the dock's one source of truth: 160 and 350 ms of the 510.
  const { scale: pulseScale, duration: pulseDuration } = agent.Pulse;
  useSync(() => DialStore.updateValues(AGENT_TIMELINE_ID, { 'donePulse.step1.to.scale': pulseScale, 'donePulse.step1.duration': pulseDuration * 16 / 51, 'donePulse.step2.duration': pulseDuration * 35 / 51 } as never), [pulseScale, pulseDuration]);
}
