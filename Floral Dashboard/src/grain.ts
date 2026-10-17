// Figma's duo noise on the petals (white 25% / black 25%, 51% density, ~0.38 px grains) is finer than a
// pixel, so it is drawn one grain per device pixel. Seeded, so every frame and reload gets the same grain.
const fract = (value: number) => value - Math.floor(value);
export const GRAIN_TILE = 256;
// Figma's own render shows the grain at about one brightness level (σ ≈ 1 of 255); 5% of the nominal
// 25% specks matches that.
export const GRAIN_STRENGTH = 0.05;

export function grainTexture(strength = GRAIN_STRENGTH) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = GRAIN_TILE;
  const context = canvas.getContext('2d')!;
  const image = context.createImageData(GRAIN_TILE, GRAIN_TILE);
  for (let y = 0; y < GRAIN_TILE; y++) for (let x = 0; x < GRAIN_TILE; x++) {
    const u = fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453), i = (y * GRAIN_TILE + x) * 4;
    // Where the two colour bands overlap, black lands over white: 0.25 + 0.25 × 0.75 alpha, grey 0.43.
    const [level, alpha] = u < 0.46 ? [255, 0.25] : u < 0.54 ? [109, 0.4375] : [0, 0.25];
    image.data[i] = image.data[i + 1] = image.data[i + 2] = level;
    image.data[i + 3] = Math.round(alpha * strength * 255);
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
}
