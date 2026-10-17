import { Cell } from './renderer';

/*
 * The dot dissolve: dots only switch off or on, never fade, slide or fly. Each cell of the shape has a score, smooth
 * blotchy noise blended with its importance (outline and navy cells matter most); going out, the lowest scores go
 * first, so the flat fills break up while the outline and the navy details hold the shape a moment longer, and
 * coming in the order reverses. In the middle only a few scattered dots remain. The mask is cut afresh every
 * update, so both subjects keep moving through it.
 */
export const FLOOR = .04;                           // the share of the shape's cells that stays through the middle: a few scattered dots

const hash = (seed: number, i: number, j: number) => { const x = Math.sin(seed * 12.9898 + i * 78.233 + j * 37.719) * 43758.5453; return x - Math.floor(x); };
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Smooth value noise per cell: one random value every `clump` cells each way, blended between, so it comes in
 * blotches about a clump wide rather than grains. A seed gives a new field. */
export function noiseField(cols: number, rows: number, clump: number, seed: number) {
  const field = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c + .5) / clump, y = (r + .5) / clump, i = Math.floor(x), j = Math.floor(y), fx = smooth(x - i), fy = smooth(y - j);
    const a = hash(seed, i, j), b = hash(seed, i + 1, j), d = hash(seed, i, j + 1), e = hash(seed, i + 1, j + 1);
    field[r * cols + c] = (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy;
  }
  return field;
}

/** A shape cell's importance: 1 on the outline (a neighbour is empty) and for navy, .5 for a light dot inside, 0 for the fill. */
function importance(cells: Uint8Array, cols: number, rows: number, i: number) {
  const r = Math.floor(i / cols), c = i % cols, cell = cells[i];
  if (cell === Cell.Dark) return 1;
  const empty = (cc: number, rr: number) => cc < 0 || rr < 0 || cc >= cols || rr >= rows || cells[rr * cols + cc] === Cell.Empty;
  if (empty(c - 1, r) || empty(c + 1, r) || empty(c, r - 1) || empty(c, r + 1)) return 1;
  return cell === Cell.Light ? .5 : 0;
}

/** The cells with only the `kept` share of the shape left, the highest scores (noise × (1 − weight) + importance ×
 * weight) kept. A new array; the drawing re-merges navy runs, so a pill splits where its cells are off. */
export function dissolve(cells: Uint8Array, cols: number, rows: number, field: Float32Array, weight: number, kept: number) {
  const shape: number[] = [];
  for (let i = 0; i < cells.length; i++) if (cells[i] !== Cell.Empty) shape.push(i);
  const score = new Float32Array(cells.length);
  for (const i of shape) score[i] = field[i] * (1 - weight) + importance(cells, cols, rows, i) * weight;
  shape.sort((a, b) => score[b] - score[a]);
  const out = new Uint8Array(cells.length), keep = Math.min(shape.length, Math.ceil(kept * shape.length));
  for (let k = 0; k < keep; k++) out[shape[k]] = cells[shape[k]];
  return out;
}
