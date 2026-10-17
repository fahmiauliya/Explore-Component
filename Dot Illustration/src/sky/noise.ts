/*
 * Value noise for the Sky version: smooth in space and, for the shimmer, in time, so nothing flickers. A seeded
 * hash gives one value per lattice point and the rest is smoothstep interpolation.
 */
const fract = (x: number) => x - Math.floor(x);
const smooth = (t: number) => t * t * (3 - 2 * t);
const hash = (seed: number, i: number, j: number, k = 0) => fract(Math.sin(seed * 12.9898 + i * 78.233 + j * 37.719 + k * 53.17) * 43758.5453);

/** 3D value noise over (x, y, z), 0–1: the shimmer's patches over the grid, drifting with z as time. */
export function noise3(seed: number, x: number, y: number, z: number) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = smooth(x - i), fy = smooth(y - j), fz = smooth(z - k);
  const plane = (kk: number) => {
    const a = hash(seed, i, j, kk), b = hash(seed, i + 1, j, kk), c = hash(seed, i, j + 1, kk), d = hash(seed, i + 1, j + 1, kk);
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  };
  return plane(k) * (1 - fz) + plane(k + 1) * fz;
}

/** 2D value noise periodic in x every `period` lattice cells: a cloud tile that scrolls without a seam. */
export function noise2p(seed: number, x: number, y: number, period: number) {
  const i = Math.floor(x), j = Math.floor(y), fx = smooth(x - i), fy = smooth(y - j);
  const wrap = (n: number) => ((n % period) + period) % period;
  const a = hash(seed, wrap(i), j), b = hash(seed, wrap(i + 1), j), c = hash(seed, wrap(i), j + 1), d = hash(seed, wrap(i + 1), j + 1);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

/** A seeded unit value for an integer key. */
export const unit = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
