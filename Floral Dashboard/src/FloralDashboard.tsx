import { useMemo, useRef, type CSSProperties } from 'react';
import { FlowerLayer } from './FlowerLayer';
import { grainTexture } from './grain';
import { BloomClock, useFlowerMotion, type BloomValues } from './FlowerMotion';
import type { AgentStatus } from './DashboardMotion';
import * as flower from './flowerLayers';

type Placement = { id: string; piece: keyof typeof flower; x: number; y: number; rotate?: number; flipY?: boolean };

// Centres in the 442.986 px flower frame (Figma 486:1020); each piece keeps its Figma frame size and turns
// about its centre exactly as Figma's rotate + flip did. Later pieces paint over earlier ones, as in Figma.
const glow: Placement = { id: '486:1021', piece: 'glow', x: 221.493, y: 221.493 };
// Each crescent draws part of one of the four background circles: 0 top-left, 1 top-right, 2 bottom-right,
// 3 bottom-left, clockwise. Lobes come from the crescents' arc centres, not from Figma's group names.
const rings: (Placement & { lobe: number })[] = [
  { id: '486:1032', piece: 'ringTopLeftOuter', x: 121.22, y: 123.96, rotate: 180, flipY: true, lobe: 0 },
  { id: '486:1038', piece: 'ringTopLeftInner', x: 121.22, y: 319.02, rotate: 180, lobe: 3 },
  { id: '486:1044', piece: 'ringTopRightOuter', x: 321.8, y: 123.96, lobe: 1 },
  { id: '486:1050', piece: 'ringTopRightInner', x: 321.8, y: 319.02, flipY: true, lobe: 2 },
  { id: '486:1057', piece: 'ringBottomLeft', x: 123.96, y: 321.76, rotate: 90, flipY: true, lobe: 3 },
  { id: '486:1063', piece: 'ringBottomRight', x: 319.02, y: 321.76, rotate: 90, lobe: 2 },
  { id: '486:1069', piece: 'ringUpperLeft', x: 123.96, y: 121.19, rotate: -90, lobe: 0 },
  { id: '486:1075', piece: 'ringUpperRight', x: 319.02, y: 121.19, rotate: -90, flipY: true, lobe: 1 },
];
// Eight petals, one every 45°; each one's base sits on the flower centre.
const petals: Placement[] = [
  { id: '486:1082', piece: 'petalLeft', x: 123.952, y: 221.6005, rotate: -90 },
  { id: '486:1108', piece: 'petalBottom', x: 221.4765, y: 319.126, rotate: 180 },
  { id: '486:1140', piece: 'petalTopLeft', x: 152.492, y: 152.622, rotate: -45 },
  { id: '486:1154', piece: 'petalBottomRight', x: 290.4535, y: 290.5735, rotate: 135 },
  { id: '486:1180', piece: 'petalTopRight', x: 290.469, y: 152.619, rotate: 45 },
  { id: '486:1195', piece: 'petalBottomLeft', x: 152.5005, y: 290.5905, rotate: -135 },
  { id: '486:1221', piece: 'petalRight', x: 319.0115, y: 221.602, rotate: 90 },
  { id: '486:1254', piece: 'petalTop', x: 221.4805, y: 124.0805 },
];
const sparkle: Placement = { id: '486:1286', piece: 'sparkle', x: 221.2915, y: 221.7715 };

const CENTRE = 221.493;
// A petal's position inside its pivot: its Figma centre, measured from the flower centre, in the pivot's
// unrotated frame. The pivot then carries the petal's rotation, so it turns and folds about its base.
const inPivot = ({ x, y, rotate = 0 }: Placement) => {
  const a = -rotate * Math.PI / 180, dx = x - CENTRE, dy = y - CENTRE;
  return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
};

const Piece = ({ placement: { id, piece, x, y, rotate, flipY }, at = [x, y] }: { placement: Placement; at?: number[] }) =>
  <div className="flower-piece" data-node-id={id} style={{ left: at[0], top: at[1], width: flower[piece].width, height: flower[piece].height,
    rotate: rotate ? `${rotate}deg` : undefined, scale: flipY ? '1 -1' : undefined }}>
    {flower[piece].layers.map((layer, index) => <FlowerLayer key={index} layer={layer} />)}
  </div>;

const LABELS = { working: 'Agent working', complete: 'Agent finished, waiting for your reply' };

/** The flower; with `motion`, the Bloom timeline drives it, without it is the still design. With `status` it is the
 * agent's status icon: the green dot of Figma 486:1845 sits top right, shown by the dashboard's motion. */
export function FloralDashboard({ motion, status, variant, style }: { motion?: BloomValues; status?: AgentStatus; variant?: 'icon'; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const grain = useMemo(() => grainTexture(), []);
  useFlowerMotion(ref, motion);
  return <div ref={ref} className={variant ? `flower flower-variant-${variant}` : 'flower'} role="img" aria-label={status ? LABELS[status] : 'Eight-petal flower in pink, white and amber, glowing from a white centre'} data-status={status} style={{ '--grain': `url(${grain})`, ...style } as CSSProperties}>
    {motion && <BloomClock />}
    <div className="flower-group" data-motion="bloom" aria-hidden="true">
      <div className="flower-group" data-motion="glow"><Piece placement={glow} /></div>
      <div className="flower-group" data-motion="rings">{rings.map(ring => <div key={ring.id} className="flower-pivot ring" data-lobe={ring.lobe} style={{ left: CENTRE, top: CENTRE }}>
        <Piece placement={ring} at={[ring.x - CENTRE, ring.y - CENTRE]} />
      </div>)}</div>
      {petals.map(petal => <div key={petal.id} className="flower-pivot petal" data-angle={petal.rotate ?? 0} style={{ left: CENTRE, top: CENTRE, rotate: petal.rotate ? `${petal.rotate}deg` : undefined }}>
        <Piece placement={{ ...petal, rotate: undefined }} at={inPivot(petal)} />
      </div>)}
      <div className="flower-group" data-motion="sparkle"><Piece placement={sparkle} /></div>
    </div>
    {status && <i className="flower-status" data-node-id="489:2911" aria-hidden="true"><i className="flower-status-dot" /></i>}
  </div>;
}
