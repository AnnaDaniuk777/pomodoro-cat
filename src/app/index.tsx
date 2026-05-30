import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/press-start-2p/400.css';
import { SCALE } from '../../shared/config';
import { App } from './App';
import './styles/global.css';

// Single source of truth: shared/config.ts. Inject SCALE into CSS so all
// `var(--scale)` calculations stay in sync with entities/cat and Electron window.
document.documentElement.style.setProperty('--scale', String(SCALE));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
