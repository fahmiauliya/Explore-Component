import { useEffect, useRef, useState } from 'react';
import type { Entry, Target } from './figures';
import { loadFigure, loadKernel, mountFigure, pointAt, type Figure, type Handle } from './hairline';

/** One kernel for the page: one frame loop, which only runs the figures on screen. */
export const HL = loadKernel();
const figures = new Map<string, Figure>();
export function figureOf(entry: Entry) {
  let f = figures.get(entry.slug);
  if (!f) { f = loadFigure(entry.source, HL); figures.set(entry.slug, f); }
  return f;
}

type Props = {
  entry: Entry;
  value: number;
  onRead: (text: string) => void;
  /** A gallery cell's height over its width; or 'box', a detail box of any shape. */
  aspect: number | 'box';
  /** The detail view: every hover target becomes a keyboard stop. */
  keyboard?: boolean;
};

export function Illustration({ entry, value, onRead, aspect, keyboard }: Props) {
  const host = useRef<HTMLDivElement>(null), handle = useRef<Handle | null>(null);
  const first = useRef(value), read = useRef(onRead);
  read.current = onRead;

  useEffect(() => {
    const stage = host.current!;
    const h = mountFigure(HL, stage, figureOf(entry), first.current, (text) => read.current(text));
    handle.current = h;
    // Touch: a tap holds its hover after the finger lifts (the kernel would let go after 1.4 s); a tap anywhere else lets go.
    let held = false;
    const keep = (e: PointerEvent) => { if (e.pointerType !== 'mouse') { e.stopImmediatePropagation(); held = true; } };
    const away = (e: PointerEvent) => { if (held && e.pointerType !== 'mouse' && !stage.contains(e.target as Node)) { held = false; pointAt(stage, 'pointerleave'); } };
    stage.addEventListener('pointerleave', keep, true);
    document.addEventListener('pointerdown', away, true);
    return () => {
      stage.removeEventListener('pointerleave', keep, true);
      document.removeEventListener('pointerdown', away, true);
      h.destroy();
      handle.current = null;
    };
  }, [entry]);
  useEffect(() => { handle.current?.set(value); }, [value]);

  return (
    <div className="plane" style={plane(entry, aspect)}>
      <div ref={host} className="stage" />
      {keyboard && <Stops stage={host} targets={entry.targets} />}
    </div>
  );
}

/**
 * Where the 400 × 320 drawing sits: its extent over every state is scaled to the safe area and centred, in container
 * units so it holds at every size. A gallery cell: 60% of the width, never closer than 48px to an edge or the labels.
 * A detail box: 70% of its smaller side.
 */
function plane(entry: Entry, aspect: number | 'box'): React.CSSProperties {
  const [x0, y0, x1, y1] = entry.box, m = Math.max(x1 - x0, y1 - y0);
  // the labels sit 24px in and are 16px tall: 40px + 48px clear above and below the drawing
  const safe = aspect === 'box' ? '70cqmin' : `min(60cqw, 100cqw - 96px, ${100 * aspect}cqw - 176px)`;
  const midY = aspect === 'box' ? '50cqh' : `${50 * aspect}cqw`;
  const at = (centre: string, c: number) => `calc(${centre} - ${safe} * ${(c / m).toFixed(5)})`;
  return { width: `calc(${safe} * ${(400 / m).toFixed(5)})`, left: at('50cqw', (x0 + x1) / 2), top: at(midY, (y0 + y1) / 2) };
}

/** Invisible stops over the hover targets: Tab moves between them and focus acts as hover. The pointer passes through. */
function Stops({ stage, targets }: { stage: React.RefObject<HTMLDivElement | null>; targets: Target[] }) {
  const [on, setOn] = useState(-1);
  return (
    <div className="stops">
      {targets.map((t, i) => (
        <button
          key={t.label}
          type="button"
          className="stop"
          data-on={on === i || undefined}
          aria-label={t.label}
          style={{ left: `${(t.at[0] / 400) * 100}%`, top: `${(t.at[1] / 320) * 100}%` }}
          onFocus={() => { setOn(i); if (stage.current) pointAt(stage.current, 'pointermove', t.at); }}
          onBlur={(e) => {
            setOn(-1);
            if (!(e.relatedTarget as HTMLElement | null)?.classList?.contains('stop') && stage.current) pointAt(stage.current, 'pointerleave');
          }}
          onKeyDown={(e) => { if (e.key === 'Escape') (e.currentTarget as HTMLButtonElement).blur(); }}
        />
      ))}
    </div>
  );
}
