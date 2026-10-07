import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Header from './components/navigation/Header';
import { setWorkTab } from './components/navigation/workTab';
import './styles/tokens.css';
import './styles/navigation.css';
import './styles/preview.css';

const DURATION = 8;
// Same critical damping (frequency 14) as the website, sampled at explicit times.
const morph = (t: number) => t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 + 14 * t) * Math.exp(-14 * t);
function App() {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [progress, setProgress] = useState(0);
  useLayoutEffect(() => {
    const box = frame.current!;
    const resize = () => setScale(box.clientWidth / 593);
    const observer = new ResizeObserver(resize);
    observer.observe(box); resize();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setWorkTab('selected');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, elapsed = 0, previous = performance.now();
    const tick = (now: number) => {
      if (!document.hidden && !reduced.matches) elapsed += Math.min(100, now - previous) / 1000;
      previous = now;
      const t = reduced.matches ? 0 : elapsed % DURATION;
      setProgress(t < 1.5 ? 0 : t < 2.5 ? morph(t - 1.5) : t < 6 ? 1 : 1 - morph(t - 6));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <main className="preview" aria-label="Liquid Transform Navigation looping preview">
    <div className="post" ref={frame}>
      <div className="post-stage" style={{transform: `scale(${scale})`}}>
        <div className="navigation-position" inert aria-hidden="true">
          <div className="navigation-scale">
            <div style={{transform: `translateX(${-16 * progress}px)`}}><Header progress={progress}/></div>
          </div>
        </div>
      </div>
    </div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
