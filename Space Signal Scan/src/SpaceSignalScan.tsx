import { AnimatedPixels } from './AnimatedPixels';
import { CardRims, EngravedDividers } from './SurfaceDetails';
import heatmap from './data/heatmap.json';
import warning from './assets/warning.svg';
import more from './assets/more.svg';
import scan from './assets/scan.svg';
import axisX from './assets/axis-x.svg';
import axisY from './assets/axis-y.svg';

function SignalChart() {
  return <div className="chart" role="img" aria-label="Frequency by distance heatmap with a detected signal selected">
    <img className="axis-y" src={axisY} alt="" />
    <img className="axis-x" src={axisX} alt="" />
    {[5,4,3,2,1].map((power,i)=><span className="axis-label" key={power} style={{top:[15,80,145,210,276][i]}}>10<sup>{power}</sup></span>)}
    <svg className="heatmap" width="440" height="260" viewBox="0 0 440 260" aria-hidden="true">
      <defs>
        <clipPath id="signal-selection"><rect width="112" height="110" /></clipPath>
        <filter id="selection-depth" x="-15%" y="-15%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dy="4" result="below" />
          <feOffset in="blur" dx="4" result="right" />
          <feFlood floodColor="#000" floodOpacity=".25" result="shade" />
          <feComposite in="shade" in2="below" operator="in" result="bottomShadow" />
          <feComposite in="shade" in2="right" operator="in" result="rightShadow" />
          <feMerge><feMergeNode in="bottomShadow"/><feMergeNode in="rightShadow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g data-layer="background"><AnimatedPixels cells={heatmap.background} /></g>
      <g data-layer="signal" transform="translate(248 71)"><AnimatedPixels cells={heatmap.signal} signal /><rect width="112" height="110" fill="none" stroke="white" strokeWidth="0.5" /></g>
      <g data-layer="selection" transform="translate(248 71)" filter="url(#selection-depth)">
        <g clipPath="url(#signal-selection)"><AnimatedPixels cells={heatmap.selection} signal /></g>
        <rect width="112" height="110" fill="none" stroke="#6185e3" strokeWidth="0.5" />
      </g>
      {[[246,69],[246,179],[358,69],[358,179]].map(([x,y])=><g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><rect width="4" height="4" fill="#6185e3" fillOpacity=".2"/><rect x="1" y="1" width="2" height="2" fill="#6185e3"/></g>)}
    </svg>
  </div>;
}
function Legend() {
  return <div className="legend"><div className="legend-items">
    {['Noise','Background','Detected signal'].map((label,i)=><span className="legend-item" key={label}><i className={`swatch swatch-${i}`} />{label}</span>)}
  </div><span>Selection · Distance 8K–34K</span></div>;
}
export function SpaceSignalScan() {
  return <article className="signal-card">
    <header className="card-header">
      <img className="scan-icon" src={scan} alt="" />
      <div className="title"><h1>Space Signal Scan</h1><span>/</span><span>frequency × distance</span></div>
      <div className="header-controls"><span className="status"><img src={warning} alt=""/>Signal Detected</span><span className="more material-control"><img src={more} alt=""/></span></div>
    </header>
    <div className="panel-rim"><div className="panel">
      <SignalChart/><Legend/><EngravedDividers/>
      <div className="metrics">{[['1.42 kHz','peak signal frequency'],['12.8 K ly','estimated distance'],['92%','signal confidence']].map(([value,label])=><div className="metric" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      <footer className="card-footer"><p>Repeating narrowband signal<br/>detected above baseline noise.</p><div className="actions"><span className="material-control table-control">Signal Table</span><span className="material-control inspect-control">Inspect Signal</span></div></footer>
    </div></div>
    <CardRims />
  </article>;
}
