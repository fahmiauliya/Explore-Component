import { Cell } from './renderer';

/*
 * The visible drawing: flat colour on a 2D canvas. Light and mid cells are circles; dark cells are vertical pills,
 * thinner than the dots, and a column's run of dark cells merges into one continuous pill, found afresh on every
 * draw, so a masked run splits where its cells are off. Nothing else is drawn: no gradients, shadows or glow,
 * and empty cells stay the background. The geometry (`centre`, `dotRadius`, `pills`) is shared with the Sky
 * version, which draws the same shapes in white.
 */
export type Grid = { cols: number; rows: number; cell: number; ox: number; oy: number; width: number; height: number; px: number }; // px: backing pixels per CSS pixel
export type Style = { background: string; light: string; bright: string; navy: string; dotSize: number; navyWidth: number };
export type Pill = { c: number; r0: number; r1: number; x: number; top: number; bottom: number };

/** A cell's centre. */
export const centre = (grid: Grid, c: number, r: number) => [grid.ox + (c + .5) * grid.cell, grid.oy + (r + .5) * grid.cell] as const;
/** A dot's radius: `dotSize` × cell across. */
export const dotRadius = (grid: Grid, dotSize: number) => dotSize * grid.cell / 2;

/** A column's runs of dark cells as pills, `navyWidth` × cell wide: from the top of the first cell to the bottom of
 * the last, less the round caps, so a single cell's pill is exactly one cell tall. */
export function pills(cells: Uint8Array, grid: Grid, navyWidth: number) {
  const { cols, rows, cell } = grid, reach = (cell - navyWidth * cell) / 2, out: Pill[] = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if (cells[r * cols + c] === Cell.Dark) {
    let end = r;
    while (end + 1 < rows && cells[(end + 1) * cols + c] === Cell.Dark) end++;
    const [x, top] = centre(grid, c, r), [, bottom] = centre(grid, c, end);
    out.push({ c, r0: r, r1: end, x, top: top - reach, bottom: bottom + reach });
    r = end;
  }
  return out;
}

export function drawDots(ctx: CanvasRenderingContext2D, cells: Uint8Array, grid: Grid, style: Style) {
  const { cols, rows } = grid;
  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, grid.width, grid.height);
  const radius = dotRadius(grid, style.dotSize);
  for (const [state, colour] of [[Cell.Light, style.light], [Cell.Mid, style.bright]] as const) {
    ctx.fillStyle = colour;
    ctx.beginPath();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (cells[r * cols + c] === state) {
      const [x, y] = centre(grid, c, r);
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.strokeStyle = style.navy;
  ctx.lineWidth = style.navyWidth * grid.cell;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const pill of pills(cells, grid, style.navyWidth)) { ctx.moveTo(pill.x, pill.top); ctx.lineTo(pill.x, pill.bottom); }
  ctx.stroke();
}
