import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { themeCss } from './theme/tokens';

// the design tokens as custom properties, before the first render (styles.css reads only these)
const tokens = document.createElement('style');
tokens.id = 'tokens';
tokens.textContent = themeCss();
document.head.prepend(tokens);

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
