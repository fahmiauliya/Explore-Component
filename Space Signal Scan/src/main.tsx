import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SpaceSignalScan } from './SpaceSignalScan';
import './styles.css';
import { BackgroundPattern } from './SurfaceDetails';

const closeup = new URLSearchParams(window.location.search).get('view') === 'closeup';

function Preview() {
  const ref = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const node = ref.current!;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1041));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <main ref={ref} className={`preview${closeup ? ' preview-closeup' : ''}`} aria-label={closeup ? 'Space Signal Scan radar close-up preview' : 'Space Signal Scan visual preview'}>
    <div className="artboard" style={{transform:`scale(${scale})`}}><BackgroundPattern closeup={closeup} /><SpaceSignalScan /></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
