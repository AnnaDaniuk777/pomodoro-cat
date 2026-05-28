import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/press-start-2p/400.css';
import { SCALE } from '../shared/config';
import './index.css';
import App from './App.tsx';

document.documentElement.style.setProperty('--scale', String(SCALE));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
