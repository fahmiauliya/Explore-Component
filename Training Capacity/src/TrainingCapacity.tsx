import { useRef, type CSSProperties } from 'react';
import { CapacityGauge } from './CapacityGauge';
import { GlassMaterial } from './GlassMaterial';
import { useCapacityMotion, type CapacityReading } from './CapacityMotion';
import dumbbell from './assets/bb856.svg';
import chevron from './assets/054e8.svg';
import divider from './assets/04a79.svg';

const breakdown = [
  { label: 'Strength', load: 1820, percent: 43, color: '#2dc0cb', pale: '#bdf0f4', edge: '#2dc0cb' },
  { label: 'Cardio', load: 1240, percent: 29, color: '#cb2d8e', pale: '#f4bddf', edge: '#cb2d8e' },
  { label: 'Mobility', load: 720, percent: 17, color: '#642dcb', pale: '#d0bdf4', edge: '#642dcb' },
  { label: 'Other', load: 500, percent: 11, color: '#b7b7b7', pale: '#eaeaea', edge: '#c4c4c4' },
];
// The four categories make up the gauge's 4,280 load; each bar is its true share of it.
const weekLoad = breakdown.reduce((sum, item) => sum + item.load, 0);
const reading: CapacityReading = { percent: 71, load: weekLoad, rows: breakdown };

export function TrainingCapacity() {
  const ref = useRef<HTMLElement>(null);
  useCapacityMotion(ref, reading);
  return <article ref={ref} className="training-card" aria-labelledby="capacity-title">
    <GlassMaterial />
    <header className="card-header">
      <img className="training-icon" src={dumbbell} alt="" />
      <div className="heading"><h1 id="capacity-title">Training Capacity</h1><img src={divider} alt=""/><span>6 of 7 sessions</span></div>
      <div className="week-control"><div className="week-face"><img src={chevron} alt=""/><span>This Week</span></div></div>
    </header>
    <section className="capacity-panel" aria-label="Weekly training load">
      <CapacityGauge />
      <ul className="breakdown">{breakdown.map(item => <li className="breakdown-row" key={item.label} aria-label={`${item.label}: ${item.load.toLocaleString('en-US')} load, ${item.percent}%`} style={{'--bar-color':item.color,'--dot-pale':item.pale,'--dot-edge':item.edge,'--share':item.load / weekLoad} as CSSProperties}>
        <div className="category"><i className="category-dot"/><span>{item.label}</span></div>
        <div className="category-data" aria-hidden="true"><span className="load">{item.load.toLocaleString('en-US')}</span><span className="load-track"><span className="load-fill"/></span><span className="share">{item.percent}%</span></div>
      </li>)}</ul>
    </section>
  </article>;
}
