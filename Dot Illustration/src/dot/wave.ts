/*
 * Timing for natural motion. `asym` makes a cycle's power stroke quicker than its recovery; a `CycleClock` counts
 * cycles of a period from the dot updates' steps, each cycle a little faster or slower and a little bigger or
 * smaller than the last, so nothing is a perfect machine loop; and a part that follows the body late reads its
 * driving phase a few updates back with `lagged`.
 */
const fract = (x: number) => x - Math.floor(x);
/** A seeded unit value for an integer key. */
export const unit = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
export const FRAME = 1 / 24;                       // the update rate the lags are counted in

/** A cycle's position u (any real, one per cycle) as an angle: the power stroke, the first `power` of each cycle,
 * runs 0 → π, the recovery π → 2π; so cos goes top → bottom quickly and back slowly. */
export const asym = (u: number, power: number) => { const f = fract(u); return f < power ? Math.PI * f / power : Math.PI + Math.PI * (f - power) / (1 - power); };

/** The cycle position a few updates ago, for follow-through: lagging parts read this instead of u. */
export const lagged = (u: number, period: number, frames: number) => u - frames * FRAME / period;

export class CycleClock {
  u = 0;                                            // the cycle position: whole cycles and the fraction into the current one
  constructor(public period: number, private vary = .05, private seed = 0, private stretch: (cycle: number) => number = () => 1) {}
  /** The speed of a cycle: ±vary, seeded, times the subject's own stretch (a long slow stroke now and then). */
  speed(cycle = Math.floor(this.u)) { return (1 + this.vary * (unit(cycle + this.seed) * 2 - 1)) * this.stretch(cycle); }
  /** The amplitude of a cycle: ±vary, seeded. */
  amplitude(cycle = Math.floor(this.u)) { return 1 + this.vary * (unit(cycle * 7 + this.seed + 3) * 2 - 1); }
  /** Forward by a dot update's step in seconds. */
  advance(step: number) { this.u += step / (this.period * this.speed()); }
  /** A jump (a seek, or a calibration sample): the position the plain period would give. */
  seek(time: number) { this.u = time / this.period; }
}
