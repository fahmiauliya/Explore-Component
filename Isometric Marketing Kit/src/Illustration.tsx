import { useEffect, useRef, useState } from 'react';
import type { Entry, Target } from './figures';
import { lower } from './meta';
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
  onRead?: (text: string) => void;
  /** A gallery cell's height over its width; or 'box', a detail box of any shape. */
  aspect: number | 'box';
  /** The detail view: every hover target becomes a keyboard stop. */
  keyboard?: boolean;
  /** A gallery cell: the figure mounts only once the cell comes within 400px of the screen (and then stays). */
  lazy?: boolean;
  /** Values the figure reads from its host's data attributes, live (the box's letter: { mark: 'A' } → data-mark). */
  data?: Record<string, string>;
  /** The extent to fit instead of the entry's own (boxOf: grown by a custom value that reaches further). */
  box?: Entry['box'];
};

export function Illustration({ entry, value, onRead, aspect, keyboard, lazy, data, box }: Props) {
  const host = useRef<HTMLDivElement>(null), handle = useRef<Handle | null>(null);
  const first = useRef(value), read = useRef(onRead);
  read.current = onRead;
  const [near, setNear] = useState(!lazy || typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (near) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: '400px 0px' });
    io.observe(host.current!);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near) return;
    const stage = host.current!;
    for (const [k, v] of Object.entries(dataRef.current ?? {})) stage.setAttribute(`data-${k}`, v);
    const h = mountFigure(HL, stage, figureOf(entry), first.current, (text) => read.current?.(text), labelOf(entry));
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
  }, [entry, near]);
  useEffect(() => { handle.current?.set(value); }, [value]);
  const dataRef = useRef(data);
  dataRef.current = data;
  const dataKey = JSON.stringify(data ?? {});
  useEffect(() => {
    const stage = host.current;
    if (stage) for (const [k, v] of Object.entries(data ?? {})) stage.setAttribute(`data-${k}`, v);
  }, [dataKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="plane" style={plane(entry, aspect, box)}>
      <div ref={host} className="stage" />
      {keyboard && <Stops stage={host} targets={entry.targets} />}
    </div>
  );
}

/** What a screen reader hears: "Funnel illustration: conversion". */
export const labelOf = (entry: Entry) => `${entry.name} illustration: ${lower(entry.topic)}`;

/** How big a figure looks: its rest pose's area (as a square's side) is this share of the safe size, so a tall balloon,
 *  a flat map and a squat safe read as the same size; a long, flat one stops at CAP of the safe size across. */
const OPTICAL = 0.84, CAP = 1.1;

/**
 * Where the 400 × 320 drawing sits, in container units so it holds at every size. Its rest pose is sized by OPTICAL
 * against the safe area (62% of the tile's smaller side: a gallery tile, its caption above it, or a detail box)
 * and centred; then, if a moving state (the balloon's flight, the box's open flaps) would leave the cell or reach the
 * labels, it is made smaller or nudged until every state stays inside.
 */
function plane(entry: Entry, aspect: number | 'box', box = entry.box): React.CSSProperties {
  const [r0, r1, r2, r3] = entry.rest, [a0, a1, a2, a3] = box;
  const k = Math.min(OPTICAL / Math.sqrt((r2 - r0) * (r3 - r1)), CAP / Math.max(r2 - r0, r3 - r1));
  const gallery = aspect !== 'box';
  // a gallery tile has its caption above it, so the drawing only keeps 16px clear of the tile's edge
  const safe = gallery ? `${(62 * Math.min(1, aspect)).toFixed(2)}cqw` : '62cqmin';
  const H = gallery ? `${100 * aspect}cqw` : '100cqh', inset = gallery ? 16 : 24, n = (v: number) => v.toFixed(4);
  // px per viewBox unit
  const scale = `min(${safe} * ${n(k)}, (${H} - ${2 * inset}px) / ${n(a3 - a1)}, (100cqw - ${2 * inset}px) / ${n(a2 - a0)})`;
  const at = (lo: string, mid: string, hi: string) => `clamp(${lo}, ${mid}, ${hi})`;
  return {
    ['--s' as string]: scale,
    width: 'calc(400 * var(--s))',
    left: at(`${inset}px - var(--s) * ${n(a0)}`, `50cqw - var(--s) * ${n((r0 + r2) / 2)}`, `100cqw - ${inset}px - var(--s) * ${n(a2)}`),
    top: at(`${inset}px - var(--s) * ${n(a1)}`, `${H} / 2 - var(--s) * ${n((r1 + r3) / 2)}`, `${H} - ${inset}px - var(--s) * ${n(a3)}`),
  };
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
