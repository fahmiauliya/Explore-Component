import type { Grid } from './dots';
import { Cell, type DotRenderer, type Subject, type Tones } from './renderer';
import type { Calibration } from './studio';

/*
 * The same size for every animal: a pre-pass samples poses across a subject's whole loop, takes the box of the
 * filled cells over all of them, and finds the zoom that makes that box fill FILL.width of the frame's width or
 * FILL.height of its height, whichever comes first, and where its centre sat, so the camera can bring it to the
 * frame's centre. Nothing then drifts or clips, since the box already holds every pose.
 */
export const SAMPLES = 24;
export const FILL = { width: .55, height: .65 };

/** Poses the subject through `span` seconds with `seek`, renders each, and returns its calibration. */
export function calibrate(subject: Subject, renderer: DotRenderer, grid: Grid, tones: Tones, lightAngle: number, span: number, seek: (time: number) => void): Calibration {
  subject.studio.calibrate(null);
  let c0 = Infinity, c1 = -1, r0 = Infinity, r1 = -1;
  for (let k = 0; k < SAMPLES; k++) {
    seek(k / SAMPLES * span);
    const cells = renderer.render(subject, tones, lightAngle);
    for (let i = 0; i < cells.length; i++) if (cells[i] !== Cell.Empty) { const c = i % grid.cols, r = (i - c) / grid.cols; if (c < c0) c0 = c; if (c > c1) c1 = c; if (r < r0) r0 = r; if (r > r1) r1 = r; }
  }
  if (c1 < 0) return { zoom: 1, ndcX: 0, ndcY: 0 };
  const width = (c1 - c0 + 1) / grid.cols, height = (r1 - r0 + 1) / grid.rows;
  return { zoom: Math.min(FILL.width / width, FILL.height / height), ndcX: (c0 + c1 + 1) / grid.cols - 1, ndcY: 1 - (r0 + r1 + 1) / grid.rows };
}
