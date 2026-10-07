import { useId } from 'react';

export default function NavigationMaterial({ path }: { path: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <>
    <svg className="nav-material" width="375" height="32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#656565" />
          <stop offset="1" stopColor="#515151" />
        </linearGradient>
        <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--navigation-rim-top)" />
          <stop offset="1" stopColor="var(--navigation-rim-bottom)" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-100%" width="140%" height="350%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="spread" />
          <feGaussianBlur in="spread" stdDeviation="2.5" />
          <feOffset dy="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .1 0" result="shadow1" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dy="2" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .25 0" result="shadow2" />
          <feMerge><feMergeNode in="shadow1" /><feMergeNode in="shadow2" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`${id}-inset`} x="-10%" y="-50%" width="120%" height="200%">
          <feMorphology in="SourceAlpha" operator="erode" radius="0.5" result="insetAlpha" />
          <feGaussianBlur in="insetAlpha" stdDeviation="0.5" />
          <feOffset dy="-1.5" />
          <feComposite in="insetAlpha" operator="out" result="bottom" />
          <feFlood floodColor="black" floodOpacity="0.15" />
          <feComposite in2="bottom" operator="in" result="shade" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="shade" /></feMerge>
        </filter>
        <filter id={`${id}-rim`}>
          <feMorphology in="SourceAlpha" operator="erode" radius="0.5" result="outer" />
          <feMorphology in="SourceAlpha" operator="erode" radius="1" result="inner" />
          <feComposite in="outer" in2="inner" operator="out" />
        </filter>
        <mask id={`${id}-rim-mask`} style={{ maskType: 'alpha' }}>
          <path d={path} fill="white" filter={`url(#${id}-rim)`} />
        </mask>
      </defs>
      <path d={path} fill={`url(#${id}-fill)`} stroke="rgba(0,0,0,.55)" strokeWidth="1" filter={`url(#${id}-shadow)`} />
      <path d={path} fill={`url(#${id}-fill)`} filter={`url(#${id}-inset)`} />
      <path d={path} fill={`url(#${id}-stroke)`} mask={`url(#${id}-rim-mask)`} />
    </svg>
    {/* One highlight follows the shared silhouette, including at both resting states.
        Keep it above the CSS surfaces so there is no renderer handoff or double highlight. */}
    <svg className="nav-inner-highlight" width="375" height="32" aria-hidden="true" focusable="false">
      <defs>
        <filter id={`${id}-highlight`} x="-10%" y="-50%" width="120%" height="200%">
          <feMorphology in="SourceAlpha" operator="erode" radius="0.5" result="insetAlpha" />
          <feGaussianBlur in="insetAlpha" stdDeviation="0.5" result="blurredAlpha" />
          <feOffset in="blurredAlpha" dy="2" result="offsetAlpha" />
          <feComposite in="insetAlpha" in2="offsetAlpha" operator="out" result="top" />
          <feFlood floodColor="white" floodOpacity="0.15" result="white" />
          <feComposite in="white" in2="top" operator="in" />
        </filter>
      </defs>
      <path d={path} fill="white" filter={`url(#${id}-highlight)`} />
    </svg>
    </>
  );
}
