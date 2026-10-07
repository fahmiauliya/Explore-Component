import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TrainingCapacity } from './TrainingCapacity';
import background from './assets/background.mp4';
import backgroundPoster from './assets/background-poster.jpg';
import './styles.css';

function Preview() {
  const ref = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1041));
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);
  return <main ref={ref} className="preview" aria-label="Training Capacity design preview">
    <div className="artboard" style={{ transform: `scale(${scale})` }}>
      <video className="scene-background" src={background} poster={backgroundPoster} autoPlay muted loop playsInline preload="auto" aria-hidden="true" disablePictureInPicture />
      <TrainingCapacity />
    </div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
