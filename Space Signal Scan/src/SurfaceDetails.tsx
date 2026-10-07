import { useEffect, useRef, type CSSProperties } from 'react';

const CROSS_PATH = 'M1.2 0h1.2v1.2H1.2z M0 1.2h1.2v1.2H0z M2.4 1.2h1.2v1.2H2.4z M1.2 2.4h1.2v1.2H1.2z';
const PATTERN_PITCH = 7.56;
const TWINKLE_SECONDS = 8; // Two complete radar sweeps; suitable for a seamless export.
const seeded = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

// One star per sparse grid block, aligned exactly with an existing Figma cross.
// Stable phases and positions prevent reshuffling when the preview resizes.
const starPositions = Array.from({ length: 18 * 13 }, (_, index) => {
  const column = (index % 18) * 8 + Math.floor(seeded(index + 1) * 8);
  const row = Math.floor(index / 18) * 8 + Math.floor(seeded(index + 501) * 8);
  return {
    x: column * PATTERN_PITCH,
    y: row * PATTERN_PITCH,
    delay: -seeded(index + 1001) * TWINKLE_SECONDS,
    peak: 0.22 + seeded(index + 1501) * 0.32,
  };
}).filter(({ x, y }) => x < 1037 && y < 776);

// Figma material geometry remains vector-based at any preview/export scale.
export function BackgroundPattern({ view = 'full' }: { view?: 'full' | 'closeup' | 'detail' }) {
  const stars = starPositions.filter(({ x, y }) => view === 'closeup'
    ? !(x > 290 && y > 118)
    : view === 'detail'
      ? !(x < 809 && y < 518)
      : !(x > 230 && x < 809 && y > 98 && y < 682));
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const syncVisibility = () => {
      if (ref.current) ref.current.dataset.paused = String(document.hidden);
    };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  return <svg ref={ref} className="background-pattern" width="1041" height="780" aria-hidden="true">
    <defs>
      <path id="pattern-cross" d={CROSS_PATH} />
      <pattern id="cross-texture" width={PATTERN_PITCH} height={PATTERN_PITCH} patternUnits="userSpaceOnUse">
        <use href="#pattern-cross" fill="#1b1b1b" />
      </pattern>
    </defs>
    <rect width="1041" height="780" fill="url(#cross-texture)" opacity=".5" />
    <g className="night-sky" fill="#c0ccd9">
      {stars.map(({x, y, delay, peak}, index) => <use
        key={index}
        href="#pattern-cross"
        x={x}
        y={y}
        className="pattern-star"
        style={{
          animationDelay: `${delay}s`,
          animationDuration: `${TWINKLE_SECONDS}s`,
          '--star-peak': peak,
        } as CSSProperties}
      />)}
    </g>
  </svg>;
}

export function CardRims() {
  return <svg className="card-rims" width="533" height="535.5" viewBox="0 0 533 535.5" aria-hidden="true">
    <defs><linearGradient id="rim-gradient" x1="0" y1=".5" x2="1" y2=".5" gradientTransform="matrix(1.357438103617341 4.115606861107559 -4.1446203603092435 11.410384968568467 1.8667316310675512 -8.072244733155756)">
      <stop stopColor="#2d2d32"/><stop offset="1" stopColor="#595968"/>
    </linearGradient></defs>
    <rect x=".25" y=".25" width="532.5" height="535" rx="21.75" fill="none" stroke="url(#rim-gradient)" strokeWidth=".5"/>
    <rect x="6.75" y="44.75" width="519.5" height="484" rx="17.75" fill="none" stroke="url(#rim-gradient)" strokeWidth=".5"/>
  </svg>;
}

export function EngravedDividers() {
  return <svg className="engraved-dividers" width="519" height="483.5" aria-hidden="true">
    <defs>
      <filter id="divider-light" x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
        <feDropShadow dx="1" dy="-1" stdDeviation=".5" floodColor="#e2e2e2" floodOpacity=".12"/>
      </filter>
      <filter id="footer-light" filterUnits="userSpaceOnUse" x="-4" y="405" width="527" height="18" colorInterpolationFilters="sRGB">
        <feDropShadow dx="0" dy="-1" stdDeviation=".5" floodColor="#e2e2e2" floodOpacity=".12"/>
      </filter>
    </defs>
    <g fill="none" stroke="#000" strokeWidth="1" filter="url(#divider-light)">
      <path d="M0 340.5H172.16667V413 M173.66667 340.5H345.83333V413 M347.33333 340.5H519"/>
    </g>
    <path d="M0 413.5H519" fill="none" stroke="#000" strokeWidth="1" filter="url(#footer-light)"/>
  </svg>;
}
