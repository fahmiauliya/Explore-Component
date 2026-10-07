import type { CSSProperties } from 'react';
import outerRim from './assets/6b361.svg';
import ringBase from './assets/b412a.svg';
import inactiveGrain from './assets/5e41c.png';
import inactiveSurface from './assets/73e09.svg';
import inactiveReflection from './assets/d83ef.png';
import activeGrain from './assets/7b517.png';
import activeSurface from './assets/93292.svg';
import activeReflection from './assets/60ab9.png';
import activeMask from './assets/84f9a.svg';
import innerArc from './assets/0e450.svg';
import activeArc from './assets/dfadb.svg';
import activeTicks from './assets/59360.svg';
import markerShadow from './assets/39eb1.svg';
import marker from './assets/007c1.svg';
import track from './assets/capacity-track.svg';

// Native SVG dimensions include Figma's visual overflow. Retain those bounds.
export function CapacityGauge() {
  return <div className="capacity-gauge" role="img" aria-label="Training capacity: 71 percent, 4,280 of 6,000 load">
    <svg width="0" height="0" className="material-filters" aria-hidden="true">
      <defs>
        <filter id="capacity-text-material" x="-15%" y="-20%" width="130%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.319588" result="softTop" />
          <feOffset in="softTop" dy="-3.958764" result="offsetTop" />
          <feComposite in="SourceAlpha" in2="offsetTop" operator="out" result="topEdge" />
          <feFlood floodColor="white" floodOpacity="0.25" />
          <feComposite in2="topEdge" operator="in" result="topLight" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.639176" result="softBottom" />
          <feOffset in="softBottom" dy="2.639176" result="offsetBottom" />
          <feComposite in="SourceAlpha" in2="offsetBottom" operator="out" result="bottomEdge" />
          <feFlood floodColor="white" floodOpacity="0.5" />
          <feComposite in2="bottomEdge" operator="in" result="bottomLight" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.329897" result="softInset" />
          <feOffset in="softInset" dy="-0.659794" result="offsetInset" />
          <feComposite in="SourceAlpha" in2="offsetInset" operator="out" result="insetEdge" />
          <feFlood floodColor="black" floodOpacity="0.25" />
          <feComposite in2="insetEdge" operator="in" result="insetShade" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="topLight" />
            <feMergeNode in="bottomLight" />
            <feMergeNode in="insetShade" />
          </feMerge>
          <feDropShadow dx="0" dy="1.286005" stdDeviation="0.321501" floodColor="#2f46af" floodOpacity="0.15" />
          <feDropShadow dx="0" dy="0.643002" stdDeviation="0.643002" floodColor="black" floodOpacity="0.3" />
        </filter>
      </defs>
    </svg>
    <img className="gauge-layer" style={{left:27,top:28.75}} src={outerRim} alt="" />
    <div className="gauge-ring">
      <img className="gauge-layer inactive" src={ringBase} alt="" />
      <img className="gauge-layer inactive" src={inactiveGrain} width="460" height="460" alt="" />
      <img className="gauge-layer inactive" src={inactiveSurface} alt="" />
      {/* Cut at 71% in Figma and only ever seen beneath the fill; it follows the sweep. */}
      <img className="gauge-layer inactive inactive-reflection" style={{left:16,top:17,width:335.237,height:243.304}} src={inactiveReflection} width="335.237" height="243.304" alt="" />
      <div className="active-ring" style={{'--active-mask': `url("${activeMask}")`} as CSSProperties}>
        <img className="gauge-layer" src={ringBase} alt="" />
        <img className="gauge-layer" src={activeGrain} width="460" height="460" alt="" />
        <img className="gauge-layer" src={activeSurface} alt="" />
        <img className="gauge-layer" style={{left:17,top:17,width:335.237,height:243.304}} src={activeReflection} width="335.237" height="243.304" alt="" />
      </div>
    </div>
    <img className="gauge-layer" style={{left:30,top:31.75}} src={innerArc} alt="" />
    <div className="sweep-reveal"><img className="gauge-layer" style={{left:27.5,top:29.25}} src={activeArc} alt="" /></div>
    <div className="gauge-reading"><div className="capacity-value">71%</div><div className="capacity-load"><strong>4,280 </strong><span>/ 6,000 load</span></div></div>
    {/* One continuous grey track replaces Figma's 71%-cut band, so empty capacity has no seam. */}
    <div className="sweep-remainder"><img className="gauge-layer" style={{left:26,top:31.75}} src={track} alt="" /></div>
    <div className="sweep-reveal"><img className="gauge-layer" style={{left:26,top:31.75}} src={activeTicks} alt="" /></div>
    <i className="gauge-foot gauge-foot-left"/><i className="gauge-foot gauge-foot-right"/>
    {/* Both pivot on the ring centre (260, 261.75) and ride the sweep's leading edge. */}
    <img className="gauge-layer gauge-marker" style={{left:354.595,top:63.7098,transformOrigin:'-94.595px 198.0402px'}} src={markerShadow} alt="" />
    <img className="gauge-layer gauge-marker" style={{left:329.5875,top:39.5542,transformOrigin:'-69.5875px 222.1958px'}} src={marker} alt="" />
  </div>;
}
