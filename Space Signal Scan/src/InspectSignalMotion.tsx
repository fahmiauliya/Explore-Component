import { useEffect, useRef } from 'react';

const DURATION = 8000;
const ease = 'cubic-bezier(.22, .8, .25, 1)';
const at = (seconds: number, values: Record<string, string>) => ({ offset: seconds / 8, easing: ease, ...values });

// One shared clock: every element meets its starting pose at the eight-second seam.
// The cursor travels outside the clipped artboard; opacity is never animated.
export function InspectSignalMotion() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const cursor = ref.current!;
    const artboard = cursor.parentElement!;
    const socket = artboard.querySelector<HTMLElement>('.inspect-loop')!;
    const face = socket.querySelector<HTMLElement>('.inspect-face')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let animations: Animation[] = [];
    const stop = () => { animations.forEach(a => a.cancel()); animations = []; };
    const syncVisibility = () => animations.forEach(a => document.hidden ? a.pause() : a.play());
    const start = () => {
      stop();
      if (reduced.matches) return;
      const rest = {
        transform: 'translateY(0px)', filter: 'brightness(1)',
        '--inspect-light-y': '12.5%',
        boxShadow: 'inset 0 4px 4px #ffffff1a, inset 0 -4px 4px #0004',
      };
      const hover = {
        transform: 'translateY(-.2px)', filter: 'brightness(1.08)',
        '--inspect-light-y': '5%',
        boxShadow: 'inset 0 2px 3px #ffffff30, inset 0 -4px 4px #0004',
      };
      const pressed = {
        transform: 'translateY(.65px)', filter: 'brightness(.92)',
        '--inspect-light-y': '20%',
        boxShadow: 'inset 0 2px 3px #0009, inset 0 -1px 2px #ffffff18',
      };
      const rebound = { ...hover, transform: 'translateY(-.32px)' };
      const frame = (seconds: number, x: number, y: number) => at(seconds, { transform: `translate(${x}px, ${y}px)` });
      const raised = { boxShadow: '0 0 0 .75px #253ca080, 0 3.8982px 6.82185px -4.87275px #3348a4d9' };
      const sunken = { boxShadow: '0 0 0 .75px #253ca080, 0 .5px 1px -.25px #17254c99' };
      const tracks: [Element, Keyframe[]][] = [
        [cursor, [frame(0, 1100, 560), frame(1.5, 1100, 560),
          frame(2.1, 820, 460), frame(2.4, 682, 400), frame(2.5, 650, 397),
          frame(4.3, 650, 397), frame(4.65, 765, 424), frame(5.5, 1100, 560), frame(8, 1100, 560)]],
        [face, [at(0, rest), at(2.3, rest), at(2.6, hover), at(3.5, hover),
          at(3.60, pressed), at(3.7, pressed), at(3.96, rebound), at(4.2, hover),
          at(4.45, hover), at(4.95, rest), at(8, rest)]],
        [socket, [at(0, raised), at(3.5, raised), at(3.60, sunken), at(3.7, sunken),
          at(4.15, raised), at(8, raised)]],
      ];
      animations = tracks.map(([element, keyframes]) => element.animate(keyframes, {
        duration: DURATION, iterations: Infinity, fill: 'both', easing: 'linear',
      }));
      const origin = document.timeline.currentTime;
      animations.forEach(animation => { animation.startTime = origin; });
      syncVisibility();
    };
    start();
    reduced.addEventListener('change', start);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      stop();
      reduced.removeEventListener('change', start);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  return <svg ref={ref} className="presentation-cursor" width="28" height="36" viewBox="0 0 28 36" aria-hidden="true">
    <path d="M2 2L3 27L9.5 21.5L15 33L20 30.5L14.5 19L23 18Z" fill="#fff" stroke="#17191e" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>;
}
