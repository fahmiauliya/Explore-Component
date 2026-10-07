import { useMemo } from 'react';

// A rounded lens: neutral in the middle, with inward sampling at its bevel.
// Generated once at the design size; the same video is sampled by the backdrop.
function makeLensMap() {
  const width = 533, height = 506, radius = 22;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  const map = context.createImageData(width, height);
  const distance = (x: number, y: number) => {
    const qx = Math.abs(x - width / 2) - (width / 2 - radius);
    const qy = Math.abs(y - height / 2) - (height / 2 - radius);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
  };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const d = distance(x + .5, y + .5);
    const edge = Math.max(0, Math.min(1, 1 + d / 52));
    const bend = Math.sin(edge * Math.PI * .82) * .48;
    // Blend adjacent edge normals continuously. A nearest-edge normal switches
    // abruptly on the corner diagonal and produces a visible triangular seam.
    const dx = Math.min(x + .5, width - x - .5);
    const dy = Math.min(y + .5, height - y - .5);
    const wx = Math.exp(-dx / 12);
    const wy = Math.exp(-dy / 12);
    const length = Math.hypot(wx, wy);
    const nx = Math.sign(x + .5 - width / 2) * wx / length;
    const ny = Math.sign(y + .5 - height / 2) * wy / length;
    const i = (y * width + x) * 4;
    map.data[i] = Math.round(255 * (.5 - nx * bend));
    map.data[i + 1] = Math.round(255 * (.5 - ny * bend));
    map.data[i + 2] = 128;
    map.data[i + 3] = 255;
  }
  context.putImageData(map, 0, 0);
  return canvas.toDataURL();
}

export function GlassMaterial() {
  const lensMap = useMemo(makeLensMap, []);
  return <>
    <svg className="material-filters" width="0" height="0" aria-hidden="true">
      <defs>
        <filter id="container-refraction" x="0" y="0" width="533" height="506" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={lensMap} x="0" y="0" width="533" height="506" result="lens" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="videoScene" />
          <feDisplacementMap in="videoScene" in2="lens" scale="96" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
    {/* Capture the video before any tint, border, or card content is painted. */}
    <div className="glass-refraction" aria-hidden="true" />
    <div className="glass-surface" aria-hidden="true" />
    <div className="glass-edge" aria-hidden="true" />
  </>;
}
