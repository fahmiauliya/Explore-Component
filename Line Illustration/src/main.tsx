import { createRoot } from 'react-dom/client';
import * as Hairline from '@lucasmarkes/hairline/react';
import './styles.css';

// Every figure from @lucasmarkes/hairline, to choose a subject for the study.
const figures = Object.entries(Hairline).filter(([name]) => /^[A-Z]/.test(name)) as [string, typeof Hairline.Terrain][];

function Gallery() {
  return <main className="gallery" aria-label="Hairline figure gallery">
    {figures.map(([name, Figure]) => <figure className="tile" key={name}>
      <Figure intensity={.5} theme="dark" />
      <figcaption>{name}</figcaption>
    </figure>)}
  </main>;
}
createRoot(document.getElementById('root')!).render(<Gallery />);
