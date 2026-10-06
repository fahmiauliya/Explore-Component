import { useEffect, useMemo, useRef } from 'react';

const LOOP_MS = 8000;
const TAU = Math.PI * 2;
const phase = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (value - Math.floor(value)) * TAU;
};

// Nearby patches share a measured fluctuation; local harmonics keep the field from
// pulsing in unison. Integer frequencies meet exactly at the eight-second seam.
function variation(x: number, y: number, t: number) {
  const seed = Math.floor(x / 24) * 59 + Math.floor(y / 23.6364) * 137;
  return .55 * Math.sin(TAU * t * 2 + x * .025 + y * .029)
    + .30 * Math.sin(TAU * t * 3 + phase(seed))
    + .15 * Math.sin(TAU * t * 5 + phase(seed + 709));
}

type Patch = { key: string; x: number; y: number; amplitude: number; cells: number[][] };

export function AnimatedPixels({ cells, signal = false }: { cells: number[][]; signal?: boolean }) {
  const ref = useRef<SVGGElement>(null);
  const patches = useMemo(() => {
    const groups = new Map<string, Patch>();
    for (const cell of cells) {
      const x = cell[0] + (signal ? 248 : 0);
      const y = cell[1] + (signal ? 71 : 0);
      const column = Math.floor((x + .001) / 24);
      const row = Math.floor((y + .001) / 23.6364);
      const key = `${column}:${row}`;
      let patch = groups.get(key);
      if (!patch) {
        patch = { key, x: column * 24 + 12, y: row * 23.6364 + 11.8182, amplitude: signal ? .32 : .38, cells: [] };
        groups.set(key, patch);
      }
      patch.cells.push(cell);
      // Keep the white core persistent, with less variation than the surrounding signal.
      if (signal && cell[3] > .1) patch.amplitude = .15;
    }
    return [...groups.values()];
  }, [cells, signal]);

  useEffect(() => {
    const root = ref.current!;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let animations: Animation[] = [];
    const groups = Array.from(root.children) as SVGGElement[];
    const restore = () => {
      animations.forEach(animation => animation.cancel());
      animations = [];
      groups.forEach(group => group.querySelectorAll('rect').forEach(rect => {
        rect.setAttribute('opacity', rect.dataset.baseOpacity!);
      }));
    };
    const syncVisibility = () => animations.forEach(animation => {
      if (document.hidden) animation.pause(); else animation.play();
    });
    const start = () => {
      restore();
      if (reducedMotion.matches) return;
      groups.forEach((group, index) => {
        const patch = patches[index];
        if (!patch.cells.some(cell => cell[2] > .015)) return;
        // Leave headroom without clipping the source cells' relative intensities.
        const brightest = Math.max(...patch.cells.map(cell => cell[2]));
        const gain = Math.min(1 + patch.amplitude, 1 / brightest);
        group.querySelectorAll('rect').forEach(rect => {
          rect.setAttribute('opacity', String(Math.min(1, Number(rect.dataset.baseOpacity) * gain)));
        });
        const frames = Array.from({ length: 65 }, (_, frame) => ({
          offset: frame / 64,
          opacity: Math.min(1, (1 + patch.amplitude * variation(patch.x, patch.y, (frame % 64) / 64)) / gain),
        }));
        const animation = group.animate(frames, { duration: LOOP_MS, iterations: Infinity, easing: 'linear' });
        animation.currentTime = 0;
        animations.push(animation);
      });
      syncVisibility();
    };
    start();
    reducedMotion.addEventListener('change', start);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      restore();
      reducedMotion.removeEventListener('change', start);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [patches]);

  return <g ref={ref} data-measurement-field={signal ? 'signal' : 'noise'}>
    {patches.map(patch => <g key={patch.key} data-measurement-patch={patch.key}>
      {patch.cells.map(([x, y, opacity, r, g, b]) => <rect
        key={`${x}:${y}`} x={x} y={y} width={7.45} height={7.3288}
        opacity={opacity} data-base-opacity={opacity}
        fill={`rgb(${r * 255} ${g * 255} ${b * 255})`}
      />)}
    </g>)}
  </g>;
}
