import { useEffect, type RefObject } from 'react';

const DURATION = 8000;
// Figma's 71% marker sits 124.74° clockwise from the left foot. The sweep ends just
// past it so the original active mask keeps its own antialiased edge at rest.
export const MARKER_ANGLE = 124.74;
const SWEEP_END = 126;
const settle = 'cubic-bezier(.16, 1, .3, 1)';
const drain = 'cubic-bezier(.65, 0, .35, 1)';
const at = (seconds: number, values: Record<string, string>, easing = 'linear') => ({ offset: seconds / 8, easing, ...values });
const format = (value: number) => value.toLocaleString('en-US');

export type CapacityReading = { percent: number; load: number; rows: { load: number; percent: number }[] };

// Build → hold → drain, on one clock. Every track starts and
// ends empty, so the eight-second seam is exact. Numbers are read back from the
// animated custom properties, never from wall time, so paused frames stay coherent.
export function useCapacityMotion(ref: RefObject<HTMLElement | null>, reading: CapacityReading) {
  useEffect(() => {
    const card = ref.current!;
    const gauge = card.querySelector<HTMLElement>('.capacity-gauge')!;
    const value = gauge.querySelector<HTMLElement>('.capacity-value')!;
    const load = gauge.querySelector<HTMLElement>('.capacity-load strong')!;
    const rows = Array.from(card.querySelectorAll<HTMLElement>('.breakdown-row'));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let animations: Animation[] = [];
    let frame = 0;

    const write = (node: Element, text: string) => { if (node.textContent !== text) node.textContent = text; };
    const sync = () => {
      const sweep = parseFloat(getComputedStyle(gauge).getPropertyValue('--sweep'));
      const progress = Math.min(sweep / MARKER_ANGLE, 1);
      write(value, `${Math.round(reading.percent * progress)}%`);
      write(load, `${format(Math.round(reading.load * progress))} `);
      rows.forEach((row, index) => {
        const fill = parseFloat(getComputedStyle(row).getPropertyValue('--fill'));
        write(row.querySelector('.load')!, format(Math.round(reading.rows[index].load * fill)));
        write(row.querySelector('.share')!, `${Math.round(reading.rows[index].percent * fill)}%`);
      });
    };
    const tick = () => { sync(); frame = requestAnimationFrame(tick); };
    const stop = () => {
      animations.forEach(animation => animation.cancel());
      animations = [];
      cancelAnimationFrame(frame);
      sync();
    };
    const syncVisibility = () => animations.forEach(animation => document.hidden ? animation.pause() : animation.play());
    const start = () => {
      stop();
      if (reduced.matches) return;
      const tracks: [Element, Keyframe[]][] = [
        [gauge, [at(0, { '--sweep': '0deg' }), at(.45, { '--sweep': '0deg' }, settle), at(2.45, { '--sweep': `${SWEEP_END}deg` }),
          at(6.15, { '--sweep': `${SWEEP_END}deg` }, drain), at(7.3, { '--sweep': '0deg' }), at(8, { '--sweep': '0deg' })]],
        ...rows.map((row, index): [Element, Keyframe[]] => {
          const grow = .95 + index * .13, empty = 6 + (rows.length - 1 - index) * .06;
          return [row, [at(0, { '--fill': '0' }), at(grow, { '--fill': '0' }, settle), at(grow + 1.35, { '--fill': '1' }),
            at(empty, { '--fill': '1' }, drain), at(empty + .85, { '--fill': '0' }), at(8, { '--fill': '0' })]];
        }),
      ];
      animations = tracks.map(([element, keyframes]) => element.animate(keyframes, {
        duration: DURATION, iterations: Infinity, fill: 'both', easing: 'linear',
      }));
      const origin = document.timeline.currentTime;
      animations.forEach(animation => { animation.startTime = origin; });
      syncVisibility();
      frame = requestAnimationFrame(tick);
    };
    start();
    reduced.addEventListener('change', start);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      stop();
      reduced.removeEventListener('change', start);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [ref, reading]);
}
