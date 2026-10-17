import type { CSSProperties } from 'react';

export type Paint = string | { matrix: number[]; stops: [number, string][] };
export type Layer =
  | { type: 'group'; name?: string; opacity?: number; blur?: number; clip?: string; glow?: number; children: Layer[] }
  | { type: 'ellipse'; name?: string; cx: number; cy: number; rx: number; ry: number; rotate?: number; fill: Paint; opacity?: number; blur?: number }
  | { type: 'path'; name?: string; d: string; fill: Paint; opacity?: number; blur?: number; grain?: boolean }
  | { type: 'fill'; name?: string; fill: string };
export type Piece = { width: number; height: number; layers: Layer[] };

const blur = (sigma?: number) => sigma ? `blur(${sigma}px)` : undefined;
const outside = (d: string) => `path(evenodd, 'M-400 -400H1400V1400H-400Z${d}')`;

const rgba = (hex: string) => [1, 3, 5, 7].map(i => i < hex.length ? parseInt(hex.slice(i, i + 2), 16) : 255);
const hex = (channels: number[]) => '#' + channels.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

// CSS blends gradient stops with premultiplied alpha; Figma blends them straight, so red fading into 20% white
// stays pinker there. Sixteen straight-blended stops per span reproduce Figma's curve.
function straightStops(stops: [number, string][]) {
  return stops.flatMap(([at, color], index) => {
    if (index === 0) return [`${color} ${at * 100}%`];
    const [from, to] = [rgba(stops[index - 1][1]), rgba(color)], start = stops[index - 1][0];
    if (from[3] === to[3] || from.slice(0, 3).join() === to.slice(0, 3).join()) return [`${color} ${at * 100}%`];
    return Array.from({ length: 16 }, (_, step) => {
      const t = (step + 1) / 16;
      return `${hex(from.map((v, i) => v + (to[i] - v) * t))} ${(start + (at - start) * t) * 100}%`;
    });
  }).join(',');
}

// Figma's radial gradients are a unit circle under a matrix: draw one 100 px circle and map it the same way.
function Gradient({ paint, offset = [0, 0] }: { paint: Exclude<Paint, string>; offset?: number[] }) {
  const stops = straightStops(paint.stops);
  return <i className="layer-gradient" style={{ background: `radial-gradient(circle 100px at 100px 100px,${stops})`,
    transform: `translate(${-offset[0]}px,${-offset[1]}px) matrix(${paint.matrix.join(',')}) scale(.01) translate(-100px,-100px)` }} />;
}

// Petal glow: Figma's drop shadow blurs the petal's hard silhouette and keeps only what falls outside it.
function Glow({ sigma, outline }: { sigma: number; outline: string }) {
  return <div className="layer layer-glow" style={{ filter: blur(sigma), clipPath: outside(outline) }}>
    <div className="layer" style={{ clipPath: `path('${outline}')` }}><i className="layer-fill" style={{ background: '#fff' }} /></div>
  </div>;
}

export function FlowerLayer({ layer }: { layer: Layer }) {
  switch (layer.type) {
    case 'fill': return <i className="layer-fill" data-name={layer.name} style={{ background: layer.fill }} />;
    case 'ellipse': {
      const left = layer.cx - layer.rx, top = layer.cy - layer.ry;
      return <i className="layer-ellipse" data-name={layer.name} style={{ left, top, width: layer.rx * 2, height: layer.ry * 2,
        rotate: layer.rotate ? `${layer.rotate}deg` : undefined, opacity: layer.opacity, filter: blur(layer.blur),
        background: typeof layer.fill === 'string' ? layer.fill : undefined }}>
        {typeof layer.fill !== 'string' && <Gradient paint={layer.fill} offset={[left, top]} />}
      </i>;
    }
    case 'path': {
      // Blur runs before clip-path on one element, so a blurred outline needs its own wrapper.
      const shape = <div className={layer.grain ? 'layer layer-grain' : 'layer'} data-name={layer.blur ? undefined : layer.name}
        style={{ clipPath: `path('${layer.d}')`, opacity: layer.blur ? undefined : layer.opacity }}>
        {typeof layer.fill === 'string' ? <i className="layer-fill" style={{ backgroundColor: layer.fill }} /> : <Gradient paint={layer.fill} />}
      </div>;
      return layer.blur ? <div className="layer" data-name={layer.name} style={{ filter: blur(layer.blur), opacity: layer.opacity }}>{shape}</div> : shape;
    }
    case 'group': {
      const outline = layer.glow ? layer.children.find(child => child.type === 'path' && child.grain) as Extract<Layer, { type: 'path' }> : undefined;
      return <div className="layer" data-name={layer.name} style={{ opacity: layer.opacity, filter: blur(layer.blur), clipPath: layer.clip && `path('${layer.clip}')` } as CSSProperties}>
        {layer.glow && outline && <Glow sigma={layer.glow} outline={outline.d} />}
        {layer.children.map((child, index) => <FlowerLayer key={index} layer={child} />)}
      </div>;
    }
  }
}
