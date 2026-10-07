import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SpaceSignalScan } from './SpaceSignalScan';
import './styles.css';
import { BackgroundPattern } from './SurfaceDetails';

const requestedView = new URLSearchParams(window.location.search).get('view');
const view = requestedView === 'closeup' || requestedView === 'detail' ? requestedView : 'full';

function Preview() {
  const ref = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const node = ref.current!;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1041));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <main ref={ref} className={`preview preview-${view}`} aria-label={`Space Signal Scan ${view === 'closeup' ? 'radar close-up' : view === 'detail' ? 'signal controls close-up' : 'full card'} preview`}>
    <div className="artboard" style={{transform:`scale(${scale})`}}><BackgroundPattern view={view} /><SpaceSignalScan /></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
